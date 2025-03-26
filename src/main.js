import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
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
let modelLoaded = false; // Track if the model has finished loading

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").innerHTML = `
  <section class="hero">
    <video class="hero-video" autoplay loop muted playsinline>
      <source src="https://www.drinkdonchico.com/cdn/shop/videos/c/vp/4e2ad30bc0f841e18e6d59d00e01d1d3/4e2ad30bc0f841e18e6d59d00e01d1d3.HD-720p-1.6Mbps-43398782.mp4?v=0" type="video/mp4">
    </video>
    <h1>The Legend of Don Chico</h1>
    <h2>Stay thirsty... The Don is on his way!</h2>
    <p>The fizzy world of soda had surrendered to the ordinary—until Don Chico stepped in. A legend. A rebel. A mastermind of flavour.</p>
  </section>

  <div class="scrolling-text-container">
    <h1 class="text top-text">A REBELLION AGAINST THE ORDINARY</h1>
    <h1 class="text bottom-text">A REBELLION AGAINST THE ORDINARY</h1>
  </div>

  <section class="info">
    <div class='heading-info-container'>
      <h1>The Legend of Real Flavor</h1>
      <p class='midtext'>Don Chico saw what others refused to see. The world deserves something better to satiate their ‘fizzy’ and ‘bubbly’ beverage cravings. He took matters into his own hands, crafting a prebiotic soda unlike anything the world had ever tasted.</p>
      <div class='flex'>
        <div class='image-container'><img class='imgStyles' src='https://drinkolipop.com/cdn/shop/files/icon-dollar.png?v=1736262524&width=200' /><p class='image-text'>Pure Ingredients</p></div>
        <div class='image-container'><img class='imgStyles'  src='https://drinkolipop.com/cdn/shop/files/icon-dollar.png?v=1736262524&width=200' /><p class='image-text'>Real Flavour</p></div>
        <div class='image-container'><img class='imgStyles'  src='https://drinkolipop.com/cdn/shop/files/icon-dollar.png?v=1736262524&width=200' /><p class='image-text'>Prebiotic Benefits</p></div>
        <div class='image-container'><img class='imgStyles'  src='https://drinkolipop.com/cdn/shop/files/icon-dollar.png?v=1736262524&width=200' /><p class='image-text'>No Artificial Junk</p></div>
      </div>
    </div>
  </section>

  <section class="scanner">
    <div class="scan-info">
      <div class="product-id">
        <h2>#DONCHICO98734</h2>
        <p>"A drink should delight, not destroy."</p>
      </div>
    </div>
    <div class="scan-container"></div>
    <div class="barcode">
      <img src="/assets/barcode.jpg" alt="Barcode" />
    </div>
    <div class="purchased"><p>Innovation Verified. Legend Approved.</p></div>
  </section>

  

  <div class="model"></div>
    <div class="model"></div>
  `;

  setupCarousel();

  initThreeJS();

  const textElements = document.querySelectorAll(
    "h1, h2, h3, p, span, button, a, li, label, div"
  );

  // Apply Ohno Blaze effect to each
  textElements.forEach((el) => {
    OhnoBlaze.create(el, {
      intensity: 2, // Adjust intensity
      speed: 1.5, // Adjust speed
      variation: 1, // Add variation
      color: "red", // Change effect color
    });
  });
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
    modelLoaded = true; // Mark as loaded

    // Center the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    // Adjust camera
    const size = box.getSize(new THREE.Vector3());
    camera.position.z = Math.max(size.x, size.y, size.z) * 1.5;

    // Ensure model starts with full scale
    model.scale.set(1, 1, 1);
    ScrollTrigger.refresh(); // Ensure triggers update after loading
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

// Ensure ScrollTrigger runs AFTER DOM loads
window.addEventListener("load", () => {
  const scannerSection = document.querySelector(".scanner");
  const scanContainer = document.querySelector(".scan-container");
  const scanSound = new Audio("/assets/scan-sfx.mp3");

  gsap.set(scanContainer, { scale: 0 });

  // DEBUG: Check if scanner section exists
  console.log("Scanner section found:", scannerSection);

  // Rotate model on scroll
  ScrollTrigger.create({
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      if (model) {
        model.rotation.x = self.progress * Math.PI * 4;
      }
    },
  });

  // Hide model when reaching the scanner section
  ScrollTrigger.create({
    trigger: scannerSection,
    start: "top 1%",
    end: "top 40%",
    markers: true, // Debug markers
    onEnter: () => {
      console.log("Entering scanner section");
      if (modelLoaded && model) {
        console.log("Hiding model");
        gsap.to(model.scale, {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 0.01,
          ease: "power2.in",
        });
      }
    },
    onLeaveBack: () => {
      console.log("Leaving scanner section");
      if (modelLoaded && model) {
        console.log("Showing model");
        gsap.to(model.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    },
  });
});

// Circular Carousel Setup
function setupCarousel() {
  function rotateCarousel() {}

  setInterval(rotateCarousel, 3000); // Auto-rotate every 3s
}

document.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  const texts = document.querySelectorAll(".text");

  texts.forEach((text, index) => {
    const direction = index % 2 === 0 ? 1 : -1; // Alternate directions
    text.style.transform = `translateX(${scrollY * 0.2 * direction}px)`;
  });
});
