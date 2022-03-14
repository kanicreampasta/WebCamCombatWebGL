// const io = require('socket.io-client');

class SignalingServer {
    private socket: any;
    pc: RTCPeerConnection;
    isMaster: boolean;
    private service: WebRTCService;

    constructor(service: WebRTCService) {
        this.service = service;
        this.isMaster = true;
    }

    sendMessage(message: any) {
        console.log("sending message to signaling server:", message);
        fetch('http://localhost:8080/offer', {
            method: 'POST',
            body: JSON.stringify(message),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(answer => {
            this.pc.setRemoteDescription(answer);
        })
        .catch(e => {
            console.warn(e);
        });
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
            // this.signaling.sendMessage({
            //     type: 'candidate',
            //     label: event.candidate.sdpMLineIndex,
            //     id: event.candidate.sdpMid,
            //     candidate: event.candidate.candidate
            // });
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
        this.signaling.sendMessage({
            sdp: sessionDescription.sdp,
            type: sessionDescription.type
        });
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
