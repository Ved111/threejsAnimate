const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// THREE.js Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefdfd); // Corrected color format

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;

document.addEventListener("DOMContentLoaded", function () {
  const modelContainer = document.querySelector(".model");
  if (!modelContainer) {
    console.error("Error: Element with class 'model' not found!");
    return;
  }

  modelContainer.appendChild(renderer.domElement);
});
// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 7.5);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 3);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

// Animation Loop
function basicAnimate() {
  requestAnimationFrame(basicAnimate);
  renderer.render(scene, camera);
}
basicAnimate();

// Model Loading
let model;
const loader = new THREE.GLTFLoader();
loader.load(
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1745911017/Can_250_Red_gasg9y.glb",
  function (gltf) {
    model = gltf.scene;
    console.log("I got loaded");

    // Compute bounding box for centering
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    // Apply material properties and enable shadows
    model.traverse((node) => {
      if (node.isMesh) {
        if (node.material) {
          node.material.metalness = 0.3;
          node.material.roughness = 0.4;
          node.material.envMapIntensity = 1.5;
        }
        node.castShadow = true;
      }
    });

    scene.add(model);

    // Adjust camera based on model size
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.z = maxDim * 1.5;

    playInitialAnimation();
  }
);
