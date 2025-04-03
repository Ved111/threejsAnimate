import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import "./style.css";

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

// Ensure DOM is ready before initializing Three.js
window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM Loaded");
  initThreeJS();
  setupScrollAnimations();
});

function initThreeJS() {
  console.log("✅ Initializing Three.js");
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

  const modelContainer = document.querySelector(".model");
  if (!modelContainer) {
    console.error("❌ .model container not found");
    return;
  }
  modelContainer.appendChild(renderer.domElement);
  console.log("✅ Renderer attached to .model");

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 3);
  scene.add(ambientLight);
  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(5, 10, 7.5);
  scene.add(mainLight);

  // Load GLTF Model
  const loader = new GLTFLoader();
  loader.load(
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1743670510/josta_bctj0k.glb", // ✅ Ensure this path is correct
    (gltf) => {
      model = gltf.scene;
      scene.add(model);
      console.log("✅ Model Loaded:", model);

      // Center the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      // Adjust camera distance based on model size
      const size = box.getSize(new THREE.Vector3());
      camera.position.z = Math.max(size.x, size.y, size.z) * 1.5;

      model.scale.set(1, 1, 1); // Adjust scale
      modelLoaded = true;
      ScrollTrigger.refresh();
    },
    undefined,
    (error) => {
      console.error("❌ Error loading model:", error);
    }
  );

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

function setupScrollAnimations() {
  console.log("✅ Setting up ScrollTrigger Animations");

  if (!document.querySelector(".info")) {
    console.error("❌ .info section not found");
  }
  if (!document.querySelector(".scan-container")) {
    console.error("❌ .scan-container section not found");
  }

  // 🔄 Flip Model in `.scrolling-text-container`
  ScrollTrigger.create({
    trigger: ".scrolling-text-container",
    start: "top center",
    end: "bottom center",
    scrub: true,
    onEnter: () => {
      if (modelLoaded) {
        gsap.to(model.rotation, { x: Math.PI * 2, duration: 0.7 });
      }
    },
    onLeaveBack: () => {
      if (modelLoaded) {
        gsap.to(model.rotation, { x: 0, duration: 0.7 });
      }
    },
  });

  // 🔄 Flip Model again in `.scrolling-text-container-2`
  ScrollTrigger.create({
    trigger: ".scrolling-text-container-2",
    start: "top center",
    end: "bottom center",
    scrub: true,
    onEnter: () => {
      if (modelLoaded) {
        gsap.to(model.rotation, { x: Math.PI * 4, duration: 0.7 });
      }
    },
    onLeaveBack: () => {
      if (modelLoaded) {
        gsap.to(model.rotation, { x: Math.PI * 2, duration: 0.7 });
      }
    },
  });

  // 🔽 Scale Down in `.scan-container`
  ScrollTrigger.create({
    trigger: ".scan-container",
    start: "top 90%",
    end: "top 50%",
    scrub: true,
    onEnter: () => {
      if (modelLoaded) {
        gsap.to(model.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.7 });
      }
    },
    onLeaveBack: () => {
      if (modelLoaded) {
        gsap.to(model.scale, { x: 1, y: 1, z: 1, duration: 0.7 });
      }
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").innerHTML = `
  <section class="hero">
    <video class="hero-video" autoplay loop muted playsinline>
      <source src="https://www.drinkdonchico.com/cdn/shop/videos/c/vp/4e2ad30bc0f841e18e6d59d00e01d1d3/4e2ad30bc0f841e18e6d59d00e01d1d3.HD-720p-1.6Mbps-43398782.mp4?v=0" type="video/mp4">
    </video>
    <img src='https://res.cloudinary.com/do7dxrdey/image/upload/v1743670509/donchico_sy2naw.png' class="donchico-image" />
    <h1>Stay thirsty... The Don is on his way!</h1>
    <p>The fizzy world of soda had surrendered to the ordinary—until Don Chico stepped in. A legend. A rebel. A mastermind of flavour.</p>
  </section>

  <div class="scrolling-text-container">
    <h1 class="text top-text">A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY</h1>
    <h1 class="text bottom-text">A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY</h1>
  </div>

  <section class="info">
    <div class='heading-info-container'>
      <h1>The Legend of<br /> Real Flavor</h1>
      <p class='midtext'>Don Chico saw what others refused to see. The world deserves something better to satiate their ‘fizzy’ and ‘bubbly’ beverage cravings. He took matters into his own hands, crafting a prebiotic soda unlike anything the world had ever tasted.</p>
      <div class='image-stats'>
        <div class='image-container'><img class='imgStyles' src='https://drinkolipop.com/cdn/shop/files/icon-dollar.png?v=1736262524&width=200' /><p class='image-text'>Pure Ingredients</p></div>
        <div class='image-container'><img class='imgStyles'  src='https://drinkolipop.com/cdn/shop/files/icon-dollar.png?v=1736262524&width=200' /><p class='image-text'>Real Flavour</p></div>
        <div class='image-container'><img class='imgStyles'  src='https://drinkolipop.com/cdn/shop/files/icon-dollar.png?v=1736262524&width=200' /><p class='image-text'>Prebiotic Benefits</p></div>
        <div class='image-container'><img class='imgStyles'  src='https://drinkolipop.com/cdn/shop/files/icon-dollar.png?v=1736262524&width=200' /><p class='image-text'>No Artificial Junk</p></div>
      </div>
    </div>
  </section>

    <div class="scrolling-text-container-2">
    <h1 class="text top-text">A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY</h1>
    <h1 class="text bottom-text">A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY - A REBELLION AGAINST THE ORDINARY</h1>
  </div>

  <section class="cta-section">
  <div class="cta-container">
    <div class="cta-image">
      <img src='https://happihealthies.com/cdn/shop/files/CAMPAIN_FILM.00_01_36_03.Still035.jpg?crop=center&height=3840&v=1733247244&width=2160' alt="Drink Image">
    </div>
    <div class="cta-content">
      <p class="p-styles">Experience the bold and refreshing energy of Don Chico, the drink that keeps you going.</p>
      <button class="cta-button">Buy Now</button>
    </div>
  </div>
</section>
<section class='scan-container'></section>



  

  <div class="model"></div>
    <div class="model"></div>
  `;

  setupCarousel();

  const textElements = document.querySelectorAll(
    "h1, h2, h3, p, span, button, a, li, label, div"
  );
});

document.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  const texts = document.querySelectorAll(".text");

  texts.forEach((text, index) => {
    const direction = index % 2 === 0 ? 1 : -1; // Alternate directions
    text.style.transform = `translateX(${scrollY * 0.2 * direction}px)`;
  });
});
