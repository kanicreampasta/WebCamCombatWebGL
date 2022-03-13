const io = require('socket.io-client');

class SignalingServer {
    private socket: any;
    pc: RTCPeerConnection;
    isMaster: boolean;
    private service: WebRTCService;

    constructor(service: WebRTCService) {
        this.service = service;
        this.socket = io('localhost:8000', {
            rejectUnauthorized: false
        });
        this.pc = null;
        const room = 'foo';
        this.isMaster = true;

        this.socket.on('connect', () => {
            // this.socket.emit('create or join', room);
            // console.log('attempted to create or join room ' + room);
            console.log('connected');
        });

        this.socket.on('connect_error', (error: any) => {
            console.log('connect error', error);
        });

        this.socket.on('message', (msg: any) => this.onMessage(msg));

        // this.socket.on('created', (room: any) => {
        //     console.log('created room ' + room);
        //     this.isMaster = true;
        // });
        
        // this.socket.on('full', (room: any) => {
        //     console.log('room ' + room + ' is full');
        // });

        // this.socket.on('join', (room: any) => {
        //     console.log('another peer made a request to join room ' + room);
        //     console.log('you are the master of room ' + room + '!');
        // });

        // this.socket.on('joined', (room: any) => {
        //     console.log('joined room ' + room);
        // });

        // this.socket.on('log', (array: any) => {
        //     console.log.apply(console, array);
        // });
    }

    sendMessage(message: any) {
        console.log("sending message to signaling server:", message);
        this.socket.emit('message', message);
    }

    private onMessage(message: any) {
        console.log('received message:', message);
        if (message === 'got user media') {
            this.service.maybeStart();
        } else if (message.type === 'offer') {
            if (!this.service.isStarted && !this.isMaster) {
                this.service.maybeStart();
            }
            this.pc.setRemoteDescription(new RTCSessionDescription(message));
            this.service.doAnswer();
        } else if (message.type === 'answer') {
            this.pc.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate') {
            const candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            this.pc.addIceCandidate(candidate);
        } else if (message === 'bye') {
            this.service.stop();
        }
    }
}

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
    // offerToReceiveAudio: false, no audio needed
    offerToReceiveVideo: true
  };

export class WebRTCService {
    // private localVideo: HTMLVideoElement;
    private localStream: MediaStream;
    // private remoteVideo: HTMLVideoElement;

    private pc?: RTCPeerConnection;
    private signaling: SignalingServer;

    onRemoteAdded: (stream: MediaStream) => void;

    isStarted: boolean;

    constructor(localStream: MediaStream) {
        this.localStream = localStream;
        // this.remoteVideo = remoteVideo;

        this.signaling = new SignalingServer(this);
    }

    createPeerConnection() {
        this.pc = new RTCPeerConnection(null);
        this.pc.onicecandidate = (c) => this.handleIceCandidate(c);
        (this.pc as any).onaddstream = (s: any) => this.handleRemoteStreamAdded(s);
        (this.pc as any).onremovestream = (s: any) => this.handleRemoteStreamRemoved(s);

        this.signaling.pc = this.pc;
    }

    maybeStart() {
        if (!this.isStarted) {
            this.createPeerConnection();
            (this.pc as any).addStream(this.localStream);
            this.isStarted = true;
            console.log('isMaster: ' + this.signaling.isMaster);
            if (this.signaling.isMaster) {
                this.makeCall();
            }
        }
    }

    private handleIceCandidate(event: RTCPeerConnectionIceEvent) {
        console.log('icecandidate event:', event);
        if (event.candidate) {
            this.signaling.sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        } else {
            console.log('End of candidates');
        }
    }

    private handleRemoteStreamAdded(event: any) {
        console.log('remote stream added');
        // this.remoteVideo.srcObject = event.stream;
        this.onRemoteAdded(event.stream);
    }
    
    private handleRemoteStreamRemoved(event: any) {
        console.log('remote stream removed:', event);
    }

    makeCall() {
        console.log('sending offer to peer');
        this.pc.createOffer()
            .then((desc) => this.setLocalAndSendMessage(desc))
            .catch((error) => {
                console.log('failed to create offer:', error);
            });
    }

    doAnswer() {
        console.log('sending answer to peer');
        this.pc.createAnswer()
            .then((desc) => this.setLocalAndSendMessage(desc))
            .catch((error) => {
                console.log('failed to create answer:', error);
            });
    }

    private setLocalAndSendMessage(sessionDescription: RTCSessionDescriptionInit) {
        this.pc.setLocalDescription(sessionDescription);
        this.signaling.sendMessage(sessionDescription);
    }

    bye() {
        this.signaling.sendMessage('bye');
    }

    stop() {
        this.isStarted = false;
        this.pc.close();
        this.pc = null;
    }
}
