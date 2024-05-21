import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

let camera, scene, renderer, controls, mixer, clock;
let poemMesh, font, faceMesh, faceHead;
let currentPoemIndex = 0;

const emotionColors = {
    'Happiness': '#ffd700',
    'Sadness': '#0000ff',
    'Fear': '#800080',
    'Disgust': '#008000',
    'Anger': '#ff0000',
    'Surprise': '#ffa500',
    'Anticipation': '#00ff00',
    'Trust': '#00ffff',
    'Guilt': '#8b0000',
    'Love': '#ff69b4',
    'Saudade': '#4682b4',
    'Envy': '#7fff00',
    'Bittersweetness': '#c71585',
    'Loneliness': '#4b0082',
    'Nostalgia': '#ff6347'
};

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
    document.getElementById('scrollUp').addEventListener('click', () => scrollPoem('up'));
    document.getElementById('scrollDown').addEventListener('click', () => scrollPoem('down'));
}

function init() {
    const faceContainer = document.getElementById('face-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    faceContainer.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true; 
    controls.enablePan = true; 
    controls.enableRotate = true; 
    controls.screenSpacePanning = true;
    controls.maxDistance = 10; 
    controls.minDistance = 2;

    clock = new THREE.Clock();

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
        faceMesh = gltf.scene.children[0];
        faceMesh.position.set(-4, 2, 0); 
        faceMesh.scale.set(9, 9, 9);
        faceMesh.rotation.x = 0.5;
        faceMesh.rotation.y = 0.7;
        faceMesh.rotation.z = -0.1;
        scene.add(faceMesh);

        faceHead = faceMesh.getObjectByName("mesh_2");

        faceMesh.traverse(function (child) {
            if (child.isMesh) {
                child.material.color.set(0x81C8D8);
            }
        });

        if (resultsData[currentPoemIndex].emotion_vector.length === 0) {
            mixer = new THREE.AnimationMixer(faceMesh);
            mixer.clipAction(gltf.animations[0]).play();
        }
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
        size: 0.2, 
        height: 0.02,
        curveSegments: 12,
        bevelEnabled: false
    });

    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    poemMesh = new THREE.Mesh(geometry, material);
    poemMesh.position.set(-2, 1, 0);
    poemMesh.rotation.y = -0.3; 
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
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
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
    emotionContainer.innerHTML = ''; 

    vector.forEach((value, index) => {
        const emotion = emotions[index];
        const barContainer = document.createElement('div');
        barContainer.classList.add('emotion-bar');

        const label = document.createElement('div');
        label.classList.add('emotion-label');
        label.textContent = emotion;

        const valueDisplay = document.createElement('div');
        valueDisplay.classList.add('emotion-value');
        valueDisplay.textContent = value.toFixed(2);

        const barBg = document.createElement('div');
        barBg.classList.add('emotion-bar-bg');

        const barFill = document.createElement('div');
        barFill.classList.add('emotion-bar-fill');
        barFill.style.width = `${value * 100}%`;
        barFill.style.backgroundColor = emotionColors[emotion];

        barBg.appendChild(barFill);
        barContainer.appendChild(label);
        barContainer.appendChild(valueDisplay);
        barContainer.appendChild(barBg);
        emotionContainer.appendChild(barContainer);
    });

    let maxEmotion = vector.indexOf(Math.max(...vector));
    if (faceHead && maxEmotion >= 0) {
        adjustFaceExpression(emotions[maxEmotion], vector[maxEmotion]);
    }
}

function adjustFaceExpression(emotion, intensity) {
    const influences = faceHead.morphTargetInfluences;
    const influenceMap = {
        'Happiness': {0: 0.4, 3: 0.4, 4: 0.4, 37: 0.6, 38: 0.6},
        'Sadness': {1: 0.4, 2: 0.4, 39: 0.6, 40: 0.6},
        'Fear': {5: 0.3, 6: 0.3, 17: 0.4, 18: 0.4, 24: 0.2},
        'Disgust': {22: 0.4, 23: 0.4, 45: 0.3, 46: 0.3},
        'Anger': {1: 0.5, 2: 0.5, 39: 0.4, 40: 0.4},
        'Surprise': {0: 0.6, 3: 0.5, 4: 0.5, 17: 0.5, 18: 0.5},
        'Anticipation': {0: 0.3, 3: 0.3, 4: 0.3, 37: 0.3, 38: 0.3},
        'Trust': {0: 0.3, 3: 0.3, 4: 0.3, 37: 0.3, 38: 0.3},
        'Guilt': {1: 0.3, 2: 0.3, 39: 0.3, 40: 0.3, 45: 0.3, 46: 0.3},
        'Love': {0: 0.4, 3: 0.4, 4: 0.4, 37: 0.4, 38: 0.4},
        'Saudade': {1: 0.2, 2: 0.2, 39: 0.2, 40: 0.2},
        'Envy': {0: 0.3, 1: 0.3, 2: 0.3, 39: 0.3, 40: 0.3},
        'Bittersweetness': {0: 0.3, 1: 0.3, 2: 0.3, 37: 0.3, 38: 0.3},
        'Loneliness': {1: 0.4, 2: 0.4, 39: 0.4, 40: 0.4},
        'Nostalgia': {0: 0.3, 3: 0.3, 4: 0.3, 37: 0.3, 38: 0.3, 45: 0.3, 46: 0.3}
    };

    influences.fill(0); // Reset influences

    Object.entries(influenceMap[emotion]).forEach(([index, value]) => {
        influences[index] = value * intensity;
    });
}

function scrollPoem(direction) {
    if (direction === 'up') {
        poemMesh.position.y += 0.5;
    } else if (direction === 'down') {
        poemMesh.position.y -= 0.5;
    }
}
