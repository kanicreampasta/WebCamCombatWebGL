import * as THREE from 'three';
import { MeshPhysicalMaterial } from 'three';
import { WebRTCService } from './webrtc';
import * as v from './video';

function createFloor(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(5, 5, 0.1);
    const material  =new THREE.MeshNormalMaterial();
    return new THREE.Mesh(geometry, material);
}

function createPlayerObject(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.5, 1, 32);
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = 90;
    return mesh;
}

function createPlayerFace(video: HTMLVideoElement): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    const texture = new THREE.VideoTexture(video);
    const material = new THREE.MeshBasicMaterial({map: texture});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = 90;
    mesh.position.z += 0.3;
    mesh.position.y -= 0.4;
    return mesh;
}

class PlayerObject {
    private body: THREE.Mesh;
    private face: THREE.Mesh;

    constructor(body: THREE.Mesh, face: THREE.Mesh) {
        this.body = body;
        this.face = face;
    }

    addToScene(scene: THREE.Scene) {
        scene.add(this.body);
        scene.add(this.face);
    }

    moveTo(x: number, y: number) {
        this.body.position.x = x;
        this.body.position.y = y;
        this.face.position.x = x;
        this.face.position.y = y;
        this.face.position.y -= 0.4;
    }
}

// init

const video = document.querySelector('#video') as HTMLVideoElement;

// initialize 3d objects
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
camera.position.z = 2;
// camera.position.x = -1;
camera.position.y = -2;
camera.lookAt(new THREE.Vector3(0, 0, 0));

const scene = new THREE.Scene();

const localVideo = document.querySelector('#localVideo') as HTMLVideoElement;
const remoteVideo = document.querySelector('#remoteVideo') as HTMLVideoElement;
v.videoTags.push(localVideo);
v.videoTags.push(remoteVideo);

const floor = createFloor();
const player = new PlayerObject(createPlayerObject(), createPlayerFace(localVideo));
const player2 = new PlayerObject(createPlayerObject(), createPlayerFace(remoteVideo));
scene.add(floor);
player.addToScene(scene);
player2.addToScene(scene);
floor.position.z = -1;
const players = [player, player2];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

// request camera access
/*
let rtc;
let localStream: MediaStream;
let remoteIdx = 1;
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        // apply the stream to the video element used in the texture
        localStream = stream;
        video.srcObject = stream;
        video.play();
        rtc = new WebRTCService(localStream);
        rtc.onRemoteAdded = (stream) => {
            const remoteVideo = document.createElement('video');
            remoteVideo.autoplay = true;
            remoteVideo.srcObject = stream;
            const remotePlayer = new PlayerObject(createPlayerObject(), createPlayerFace(remoteVideo));
            remotePlayer.addToScene(scene);
            players.push(remotePlayer);
        };
        rtc.maybeStart();
    }).catch(function (error) {
        console.error('Unable to access the camera/webcam.', error);
    });
} else {
    console.error('MediaDevices interface not available.');
}
*/

v.initAndStart();

// animation

function animation(time: number) {

    // player.moveTo(Math.cos(time/5000), Math.sin(time/3000)+0.1+0.2);
    // player2.moveTo(-Math.cos(time/5000), -Math.sin(time/3000)-0.1+0.2);
    for (let i=0; i<players.length; i++) {
        players[i].moveTo(Math.cos(time/5000 + i*30*Math.PI/180), 0.3*(i+1));
    }

    renderer.render(scene, camera);

}
