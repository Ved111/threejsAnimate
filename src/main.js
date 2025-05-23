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
let centerCan, leftCan, rightCan;
let modelLoaded = false; // Track if the model has finished loading

let swapCount = 0;
let lastXMovement = 0;
let zeroCrossCount = 0;

// Ensure DOM is ready before initializing Three.js
window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM Loaded");
  initThreeJS();
  setupScrollAnimations();
});

function initThreeJS() {
  console.log("✅ Initializing Three.js");

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  // Top light
  const topLight = new THREE.DirectionalLight(0xffffff, 2);
  topLight.position.set(0, 10, 0);
  scene.add(topLight);

  // Bottom fill (bounces light from below)
  const bottomLight = new THREE.PointLight(0xffffff, 1.5, 2);
  bottomLight.position.set(0, -5, 0);
  scene.add(bottomLight);

  // Front light
  const frontLight = new THREE.DirectionalLight(0xffffff, 2);
  frontLight.position.set(0, 0, 10);
  scene.add(frontLight);

  // Back light
  const backLight = new THREE.DirectionalLight(0xffffff, 2);
  backLight.position.set(0, 0, -10);
  scene.add(backLight);

  // Left light
  const leftLight = new THREE.DirectionalLight(0xffffff, 2);
  leftLight.position.set(-10, 0, 0);
  scene.add(leftLight);

  // Right light
  const rightLight = new THREE.DirectionalLight(0xffffff, 2);
  rightLight.position.set(10, 0, 0);
  scene.add(rightLight);

  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const modelContainer = document.querySelector(".model");
  if (!modelContainer) {
    console.error("❌ .model container not found");
    return;
  }
  modelContainer.appendChild(renderer.domElement);
  console.log("✅ Renderer attached to .model");

  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(10, 10, 10);
  scene.add(keyLight);
  const loader = new GLTFLoader();

  // GLB URLs for three cans
  const modelURLs = {
    center:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1747923870/2.44_u6yamm.glb",
    left: "https://res.cloudinary.com/do7dxrdey/image/upload/v1747987124/starberry_yeswvi.glb",
    right:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1747977846/appleCOT_tibxq0.glb",
  };

  // Load all cans
  Promise.all(
    Object.entries(modelURLs).map(
      ([key, url]) =>
        new Promise((resolve, reject) => {
          loader.load(
            url,
            (gltf) => {
              const model = gltf.scene;

              // Center and scale the model
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              model.position.sub(center);
              model.position.y = -center.y;
              model.scale.set(0.6, 0.6, 0.6);

              model.traverse((child) => {
                if (
                  child.isMesh &&
                  child.material &&
                  child.material.isMeshStandardMaterial
                ) {
                  const oldMat = child.material;

                  child.material = new THREE.MeshStandardMaterial({
                    color: oldMat.color || new THREE.Color(0xffffff),
                    metalness: 1,
                    roughness: 0.5,
                    envMapIntensity: 2,
                    map: oldMat.map || null,
                    needsUpdate: true,
                  });

                  child.receiveShadow = true;
                  child.geometry.computeVertexNormals(); // Ensure normals are good
                }
              });

              resolve({ key, model, size });
            },
            undefined,
            (error) => {
              console.error(`❌ Error loading ${key} can:`, error);
              reject(error);
            }
          );
        })
    )
  )
    .then((results) => {
      let maxWidth = 0;

      results.forEach(({ key, model, size }) => {
        // Position the cans
        model.position.y = -1;
        if (key === "left") {
          model.rotation.set(0, 0, 0);
          model.position.x = -7;
          leftCan = model;
        } else if (key === "right") {
          model.rotation.set(0, 0, 0);
          model.position.x = 7;
          rightCan = model;
        }

        if (key === "center") {
          model.rotation.set(0, 0, 0);
          centerCan = model;
        }

        scene.add(model);
        maxWidth = Math.max(maxWidth, size.x, size.y, size.z);
      });
      modelLoaded = true;

      // Adjust camera to fit the largest model
      camera.position.z = maxWidth * 2;
      camera.updateProjectionMatrix();

      // Start rendering
      animate();
    })
    .catch((err) => {
      console.error("🚨 Failed to load models:", err);
    });

  function animate() {
    requestAnimationFrame(animate);
    renderer.shadowMap.enabled = false;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.render(scene, camera);
  }

  animate();
}

function setupScrollAnimations() {
  function swapCans() {
    if (!modelLoaded) return;

    // Save references
    const oldCenter = centerCan;
    const oldLeft = leftCan;
    const oldRight = rightCan;

    // Rotate roles: center → left, left → right, right → center
    centerCan = oldLeft;
    leftCan = oldRight;
    rightCan = oldCenter;

    // Update positions
    centerCan.position.x = 0;
    leftCan.position.x = -7;
    rightCan.position.x = 7;

    // Optional: update rotation or other props if needed
    centerCan.rotation.set(0, 0, 0);
    leftCan.rotation.set(0, 0, 0);
    rightCan.rotation.set(0, 0, 0);
  }

  ScrollTrigger.create({
    trigger: ".custom-border-section",
    start: "top center",
    end: "bottom 80%",
    scrub: true,
    onEnterBack: () => {
      swapCount = 0;
      lastXMovement = 0;
      zeroCrossCount = 0;
    },

    // 🧹 Optional: also reset when completely leaving the section forward
    onLeave: () => {
      swapCount = 0;
      lastXMovement = 0;
      zeroCrossCount = 0;
    },
    onUpdate: (self) => {
      if (!modelLoaded) return;

      console.log(swapCount);
      const progress = self.progress;

      // Z-axis tilt
      const tiltAmount = Math.sin(progress * Math.PI * 2) * 0.1;
      centerCan.rotation.z = tiltAmount;

      // Spin bacesed on scroll velocity
      const scrollVelocity = self.getVelocity();
      const spinSpeed =
        Math.abs(scrollVelocity) > 0 ? scrollVelocity * 0.00005 : 0;
      centerCan.rotation.y += spinSpeed;

      // X-movement for oscillation
      const xMovement = Math.sin(progress * Math.PI * 3) * 1.2;
      centerCan.position.x = xMovement;
      // ✅ Detect zero-crossing (sign change) in xMovement

      if (
        (xMovement > 0 && lastXMovement <= 0) ||
        (xMovement < 0 && lastXMovement >= 0)
      ) {
        console.log("triggered!", zeroCrossCount);
        zeroCrossCount++;

        // Skip the first center pass (initial), and last one
        if (zeroCrossCount !== 1) {
          swapCans();
          swapCount++;
        }
      }

      lastXMovement = xMovement;
    },
  });

  ScrollTrigger.create({
    trigger: ".can-hero-section",
    start: "top top", // Section top reaches top of viewport
    end: "bottom bottom", // Section bottom reaches bottom of viewport
    scrub: true,
    onEnter: () => {
      if (modelLoaded) {
        gsap.to(centerCan.scale, {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 0.5,
          ease: "power2.out",
        });
        gsap.to(leftCan.scale, {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 0.5,
          ease: "power2.out",
        });
        gsap.to(rightCan.scale, {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    },
    onLeaveBack: () => {
      if (modelLoaded) {
        const targetScale = { x: 0.6, y: 0.6, z: 0.6 };

        [centerCan, leftCan, rightCan].forEach((can) => {
          gsap.to(can.scale, {
            ...targetScale,
            duration: 0.7,
            ease: "power2.out",
          });
        });
      }
    },
  });

  ScrollTrigger.create({
    trigger: ".poppy-section",
    start: "top 80%",
    end: "top 1%",
    scrub: true,
    onUpdate: (self) => {
      if (!modelLoaded) return;

      const t = self.progress; // from 0 to 1
      const easedT = gsap.utils.interpolate(
        0,
        1,
        gsap.parseEase("power2.inOut")(t)
      );

      // ✴️ Thrust starts after 30% scroll
      const dropStart = 0.9;
      let dropT = 0;

      if (t > dropStart) {
        const normalizedT = (t - dropStart) / (1 - dropStart); // maps 0.3–1 → 0–1
        const fastT = Math.min(normalizedT * 2, 1); // double speed
        dropT = gsap.parseEase("power4.in")(fastT);
      }

      // Thrust down: Y = -0.05 → -1
      centerCan.position.y = gsap.utils.interpolate(-1, -1.1, dropT);

      // Animate all rotations from (0, 0, 0) to (0, 2, 0)
      const targetRotationY = gsap.utils.interpolate(
        centerCan.rotation.y,
        0,
        easedT
      );

      leftCan.rotation.set(0, targetRotationY, 0);
      centerCan.rotation.set(0, targetRotationY, 0);
      rightCan.rotation.set(0, targetRotationY, 0);

      // Start moving side cans earlier
      const appearStart = 0.1;
      let earlyT = 0;
      if (t > appearStart) {
        const localT = (t - appearStart) / (1 - appearStart); // normalize from 0.1–1 → 0–1
        earlyT = gsap.parseEase("power3.out")(Math.min(localT, 1));
      }

      leftCan.position.x = gsap.utils.interpolate(-7, -1, earlyT);
      rightCan.position.x = gsap.utils.interpolate(7, 1, earlyT);
    },
    onLeaveBack: () => {
      // Reset positions when scrolling back up
      if (leftCan && rightCan) {
        leftCan.position.set(-7, 0, 0); // Reset X-position
        rightCan.position.set(7, 0, 0); // Reset X-position

        leftCan.rotation.set(0, 2, 0);
        centerCan.rotation.set(0, 0, 0);
        rightCan.rotation.set(0, 2, 0);

        leftCan.position.y = -1;
        centerCan.position.y = -1;
        rightCan.position.y = -1;
      }
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").innerHTML = `

  <div class="intro-screen">
  <div class="logo-container">
    <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1744179914/donchicoredlogo_uzs2if.png" class="main-logo shimmer" />
    <div class="flavors-row">
      <img src='https://res.cloudinary.com/do7dxrdey/image/upload/v1744616117/12_1_tgay16.png' class="flavor-img shimmer" />
      <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1744617210/38_1_ppivfj.png" class="flavor-img shimmer" />
      <img src='https://res.cloudinary.com/do7dxrdey/image/upload/v1744617469/25_1_y9hpks.png' class="flavor-img shimmer" />
    </div>
  </div>
</div>
  <section class="hero">
    <video class="hero-video" autoplay loop muted playsinline>
      <source src="https://www.drinkdonchico.com/cdn/shop/videos/c/vp/4e2ad30bc0f841e18e6d59d00e01d1d3/4e2ad30bc0f841e18e6d59d00e01d1d3.HD-720p-1.6Mbps-43398782.mp4?v=0" type="video/mp4">
    </video>
    <img src='https://res.cloudinary.com/do7dxrdey/image/upload/v1744179914/donchicoredlogo_uzs2if.png' class="donchico-image" />
    <h1>Stay thirsty... The Don is on his way!</h1>
    <p>The fizzy world of soda had surrendered to the ordinary—until Don Chico stepped in. A legend. A rebel. A mastermind of flavour.</p>
  </section>

  

  <section class="custom-border-section">

   
  <div> <div class="text-line left"><div class='gradient-div'><img class='gradient-img' src='https://res.cloudinary.com/do7dxrdey/image/upload/v1744616117/12_1_tgay16.png'/><div>This one goes left → right</div></div></div>
  <div class="text-line right"><div class='gradient-div'><img class='gradient-img' src='https://res.cloudinary.com/do7dxrdey/image/upload/v1744617469/25_1_y9hpks.png'/><div>This one goes left → right</div></div> 
  <div class="text-line left"><div class='gradient-div'><img class='gradient-img' src='https://res.cloudinary.com/do7dxrdey/image/upload/v1744616117/12_1_tgay16.png'/><div>This one goes left → right</div></div></div>
  <div class="text-line right"><div class='gradient-div'><img class='gradient-img' src='https://res.cloudinary.com/do7dxrdey/image/upload/v1744617469/25_1_y9hpks.png'/><div>This one goes left → right</div></div> 
  <div class="text-line left last-section"><div class='gradient-div'><img class='gradient-img' src='https://res.cloudinary.com/do7dxrdey/image/upload/v1744617469/25_1_y9hpks.png'/><div>This one goes left → right</div></div></div>

   <!-- Right Border -->
 
  </section>





<section class="poppy-section" id="poppy-section">
  <div class="content-wrapper">
    <div class="text-block">
      <h2>The Don’s Message</h2>
      <p>Real flavor. Real rebellion. Don Chico doesn’t follow the crowd — he fizzes his own path.</p>
    </div>

  </div>
  <img class='table-top' src='https://res.cloudinary.com/do7dxrdey/image/upload/v1746685923/empty-wooden-table-top-isolated-white-background-used-display-montage-your-products-removebg-preview_1_n9p2tt.png' />


</section>
<section class="can-hero-section">
  <div class="can-group">
  <img 
  src="https://res.cloudinary.com/do7dxrdey/image/upload/v1747046244/poster_vrocs4.webp" 
  alt="Apple Cotrelish" 
  class="can can-right"
  data-flavor="Apple Cotrelish" 
  data-color="#F4812C" 
  data-text="Cool, calm, and delicious. Apple Cotrelish's got that mellow magic."
  data-btn="Buy Apple Cotrelish"
/>

<img 
  src="https://res.cloudinary.com/do7dxrdey/image/upload/v1747046225/poster_opkfrb.webp" 
  alt="Watermelon Sorbet" 
  class="can can-center"
  data-flavor="Watermelon Sorbet" 
  data-color="#4BAB55" 
  data-text="Zesty, juicy, and refreshingly wild. Watermelon Sorbet is here to wake you up."
  data-btn="Buy Watermelon Sorbet"
/>
<img 
  src="https://res.cloudinary.com/do7dxrdey/image/upload/v1747046235/poster_afhjq7.webp" 
  alt="Strawberry Cream" 
  class="can can-left" 
  data-flavor="Strawberry Cream" 
  data-color="#ee6876" 
  data-text="Berry bold and bubbly. Strawberry Cream brings the sweet punch you crave."
  data-btn="Buy Strawberry Cream"
/>



  </div>

  <div class="can-text">
    <h2 id="can-title">Pop. Sip. Repeat.</h2>
    <p id="can-description">Three bold flavors, zero regrets. Which one will you choose?</p>
    <div class="btn-row" id="btn-row">
      <button class="btn strawberry">Buy Strawberry</button>
      <button class="btn orange">Buy Citrus</button>
      <button class="btn blueberry">Buy Blueberry</button>
    </div>
  </div>
</section>
<section class="review-section">
  <h2 class="review-heading">What Our Fans Say</h2>
  <div class="carousel">
    <div class="carousel-track">
      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1511909525232-61113c912836')">
        <div class="review-card-content">
          <p class="review-text">“This drink changed my life. I'm obsessed!”</p>
          <span class="reviewer-name">Samantha R.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1544005313-94ddf0286df2')">
        <div class="review-card-content">
          <p class="review-text">“Love the citrus one. It’s got the right punch!”</p>
          <span class="reviewer-name">Jake T.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1603415526960-f8fcd6a6e9a2')">
        <div class="review-card-content">
          <p class="review-text">“Strawberry Cream is now my go-to flavor.”</p>
          <span class="reviewer-name">Lina M.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1511909525232-61113c912836')">
        <div class="review-card-content">
          <p class="review-text">“This drink changed my life. I'm obsessed!”</p>
          <span class="reviewer-name">Samantha R.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1544005313-94ddf0286df2')">
        <div class="review-card-content">
          <p class="review-text">“Love the citrus one. It’s got the right punch!”</p>
          <span class="reviewer-name">Jake T.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1603415526960-f8fcd6a6e9a2')">
        <div class="review-card-content">
          <p class="review-text">“Strawberry Cream is now my go-to flavor.”</p>
          <span class="reviewer-name">Lina M.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1511909525232-61113c912836')">
        <div class="review-card-content">
          <p class="review-text">“This drink changed my life. I'm obsessed!”</p>
          <span class="reviewer-name">Samantha R.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1544005313-94ddf0286df2')">
        <div class="review-card-content">
          <p class="review-text">“Love the citrus one. It’s got the right punch!”</p>
          <span class="reviewer-name">Jake T.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1603415526960-f8fcd6a6e9a2')">
        <div class="review-card-content">
          <p class="review-text">“Strawberry Cream is now my go-to flavor.”</p>
          <span class="reviewer-name">Lina M.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1511909525232-61113c912836')">
        <div class="review-card-content">
          <p class="review-text">“This drink changed my life. I'm obsessed!”</p>
          <span class="reviewer-name">Samantha R.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1544005313-94ddf0286df2')">
        <div class="review-card-content">
          <p class="review-text">“Love the citrus one. It’s got the right punch!”</p>
          <span class="reviewer-name">Jake T.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1603415526960-f8fcd6a6e9a2')">
        <div class="review-card-content">
          <p class="review-text">“Strawberry Cream is now my go-to flavor.”</p>
          <span class="reviewer-name">Lina M.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1511909525232-61113c912836')">
        <div class="review-card-content">
          <p class="review-text">“This drink changed my life. I'm obsessed!”</p>
          <span class="reviewer-name">Samantha R.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1544005313-94ddf0286df2')">
        <div class="review-card-content">
          <p class="review-text">“Love the citrus one. It’s got the right punch!”</p>
          <span class="reviewer-name">Jake T.</span>
        </div>
      </div>

      <div class="review-card" style="background-image: url('https://images.unsplash.com/photo-1603415526960-f8fcd6a6e9a2')">
        <div class="review-card-content">
          <p class="review-text">“Strawberry Cream is now my go-to flavor.”</p>
          <span class="reviewer-name">Lina M.</span>
        </div>
      </div>

      <!-- Optional repeats for loop -->
    </div>
  </div>
</section>

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


  

    <div class="model"></div>
  `;
});

document.addEventListener("DOMContentLoaded", () => {
  const cans = document.querySelectorAll(".can");
  const section = document.querySelector(".can-hero-section");
  const title = document.getElementById("can-title");
  const desc = document.getElementById("can-description");
  const btnRow = document.getElementById("btn-row");

  const defaultState = {
    bg: "linear-gradient(to right, #ee6876, #4BAB55, #F4812C)",
    title: "Pop. Sip. Repeat.",
    desc: "Three bold flavors, zero regrets. Which one will you choose?",
    buttons: `
    <button class="btn" style="background-color:#ee6876">Buy Strawberry Cream</button>
    <button class="btn" style="background-color:#4BAB55">Buy Watermelon Sorbet</button>
    <button class="btn" style="background-color:#F4812C">Buy Apple Cotrelish</button>
  `,
  };

  cans.forEach((can) => {
    can.addEventListener("mouseenter", () => {
      const color = can.dataset.color;
      const flavor = can.dataset.flavor;
      const text = can.dataset.text;
      const btnText = can.dataset.btn;

      section.style.background = color;
      title.textContent = flavor;
      desc.textContent = text;
      btnRow.innerHTML = `<button class="btn" style="background-color:${color}">${btnText}</button>`;

      // Enlarge the hovered can
      can.classList.add("hovered");
    });

    can.addEventListener("mouseleave", () => {
      section.style.background = defaultState.bg;
      title.textContent = defaultState.title;
      desc.textContent = defaultState.desc;
      btnRow.innerHTML = defaultState.buttons;

      // Remove enlarge class from all cans
      cans.forEach((c) => c.classList.remove("hovered"));
    });
  });

  // 👇 ScrollTrigger to pin poppy section
  ScrollTrigger.create({
    trigger: ".poppy-section",
    start: "top top",
    end: "+=100%",
    pin: true,
    pinSpacing: false,
    anticipatePin: 1,
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const lines = document.querySelectorAll(".text-line");

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    lines.forEach((line, i) => {
      const rect = line.getBoundingClientRect();
      const offsetY = rect.top - windowHeight / 2;

      const progress = offsetY / windowHeight;
      const clamped = Math.max(-1, Math.min(1, progress));

      const maxTranslate = 200;
      const direction = line.classList.contains("left") ? 1 : -1;
      const x = clamped * maxTranslate * direction;

      line.style.transform = `translateX(${x}px)`;
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const intro = document.querySelector(".intro-screen");
  const audio = new Audio(
    "https://res.cloudinary.com/do7dxrdey/video/upload/v1745594133/soda-can-opening-169337_aekjbs.mp3"
  );

  setTimeout(() => {
    intro.style.opacity = "0";
    audio.play();

    // Actually remove it from DOM after fade out
    setTimeout(() => {
      intro.style.display = "none";
    }, 800); // match with CSS transition duration
  }, 1000); // Show for 1 second
});
