import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "./style.css";

gsap.registerPlugin(ScrollTrigger);

// Smooth Scrolling Setup
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Declare global model variable
let model;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").innerHTML = `
    <section class="hero">
      <h1>Digital <br />Evolution</h1>
      <h2>Transform your brand identity</h2>
      <p>Experience the experience...</p>
    </section>
    <section class="info">
      <div class="tags">
        <p>Brand strategy</p>
        <p>User experience</p>
        <p>Digital products</p>
        <p>Innovation lab</p>
      </div>
      <h2>Experience the experience...</h2>
      <p>Experience the experience...</p>
    </section>
    <section class="scanner">
      <div class="scan-info">
        <div class="product-id">
          <h2>#98734</h2>
          <p>Transform the transform the</p>
        </div>
      </div>
      <div class="scan-container"></div>
      <div class="barcode">
        <img src="/assets/barcode.jpg" alt="Barcode" />
      </div>
      <div class="purchased"><p>Innovation verified</p></div>
    </section>
    <section class="outro">
      <h2>Experience the experience...</h2>
    </section>
    <div class="model"></div>

  `;

  initThreeJS();
});

// THREE.js Scene Setup
function initThreeJS() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfefdfd);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 3);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.querySelector(".model").appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 3);
  scene.add(ambientLight);
  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(5, 10, 7.5);
  scene.add(mainLight);

  // Load GLTF Model
  const loader = new GLTFLoader();
  loader.load("/assets/josta.glb", (gltf) => {
    model = gltf.scene;
    scene.add(model);

    // Center the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    // Adjust camera
    const size = box.getSize(new THREE.Vector3());
    camera.position.z = Math.max(size.x, size.y, size.z) * 1.5;
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

const stickyHeight = window.innerHeight;
const scannerSection = document.querySelector(".scanner");
const scanContainer = document.querySelector(".scan-container");
const scanSound = new Audio("/assets/scan-sfx.mp3");
gsap.set(scanContainer, { scale: 0 });

ScrollTrigger.create({
  trigger: ".scanner",
  start: "top top",
  end: `${stickyHeight}px`,
  pin: true,
  onEnter: () => {
    if (model) {
      model.position.y = 0;

      setTimeout(() => {
        scanSound.currentTime = 0;
        scanSound.play();
      }, 500);

      gsap.to(model.rotation, {
        y: model.rotation.y + Math.PI * 2,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.to(model.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
              gsap.to(model.scale, {
                x: 0,
                duration: 0.5,
                ease: "power2.in",
              });
            },
          });
        },
      });
    }
  },
});
