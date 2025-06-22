import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import "./style.css";
import { openCanAudio } from "./openCanAudio";
import { flavors, bubbleImageUrl } from "./utils";
import { carouselGesture } from "./carouselGesture";
import { generateBubble } from "./generateBubble";

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
let centerCan,
  leftCan,
  rightCan,
  initialCan = {},
  initialLeftCan,
  initialRightCan;
let modelLoaded = false; // Track if the model has finished loading

let swapCount = 0;
let actualSwapCount = 0;
let lastXMovement = 0;

let didSwapRecently = false;

let canIsCentered = false; // global flag outside ScrollTrigger

// Ensure DOM is ready before initializing Three.js
window.addEventListener("DOMContentLoaded", () => {
  initThreeJS();
});

function replaceInitialCanWithGLB(url, scene, hex) {
  if (!modelLoaded) return;

  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      const newModel = gltf.scene;

      // Center & scale
      const box = new THREE.Box3().setFromObject(newModel);
      const center = box.getCenter(new THREE.Vector3());

      // Center it
      newModel.position.sub(center);

      // Shift it up so its base sits at y = 0
      newModel.position.y = isMobile ? -0.7 : -1;
      newModel.scale.set(0.6, 0.6, 0.6);

      // Fix materials
      newModel.traverse((child) => {
        if (
          child.isMesh &&
          child.material &&
          child.material.isMeshStandardMaterial
        ) {
          const oldMat = child.material;

          const newMat = new THREE.MeshStandardMaterial({
            map: oldMat.map || null,
            color: hex
              ? new THREE.Color(hex)
              : oldMat.color || new THREE.Color(0xffffff),
            metalness: 1,
            roughness: 0.5,
            envMapIntensity: 2,
          });

          newMat.transparent = false;
          newMat.opacity = 1;
          newMat.side = THREE.DoubleSide;
          newMat.depthWrite = true;
          newMat.needsUpdate = true;

          child.material = newMat;

          child.castShadow = true;
          child.receiveShadow = true;
          child.geometry.computeVertexNormals();
        }
      });

      // Remove old
      if (initialCan) {
        scene.remove(initialCan);
      }

      initialCan = newModel;
      scene.add(initialCan);
    },
    undefined,
    (err) => {
      console.error("🚨 Failed to load new model:", err);
    }
  );
}

function updateModelColor(model, colorHex) {
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        metalness: 1,
        roughness: 0.5,
      });
      child.material.needsUpdate = true;
    }
  });
}

const backgroundImages = [
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067029/IMG_2127_1_xxzbnf.png",
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

let scene = null;

function fadeOutIntro() {
  const intro = document.querySelector(".intro-screen");
  if (!intro) return;

  intro.style.opacity = "0";
  document.body.classList.remove("no-scroll");

  setTimeout(() => {
    intro.style.display = "none";
  }, 300); // or 2000 if you want a delay
}

function initThreeJS() {
  const ASSET_URLS = [
    // Images
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067029/IMG_2127_1_xxzbnf.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067031/IMG_2126_1_tesfjm.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067028/IMG_2125_1_ojbhu5.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6110_li3uxr.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6111_gpzjeq.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6109_z0i9vk.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.54.07_PM-removebg-preview_kyeuox.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.53.54_PM-removebg-preview_awbuwn.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.54.01_PM-removebg-preview_cgebmi.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749068655/all3.6_1_1_1_1_dw2fyx.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750159941/de7b6738e9c3be8feb23abc4b1116b8d-removebg-preview_1_h5zpws.png",

    // Videos
    "https://res.cloudinary.com/do7dxrdey/video/upload/v1745594133/soda-can-opening-169337_aekjbs.mp3",
  ];

  function preloadAsset(url) {
    return new Promise((resolve, reject) => {
      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(url);
      const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
      const isAudio = /\.(mp3|wav)$/i.test(url);

      if (isImage) {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
      } else if (isVideo || isAudio) {
        const media = document.createElement(isVideo ? "video" : "audio");
        media.src = url;
        media.onloadeddata = resolve;
        media.onerror = reject;
      } else {
        // fallback: just resolve
        resolve();
      }
    });
  }

  // Start asset preloading
  const preloadAssetsPromise = Promise.allSettled(
    ASSET_URLS.map(preloadAsset)
  ).then(() => {
    console.log("✅ Asset preload completed (errors ignored)");
  });

  scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(
    window.devicePixelRatio < 2 ? window.devicePixelRatio : 2
  );

  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setClearColor(0xffffff, 0); // Fully transparent background
  renderer.setSize(window.innerWidth, window.innerHeight);

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

  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(10, 10, 10);
  scene.add(keyLight);

  const loader = new GLTFLoader();
  const modelURLs = {
    initial:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1750236870/DCcanWithENGRAVEDlogo_2_ecjm5i_dobnwk.glb",
    center:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1747977846/appleCOT_tibxq0.glb",
    left: "https://res.cloudinary.com/do7dxrdey/image/upload/v1747987124/starberry_yeswvi.glb",
    right:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1747923870/2.44_u6yamm.glb",
  };

  const loadModelPromises = Object.entries(modelURLs).map(([key, url]) => {
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          model.position.sub(center);
          model.position.y = window.innerWidth < 768 ? -0.7 : -1;
          model.scale.set(0.6, 0.6, 0.6);

          model.traverse((child) => {
            if (
              child.isMesh &&
              child.material &&
              child.material.isMeshStandardMaterial
            ) {
              const oldMat = child.material;
              const newMat = new THREE.MeshStandardMaterial({
                color: oldMat.color || new THREE.Color(0xffffff),
                metalness: 1,
                roughness: 0.5,
                envMapIntensity: 2,
                map: oldMat.map || null,
              });
              newMat.transparent = false; // Fully opaque
              newMat.opacity = 1; // Full visibility
              newMat.alphaTest = 0.0; // Disable alpha cutoff
              newMat.side = THREE.FrontSide; // Optional: use FrontSide for better performance
              newMat.depthWrite = true;
              newMat.needsUpdate = true;
              if (newMat.map) {
                newMat.map.encoding = THREE.sRGBEncoding;
                newMat.map.needsUpdate = true;
                newMat.alphaMap = null;
              }

              child.material = newMat;
              child.castShadow = true;
              child.receiveShadow = true;
              child.geometry.computeVertexNormals();
            }
          });

          resolve({ key, model, size });
        },
        undefined,
        (err) => reject(err)
      );
    });
  });

  Promise.all([preloadAssetsPromise, Promise.all(loadModelPromises)])
    .then(([_, models]) => {
      let maxWidth = 0;
      models.forEach(({ key, model, size }) => {
        if (key === "left") {
          model.rotation.set(0, 0, 0);
          model.position.x = -7;
          leftCan = model;
        } else if (key === "right") {
          model.rotation.set(0, 0, 0);
          model.position.x = 7;
          rightCan = model;
        } else if (key === "center") {
          model.rotation.set(0, 0, 0);
          model.position.x = 7;
          centerCan = model;
        } else if (key === "initial") {
          updateModelColor(model, "#619b58");
          model.position.x = 0;
          model.rotation.set(0, 0, 0);
          initialCan = model;
          initialLeftCan = model.clone(true);
          updateModelColor(initialLeftCan, "#c78345");
          initialLeftCan.position.x = window.innerWidth < 768 ? -0.9 : -1;
          initialRightCan = model.clone(true);
          updateModelColor(initialRightCan, "#c67578");
          initialRightCan.position.x = window.innerWidth < 768 ? 0.9 : 1;

          scene.add(initialCan, initialLeftCan, initialRightCan);
        }

        scene.add(model);
        maxWidth = Math.max(maxWidth, size.x, size.y, size.z);
      });

      modelLoaded = true;
      fadeOutIntro();
      openCanAudio(camera);

      camera.position.z = maxWidth * 2;
      if (window.innerWidth < 768) {
        camera.position.z *= 1.5;
      }
      camera.updateProjectionMatrix();

      animate();
    })
    .catch((err) => {
      console.error("🚨 Failed to load models or assets:", err);
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
}

let hasCollided = false;
let isSwapping = false;

function resetSwapState() {
  lastXMovement = 0;
  didSwapRecently = false;
  hasCollided = false; // if you're using it
}

function setupScrollAnimations(updateFruitCallback) {
  let currentRange = -1;

  function updateInitialCanByProgress(
    progress,
    xMovement,
    responsiveScale,
    scene
  ) {
    if (!modelLoaded) return;

    const swapPoints = [0.12, 0.37, 0.62];
    let newRange = 0;

    if (progress >= swapPoints[0] && progress < swapPoints[1]) {
      newRange = 1;
    } else if (progress >= swapPoints[1] && progress < swapPoints[2]) {
      newRange = 2;
    } else if (progress >= swapPoints[2]) {
      newRange = 3;
    }

    if (newRange === currentRange) return;
    currentRange = newRange;

    const glbURLs = [
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1750236870/DCcanWithENGRAVEDlogo_2_ecjm5i_dobnwk.glb",
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1747923870/2.44_u6yamm.glb",
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1747987124/starberry_yeswvi.glb",
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1747977846/appleCOT_tibxq0.glb",
    ];

    const urlToLoad = glbURLs[newRange];

    if (initialCan) {
      initialCan.position.x = xMovement * responsiveScale;
    }

    // ✅ Only update background if not near the beginning (range 0)

    if (progress > 0.1) {
      console.log(progress, "newRange");
      updateBackgroundImage(newRange % 4);

      replaceInitialCanWithGLB(
        urlToLoad,
        scene,
        newRange === 0 ? "#619b58" : null
      );
    }
  }

  const resetCansY = () => {
    const y = isMobile ? -0.7 : -1;
    if (initialCan && initialCan.visible) initialCan.position.y = y;
    if (initialLeftCan && initialLeftCan.visible) initialLeftCan.position.y = y;
    if (initialRightCan && initialRightCan.visible)
      initialRightCan.position.y = y;
    if (centerCan && centerCan.visible) centerCan.position.y = y;
    if (leftCan && leftCan.visible) leftCan.position.y = y;
    if (rightCan && rightCan.visible) rightCan.position.y = y;
  };

  ScrollTrigger.create({
    trigger: ".hero-section",
    start: "top top",
    end: "+=50%",
    scrub: true,
    onUpdate: (self) => {
      if (!modelLoaded) return;

      const t = self.progress;

      const centerX = gsap.utils.interpolate(0, isMobile ? -0.9 : -2, t);
      initialCan.position.x = centerX;

      // Animate side cans' Y position upward
      const startY = isMobile ? -0.7 : -1;
      const endY = 4; // move up (higher Y = up in camera view)
      const upwardY = gsap.utils.interpolate(startY, endY, t);
      initialLeftCan.position.y = upwardY;
      initialRightCan.position.y = upwardY;

      // Make sure they stay visible during scroll
      initialLeftCan.visible = true;
      initialRightCan.visible = true;

      initialLeftCan.visible = true;
      initialRightCan.visible = true;
    },

    onLeave: () => {
      initialCan.position.x = isMobile ? -0.9 : -2;
    },

    onEnter: () => {
      initialCan.visible = true;
      initialLeftCan.visible = true;
      initialRightCan.visible = true;
    },

    onEnterBack: () => {
      lastXMovement = 0;
      centerCan.visible = false;
      currentRange = -1;

      initialCan.visible = true;
      initialLeftCan.visible = true;
      initialRightCan.visible = true;

      updateBackgroundImage(0);
      replaceInitialCanWithGLB(
        "https://res.cloudinary.com/do7dxrdey/image/upload/v1749915409/DCcanWithENGRAVEDlogo_2_ecjm5i.glb",
        scene,
        "#619b58"
      );

      const baseY = isMobile ? -0.7 : -1;

      // ✅ Make sure this happens next frame after visibility is already set
      requestAnimationFrame(() => {
        initialCan.position.set(isMobile ? -0.9 : -2, baseY, 0);
        initialLeftCan.position.set(isMobile ? -0.9 : -1, baseY, 0);
        initialRightCan.position.set(isMobile ? 0.9 : 1, baseY, 0);
      });
    },
  });

  ScrollTrigger.create({
    trigger: ".custom-border-section",
    start: "top center",
    end: "bottom 80%",
    scrub: true,
    onEnterBack: () => {
      lastXMovement = 0;
      resetSwapState();
      if (centerCan) {
        centerCan.visible = false;
        centerCan.position.set(7, isMobile ? -0.7 : -1, 0); // move it right
      }
      initialLeftCan.visible = false;
      initialRightCan.visible = false;
      // Make sure they're out of view
      initialLeftCan.position.x = -7;
      initialRightCan.position.x = 7;
      initialCan.visible = true;
    },

    // 🧹 Optional: also reset when completely leaving the section forward
    onLeave: () => {
      console.log("triggered");
      lastXMovement = 0;
      if (centerCan) {
        centerCan.visible = true;
        centerCan.position.set(isMobile ? -0.7 : -1, -4, 0); // restore position
      }
    },
    onUpdate: (self) => {
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
            bottom: "-100px",
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

      const direction = scrollVelocity > 0 ? "down" : "up";

      // if (
      //   (direction === "down" && isExactlyRightExtreme) ||
      //   (direction === "up" && isExactlyLeftExtreme)
      // ) {
      //   playCanSpinInPlace(initialCan);
      // }

      updateInitialCanByProgress(progress, xMovement, responsiveScale, scene);

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
          updateFruitCallback(direction, progress);

          actualSwapCount++;
        }
      }

      const isAtExtreme =
        xMovement <= -2 + threshold || xMovement >= 2 - threshold;

      if (!isAtExtreme) {
        didSwapRecently = false;
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
          duration: 0.01,
          ease: "power2.out",
        });
        gsap.to(leftCan.scale, {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 0.01,
          ease: "power2.out",
        });
        gsap.to(rightCan.scale, {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 0.01,
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

      // ⛔️ HIDE initialCan during this section
      if (initialCan) {
        initialCan.visible = false;
        initialCan.position.x = -10; // or any offscreen value
        centerCan.position.x = 0;
      }

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
        centerCan.rotation.set(0, rotationY, 0);
      } else {
        // ✴️ After rotateEnd, just reset to 0 rotation
        centerCan.rotation.set(0, 0, 0);
      }

      if (t > dropStart) {
        const normalizedT = (t - dropStart) / (1 - dropStart); // maps 0.3–1 → 0–1
        const fastT = Math.min(normalizedT * 2, 1); // double speed
        dropT = gsap.parseEase("power4.in")(fastT);
      }

      // Thrust down: Y = -0.05 → -1
      if (isMobile) {
        centerCan.position.y = gsap.utils.interpolate(-0.7, -0.8, dropT);
      } else centerCan.position.y = gsap.utils.interpolate(-1, -1.1, dropT);

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
      // Animate all rotations from (0, 0, 0) to (0, 2, 0)
      const targetRotationY = gsap.utils.interpolate(
        centerCan.rotation.y,
        0,
        easedT
      );

      centerCan.rotation.set(0, targetRotationY, 0);

      const leftTargetX = isMobile ? -0.8 : -1;
      const rightTargetX = isMobile ? 0.8 : 1;

      leftCan.position.x = gsap.utils.interpolate(0, leftTargetX, earlyT);
      rightCan.position.x = gsap.utils.interpolate(0, rightTargetX, earlyT);
      leftCan.rotation.set(0, -0.6, 0);
      rightCan.rotation.set(0, -0.32, 0);
    },
    onLeaveBack: () => {
      // Reset positions when scrolling back up
      if (leftCan && rightCan) {
        leftCan.position.set(-7, isMobile ? -0.7 : -1, 0); // Reset X-position
        rightCan.position.set(7, isMobile ? -0.7 : -1, 0); // Reset X-position
        centerCan.position.set(0, isMobile ? -0.7 : -1, 0);
        leftCan.rotation.set(0, 0, 0);
        centerCan.rotation.set(0, 0, 0);
        rightCan.rotation.set(0, 0, 0);
        centerCan.rotation.set(0, 0, 0);
        leftCan.visible = true;
        rightCan.visible = true;

        // ✅ Restore initialCan position & visibility
        initialCan.position.set(0, isMobile ? -0.7 : -1, 0);
        initialCan.visible = true;
      }
    },
  });

  if (isMobile) {
    ScrollTrigger.create({
      trigger: ".poppy-section",
      start: "top 1%", // Begin right after your current one ends
      end: () => {
        const section = document.querySelector(".poppy-section");
        return `+=${section.offsetHeight * 0.2}`; // 20% of its height
      },
      scrub: true,
      onUpdate: (self) => {
        const t = self.progress;

        if (leftCan && rightCan && centerCan) {
          // Slide leftCan left

          if (isMobile) {
            leftCan.position.y = -0.7;
            rightCan.position.y = -0.7;
          } else {
            leftCan.position.y = -1;
            rightCan.position.y = -1;
          }
          // Hide centerCan once the poppy-section is 20% scrolled past
          if (t > 0.2) {
            centerCan.visible = false;
          } else {
            centerCan.visible = true;
          }
        }
      },
      onLeave: () => {
        // Fully hide when done
        // leftCan.visible = false;
        // rightCan.visible = false;
        // centerCan.visible = false;
      },
      onEnterBack: () => {
        // Restore visibility and opacity
        leftCan.visible = true;
        rightCan.visible = true;
        centerCan.visible = true;
      },
    });
  }

  ScrollTrigger.create({
    trigger: ".poppy-section",
    start: "top top", // 🔥 Triggers when the top of .poppy-section hits the top of viewport
    end: "top top-=1", // Ends 1px after leaving
    onLeave: () => {
      if (!isMobile) {
        centerCan.visible = false;
        leftCan.visible = false;
        rightCan.visible = false;
      }
    },
    onEnterBack: () => {
      if (!isMobile) {
        centerCan.visible = true;
        leftCan.visible = true;
        rightCan.visible = true;
      }
    },
  });

  ScrollTrigger.create({
    trigger: ".model",
    start: "top top", // or adjust based on when you want them hidden
    end: "bottom top",
    onEnter: () => {
      if (modelLoaded) {
        [
          initialCan,
          initialLeftCan,
          initialRightCan,
          centerCan,
          leftCan,
          rightCan,
        ].forEach((can) => {
          if (can) can.visible = false;
        });
      }
    },
    onEnterBack: () => {
      if (modelLoaded) {
        [
          initialCan,
          initialLeftCan,
          initialRightCan,
          centerCan,
          leftCan,
          rightCan,
        ].forEach((can) => {
          if (can) can.visible = true;
        });
      }
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").innerHTML = `

  <div class="intro-screen">
  <div class="logo-container">
  <p>Heee</p>
    <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1744179914/donchicoredlogo_uzs2if.png" class="main-logo shimmer" />
  <div class="flavors-row">
    <div class="flavor-circle">
      <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1750412492/11_1_cukhbe.png" class="flavor-img shimmer" />
    </div>
    <div class="flavor-circle">
      <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1750412499/37_1_vb6ngi.png" class="flavor-img shimmer" />
    </div>
    <div class="flavor-circle">
      <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1744617469/25_1_y9hpks.png" class="flavor-img shimmer" />
    </div>
</div>

  </div>
</div>
<section class="hero">


<img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1744179914/donchicoredlogo_uzs2if.png" class="donchico-image" />
<p>The fizzy world of soda had surrendered to the ordinary—until Don Chico stepped in. A legend. A rebel. A mastermind of flavour.</p>
</section>
  

  <section class="custom-border-section">
  <div class="background-image-layer"></div>

  <div class="fruit-container">
  <div class="fruit-zone fruit-1-img">
  
    <img class="fruit-img fruit-1" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1749059138/Adobe_Express_-_file_1_pccfnh.png" />
    <div class="fruit-text text-0">Watermelon Sorbet</div>

  </div>

  <div class="fruit-zone fruit-2-img">
    
    <img class="fruit-img fruit-2" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1748930509/strawberry_1_rgx8eh.png" />
    <div class="fruit-text text-1">Strawberry Cream</div>
  </div>

  <div class="fruit-zone fruit-3-img">
   
    <img class="fruit-img fruit-3" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1748930645/apricot3d_1_uavqqj.png" />
    <div class="fruit-text text-2">Applecot Relish</div>

  </div>
</div>



  

   <!-- Right Border -->
 
  </section>





<section class="poppy-section" id="poppy-section">



</section>


<audio id="explosion-sound" src="/sounds/fruit-explosion.mp3" preload="auto"></audio>
<div id="dom-explosion-container"></div>
<section class="can-hero-section">
<div class="can-text">
<h2 id="can-title">Pop. Sip. Repeat.</h2>
<p id="can-description">Three bold flavors, zero regrets. Which one will you choose?</p>

</div>
  <div class="can-group">
  <img 
  src="https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.53.54_PM-removebg-preview_awbuwn.png" 
  alt="Strawberry Cream" 
  class="can can-left" 
  data-flavor="Strawberry Cream" 
  data-color="#ee6876" 
  data-darker-color="#c06a23"
  data-text="Berry bold and bubbly. Strawberry Cream brings the sweet punch you crave."
  data-btn="Buy Strawberry Cream"
  data-bgimg="https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6111_gpzjeq.png"
/>

  <img 
  src="https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.54.01_PM-removebg-preview_cgebmi.png" 
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
src="https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.54.07_PM-removebg-preview_kyeuox.png" 
alt="Watermelon Sorbet" 
class="can"
data-flavor="Watermelon Sorbet" 
data-color="#4BAB55" 
data-darker-color="#3a8a41"
  data-text="Zesty, juicy, and refreshingly wild. Watermelon Sorbet is here to wake you up."
data-btn="Buy Watermelon Sorbet"
data-bgimg="https://res.cloudinary.com/do7dxrdey/image/upload/v1749824280/IMG_6110_li3uxr.png"
/>



  </div>

  <div class="btn-row" id="btn-row">
<button class="soda-btn" style="background: linear-gradient(145deg, #ee6876, #d0485c);">Buy Strawberry Cream</button>
<button class="soda-btn" style="background: linear-gradient(145deg, #F4812C, #c06a23);">Buy Applecot Relish</button>
<button class="soda-btn" style="background: linear-gradient(145deg, #4BAB55, #3a8a41);">Buy Watermelon Sorbet</button>
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
  <button class="flavor-btn orange soda-btn" data-index="2" style="background: linear-gradient(145deg, #F4812C, #c06a23);">APPLECOT RELISH</button>
  <button class="flavor-btn soda-btn lemon" data-index="0" style="background: linear-gradient(145deg, #4BAB55, #3a8a41);">WATERMELON SORBET</button>
    <button class="flavor-btn mango soda-btn" data-index="1" style="background: linear-gradient(145deg, #ee6876, #d0485c);">STRAWBERRY CREAM</button>
  </div>
</section>

<section class="recipe-section">
  <h2 class="recipe-heading">Don's Recipes</h2>
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






  

    <div class="model">
    
    </div>
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

  function updateFruitIndex(direction, progress) {
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
  let currentIndex = { value: 0 };

  let isAnimating = false;

  const mainCan = document.getElementById("main-can");
  const leftBgCan = document.getElementById("left-bg-can");
  const rightBgCan = document.getElementById("right-bg-can");
  const leftArrow = document.querySelector(".nav-arrow.left");
  const rightArrow = document.querySelector(".nav-arrow.right");
  const mobileCanUI = document.querySelector(".mobile-can-ui");

  carouselGesture({
    swipeArea: mobileCanUI,
    carouselLength: flavors.length,
    callback: updateMainCan,
    currentIndex,
    condition: isMobile,
  });

  function updateMainCan(index) {
    currentIndex.value = index;

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
    mobileUI.style.backgroundImage = `url(${flavors[currentIndex.value].bg})`;
  }

  leftArrow.addEventListener("click", () => {
    const newIndex = (currentIndex.value - 1 + flavors.length) % flavors.length;
    updateMainCan(newIndex);
  });

  rightArrow.addEventListener("click", () => {
    const newIndex = (currentIndex.value + 1) % flavors.length;
    updateMainCan(newIndex);
  });

  document.querySelectorAll(".flavor-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      updateMainCan(index);
    });
  });

  // Initialize
  updateMainCan(currentIndex.value);
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
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

    // Set default open one if it has class "active"
    if (item.classList.contains("active")) {
      answer.style.maxHeight = answer.scrollHeight + "px";
    }

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");

      faqItems.forEach((el) => {
        el.classList.remove("active");
        el.querySelector(".faq-answer").style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("active");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
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

  const canHero = document.querySelector(".can-hero-section");

  ScrollTrigger.create({
    trigger: ".can-hero-section",
    start: "top bottom", // when .can-hero-section hits the bottom of viewport
    end: "top top", // until it reaches top of viewport
    onEnter: () => {
      document.querySelector(".poppy-section").style.display = "none";
      document.querySelector(".poppy-section").style.height = "0px";
    },
    onLeaveBack: () => {
      document.querySelector(".poppy-section").style.display = "block";
      document.querySelector(".poppy-section").style.height = "100vh"; // or whatever original height you used
    },
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

document.addEventListener("DOMContentLoaded", () => {
  const customBorderSection = document.querySelector(".custom-border-section");
  generateBubble(customBorderSection, !isMobile);
});
