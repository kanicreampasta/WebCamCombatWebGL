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

        this.socket.on('connect', () => {
            this.socket.emit('create or join', room);
            console.log('attempted to create or join room ' + room);
        });

        this.socket.on('connect_error', (error: any) => {
            console.log('connect error', error);
        });

        this.socket.on('message', this.onMessage);

        this.socket.on('created', (room: any) => {
            console.log('created room ' + room);
            this.isMaster = true;
        });
        
        this.socket.on('full', (room: any) => {
            console.log('room ' + room + ' is full');
        });

        this.socket.on('join', (room: any) => {
            console.log('another peer made a request to join room ' + room);
            console.log('you are the master of room ' + room + '!');
        });

        this.socket.on('joined', (room: any) => {
            console.log('joined room ' + room);
        });

        this.socket.on('log', (array: any) => {
            console.log.apply(console, array);
        });
    }

    sendMessage(message: any) {
        console.log("sending message to signaling server:", message);
        this.socket.emit('message', message);
    }

    private onMessage(message: any) {
        console.log('received message:', message);
        if (message === 'got user media') {
            
        } else if (message.type === 'offer') {

        } else if (message.type === 'answer') {

        } else if (message.type === 'candidate') {

        } else if (message === 'bye') {

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
    private remoteVideo: HTMLVideoElement;

    private pc?: RTCPeerConnection;
    private signaling: SignalingServer;

    private isStarted: boolean;

    constructor(localStream: MediaStream, remoteVideo: HTMLVideoElement) {
        this.localStream = localStream;
        this.remoteVideo = remoteVideo;

        this.signaling = new SignalingServer(this);
    }

    createPeerConnection() {
        this.pc = new RTCPeerConnection(null);
        this.pc.onicecandidate = this.handleIceCandidate;
        (this.pc as any).onaddstream = this.handleRemoteStreamAdded;
        (this.pc as any).onremovestream = this.handleRemoteStreamRemoved;

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
        this.remoteVideo.srcObject = event.stream;
    }
    
    private handleRemoteStreamRemoved(event: any) {
        console.log('remote stream removed:', event);
    }

    makeCall() {
        console.log('sending offer to peer');
        this.pc.createOffer()
            .then(this.setLocalAndSendMessage)
            .catch((error) => {
                console.log('failed to create offer:', error);
            });
    }

    doAnswer() {
        console.log('sending answer to peer');
        this.pc.createAnswer()
            .then(this.setLocalAndSendMessage)
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

    private stop() {
        this.isStarted = false;
        this.pc.close();
        this.pc = null;
    }
}
