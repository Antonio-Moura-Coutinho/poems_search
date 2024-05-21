// Import necessary modules from three.js
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
init();

function init() {
  let mixer;

  const clock = new THREE.Clock();

  const container = document.createElement("div");
  document.body.appendChild(container);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    20
  );
  camera.position.set(-0.2, 0.2, 6.1);

  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  container.appendChild(renderer.domElement);

  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("jsm/libs/basis/")
    .detectSupport(renderer);

  new GLTFLoader()
    .setKTX2Loader(ktx2Loader)
    .setMeshoptDecoder(MeshoptDecoder)
    .load("models/gltf/facecap.glb", (gltf) => {
      const mesh = gltf.scene.children[0];

      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          // Assuming the model's material can be directly colored
          child.material.color.set(0x81c8d8);
          //child.material.color.set(0xA1E881);
          //child.material.color.set(0x740808);
        }
      });
      scene.add(mesh);
      scene.background = new THREE.Color(0x000000);
      mesh.position.set(0, 1.5, -1);
      mixer = new THREE.AnimationMixer(mesh);

      mixer.clipAction(gltf.animations[0]).play();

      // GUI

      const head = mesh.getObjectByName("mesh_2");

      const influences = head.morphTargetInfluences;

      const gui = new GUI();

      gui.close();

      for (const [key, value] of Object.entries(head.morphTargetDictionary)) {
        gui
          .add(influences, value, 0, 1, 0.01)
          .name(key.replace("blendShape1.", ""))
          .listen();
        console.log(Object.keys(head.morphTargetDictionary));

        head.morphTargetInfluences[0] = 0;
        head.morphTargetInfluences[1] = 0;
        head.morphTargetInfluences[3] = 0.5;

        head.morphTargetInfluences[37] = 0.6;
        head.morphTargetInfluences[38] = 0.9;
      }
    });

  function moveFaceComponent(component) {
    switch (component) {
      case "browInnerUp":
        head.morphTargetInfluences[0] += 0.1;
        break;
      case "browDown_L":
        head.morphTargetInfluences[1] += 0.1;
        break;
      case "browDown_R":
        head.morphTargetInfluences[2] += 0.1;
        break;
      case "browOuterUp_L":
        head.morphTargetInfluences[3] += 0.1;
        break;
      case "browOuterUp_R":
        head.morphTargetInfluences[4] += 0.1;
        break;
      case "eyeLookUp_L":
        head.morphTargetInfluences[5] += 0.1;
        break;
      case "eyeLookUp_R":
        head.morphTargetInfluences[6] += 0.1;
        break;
      case "eyeLookDown_L":
        head.morphTargetInfluences[7] += 0.1;
        break;
      case "eyeLookDown_R":
        head.morphTargetInfluences[8] += 0.1;
        break;
      case "eyeLookIn_L":
        head.morphTargetInfluences[9] += 0.1;
        break;
      case "eyeLookIn_R":
        head.morphTargetInfluences[10] += 0.1;
        break;
      case "eyeLookOut_L":
        head.morphTargetInfluences[11] += 0.1;
        break;
      case "eyeLookOut_R":
        head.morphTargetInfluences[12] += 0.1;
        break;
      case "eyeBlink_L":
        head.morphTargetInfluences[13] += 0.1;
        break;
      case "eyeBlink_R":
        head.morphTargetInfluences[14] += 0.1;
        break;
      case "eyeSquint_L":
        head.morphTargetInfluences[15] += 0.1;
        break;
      default:
        console.log("Invalid face component");
    }
  }

  const environment = new RoomEnvironment(renderer);
  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  scene.environment = pmremGenerator.fromScene(environment).texture;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 2.5;
  //controls.maxDistance = 5;
  controls.minAzimuthAngle = -Math.PI / 2;
  controls.maxAzimuthAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 1.8;
  //controls.target.set(0, 0.15, -0.2);

  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();

    renderer.render(scene, camera);
    controls.update();
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
