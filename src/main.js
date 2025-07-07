import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import "./style.css";
import { openCanAudio } from "./openCanAudio";
import { carouselGesture } from "./carouselGesture";
import { generateBubble } from "./generateBubble";
import recipe from "./templates/recipes";
import { flavors } from "./utils";
import pictureCollage from "./templates/pictureCollage";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
RectAreaLightUniformsLib.init();
import ticker from "./templates/ticker";

function getModelScreenHeightInPixels(model, camera, renderer) {
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const top = new THREE.Vector3(center.x, box.max.y, center.z);
  const bottom = new THREE.Vector3(center.x, box.min.y, center.z);

  const projectY = (v) => {
    const projected = v.clone().project(camera);
    return ((1 - projected.y) * renderer.domElement.clientHeight) / 2;
  };

  return Math.abs(projectY(top) - projectY(bottom));
}

function applyModelHeightToImages(model, camera, renderer) {
  const modelHeightPx = getModelScreenHeightInPixels(model, camera, renderer);

  const imageSelectors = [
    ".can-group-hero .can[key='left']",
    ".can-group-hero .can[key='center']",
    ".can-group-hero .can[key='right']",
    "#left-bg-can",
    "#main-can",
    "#right-bg-can",
  ];

  if (isMobile) {
    imageSelectors.forEach((selector) => {
      const img = document.querySelector(selector);
      if (img) {
        img.style.height = `${modelHeightPx + 20}px`;
        img.style.width = "auto"; // preserve aspect ratio
      }
    });
  }
}

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
  initialCan = {};
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

function replaceInitialCanWithGLB(key, scene, hex) {
  if (!modelLoaded || !glbModelCache[key]) return;

  const original = glbModelCache[key];
  const newModel = original.clone(true); // ✅ Clone the cached original

  // Reset transform
  const box = new THREE.Box3().setFromObject(newModel);
  const center = box.getCenter(new THREE.Vector3());
  newModel.position.sub(center);
  newModel.position.y = isMobile ? -0.7 : -1;
  newModel.position.x = initialCan?.position.x || 0;
  newModel.scale.set(0.6, 0.6, 0.6);
  newModel.rotation.set(0, 0, 0);

  newModel.traverse((child) => {
    if (child.isMesh && child.material?.isMeshStandardMaterial) {
      const oldMat = child.material;
      const newMat = new THREE.MeshStandardMaterial({
        color: hex ? new THREE.Color(hex) : oldMat.color.clone(),
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 2.5,
        map: oldMat.map || null,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        transparent: false,
        opacity: 1,
        alphaTest: 0.0,
        side: THREE.FrontSide,
        depthWrite: true,
      });

      if (newMat.map) {
        newMat.map.encoding = THREE.sRGBEncoding;
        newMat.map.needsUpdate = true;
      }

      child.material = newMat;
      child.castShadow = true;
      child.receiveShadow = true;
      child.geometry.computeVertexNormals();
    }
  });
  if (initialCan) {
    scene.remove(initialCan);
  }

  initialCan = newModel;
  initialCan.visible = true;
  scene.add(initialCan);
}

const backgroundImages = [
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1751214072/2_1_qc6ltq.png",
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1751214072/2_1_qc6ltq.png",
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1751214072/3_1_hajus7.png",
  "https://res.cloudinary.com/do7dxrdey/image/upload/v1751214072/4_3_byfiaa.png",
];

let currentBgIndex = -1;

function updateBackgroundImage(index) {
  if (index === currentBgIndex) return;

  const bgImg = document.getElementById("bg-image");
  const url = backgroundImages[index];

  if (bgImg && url) {
    bgImg.src = url;
    currentBgIndex = index;
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

const glbModelCache = {};

function initThreeJS() {
  const ASSET_URLS = [
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067031/IMG_2126_1_tesfjm.png",

    // 🌈 Hero Section Cans
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751262477/Screenshot_2025-06-30_at_11.16.55_AM-removebg-preview_1_lsivbz.png",

    // 🍍 Logo and Flavors
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1744179914/donchicoredlogo_uzs2if.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750412492/11_1_cukhbe.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750412499/37_1_vb6ngi.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1744617469/25_1_y9hpks.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751272545/Screenshot_2025-06-30_at_2.04.26_PM-removebg-preview_1_fb01a6.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751272786/Screenshot_2025-06-30_at_2.08.52_PM-removebg-preview_fh0akn.png",

    // 💨 Bubbles
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751273819/Screenshot_2025-06-30_at_2.23.57_PM-removebg-preview_1_yz6e5n.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751273811/Screenshot_2025-06-30_at_2.24.02_PM-removebg-preview_1_ttdgew.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751273802/Screenshot_2025-06-30_at_2.24.06_PM-removebg-preview_1_q46g4b.png",

    // 🍎 Fruit Sections
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749059138/Adobe_Express_-_file_1_pccfnh.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751033116/Don_Chicos_Website_1_-removebg-preview_eoaxqi.webp",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751033228/Don_Chicos_Website_2_-removebg-preview_hss1cg.webp",

    // 🥤 Can Hero Section
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.53.54_PM-removebg-preview_awbuwn.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.54.01_PM-removebg-preview_cgebmi.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1750249660/Screenshot_2025-06-18_at_5.54.07_PM-removebg-preview_kyeuox.png",

    // 📱 Mobile UI Cans
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749979554/IMG_4588_1_1_qhx10y.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749067023/Adobe_Express_-_file_3_1_syhwrv.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749066942/Adobe_Express_-_file_4_1_druku2.png",
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1749066841/Adobe_Express_-_file_2_1_aci4ev.png",

    // 🔊 Audio
    "https://res.cloudinary.com/do7dxrdey/video/upload/v1745594133/soda-can-opening-169337_aekjbs.mp3",
  ];

  preloadBackgroundImages(backgroundImages);

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

  let preloadAssetsPromise;

  if (!isMobile) {
    preloadAssetsPromise = Promise.allSettled(
      ASSET_URLS.map(preloadAsset)
    ).then(() => {
      console.log("✅ Asset preload completed (errors ignored)");
    });
  } else {
    console.log("📱 Skipping preload on mobile");
    preloadAssetsPromise = Promise.resolve();
  }

  scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(
    window.devicePixelRatio < 2 ? window.devicePixelRatio : 2
  );

  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setClearColor(0xffffff, 0); // Fully transparent background
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  // const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  // scene.add(ambientLight);

  // // Top light
  // const topLight = new THREE.DirectionalLight(0xffffff, 2);
  // topLight.position.set(0, 10, 0);
  // scene.add(topLight);

  // Front light
  // const frontLight = new THREE.DirectionalLight(0xffffff, 2);
  // frontLight.position.set(0, 0, 10);
  // scene.add(frontLight);

  // // Back light
  // const backLight = new THREE.DirectionalLight(0xffffff, 2);
  // backLight.position.set(0, 0, -10);
  // scene.add(backLight);

  // Clear existing lights
  scene.clear();

  // Add new top key light
  const keyLight2 = new THREE.DirectionalLight(0xffffff, 4.5);
  keyLight2.position.set(-2, 5, 5);
  keyLight2.castShadow = false;
  scene.add(keyLight2);

  // Add top highlight light
  const topHighlight = new THREE.DirectionalLight(0xffffff, 4.0);
  topHighlight.position.set(0, 10, 10);
  scene.add(topHighlight);

  // Front light
  const frontLight = new THREE.DirectionalLight(0xffffff, 0.2);
  frontLight.position.set(2, 0, 2);
  scene.add(frontLight);

  // Add very soft ambient light to lift shadows slightly
  const ambientLight = new THREE.AmbientLight(0xffffff, 5);
  scene.add(ambientLight);

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
    left: "https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751806981/starberry_yeswvi_1_kfxrr1.glb",
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
                metalness: 0.9,
                roughness: 0.1,
                envMapIntensity: 2.5,
                map: oldMat.map || null,
              });
              newMat.clearcoat = 0.8;
              newMat.clearcoatRoughness = 0.1;
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
          glbModelCache[key] = model; // ✅ Add this line
        },

        undefined
      );
    });
  });

  let fadeOutTriggered = false;

  // Track when model loading completes
  let modelLoadComplete = false;

  // Start timer
  const startTime = performance.now();

  // Kick off loading
  Promise.all([preloadAsset, Promise.all(loadModelPromises)])
    .then(([_, models]) => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // If it took longer than 4 seconds and model already resolved, trigger fallback
      if (loadTime > 4000 && !fadeOutTriggered && modelLoadComplete) {
        fadeOutIntro();
        fadeOutTriggered = true;
      }

      // Continue normal model setup
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
          model.position.x = 0;
          model.rotation.set(0, 0, 0);
          initialCan = model;
          initialCan.visible = false;
          scene.add(initialCan);
        }

        scene.add(model);
        maxWidth = Math.max(maxWidth, size.x, size.y, size.z);
      });

      applyModelHeightToImages(centerCan, camera, renderer);
      modelLoaded = true;

      // If fadeOutIntro hasn't run yet (and shouldn't be deferred), run it now
      if (!fadeOutTriggered) {
        fadeOutIntro();
        fadeOutTriggered = true;
      }

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

  // Separate tracker: when loadModelPromises completes
  Promise.all(loadModelPromises)
    .then(() => {
      modelLoadComplete = true;
    })
    .catch((err) => {
      console.error("❌ Model loading failed:", err);
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
    scene,
    direction,
    updateFruitCallback
  ) {
    if (!modelLoaded) return;

    const swapPoints = [0.12, 0.37, 0.62];

    console.log(progress);
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

    const keys = ["initial", "right", "left", "center"];

    const keysToLoad = keys[newRange];

    if (initialCan) {
      initialCan.position.x = xMovement;
    }

    // ✅ Only update background if not near the beginning (range 0)

    if (progress > 0.1) {
      console.log(progress, "newRange");
      updateBackgroundImage(newRange % 4);
      updateFruitCallback(direction, progress);

      replaceInitialCanWithGLB(keysToLoad, scene);
    }
  }

  ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: "+=45%",
    scrub: true,
    onUpdate: (self) => {
      if (!modelLoaded) return;

      const centerImg = document.querySelector(".can[key='center']");
      if (centerImg) centerImg.style.opacity = 0;

      const t = self.progress;

      // Hide when reversed fully
      if (t === 0) {
        initialCan.visible = false;
        return;
      }

      // Central can moves left at normal scroll pace
      const centerX = gsap.utils.interpolate(0, isMobile ? -0.9 : -2, t);
      initialCan.position.x = centerX;

      initialCan.visible = true;
    },
    onEnterBack: () => {
      lastXMovement = 0;
      centerCan.visible = false;
      currentRange = -1;

      updateBackgroundImage(0);
      replaceInitialCanWithGLB(
        "https://res.cloudinary.com/do7dxrdey/image/upload/v1749915409/DCcanWithENGRAVEDlogo_2_ecjm5i.glb",
        scene
      );

      const baseY = isMobile ? -0.7 : -1;

      // ✅ Make sure this happens next frame after visibility is already set
      requestAnimationFrame(() => {
        initialCan.position.set(isMobile ? -0.9 : -2, baseY, 0);
      });
    },
    onEnter: () => {
      if (!modelLoaded) return;

      centerCan.visible = false;
      currentRange = -1;
      lastXMovement = 0;

      updateBackgroundImage(0);

      replaceInitialCanWithGLB("initial", scene); // 👈 This is your function
    },

    onLeaveBack: () => {
      const centerImg = document.querySelector(".can[key='center']");
      if (centerImg) centerImg.style.opacity = 1;
    },
  });

  ScrollTrigger.create({
    trigger: ".custom-border-section",
    start: "top center",
    end: "bottom 50%",
    scrub: true,
    onEnterBack: () => {
      lastXMovement = 0;
      resetSwapState();
      if (centerCan) {
        centerCan.visible = false;
        centerCan.position.set(7, isMobile ? -0.9 : -1, 0);
      }
    },
    onLeaveBack: () => {},
    onLeave: () => {},
    onUpdate: (self) => {
      if (!modelLoaded) return;

      const progress = self.progress;
      const scrollVelocity = self.getVelocity();
      const screenWidth = window.innerWidth;

      const minX = isMobile ? -0.7 : -2;
      const maxX = isMobile ? 0.7 : 2;
      const rangeX = maxX - minX;

      // 🌀 Y rotation
      const segmentStart = Math.floor(progress / 0.25) * 0.25;
      const localT = (progress - segmentStart) / 0.25;
      initialCan.rotation.y = gsap.utils.interpolate(0, Math.PI * 2, localT);

      // 📍 Position logic
      function getLocalT(p, start, end) {
        return (p - start) / (end - start);
      }

      let xMovement;
      if (progress < 0.25) {
        const t = getLocalT(progress, 0, 0.25);
        xMovement = minX + rangeX * t;
      } else if (progress < 0.5) {
        const t = getLocalT(progress, 0.25, 0.5);
        xMovement = maxX - rangeX * t;
      } else if (progress < 0.75) {
        const t = getLocalT(progress, 0.5, 0.75);
        xMovement = minX + rangeX * t;
      } else if (progress < 0.92) {
        const t = getLocalT(progress, 0.75, 0.92); // 🔥 shorter range = faster
        xMovement = gsap.utils.interpolate(maxX, 0, t);
      } else {
        xMovement = 0; // ✅ stay at center after 0.9
      }

      initialCan.position.x = xMovement;

      // 📝 Text animation
      const textIndices = [0, 1, 2];

      textIndices.forEach((index) => {
        const textEl = document.querySelector(`.fruit-text.text-${index}`);
        if (!textEl) return;

        const enterStart = index * 0.25;
        const enterEnd = enterStart + 0.25;

        const progressInRange = progress >= enterStart;

        let x = 0;
        let opacity = 0;

        const directionIn = index % 2 === 0 ? -screenWidth : screenWidth;

        if (progress >= enterStart && progress < enterEnd) {
          // Animate in from left or right
          const t = (progress - enterStart) / 0.25;
          x = gsap.utils.interpolate(directionIn, 0, t);
          opacity = gsap.utils.interpolate(0, 1, t);
        } else if (progress >= enterEnd) {
          // Stay in center
          x = 0;
          opacity = 1;
        }

        gsap.set(textEl, {
          x,
          opacity,
          position: "absolute",
          display: opacity > 0 ? "block" : "none",
          bottom: "-100px",
          transform: "translateX(0%)",
        });
      });

      // 🔁 Swap detection
      const threshold = Math.abs(rangeX) * 0.1;

      const reachedLeft =
        xMovement <= minX + threshold && lastXMovement > minX + threshold;
      const reachedRight =
        xMovement >= maxX - threshold && lastXMovement < maxX - threshold;

      const direction = scrollVelocity > 0 ? "down" : "up";

      updateInitialCanByProgress(
        progress,
        xMovement,
        scene,
        direction,
        updateFruitCallback
      );
      //           updateFruitCallback(direction, progress);

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
          actualSwapCount++;
        }
      }

      const isAtExtreme =
        xMovement <= minX + threshold || xMovement >= maxX - threshold;

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
    start: "top 50%",
    end: "top 1%",
    scrub: true,
    onUpdate: (self) => {
      if (!modelLoaded) return;

      // ⛔️ HIDE initialCan during this section
      if (initialCan) {
        initialCan.visible = false;
        initialCan.position.x = -10; // or any offscreen value
        centerCan.position.x = 0;
        centerCan.visible = true;
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
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").innerHTML = `

  <div class="intro-screen">
  <div class="logo-container">
    <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1744179914/donchicoredlogo_uzs2if.png" class="main-logo shimmer" />
  <div class="flavors-row">
    <div class="flavor-circle">
      <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1750412492/11_1_cukhbe.png" class="flavor-img shimmer" />
    </div>
    <div class="flavor-circle">
      <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1750412499/37_1_vb6ngi.png" class="flavor-img shimmer" />
    </div>
    <div class="flavor-circle">
      <img src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751635300/2_2_1_lapjn0.png" class="flavor-img shimmer" />
    </div>
</div>

  </div>
</div>
<section class="don-landing">

<div class="hero-content">
<div class="og-container">
  <div class="logo-container-2">
    <img
      class="main-logo-2"
      src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751272545/Screenshot_2025-06-30_at_2.04.26_PM-removebg-preview_1_fb01a6.png"
      alt="Main Logo"
    />
  </div>
  <div class="badges">
    <img
      class="badges-img"
      src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751634605/6_1_3_ydfa44.png"
      alt="Badge 1"
    />
    <img
      class="badges-img"
      src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751634604/6_1_1_erur0t.png"
      alt="Badge 2"
    />
    <img
      class="badges-img"
      src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751634604/6_1_2_xgycog.png"
      alt="Badge 3"
    />
  </div>
</div>



    <p class="hero-desc">
    The fizzy world of soda had surrendered to the ordinary- Until Don Chico stepped in. <br />
    A legend. A rebel. A mastermind of flavour.    </p>

    <button class="soda-btn">
      Shop Now 
    </button>
  </div>

  <div class="bubble-wrapper">
  <img class="bubble-1" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751273819/Screenshot_2025-06-30_at_2.23.57_PM-removebg-preview_1_yz6e5n.png" />
  <img class="bubble-2" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751273811/Screenshot_2025-06-30_at_2.24.02_PM-removebg-preview_1_ttdgew.png" />
  <img class="bubble-3" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751273802/Screenshot_2025-06-30_at_2.24.06_PM-removebg-preview_1_q46g4b.png" />
</div>


</section>
<section class="hero">
<div class="can-group-hero">
<img class="can " key='left' src='https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751807053/Screenshot_2025-07-06_at_6.33.09_PM-removebg-preview_uw2zo2.png' />
<img class="can " key='center' src='https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751807053/Screenshot_2025-07-06_at_6.33.09_PM-removebg-preview_uw2zo2.png' />
<img class="can " key='right' src='https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751807053/Screenshot_2025-07-06_at_6.33.09_PM-removebg-preview_uw2zo2.png' />
</div>


</section>
  

  <section class="custom-border-section">
  
  <div class="background-image-layer">
  <img id="bg-image" src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751214072/2_1_qc6ltq.png" alt="" />
</div>


<div class="fruit-container">
<div class="fruit-zone fruit-1-img">
  <img
    class="fruit-img fruit-1"
    src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751635300/2_2_1_lapjn0.png"

  />
  <div class="fruit-text text-0">
    <p class="fruit-label-text">Watermelon Sorbet</p>
    <p class="fruit-para">
      This isn’t just watermelon and mint. It’s a chilled rebellion against boring.
      A summer stunner with a minty twist.
    </p>
  </div>
</div>




<div class="fruit-zone fruit-2-img">
  <img
    class="fruit-img fruit-2"
    src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751033116/Don_Chicos_Website_1_-removebg-preview_eoaxqi.webp"
  />
  <div class="fruit-text text-1">
    <p class="fruit-label-text">Strawberry Cream</p>
    <p class="fruit-para">
      The strawberry-vanilla soda you wish you grew up with, finally done right.
    </p>
  </div>
</div>


 <div class="fruit-zone fruit-3-img">
  <img
    class="fruit-img fruit-3"
    src="https://res.cloudinary.com/do7dxrdey/image/upload/v1751033228/Don_Chicos_Website_2_-removebg-preview_hss1cg.webp"

  />
  <div class="fruit-text text-2">
    <p class="fruit-label-text">AppleCot Relish</p>
    <p class="fruit-para">Half apple, half apricot, fully addictive.</p>
  </div>
</div>

</div>
</div>




  

   <!-- Right Border -->
 
  </section>





<section class="poppy-section" id="poppy-section">



</section>


<div id="dom-explosion-container"></div>
<section class="can-hero-section">
<div class="can-text">

</div>
  <div class="can-group">
  <div> <img 
  src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751808316/Screenshot_2025-07-06_at_6.52.44_PM__2_-removebg-preview_m5alhr.png" 
  alt="Strawberry Cream" 
  class="can can-left" 
  data-flavor="Strawberry Cream" 
  data-color="#ee6876" 
  data-darker-color="#c06a23"
  data-text="Berry bold and bubbly. Strawberry Cream brings the sweet punch you crave."
  data-btn="Buy Strawberry Cream"
  data-bgimg="https://res.cloudinary.com/do7dxrdey/image/upload/v1751214072/3_1_hajus7.png"
/>
<p class="flav-text text-0">Watermelon Sorbet</p><button class="soda-btn" >+ 6 Pack</button>
</div>
 
<div>  <img 
src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751808426/Screenshot_2025-07-06_at_6.46.44_PM-removebg-preview_dbjqac.png" 
alt="Applecot Relish" 
class="can can-right"
data-flavor="Applecot Relish" 
data-color="#F4812C" 
data-darker-color="#d0485c"

data-text="Cool, calm, and delicious. Applecot Relish's got that mellow magic."
data-btn="Buy Applecot Relish"
data-bgimg="https://res.cloudinary.com/do7dxrdey/image/upload/v1751214072/4_3_byfiaa.png"
/>
<p class="flav-text text-1">Strawberry Cream</p><button class="soda-btn" >+ 6 Pack</button>
</div>



<div><img 
src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751807943/Screenshot_2025-07-06_at_6.46.49_PM-removebg-preview_vac2f3.png" 
alt="Watermelon Sorbet" 
class="can"
data-flavor="Watermelon Sorbet" 
data-color="#4BAB55" 
data-darker-color="#3a8a41"
  data-text="Zesty, juicy, and refreshingly wild. Watermelon Sorbet is here to wake you up."
data-btn="Buy Watermelon Sorbet"
data-bgimg="https://res.cloudinary.com/do7dxrdey/image/upload/v1751214072/2_1_qc6ltq.png"
/>
<p class="flav-text text-2">Applecot Relish</p><button class="soda-btn" >+ 6 Pack</button>
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

    <img class="can-bg right"       src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751807943/Screenshot_2025-07-06_at_6.46.49_PM-removebg-preview_vac2f3.png"
    id="right-bg-can"  alt="Right Can" />
    <img class="can-bg left" id="left-bg-can"
    src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751808316/Screenshot_2025-07-06_at_6.52.44_PM__2_-removebg-preview_m5alhr.png"

     alt="Left Can" />


    <img
    id="main-can"
      class="main-can"
      src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751808426/Screenshot_2025-07-06_at_6.46.44_PM-removebg-preview_dbjqac.png"
      alt="Watermelon Sorbet"
    />


    <button class="nav-arrow right">&#10095;</button>
  </div>

  <!-- Nutrition Facts -->


  <!-- Flavor Buttons -->
  <div class="flavor-buttons">
  <button class="flavor-btn orange soda-btn" data-index="2" >APPLECOT RELISH</button>
  <button class="flavor-btn soda-btn lemon" data-index="0" >WATERMELON SORBET</button>
    <button class="flavor-btn mango soda-btn" data-index="1" >STRAWBERRY CREAM</button>
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
    mobileUI.style.background = `url(${
      flavors[currentIndex.value].bg
    }) center/cover no-repeat`;
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

  ScrollTrigger.create({
    trigger: ".can-hero-section",
    start: "top bottom", // when .can-hero-section hits the bottom of viewport
    end: "top top", // until it reaches top of viewport
    onEnter: () => {
      requestAnimationFrame(() => {
        const poppy = document.querySelector(".poppy-section");
        poppy.style.position = "absolute";
        poppy.style.top = "-100vh"; // Push it above viewport
        poppy.style.left = "0";
        poppy.style.width = "100%";
        poppy.style.zIndex = "-1";
      });
    },
    onLeaveBack: () => {
      const poppy = document.querySelector(".poppy-section");

      poppy.style.position = "relative"; // restore layout
      poppy.style.top = "0";
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

document.addEventListener("DOMContentLoaded", () => {
  ticker();
  pictureCollage();
});

const backgroundImageCache = {};

function preloadBackgroundImages(urls) {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
    backgroundImageCache[url] = img;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".ticker-main-container");

  // Create wrapper div
  const wrapper = document.createElement("div");
  wrapper.style.top = "20px";
  wrapper.style.left = "20px";
  wrapper.style.zIndex = "10";
  wrapper.style.textAlign = "center";
  wrapper.style.gap = "10px";
  wrapper.style.padding = "10vh";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";

  // Create image
  const image = document.createElement("img");
  image.src =
    "https://res.cloudinary.com/do7dxrdey/image/upload/v1751557233/IMG_6889-removebg-preview_jsgrpz.png";
  image.alt = "Extra image";
  image.style.height = "60vh";
  image.style.paddingBottom = "5vh";
  image.classList.add("assorted-class");

  // Create paragraph
  const paragraph = document.createElement("p");
  paragraph.textContent = "Our Assorted Pack"; // Change as needed
  paragraph.classList.add("assorted"); // Add your desired class(es)

  // Create button
  const button = document.createElement("button");
  button.textContent = "+ 6 Pack";
  button.classList.add("soda-btn");

  // Append elements to wrapper
  wrapper.appendChild(image);
  wrapper.appendChild(paragraph); // 👈 insert paragraph between image and button
  wrapper.appendChild(button);

  // Append wrapper to container
  container.appendChild(wrapper);
});
