import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

let camera, scene, renderer, controls;
let poemMesh, font;
let currentPoemIndex = 0;

const resultsData = JSON.parse(localStorage.getItem('results')) || [{
    poem: 'No poems available. Please go back and search again.',
    emotion_vector: []
}];

const emotions = [
    'Happiness', 'Sadness', 'Fear', 'Disgust', 'Anger', 'Surprise', 
    'Anticipation', 'Trust', 'Guilt', 'Love', 'Saudade', 'Envy', 
    'Bittersweetness', 'Loneliness', 'Nostalgia'
];

document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
    setupNavigation();
    displayPoem();
});

function setupNavigation() {
    document.getElementById('nextPoem').addEventListener('click', () => showNextPoem());
    document.getElementById('prevPoem').addEventListener('click', () => showPreviousPoem());
    document.getElementById('backToSearch').addEventListener('click', () => window.location.href = 'index.html');
}

function init() {
    const faceContainer = document.createElement('div');
    faceContainer.id = 'face-container';
    document.body.appendChild(faceContainer);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    faceContainer.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);

    const loader = new FontLoader();
    loader.load('fonts/helvetiker_regular.typeface.json', function (loadedFont) {
        font = loadedFont;
        changePoem(resultsData[currentPoemIndex].poem);
    });

    loadFaceModel();

    const ambientLight = new THREE.AmbientLight(0x404040, 7);
    scene.add(ambientLight);

    const lightFace = new THREE.DirectionalLight(0xffffff, 7);
    lightFace.position.set(1, 4, 2);
    scene.add(lightFace);

    const textLight = new THREE.DirectionalLight(0xffffff, 9);
    textLight.position.set(1, -9, 2);
    scene.add(textLight);
}

function loadFaceModel() {
    const ktx2Loader = new KTX2Loader().setTranscoderPath('jsm/libs/basis/').detectSupport(renderer);
    const gltfLoader = new GLTFLoader().setKTX2Loader(ktx2Loader).setMeshoptDecoder(MeshoptDecoder);

    gltfLoader.load('models/gltf/facecap.glb', function (gltf) {
        const faceMesh = gltf.scene.children[0];
        faceMesh.position.set(0, 0, 0);
        faceMesh.scale.set(9, 9, 9);
        faceMesh.rotation.x = Math.PI / 11;
        scene.add(faceMesh);

        faceMesh.traverse(function (child) {
            if (child.isMesh) {
                child.material.color.set(0x81C8D8);
            }
        });
    }, undefined, function (error) {
        console.error('An error happened with the GLTF loader:', error);
    });
}

function changePoem(text) {
    if (poemMesh) {
        scene.remove(poemMesh);
    }

    const geometry = new TextGeometry(text, {
        font: font,
        size: 0.3,
        height: 0.1,
    });
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    poemMesh = new THREE.Mesh(geometry, material);
    poemMesh.position.set(-3, -2, 0);
    scene.add(poemMesh);
}

function showNextPoem() {
    currentPoemIndex = (currentPoemIndex + 1) % resultsData.length;
    displayPoem();
}

function showPreviousPoem() {
    currentPoemIndex = (currentPoemIndex - 1 + resultsData.length) % resultsData.length;
    displayPoem();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function displayPoem() {
    const poemText = document.getElementById('poem-text');
    poemText.textContent = resultsData[currentPoemIndex].poem;
    displayEmotionVector(resultsData[currentPoemIndex].emotion_vector);
    changePoem(resultsData[currentPoemIndex].poem);
}

function displayEmotionVector(vector) {
    const emotionContainer = document.getElementById('emotion-vector-container');
    const ul = document.createElement('ul');
    vector.forEach((value, index) => {
        const li = document.createElement('li');
        li.textContent = `${emotions[index]}: ${value.toFixed(2)}`;
        ul.appendChild(li);
    });
    emotionContainer.innerHTML = ''; // Clear previous content
    emotionContainer.appendChild(ul);
}
