import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

let camera, scene, renderer, controls, mixer, clock;
let poemMesh, font, faceMesh, faceHead, poetMesh, titleMesh;
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
const baseExpression = {
    'Happiness': { indices: [0, 3, 4, 37, 38], intensity: [0.4, 0.4, 0.4, 0.6, 0.6] },
    'Sadness': { indices: [1, 2, 39, 40], intensity: [0.4, 0.4, 0.6, 0.6] },
    'Fear': { indices: [5, 6, 17, 18, 24], intensity: [0.3, 0.3, 0.4, 0.4, 0.2] },
    'Disgust': { indices: [22, 23, 45, 46], intensity: [0.4, 0.4, 0.3, 0.3] },
    'Anger': { indices: [1, 2, 39, 40], intensity: [0.5, 0.5, 0.4, 0.4] },
    'Surprise': { indices: [0, 3, 4, 17, 18], intensity: [0.6, 0.5, 0.5, 0.5, 0.5] },
    'Anticipation': { indices: [0, 3, 4, 37, 38], intensity: [0.3, 0.3, 0.3, 0.3, 0.3] },
    'Trust': { indices: [0, 3, 4, 37, 38], intensity: [0.3, 0.3, 0.3, 0.3, 0.3] },
    'Guilt': { indices: [1, 2, 39, 40, 45, 46], intensity: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3] },
    'Love': { indices: [0, 3, 4, 37, 38], intensity: [0.4, 0.4, 0.4, 0.4, 0.4] },
    'Saudade': { indices: [1, 2, 39, 40], intensity: [0.2, 0.2, 0.2, 0.2] },
    'Envy': { indices: [0, 1, 2, 39, 40], intensity: [0.3, 0.3, 0.3, 0.3, 0.3] },
    'Bittersweetness': { indices: [0, 1, 2, 37, 38], intensity: [0.3, 0.3, 0.3, 0.3, 0.3] },
    'Loneliness': { indices: [1, 2, 39, 40], intensity: [0.4, 0.4, 0.4, 0.4] },
    'Nostalgia': { indices: [0, 3, 4, 37, 38, 45, 46], intensity: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3] }
};


const resultsData = JSON.parse(localStorage.getItem('results')) || [{
    poem: 'No poems available. Please go back and search again.',
    emotion_vector: [],
    poet: 'No Poet'
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
        changePoet(resultsData[currentPoemIndex].poet);
        changeTitle(resultsData[currentPoemIndex].title);
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

    const maxWordsPerLine = 10;
    const punctuationRegex = /[,:.!?;]/;
    const words = text.split(' ');
    let formattedText = '';
    let currentLine = '';

    words.forEach((word, index) => {
        currentLine += word + ' ';
        if (punctuationRegex.test(word) || currentLine.split(' ').length >= maxWordsPerLine || index === words.length - 1) {
            formattedText += currentLine.trim() + '\n';
            currentLine = '';
        }
    });

    const geometry = new TextGeometry(formattedText.trim(), {
        font: font,
        size: 0.2,
        height: 0.02,
        curveSegments: 12,
        bevelEnabled: false
    });

    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    poemMesh = new THREE.Mesh(geometry, material);
    poemMesh.position.set(-2, 3, -3);
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
    changePoet(resultsData[currentPoemIndex].poet);
    changeTitle(resultsData[currentPoemIndex].title);

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
        label.textContent = `${emotion}: ${value.toFixed(2) * 100}%`;

        
        const barBg = document.createElement('div');
        barBg.classList.add('emotion-bar-bg');

        const barFill = document.createElement('div');
        barFill.classList.add('emotion-bar-fill');
        barFill.style.width = `${value * 100}%`;
        barFill.style.backgroundColor = emotionColors[emotion];

        barBg.appendChild(barFill);
        barContainer.appendChild(label);
        barContainer.appendChild(barBg);
        emotionContainer.appendChild(barContainer);
    });

    let maxEmotion = vector.indexOf(Math.max(...vector));
    if (faceHead && maxEmotion >= 0) {
        adjustFaceExpression(emotions[maxEmotion], vector[maxEmotion]);
    }
}

function interpolateExpression(emotion, intensity) {
    const influences = faceHead.morphTargetInfluences;
    influences.fill(0); // Reset all influences

    const emotionData = baseExpression[emotion];
    emotionData.indices.forEach((index, idx) => {
        influences[index] = emotionData.intensity[idx] * intensity;
    });
}
function adjustFaceExpression(emotion, intensity) {
    interpolateExpression(emotion, intensity);
}


function scrollPoem(direction) {
    if (direction === 'up') {
        poemMesh.position.y += 0.5;
    } else if (direction === 'down') {
        poemMesh.position.y -= 0.5;
    }
}

function changePoet(poet){
    if (poetMesh) {
        scene.remove(poetMesh);
    }
    
    const geometry = new TextGeometry('Poet:  ' + poet, {
        font: font,
        size: 0.05,
        height: 0.01,
        curveSegments: 5,
        bevelEnabled: false
    });
    const material = new THREE.MeshStandardMaterial({ color: 0x81C8D8 });
    poetMesh = new THREE.Mesh(geometry, material);
    poetMesh.position.set(-1.6, 0, 4);
    poetMesh.rotation.y = 0.7;
    scene.add(poetMesh);
}

function changeTitle(title){
    if (titleMesh) {
        scene.remove(titleMesh);
    }
    
    const geometry = new TextGeometry(title, {
        font: font,
        size: 0.2,
        height: 0.02,
        curveSegments: 12,
        bevelEnabled: false
    });
    const material = new THREE.MeshStandardMaterial({ color: 0x81C8D8 });
    titleMesh = new THREE.Mesh(geometry, material);
    titleMesh.position.set(-2, 4, -3);
    titleMesh.rotation.y = -0.3;
    scene.add(titleMesh);
}