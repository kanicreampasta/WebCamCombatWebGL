import * as THREE from 'three';
import { MeshPhysicalMaterial } from 'three';

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

// init

const video = document.querySelector('#video') as HTMLVideoElement;

// request camera access
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

    const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {

        // apply the stream to the video element used in the texture

        video.srcObject = stream;
        video.play();

    }).catch(function (error) {

        console.error('Unable to access the camera/webcam.', error);

    });

} else {

    console.error('MediaDevices interface not available.');

}

// initialize 3d objects
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
camera.position.z = 2;
// camera.position.x = -1;
camera.position.y = -2;
camera.lookAt(new THREE.Vector3(0, 0, 0));

const scene = new THREE.Scene();

const floor = createFloor();
const player = createPlayerObject();
const face = createPlayerFace(video);
scene.add(floor);
scene.add(player);
scene.add(face);
floor.position.z = -1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

function movePlayer(x: number, y: number) {
    console.log('move')
    player.position.x = x;
    player.position.y = y;
    face.position.x = x;
    face.position.y = y;
    face.position.y -= 0.4;
}

renderer.domElement.addEventListener('keydown', (ev) => {
    console.log(ev);
    switch (ev.key) {
        case 'w':
            movePlayer(0, 0.1);
            break;
    }
});

// animation

function animation(time: number) {

    movePlayer(Math.cos(time/5000), Math.sin(time/3000)+0.1);

    renderer.render(scene, camera);

}
