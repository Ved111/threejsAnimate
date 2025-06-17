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

let lastDirection = null;
let shouldRepeat = false;

const isMobile = window.innerWidth < 768;

// Declare global model variable
let centerCan, leftCan, rightCan, initialCan;
let modelLoaded = false; // Track if the model has finished loading

let swapCount = 0;
let actualSwapCount = 0;
let lastXMovement = 0;

let didSwapRecently = false;

let canIsCentered = false; // global flag outside ScrollTrigger

// Ensure DOM is ready before initializing Three.js
window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM Loaded");
  initThreeJS();
});

const backgroundImages = [
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067029/IMG_2127_1_xxzbnf.png",
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067031/IMG_2126_1_tesfjm.png",
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067028/IMG_2125_1_ojbhu5.png",
];

function updateBackgroundImage(index) {
  const bgLayer = document.querySelector(".background-image-layer");
  if (bgLayer) {
    bgLayer.style.backgroundImage = `url('${backgroundImages[index]}')`;
  }
}

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
  renderer.setClearColor(0x000000, 0); // Fully transparent background
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
    initial:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1749915409/DCcanWithENGRAVEDlogo_2_ecjm5i.glb",
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

                  // Replace material with custom MeshStandardMaterial
                  const newMat = new THREE.MeshStandardMaterial({
                    color: oldMat.color || new THREE.Color(0xffffff),
                    metalness: 1,
                    roughness: 0.5,
                    envMapIntensity: 2,
                    map: oldMat.map || null,
                  });

                  // Make sure it's fully opaque
                  newMat.transparent = false;
                  newMat.opacity = 1;
                  newMat.side = THREE.DoubleSide;
                  newMat.depthWrite = true;
                  newMat.needsUpdate = true;
                  newMat.alphaTest = 0.5; // removes any low-alpha pixels

                  child.material = newMat;

                  // Enable shadows
                  child.castShadow = true;
                  child.receiveShadow = true;

                  // Ensure good lighting
                  child.geometry.computeVertexNormals();
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
          model.position.x = 7;

          centerCan = model;
        }
        if (key === "initial") {
          model.rotation.set(0, 0, 0);
          model.position.x = -2;

          initialCan = model;
        }

        scene.add(model);
        maxWidth = Math.max(maxWidth, size.x, size.y, size.z);
      });
      modelLoaded = true;

      // ✅ Hide intro screen now
      const intro = document.querySelector(".intro-screen");
      const audio = new Audio(
        "https://res.cloudinary.com/do7dxrdey/video/upload/v1745594133/soda-can-opening-169337_aekjbs.mp3"
      );

      setTimeout(() => {
        intro.style.opacity = "0";
        audio.play();

        setTimeout(() => {
          intro.style.display = "none";
        }, 800);
      }, 500); // Optional delay

      // Adjust camera to fit the largest model
      camera.position.z = maxWidth * 2;

      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        camera.position.z *= 1.5; // Zoom out slightly for mobile
      }
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

let hasCollided = false;
let isSwapping = false;

function resetSwapState() {
  lastXMovement = 0;
  didSwapRecently = false;
  hasCollided = false; // if you're using it
}

function setupScrollAnimations(updateFruitCallback) {
  function swapCans(reachedLeft, xPosition, responsiveScale) {
    if (!modelLoaded) return;

    // Save references
    const oldCenter = centerCan;
    const oldLeft = leftCan;
    const oldRight = rightCan;
    const oldInitial = initialCan;

    // Rotate roles: center → left, left → right, right → center
    centerCan = oldLeft;
    leftCan = oldRight;
    rightCan = oldInitial;
    initialCan = oldCenter;

    // Update positions
    console.log(xPosition, "insideSwap");

    initialCan.position.x = xPosition * responsiveScale;
    centerCan.position.x = 7;
    leftCan.position.x = -7;
    rightCan.position.x = 7;
  }

  function swapCansLeft(reachedLeft, xPosition, responsiveScale) {
    if (!modelLoaded) return;

    const oldInitial = initialCan;
    const oldCenter = centerCan;
    const oldLeft = leftCan;
    const oldRight = rightCan;

    // Rotate: right → initial, left → right, center → left, initial → center
    initialCan = oldRight;
    rightCan = oldLeft;
    leftCan = oldCenter;
    centerCan = oldInitial;

    console.log(xPosition, "insideSwap");

    // Update positions
    initialCan.position.x = xPosition * responsiveScale;
    centerCan.position.x = 7;
    leftCan.position.x = -7;
    rightCan.position.x = 7;
  }

  ScrollTrigger.create({
    trigger: ".custom-border-section",
    start: "top center",
    end: "bottom 80%",
    scrub: true,
    onEnterBack: () => {
      lastXMovement = 0;
      resetSwapState();
    },

    // 🧹 Optional: also reset when completely leaving the section forward
    onLeave: () => {
      lastXMovement = 0;
    },
    onUpdate: (self) => {
      console.log("swapCount", swapCount);
      if (!modelLoaded) return;

      const progress = self.progress;

      // Spin bacesed on scroll velocity
      const scrollVelocity = self.getVelocity();
      const segmentStart = Math.floor(progress / 0.25) * 0.25;
      const localT = (progress - segmentStart) / 0.25;
      initialCan.rotation.y = gsap.utils.interpolate(0, Math.PI * 2, localT);

      // X-movement for oscillation

      function getLocalT(p, start, end) {
        return (p - start) / (end - start);
      }

      let xMovement;

      if (progress < 0.25) {
        const t = getLocalT(progress, 0, 0.25);
        xMovement = -2 + 4 * t;
      } else if (progress < 0.5) {
        const t = getLocalT(progress, 0.25, 0.5);
        xMovement = 2 - 4 * t;
      } else if (progress < 0.75) {
        const t = getLocalT(progress, 0.5, 0.75);
        xMovement = -2 + 4 * t;
      } else {
        const t = getLocalT(progress, 0.75, 1);
        const damping = 1 - Math.pow(t, 3);
        xMovement = (2 - 2 * t) * damping;
      }

      // 👇 Apply responsive scale to xMovement based on screen size
      const screenWidth = window.innerWidth;
      const minScale = 0.3;
      const maxScale = 1.0;
      const responsiveScale = gsap.utils.mapRange(
        320,
        1200,
        minScale,
        maxScale,
        screenWidth
      );
      initialCan.position.x = xMovement * responsiveScale;

      console.log(progress, "progress");

      const textIndices = [0, 1, 2];

      textIndices.forEach((index) => {
        const textEl = document.querySelector(`.fruit-text.text-${index}`);
        if (!textEl) return;

        const screenWidth = window.innerWidth;

        // Define timing for this text
        const enterStart = index * 0.25;
        const enterEnd = enterStart + 0.25;
        const exitStart = enterEnd;
        const exitEnd = exitStart + 0.25;

        let x = null;
        let opacity = 0;

        if (progress >= enterStart && progress < enterEnd) {
          // Entering: left → center
          const t = (progress - enterStart) / 0.25;
          x = gsap.utils.interpolate(-screenWidth, 0, t);
          opacity = gsap.utils.interpolate(0, 1, t);
        } else if (progress >= exitStart && progress < exitEnd) {
          // Exiting: center → right
          const t = (progress - exitStart) / 0.25;
          x = gsap.utils.interpolate(0, screenWidth, t);
          opacity = gsap.utils.interpolate(1, 0, t);
        }

        if (x !== null) {
          gsap.set(textEl, {
            x,
            opacity,
            position: "absolute",
            display: "block",
          });
        } else {
          gsap.set(textEl, {
            opacity: 0,
            display: "none",
          });
        }
      });

      // ✅ Detect zero-crossing (sign change) in xMovement

      const threshold = isMobile ? 1.9 : 1.5; // how close to the extreme before triggering

      const reachedLeft =
        xMovement <= -2 + threshold && lastXMovement > -2 + threshold;
      const reachedRight =
        xMovement >= 2 - threshold && lastXMovement < 2 - threshold;

      console.log(xMovement);

      const direction = scrollVelocity > 0 ? "down" : "up";

      // if (
      //   (direction === "down" && isExactlyRightExtreme) ||
      //   (direction === "up" && isExactlyLeftExtreme)
      // ) {
      //   playCanSpinInPlace(initialCan);
      // }

      if ((reachedLeft || reachedRight) && !didSwapRecently) {
        didSwapRecently = true;

        if (direction === "down" && swapCount < 0) {
          swapCount++;
          return;
        }

        if (direction === "up" && swapCount <= 1) return;

        direction === "down" ? swapCount++ : swapCount--;

        if (
          (swapCount > 1 && direction === "down") ||
          (direction === "up" && swapCount > 0)
        ) {
          updateFruitCallback(direction);

          actualSwapCount++;

          direction === "up"
            ? swapCansLeft(reachedLeft, xMovement, responsiveScale)
            : swapCans(reachedLeft, xMovement, responsiveScale);
        }
      }

      const isAtExtreme =
        xMovement <= -2 + threshold || xMovement >= 2 - threshold;

      if (!isAtExtreme) {
        didSwapRecently = false;
      }
      console.log("actualSwapCount", actualSwapCount, xMovement);

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
      const rotateEnd = dropStart; // Rotation finishes just before thrust starts

      // ✴️ Rotation Phase (0 to 0.9): Spin can and wrap it back to 0
      const totalSpins = 1.5; // 1.5 full spins → 3π radians
      let rotationY = 0;
      if (t < rotateEnd) {
        const rotateT = t / rotateEnd; // normalize 0–0.9 to 0–1
        const easedRotateT = gsap.parseEase("power3.inOut")(rotateT);
        rotationY = (Math.PI * 2 * totalSpins * easedRotateT) % (Math.PI * 2);
        initialCan.rotation.set(0, rotationY, 0);
      } else {
        // ✴️ After rotateEnd, just reset to 0 rotation
        initialCan.rotation.set(0, 0, 0);
      }

      if (t > dropStart) {
        const normalizedT = (t - dropStart) / (1 - dropStart); // maps 0.3–1 → 0–1
        const fastT = Math.min(normalizedT * 2, 1); // double speed
        dropT = gsap.parseEase("power4.in")(fastT);
      }

      // Thrust down: Y = -0.05 → -1
      initialCan.position.y = gsap.utils.interpolate(-1, -1.1, dropT);

      // Animate all rotations from (0, 0, 0) to (0, 2, 0)
      const targetRotationY = gsap.utils.interpolate(
        initialCan.rotation.y,
        0,
        easedT
      );

      leftCan.rotation.set(0, targetRotationY, 0);
      initialCan.rotation.set(0, targetRotationY, 0);
      rightCan.rotation.set(0, targetRotationY, 0);

      // Start moving side cans earlier
      const appearStart = 0.7;
      let earlyT = 0;
      if (t > appearStart) {
        leftCan.visible = true;
        rightCan.visible = true;
        const localT = (t - appearStart) / (1 - appearStart); // normalize from 0.1–1 → 0–1
        earlyT = gsap.parseEase("power3.out")(Math.min(localT, 1));
      } else {
        // Hide cans before appearStart
        leftCan.visible = false;
        rightCan.visible = false;
      }

      const isMobile = window.innerWidth < 768;
      const leftTargetX = isMobile ? -0.9 : -1;
      const rightTargetX = isMobile ? 0.9 : 1;

      leftCan.position.x = gsap.utils.interpolate(0, leftTargetX, earlyT);
      rightCan.position.x = gsap.utils.interpolate(0, rightTargetX, earlyT);
    },
    onLeaveBack: () => {
      // Reset positions when scrolling back up
      if (leftCan && rightCan) {
        leftCan.position.set(-7, -1, 0); // Reset X-position
        rightCan.position.set(7, -1, 0); // Reset X-position
        centerCan.position.set(7, -1, 0);
        initialCan.position.set(0, -1, 0);
        leftCan.rotation.set(0, 0, 0);
        initialCan.rotation.set(0, 0, 0);
        rightCan.rotation.set(0, 0, 0);
        centerCan.rotation.set(0, 0, 0);
        leftCan.visible = true;
        rightCan.visible = true;
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
<video
  class="hero-video"
  muted
  
  preload="auto"
  id="scrollVideo"
>
  <source
    src="https://res.cloudinary.com/do7dxrdey/video/upload/v1748825817/output_15fps_keyframe_zqjw3p.mp4"
    type="video/mp4"
  />
</video>
<img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1744179914/donchicoredlogo_uzs2if.png" class="donchico-image" />
<h1>Stay thirsty... The Don is on his way!</h1>
<p>The fizzy world of soda had surrendered to the ordinary—until Don Chico stepped in. A legend. A rebel. A mastermind of flavour.</p>
</section>
  

  <section class="custom-border-section">
  <div class="background-image-layer"></div>

  <div class="fruit-container">
  <div class="fruit-zone fruit-1-img">
  
    <img class="fruit-img fruit-1" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749059138/Adobe_Express_-_file_1_pccfnh.png" />
  </div>

  <div class="fruit-zone fruit-2-img">
    
    <img class="fruit-img fruit-2" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1748930509/strawberry_1_rgx8eh.png" />
  </div>

  <div class="fruit-zone fruit-3-img">
   
    <img class="fruit-img fruit-3" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1748930645/apricot3d_1_uavqqj.png" />
  </div>
</div>



  

   <!-- Right Border -->
 
  </section>





<section class="poppy-section" id="poppy-section">



</section>


<audio id="explosion-sound" src="/sounds/fruit-explosion.mp3" preload="auto"></audio>
<div id="dom-explosion-container"></div>
<section class="can-hero-section">
  <div class="can-group">
  <img 
  src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749066942/Adobe_Express_-_file_4_1_druku2.png" 
  alt="Watermelon Sorbet" 
  class="can"
  data-flavor="Watermelon Sorbet" 
  data-color="#4BAB55" 
  data-darker-color="#3a8a41"
    data-text="Zesty, juicy, and refreshingly wild. Watermelon Sorbet is here to wake you up."
  data-btn="Buy Watermelon Sorbet"
  data-bgimg="https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6110_li3uxr.png"
  />
  <img 
  src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749066841/Adobe_Express_-_file_2_1_aci4ev.png" 
  alt="Applecot Relish" 
  class="can can-right"
  data-flavor="Applecot Relish" 
  data-color="#F4812C" 
  data-darker-color="#d0485c"

  data-text="Cool, calm, and delicious. Applecot Relish's got that mellow magic."
  data-btn="Buy Applecot Relish"
  data-bgimg="https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6109_z0i9vk.png"
/>


<img 
  src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749067023/Adobe_Express_-_file_3_1_syhwrv.png" 
  alt="Strawberry Cream" 
  class="can can-left" 
  data-flavor="Strawberry Cream" 
  data-color="#ee6876" 
  data-darker-color="#c06a23"
  data-text="Berry bold and bubbly. Strawberry Cream brings the sweet punch you crave."
  data-btn="Buy Strawberry Cream"
  data-bgimg="https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6111_gpzjeq.png"
/>



  </div>

  <div class="can-text">
    <h2 id="can-title">Pop. Sip. Repeat.</h2>
    <p id="can-description">Three bold flavors, zero regrets. Which one will you choose?</p>
    <div class="btn-row" id="btn-row">
    <button class="soda-btn" style="background: linear-gradient(145deg, #ee6876, #d0485c);">Buy Strawberry Cream</button>
    <button class="soda-btn" style="background: linear-gradient(145deg, #4BAB55, #3a8a41);">Buy Watermelon Sorbet</button>
    <button class="soda-btn" style="background: linear-gradient(145deg, #F4812C, #c06a23);">Buy Applecot Relish</button>
    </div>
  </div>
</section>

<section class="mobile-can-ui">
  <!-- Top Bar -->
  <div class="top-bar">
  <img class="brand" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749979554/IMG_4588_1_1_qhx10y.png"/>
   
 
  </div>

  <!-- Center Can Display -->
  <div class="can-display">
    <button class="nav-arrow left">&#10094;</button>
    <img class="can-bg left" id="left-bg-can" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749067023/Adobe_Express_-_file_3_1_syhwrv.png" alt="Left Can" />
    <img
    id="main-can"
      class="main-can"
      src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749066942/Adobe_Express_-_file_4_1_druku2.png"
      alt="Watermelon Sorbet"
    />
    <img class="can-bg right"   id="right-bg-can" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749066841/Adobe_Express_-_file_2_1_aci4ev.png" alt="Right Can" />
    <button class="nav-arrow right">&#10095;</button>
  </div>

  <!-- Nutrition Facts -->
  <div class="nutrition-card">
    <p><strong>CALORIES:</strong> 0</p>
    <p><strong>SUGAR:</strong> 0</p>
    <p><strong>VITAMINS:</strong> B2, B6, B12, NIACIN</p>
    <p><strong>CAFFEINE:</strong> 75mg</p>
    <p><strong>TAURINE:</strong> 1000mg</p>
  </div>

  <!-- Flavor Buttons -->
  <div class="flavor-buttons">
    <button class="flavor-btn soda-btn lemon" data-index="0" style="background: linear-gradient(145deg, #4BAB55, #3a8a41);">WATERMELON SORBET</button>
    <button class="flavor-btn orange soda-btn" data-index="2" style="background: linear-gradient(145deg, #F4812C, #c06a23);">APPLECOT RELISH</button>
    <button class="flavor-btn mango soda-btn" data-index="1" style="background: linear-gradient(145deg, #ee6876, #d0485c);">STRAWBERRY CREAM</button>
  </div>
</section>

<section class="recipe-section">
  <h2 class="recipe-heading">Delicious Recipes</h2>
  <div class="recipe-grid" id="recipe-grid">
    <!-- Cards will be injected by JavaScript -->
  </div>
</section>

<section class="faq-section">
  <h2 class="faq-heading">Frequently Asked Questions</h2>
  <div class="faq-container">
    <div class="faq-accordion">
      <div class="faq-item active">
        <button class="faq-question">What exactly is Don Chico’s Gut Loving Soda? </button>
        <div class="faq-answer">
          <p>We are a new age, premium, non-alcoholic, carbonated beverage for a world riddled with unhealthy, gimmicky drinks that are crammed with chemicals. Don Chico's is a prebiotic infused carbonated beverage that's low on sugar while also helping you with your daily dose of dietary fibre (in a cool, less prescription drug manner) We are a solution (quite literally). Sugary, carbonated drinks that taste nothing like a tastefully AND carefully crafted beverage are the problem. </p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question"> I'm confused now. Probiotics or Prebiotics? </button>
        <div class="faq-answer">
          <p>

          Prebiotics are the ultimate hype crew for your gut—laying down the red carpet, setting the vibe, and making sure the good bacteria (probiotics) have the fuel to keep the party going.
          
          Unlike probiotics, which are the VIP guests, prebiotics do the real work behind the scenes—feeding the good guys so your digestion stays smooth, your immunity stays strong, and your gut stays happy.
          
          And the best part? You don’t need fermented foods or bland fiber bars—just sip on a refreshing prebiotic soda and let the gut-friendly fiesta begin!
          </p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question"> Okay, fair. But what's the point of having fibre in my soda? </button>
        <div class="faq-answer">
          <p>Y

          Because your gut deserves VIP treatment!
          
          We’ve packed our soda with prebiotic fiber from nature’s finest sources—cassava root, chicory root inulin, Jerusalem artichoke, calendula flower, kudzu root, and marshmallow root—all chosen to feed the good bacteria in your gut and keep digestion smooth.
          
          Unlike regular sodas that do nothing for your microbiome, ours brings the fizz and the fiber—because a happy gut = a happy you!
          </p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">  Why carbonated? Why not a simple fruit juice? </button>
        <div class="faq-answer">
          <p>If we go a level down with this question, you might as well ask, ‘Why fruit juice? Why not plain water?’ Let’s make this a little more easy to understand (For Don Chico’s crew’s understanding..not for you of course): We all know the purpose of fluid intake is to quench one’s thirst and keep our bodies hydrated. However, let’s roll back to some million years ago:
          Humans being humans, discovered they can create multiple concoctions by adding fruit to plain water in a bid to HELP with hydration- the idea was to make it easier for many to consume this mana of life. Blame this on the basic human flaw of finding monotony in the most essential of things; of feeling that the important things in life are all ‘mundane’.  Fast forward to some thousand years later: humans have now added sugar to make this experience a tad bit more pleasant for the larger masses, including the children and the elderly. Fast forward to many thousand years later, Joseph Priestly in the year 1767 invents carbonated water. This is fine- because it makes the task of consuming fluids fun, bubbly and exciting. Add a bit of flavour and you now have flavoured carbonated water.  It’s all fun and games UNTIL some folks (we are not taking any names here) begin making this concoction borderline addictive by adding a truck load of sugar and artificial sweeteners. There is no turning back since then: We all acknowledge that the world is going through an obesity pandemic that has been brought to existence by the modern day dietary intake. There is a negative connotation attached to the word ‘soda’ at times because the beverages being sold as ‘sodas’ are called just that in popular culture- SODA.However, the real evil in these carbonated drinks is, you guessed it right- extremely high quantities of artificial sweeteners and sugars!
          </p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">How does a can of Don Chico's benefit my gut? </button>
        <div class="faq-answer">
          <p>Well, a thriving gut (referred to as the microbiome) is where different key hormones and vitamins are produced. These hormones & vitamins are vital to both, your physical & mental health. This is what you need to know: a healthy microbiome ultimately leads to a healthy & happy you. In short, Don Chico's aids you in digestion & ensures that you have a healthy gut (apart from being the tastiest fizzy drink out there of course). No funny, gimmicky tall claims. Just a tastefully crafted beverage that's here to ensure that you have one less thing to worry about.
          </p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">  Why carbonated? Why not a simple fruit juice? </button>
        <div class="faq-answer">
          <p>If we go a level down with this question, you might as well ask, ‘Why fruit juice? Why not plain water?’ Let’s make this a little more easy to understand (For Don Chico’s crew’s understanding..not for you of course): We all know the purpose of fluid intake is to quench one’s thirst and keep our bodies hydrated. However, let’s roll back to some million years ago:
          Humans being humans, discovered they can create multiple concoctions by adding fruit to plain water in a bid to HELP with hydration- the idea was to make it easier for many to consume this mana of life. Blame this on the basic human flaw of finding monotony in the most essential of things; of feeling that the important things in life are all ‘mundane’.  Fast forward to some thousand years later: humans have now added sugar to make this experience a tad bit more pleasant for the larger masses, including the children and the elderly. Fast forward to many thousand years later, Joseph Priestly in the year 1767 invents carbonated water. This is fine- because it makes the task of consuming fluids fun, bubbly and exciting. Add a bit of flavour and you now have flavoured carbonated water.  It’s all fun and games UNTIL some folks (we are not taking any names here) begin making this concoction borderline addictive by adding a truck load of sugar and artificial sweeteners. There is no turning back since then: We all acknowledge that the world is going through an obesity pandemic that has been brought to existence by the modern day dietary intake. There is a negative connotation attached to the word ‘soda’ at times because the beverages being sold as ‘sodas’ are called just that in popular culture- SODA.However, the real evil in these carbonated drinks is, you guessed it right- extremely high quantities of artificial sweeteners and sugars!
          </p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">Is Don Chico's Gluten Free & Vegan?  </button>
        <div class="faq-answer">
          <p>

          Yes, and yes! Sip on & embark on a guilt free yet flavourful adventure!
          
          </p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">Is Don Chico's anything like Kombucha?  </button>
        <div class="faq-answer">
          <p>

          No. Kombucha walks so we can run. While kombucha brings the funk with its fermented tang, our prebiotic soda keeps it fresh, fizzy, and full of gut-loving goodness—no mystery floaties, no vinegar vibes, just a smooth, delicious way to fuel your microbiome. Cheers to gut health, minus the kombucha culture shock! 
          
          </p>
        </div>
      </div>
      <div class="faq-item">
      <button class="faq-question">Will consuming Don Chico's Soda prove to be bad for my teeth?  </button>
      <div class="faq-answer">
        <p>

        Nah, our prebiotic soda is more like a charm for your gut, not a crime scene for your enamel. Teeth largely go bad either because of the sugar content or acids in most fizzy drinks (we aren't taking any names here!) Don Chico's on the other hand: no harsh acids, no sneaky sugars—just a smooth, refreshing sip that keeps both your taste buds and your teeth smiling!        
        </p>
      </div>
    </div>
    
    </div>
    <div class="faq-image">
      <img id="faq-img" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749068655/all3.6_1_1_1_1_dw2fyx.png" alt="FAQ" />
    </div>
  </div>
</section>






  

    <div class="model"></div>
  `;

  const fruits = [
    document.querySelector(".fruit-1"),
    document.querySelector(".fruit-2"),
    document.querySelector(".fruit-3"),
  ];

  let currentFruitIndex = -1;
  let lastDirection = 1; // 1 = down, -1 = up

  function showFruit(index) {
    // Optional animation
    gsap.fromTo(
      fruits[index],
      { scale: 1 },
      {
        scale: 1.2,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "back.out(1.7)",
      }
    );
  }

  function updateFruitIndex(direction) {
    // Handle initial scroll
    if (currentFruitIndex === -1) {
      currentFruitIndex = 0;
      lastDirection = direction;
    }

    // Direction changed? Set repeat flag, and don't move yet
    else if (direction !== lastDirection) {
      shouldRepeat = true;
      lastDirection = direction;
    }

    // If we just repeated, now proceed with the actual move
    else if (shouldRepeat) {
      shouldRepeat = false;

      if (direction === "down" && currentFruitIndex < fruits.length - 1) {
        currentFruitIndex += 1;
      } else if (direction === "up" && currentFruitIndex > 0) {
        currentFruitIndex -= 1;
      }
    }

    // Normal move when direction is steady
    else if (direction === "down" && currentFruitIndex < fruits.length - 1) {
      currentFruitIndex += 1;
    } else if (direction === "up" && currentFruitIndex > 0) {
      currentFruitIndex -= 1;
    }

    updateBackgroundImage(currentFruitIndex);

    showFruit(currentFruitIndex);
    const fruitEl = fruits[currentFruitIndex];
    gsap.fromTo(
      fruitEl,
      { scale: 1 },
      {
        scale: 1.2,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "back.out(1.7)",
      }
    );
  }

  // ✅ Setup ScrollTrigger after fruitEl is defined
  setupScrollAnimations(updateFruitIndex);
});

document.addEventListener("DOMContentLoaded", () => {
  const flavors = [
    {
      name: "Watermelon Sorbet",
      src: "https://res.cloudinary.com/do7dxrdey/image/upload/v1749066942/Adobe_Express_-_file_4_1_druku2.png",
      bg: "https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6110_li3uxr.png",
    },
    {
      name: "Strawberry Cream",
      src: "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067023/Adobe_Express_-_file_3_1_syhwrv.png",
      bg: "https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6111_gpzjeq.png",
    },
    {
      name: "Applecot Relish",
      src: "https://res.cloudinary.com/do7dxrdey/image/upload/v1749066841/Adobe_Express_-_file_2_1_aci4ev.png",
      bg: "https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6109_z0i9vk.png",
    },
  ];

  let currentIndex = 0;

  let isAnimating = false;

  const mainCan = document.getElementById("main-can");
  const leftBgCan = document.getElementById("left-bg-can");
  const rightBgCan = document.getElementById("right-bg-can");
  const leftArrow = document.querySelector(".nav-arrow.left");
  const rightArrow = document.querySelector(".nav-arrow.right");

  function updateMainCan(index) {
    currentIndex = index;

    // Smooth fade animation
    mainCan.classList.add("fade-out");
    setTimeout(() => {
      mainCan.src = flavors[index].src;
      mainCan.classList.remove("fade-out");
      mainCan.classList.add("fade-in");
    }, 150);

    setTimeout(() => mainCan.classList.remove("fade-in"), 300);

    // Update background cans
    leftBgCan.src = flavors[(index - 1 + flavors.length) % flavors.length].src;
    rightBgCan.src = flavors[(index + 1) % flavors.length].src;

    // 👇 Set mobile background
    const mobileUI = document.querySelector(".mobile-can-ui");
    mobileUI.style.backgroundImage = `url(${flavors[currentIndex].bg})`;
  }

  leftArrow.addEventListener("click", () => {
    const newIndex = (currentIndex - 1 + flavors.length) % flavors.length;
    updateMainCan(newIndex);
  });

  rightArrow.addEventListener("click", () => {
    const newIndex = (currentIndex + 1) % flavors.length;
    updateMainCan(newIndex);
  });

  document.querySelectorAll(".flavor-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      updateMainCan(index);
    });
  });

  // Initialize
  updateMainCan(currentIndex);
});

document.addEventListener("DOMContentLoaded", () => {
  const recipes = [
    {
      img: "https://res.cloudinary.com/do7dxrdey/image/upload/v1749068655/all3.6_1_1_1_1_dw2fyx.png",
      title: "Apple, Cinammon& Orange Water",
      text: "Comforting ingredients, apple and cinnamon come together with ....",
    },
    {
      img: "https://res.cloudinary.com/do7dxrdey/image/upload/v1749068655/all3.6_1_1_1_1_dw2fyx.png",
      title: "Sparkling Apple Pie",
      text: "Loaded with the fresh flavours of apples and cinnamon, this recipe is ...",
    },
  ];

  const grid = document.getElementById("recipe-grid");

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <img src="${recipe.img}" alt="Recipe Image">
      <h1 style="margin-left: 16px; margin-top: 16px;">${recipe.title}</h1>
      <p>${recipe.text}</p>
    `;
    grid.appendChild(card);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const faqItems = document.querySelectorAll(".faq-item");
  const faqImage = document.getElementById("faq-img");

  const images = [
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749068655/all3.6_1_1_1_1_dw2fyx.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749068655/all3.6_1_1_1_1_dw2fyx.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749068655/all3.6_1_1_1_1_dw2fyx.png",
  ];

  faqItems.forEach((item, index) => {
    item.querySelector(".faq-question").addEventListener("click", () => {
      // Close all
      faqItems.forEach((el) => el.classList.remove("active"));
      // Open current
      item.classList.add("active");
      // Update image
      faqImage.src = images[index];
    });
  });
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
    <button class="soda-btn" style="background: linear-gradient(145deg, #ee6876, #d0485c);">Buy Strawberry Cream</button>
    <button class="soda-btn" style="background: linear-gradient(145deg, #4BAB55, #3a8a41);">Buy Watermelon Sorbet</button>
    <button class="soda-btn" style="background: linear-gradient(145deg, #F4812C, #c06a23);">Buy Applecot Relish</button>
  `,
  };

  cans.forEach((can) => {
    can.addEventListener("mouseenter", () => {
      const color = can.dataset.color; // e.g., "#ee6876"
      const darkerColor = can.dataset.darkerColor;
      const flavor = can.dataset.flavor;
      const text = can.dataset.text;
      const btnText = can.dataset.btn;

      const bgImg = can.dataset.bgimg; // ✅ this was missing!
      section.style.backgroundImage = `url(${bgImg})`;
      title.textContent = flavor;
      desc.textContent = text;

      // ✅ Safely inject button with background color
      btnRow.innerHTML = `
    <button class="soda-btn" style="background: linear-gradient(145deg, ${color}, ${darkerColor});">
      ${btnText}
    </button>
  `;

      // Enlarge the hovered can
      can.classList.add("hovered");
    });

    can.addEventListener("mouseleave", () => {
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
  const video = document.getElementById("scrollVideo");
  const heroSection = document.querySelector(".hero");
  const videoMask = document.getElementById("videoMask");

  if (!video || !heroSection || !videoMask) return;

  // Pause and reset before playing
  video.pause();
  video.currentTime = 0;

  // Try to play, but catch any autoplay errors
  video.play().catch(() => {
    // Autoplay might be blocked; mute video to allow autoplay on some browsers
    video.muted = true;
    video.play().catch(() => {});
  });

  video.addEventListener("loadedmetadata", () => {
    // Make sure currentTime is at 0 once metadata is loaded
    if (video.currentTime !== 0) {
      video.currentTime = 0;
    }
  });

  function updateMaskOpacityOnScroll() {
    const rect = heroSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    let scrollFraction = 0;
    if (rect.top <= 0 && rect.bottom >= 0) {
      scrollFraction = 1 - rect.bottom / rect.height;
    } else if (rect.top > 0) {
      scrollFraction = 0;
    } else if (rect.bottom < 0) {
      scrollFraction = 1;
    }

    scrollFraction = Math.min(Math.max(scrollFraction, 0), 1);

    // Map scrollFraction 0->1 to mask opacity 0.8->0
    const opacity = 0.8 * (1 - scrollFraction);

    videoMask.style.opacity = opacity;

    requestAnimationFrame(updateMaskOpacityOnScroll);
  }

  requestAnimationFrame(updateMaskOpacityOnScroll);
});

document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("scrollVideo");
  const heroSection = document.querySelector(".hero");

  if (!video || !heroSection) return;

  video.addEventListener("loadedmetadata", () => {
    const duration = video.duration;
    let lastTime = 0;

    function updateVideoOnScroll() {
      const rect = heroSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrollPosition = windowHeight - rect.top;
        const totalScrollable = windowHeight + rect.height;

        let scrollFraction = scrollPosition / totalScrollable;
        scrollFraction = Math.min(Math.max(scrollFraction, 0), 1);

        const newTime = duration * scrollFraction;

        // Only update currentTime if difference > 0.1 seconds to reduce spamming
        if (Math.abs(newTime - lastTime) > 0.1 && video.readyState >= 2) {
          try {
            video.currentTime = newTime;
            lastTime = newTime;
          } catch (e) {
            // Ignore errors like invalid seek times
          }
        }
      }

      requestAnimationFrame(updateVideoOnScroll);
    }

    requestAnimationFrame(updateVideoOnScroll);
  });
});

let lastBubbleTime = 0;
const bubbleInterval = 150; // Minimum ms between bubbles (adjust as needed)

document.addEventListener("mousemove", (e) => {
  const now = Date.now();
  if (now - lastBubbleTime < bubbleInterval) return;
  lastBubbleTime = now;

  const bubble = document.createElement("img");
  bubble.src =
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750159941/de7b6738e9c3be8feb23abc4b1116b8d-removebg-preview_1_h5zpws.png";
  // 🔁 Replace with your actual image
  bubble.className = "cursor-bubble";
  bubble.style.left = `${e.clientX}px`;
  bubble.style.top = `${e.clientY}px`;

  const size = Math.random() * 10 + 10;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;

  document.body.appendChild(bubble);

  setTimeout(() => {
    bubble.remove();
  }, 800);
});
