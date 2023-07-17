import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
const model = new URL("../assets/assemblyfb.glb", import.meta.url).href;
import "./index.css";

if (ZapparThree.browserIncompatible()) {
  ZapparThree.browserIncompatibleUI();

  throw new Error("Unsupported browser");
}

const manager = new ZapparThree.LoadingManager();

const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
document.body.appendChild(renderer.domElement);

//resize the canvas if the window resizes
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Zappar camera instead of a ThreeJS camera
const camera = new ZapparThree.Camera();

ZapparThree.permissionRequestUI().then((granted) => {
  if (granted) camera.start();
  else ZapparThree.permissionDeniedUI();
});

ZapparThree.glContextSet(renderer.getContext());

scene.background = camera.backgroundTexture;

const instantTracker = new ZapparThree.InstantWorldTracker();
const instantTrackerGroup = new ZapparThree.InstantWorldAnchorGroup(
  camera,
  instantTracker
);

scene.add(instantTrackerGroup);

const gltfLoader = new GLTFLoader(manager);

gltfLoader.load(
  model,
  (gltf) => {
    // Model loaded
    const modelObject = gltf.scene;
    modelObject.scale.set(2, 2, 2);
    instantTrackerGroup.add(modelObject);
  },
  undefined,
  () => {
    console.log("An error occurred loading the GLTF model");
  }
);

// some lighting
const directionalLight = new THREE.DirectionalLight("white", 1.5);
directionalLight.position.set(0, 5, 0);
directionalLight.lookAt(0, 0, 0);
instantTrackerGroup.add(directionalLight);

// And then a little ambient light to brighten the model up a bit
const ambientLight = new THREE.AmbientLight("white", 0.8);
instantTrackerGroup.add(ambientLight);

// The user can confirm the location by tapping on the screen
let hasPlaced = false;
const placeButton =
  document.getElementById("tap-to-place") || document.createElement("div");
placeButton.addEventListener("click", () => {
  hasPlaced = true;
  placeButton.remove();
});

// Use a function to render our scene as usual
function render(): void {
  if (!hasPlaced) {
    // If the user hasn't chosen a place in their room yet, update the instant tracker
    // to be directly in front of the user
    instantTrackerGroup.setAnchorPoseFromCameraOffset(0, 0, -1);
  }

  // camera must have updateFrame called every frame
  camera.updateFrame(renderer);

  // Draw the ThreeJS scene  using the Zappar camera
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

// Start
render();
