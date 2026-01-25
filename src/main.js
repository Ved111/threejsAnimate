import { gsap, ScrollTrigger } from "./config/gsap.config.js";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Lenis from "lenis";
import "./style.css";
import { openCanAudio } from "./openCanAudio";
import { carouselGesture } from "./carouselGesture";
import { generateBubble } from "./generateBubble";
import { flavors } from "./utils";
import pictureCollage from "./templates/pictureCollage";
import reviewSection from "./templates/reviews/index.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
RectAreaLightUniformsLib.init();
import ticker from "./templates/ticker";
import socialsSection from "./templates/socials/index.js";

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

// Footer Animation
function initFooterAnimation() {
  const footerElements = [
    document.querySelector(".footer-element-1"),
    document.querySelector(".footer-element-2"),
    document.querySelector(".footer-element-3"),
  ].filter(Boolean);

  if (footerElements.length !== 3) {
    console.warn("❌ Some footer elements are missing");
    return;
  }

  const customFooter = document.querySelector(".custom-footer");

  // Get line positions based on screen size
  function getLinePositions() {
    if (window.innerWidth < 768) {
      // mobile: tighter spread
      return [
        { x: -100, y: 0 }, // left
        { x: 0, y: 0 }, // center
        { x: 100, y: 0 }, // right
      ];
    } else if (window.innerWidth < 1280) {
      // tablet / small desktop: medium spread
      return [
        { x: -300, y: 0 },
        { x: 0, y: 0 },
        { x: 300, y: 0 },
      ];
    } else {
      // large desktop: widest spread
      return [
        { x: -380, y: 0 },
        { x: 0, y: 0 },
        { x: 380, y: 0 },
      ];
    }
  }

  let linePositions = getLinePositions();

  // Always start hidden at center
  gsap.set(footerElements, { x: 0, y: 0, opacity: 0 });
  gsap.set(customFooter, { opacity: 0, display: "none" });

  // Create enter + leave timeline
  function animateIn() {
    gsap.set(customFooter, { display: "flex" });
    gsap
      .timeline()
      .to(customFooter, { opacity: 1, duration: 0.3 })
      .to(
        footerElements,
        {
          opacity: 1,
          duration: 0.4,
          x: (i) => linePositions[i].x,
          y: (i) => linePositions[i].y,
          ease: "power3.out",
          stagger: 0.1,
        },
        "<"
      );
  }

  function animateOut() {
    gsap
      .timeline()
      .to(footerElements, {
        x: 0,
        y: 0,
        opacity: 0,
        duration: 0.5,
        ease: "power3.in",
        stagger: 0.1,
      })
      .to(
        customFooter,
        {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            gsap.set(customFooter, { display: "none" });
          },
        },
        "-=0.2"
      );
  }

  // ScrollTrigger
  ScrollTrigger.create({
    trigger: ".custom-border-section",
    start: "top top",
    end: "bottom-=200 bottom", // 🔥 start fading out 100px before section ends
    onEnter: animateIn,
    onLeave: animateOut,
    onEnterBack: animateIn,
    onLeaveBack: animateOut,
  });

  // Update positions on resize
  window.addEventListener("resize", () => {
    linePositions = getLinePositions();
  });
}

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
      child.castShadow = false;
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
  "https://donchico.s3.eu-north-1.amazonaws.com/2_1_qc6ltq.png",
  "https://donchico.s3.eu-north-1.amazonaws.com/2_1_qc6ltq.png",
  "https://donchico.s3.eu-north-1.amazonaws.com/3_1_hajus7.png",
  "https://donchico.s3.eu-north-1.amazonaws.com/4_3_byfiaa.png",
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

const isLowEnd =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) && window.innerWidth < 768;

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
  const ASSET_URLS = [];

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
        resolve();
      }
    });
  }

  let preloadAssetsPromise;

  if (!isMobile) {
    preloadAssetsPromise = Promise.allSettled(
      ASSET_URLS.map(preloadAsset)
    ).then(() => {});
  } else {
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

  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  scene.clear();

  const keyLight2 = new THREE.DirectionalLight(0xffffff, 4.5);
  keyLight2.position.set(-2, 5, 5);
  keyLight2.castShadow = false;
  scene.add(keyLight2);

  const topHighlight = new THREE.DirectionalLight(0xffffff, 4.0);
  topHighlight.position.set(0, 10, 10);
  scene.add(topHighlight);

  const frontLight = new THREE.DirectionalLight(0xffffff, 0.2);
  frontLight.position.set(2, 0, 2);
  scene.add(frontLight);

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
      "https://donchico.s3.eu-north-1.amazonaws.com/DCcanWithENGRAVEDlogo_2_ecjm5i_dobnwk.glb",
    center: "https://donchico.s3.eu-north-1.amazonaws.com/appleCOT_tibxq0.glb",
    left: "https://res.cloudinary.com/dt5lkw0vz/image/upload/starberry_yeswvi_1_kfxrr1.glb",
    right: "https://donchico.s3.eu-north-1.amazonaws.com/2.44_u6yamm.glb",
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
              newMat.transparent = false;
              newMat.opacity = 1;
              newMat.alphaTest = 0.0;
              newMat.side = THREE.FrontSide;
              newMat.depthWrite = true;
              newMat.needsUpdate = true;
              if (newMat.map) {
                newMat.map.encoding = THREE.sRGBEncoding;
                newMat.map.needsUpdate = true;
                newMat.alphaMap = null;
              }

              child.material = newMat;
              child.castShadow = false;
              child.receiveShadow = true;
              child.geometry.computeVertexNormals();
            }
          });

          resolve({ key, model, size });
          glbModelCache[key] = model;
        },
        undefined
      );
    });
  });

  let fadeOutTriggered = false;

  let modelLoadComplete = false;

  const startTime = performance.now();

  Promise.all([preloadAssetsPromise, Promise.all(loadModelPromises)])
    .then(([_, models]) => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      if (loadTime > 4000 && !fadeOutTriggered && modelLoadComplete) {
        fadeOutIntro();
        fadeOutTriggered = true;
      }

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

  Promise.all(loadModelPromises)
    .then(() => {
      modelLoadComplete = true;
    })
    .catch((err) => {
      console.error("❌ Model loading failed:", err);
    });

  function animate() {
    if (isLowEnd) {
      setTimeout(() => requestAnimationFrame(animate), 1000 / 30);
    } else {
      requestAnimationFrame(animate);
    }
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
  hasCollided = false;
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

    if (progress > 0.1) {
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

      if (t === 0) {
        initialCan.visible = false;
        return;
      }

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
        "https://donchico.s3.eu-north-1.amazonaws.com/DCcanWithENGRAVEDlogo_2_ecjm5i.glb",
        scene
      );

      const baseY = isMobile ? -0.7 : -1;

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

      replaceInitialCanWithGLB("initial", scene);
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

      const segmentStart = Math.floor(progress / 0.25) * 0.25;
      const localT = (progress - segmentStart) / 0.25;
      initialCan.rotation.y = gsap.utils.interpolate(0, Math.PI * 2, localT);

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
        const t = getLocalT(progress, 0.75, 0.92);
        xMovement = gsap.utils.interpolate(maxX, 0, t);
      } else {
        xMovement = 0;
      }

      initialCan.position.x = xMovement;

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
          const t = (progress - enterStart) / 0.25;
          x = gsap.utils.interpolate(directionIn, 0, t);
          opacity = gsap.utils.interpolate(0, 1, t);
        } else if (progress >= enterEnd) {
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
    start: "top top",
    end: "bottom bottom",
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

      if (initialCan) {
        initialCan.visible = false;
        initialCan.position.x = -10;
        centerCan.position.x = 0;
        centerCan.visible = true;
      }

      const t = self.progress;
      const easedT = gsap.utils.interpolate(
        0,
        1,
        gsap.parseEase("power2.inOut")(t)
      );

      const dropStart = 0.9;
      let dropT = 0;
      const rotateEnd = dropStart;

      const totalSpins = 1.5;
      let rotationY = 0;
      if (t < rotateEnd) {
        const rotateT = t / rotateEnd;
        const easedRotateT = gsap.parseEase("power3.inOut")(rotateT);
        rotationY = (Math.PI * 2 * totalSpins * easedRotateT) % (Math.PI * 2);
        centerCan.rotation.set(0, rotationY, 0);
      } else {
        centerCan.rotation.set(0, 0, 0);
      }

      if (t > dropStart) {
        const normalizedT = (t - dropStart) / (1 - dropStart);
        const fastT = Math.min(normalizedT * 2, 1);
        dropT = gsap.parseEase("power4.in")(fastT);
      }

      if (isMobile) {
        centerCan.position.y = gsap.utils.interpolate(-0.7, -0.8, dropT);
      } else centerCan.position.y = gsap.utils.interpolate(-1, -1.1, dropT);

      const appearStart = 0.7;
      let earlyT = 0;
      if (t > appearStart) {
        leftCan.visible = true;
        rightCan.visible = true;
        const localT = (t - appearStart) / (1 - appearStart);
        earlyT = gsap.parseEase("power3.out")(Math.min(localT, 1));
      } else {
        leftCan.visible = false;
        rightCan.visible = false;
      }

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
      if (leftCan && rightCan) {
        leftCan.position.set(-7, isMobile ? -0.7 : -1, 0);
        rightCan.position.set(7, isMobile ? -0.7 : -1, 0);
        centerCan.position.set(0, isMobile ? -0.7 : -1, 0);
        leftCan.rotation.set(0, 0, 0);
        centerCan.rotation.set(0, 0, 0);
        rightCan.rotation.set(0, 0, 0);
        centerCan.rotation.set(0, 0, 0);
        leftCan.visible = true;
        rightCan.visible = true;

        initialCan.position.set(0, isMobile ? -0.7 : -1, 0);
        initialCan.visible = true;
      }
    },
  });

  if (isMobile) {
    ScrollTrigger.create({
      trigger: ".poppy-section",
      start: "top 1%",
      end: () => {
        const section = document.querySelector(".poppy-section");
        return `+=${section.offsetHeight * 0.2}`;
      },
      scrub: true,
      onUpdate: (self) => {
        const t = self.progress;

        if (leftCan && rightCan && centerCan) {
          if (isMobile) {
            leftCan.position.y = -0.7;
            rightCan.position.y = -0.7;
          } else {
            leftCan.position.y = -1;
            rightCan.position.y = -1;
          }
          if (t > 0.2) {
            centerCan.visible = false;
          } else {
            centerCan.visible = true;
          }
        }
      },
      onLeave: () => {},
      onEnterBack: () => {
        leftCan.visible = true;
        rightCan.visible = true;
        centerCan.visible = true;
      },
    });
  }

  ScrollTrigger.create({
    trigger: ".poppy-section",
    start: "top top",
    end: "top top-=1",
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

gsap.ticker.lagSmoothing(500, 33);

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").innerHTML = `
    <div class="intro-screen">
      <div class="logo-container">
        <img src="https://donchico.s3.eu-north-1.amazonaws.com/donchicoredlogo_uzs2if.png" class="main-logo shimmer" />
        <div class="flavors-row">
          <div class="flavor-circle">
            <img src="https://donchico.s3.eu-north-1.amazonaws.com/11_1_cukhbe.png" class="flavor-img shimmer" />
          </div>
          <div class="flavor-circle">
            <img src="https://donchico.s3.eu-north-1.amazonaws.com/37_1_vb6ngi.png" class="flavor-img shimmer" />
          </div>
          <div class="flavor-circle">
            <img src="https://donchico.s3.eu-north-1.amazonaws.com/2_2_1_lapjn0.png" class="flavor-img shimmer" />
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
              src="https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-06-30_at_2.04.26_PM-removebg-preview_1_fb01a6.png"
              alt="Main Logo"
            />
          </div>
          <div class="badges">
            <img
              class="badges-img"
              src="https://donchico.s3.eu-north-1.amazonaws.com/6_1_3_ydfa44.png"
              alt="Badge 1"
            />
            <img
              class="badges-img"
              src="https://donchico.s3.eu-north-1.amazonaws.com/6_1_1_erur0t.png"
              alt="Badge 2"
            />
            <img
              class="badges-img"
              src="https://donchico.s3.eu-north-1.amazonaws.com/6_1_2_xgycog.png"
              alt="Badge 3"
            />
          </div>
        </div>
        <p class="hero-desc">
          The fizzy world of soda had surrendered to the ordinary- Until Don Chico stepped in.
          A legend. A rebel. A mastermind of flavour.
        </p>
        <button class="soda-btn" onclick="window.open('https://www.drinkdonchico.com/collections/all', '_blank')">
          Shop Now
        </button>
      </div>
      <div class="bubble-wrapper">
        <img class="bubble-1" src="https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-06-30_at_2.23.57_PM-removebg-preview_1_yz6e5n.png" />
        <img class="bubble-2" src="https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-06-30_at_2.24.02_PM-removebg-preview_1_ttdgew.png" />
        <img class="bubble-3" src="https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-06-30_at_2.24.06_PM-removebg-preview_1_q46g4b.png" />
      </div>
    </section>
    <section class="hero">
      <div class="can-group-hero">
        <img class="can " key='left' src='https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-07-06_at_6.33.09_PM-removebg-preview_uw2zo2.png' />
        <img class="can " key='center' src='https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-07-06_at_6.33.09_PM-removebg-preview_uw2zo2.png' />
        <img class="can " key='right' src='https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-07-06_at_6.33.09_PM-removebg-preview_uw2zo2.png' />
      </div>
    </section>
    <section class="custom-border-section">
      <div class="background-image-layer">
        <img id="bg-image" src="https://donchico.s3.eu-north-1.amazonaws.com/2_1_qc6ltq.png" alt="" />
      </div>
      <div class="fruit-container">
        <div class="fruit-zone fruit-1-img">
          <img
            class="fruit-img fruit-1"
            src="https://donchico.s3.eu-north-1.amazonaws.com/2_2_1_lapjn0.png"
          />
          <div class="fruit-text text-0">
            <p class="fruit-label-text">Watermelon Sorbet</p>
            <p class="fruit-para">
              It’s a chilled rebellion against boring.
              A summer stunner with a minty twist.
            </p>
          </div>
        </div>
        <div class="fruit-zone fruit-2-img">
          <img
            class="fruit-img fruit-2"
            src="https://donchico.s3.eu-north-1.amazonaws.com/Don_Chicos_Website_1_-removebg-preview_eoaxqi.webp"
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
            src="https://donchico.s3.eu-north-1.amazonaws.com/Don_Chicos_Website_2_-removebg-preview_hss1cg.webp"
          />
          <div class="fruit-text text-2">
            <p class="fruit-label-text">AppleCot Relish</p>
            <p class="fruit-para">Half apple, half apricot, fully addictive.</p>
          </div>
        </div>
      </div>

      <div class="custom-footer">
    <img class="footer-element-1" src="https://donchico.s3.eu-north-1.amazonaws.com/6_1_3_ydfa44.png" alt="Footer Image 1" />
    <img class="footer-element-2" src="https://donchico.s3.eu-north-1.amazonaws.com/6_1_2_xgycog.png" alt="Footer Image 2" />
    <img class="footer-element-3" src="https://donchico.s3.eu-north-1.amazonaws.com/6_1_1_erur0t.png" alt="Footer Image 3" />
  </div>
    </section>
    <section class="poppy-section" id="poppy-section"></section>
    <div id="dom-explosion-container"></div>
    <section class="can-hero-section">
      <div class="can-text"></div>
      <div class="can-group">
        <div>
          <img
            onclick="window.open('https://www.drinkdonchico.com/products/strawberry-cream', '_blank')"
            src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751808316/Screenshot_2025-07-06_at_6.52.44_PM__2_-removebg-preview_m5alhr.png"
            alt="Strawberry Cream"
            class="can can-left"
            data-flavor="Strawberry Cream"
            data-color="#ee6876"
            data-darker-color="#c06a23"
            data-text="Berry bold and bubbly. Strawberry Cream brings the sweet punch you crave."
            data-btn="Buy Strawberry Cream"
            data-bgimg="https://donchico.s3.eu-north-1.amazonaws.com/3_1_hajus7.png"
          />
          <p class="flav-text text-0">Strawberry Cream</p>
          <button class="soda-btn" onclick="window.open('https://www.drinkdonchico.com/products/strawberry-cream', '_blank')">
            + 6 Pack
          </button>
        </div>
        <div>
          <img
            onclick="window.open('https://www.drinkdonchico.com/products/applecot-relish', '_blank')"
            src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751808426/Screenshot_2025-07-06_at_6.46.44_PM-removebg-preview_dbjqac.png"
            alt="Applecot Relish"
            class="can can-right"
            data-flavor="Applecot Relish"
            data-color="#F4812C"
            data-darker-color="#d0485c"
            data-text="Cool, calm, and delicious. Applecot Relish's got that mellow magic."
            data-btn="Buy Applecot Relish"
            data-bgimg="https://donchico.s3.eu-north-1.amazonaws.com/4_3_byfiaa.png"
          />
          <p class="flav-text text-1">Applecot Relish</p>
          <button class="soda-btn" onclick="window.open('https://www.drinkdonchico.com/products/applecot-relish', '_blank')">
            + 6 Pack
          </button>
        </div>
        <div>
          <img
            onclick="window.open('https://www.drinkdonchico.com/products/watermelon-sorbet', '_blank')"
            src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751807943/Screenshot_2025-07-06_at_6.46.49_PM-removebg-preview_vac2f3.png"
            alt="Watermelon Sorbet"
            class="can"
            data-flavor="Watermelon Sorbet"
            data-color="#4BAB55"
            data-darker-color="#3a8a41"
            data-text="Zesty, juicy, and refreshingly wild. Watermelon Sorbet is here to wake you up."
            data-btn="Buy Watermelon Sorbet"
            data-bgimg="https://donchico.s3.eu-north-1.amazonaws.com/2_1_qc6ltq.png"
          />
          <p class="flav-text text-2">Watermelon Sorbet</p>
          <button class="soda-btn" onclick="window.open('https://www.drinkdonchico.com/products/watermelon-sorbet', '_blank')">
            + 6 Pack
          </button>
        </div>
      </div>
    </section>
    <section class="mobile-can-ui">
      <div class="top-bar">
        <img class="brand" src="https://donchico.s3.eu-north-1.amazonaws.com/IMG_4588_1_1_qhx10y.png"/>
      </div>
      <div class="can-display">
        <button class="nav-arrow left">&#10094;</button>
        <img
          class="can-bg right"
          src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751807943/Screenshot_2025-07-06_at_6.46.49_PM-removebg-preview_vac2f3.png"
          id="right-bg-can"
          alt="Right Can"
        />
        <img
          class="can-bg left"
          id="left-bg-can"
          src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751808316/Screenshot_2025-07-06_at_6.52.44_PM__2_-removebg-preview_m5alhr.png"
          alt="Left Can"
        />
        <img
          id="main-can"
          class="main-can"
          src="https://res.cloudinary.com/dt5lkw0vz/image/upload/v1751808426/Screenshot_2025-07-06_at_6.46.44_PM-removebg-preview_dbjqac.png"
          alt="Watermelon Sorbet"
        />
        <button class="nav-arrow right">&#10095;</button>
      </div>
      <div class="flavor-buttons">
        <button class="flavor-btn orange soda-btn" data-index="2" onclick="window.open('https://www.drinkdonchico.com/products/applecot-relish', '_blank')">
          APPLECOT RELISH
        </button>
        <button class="flavor-btn mango soda-btn" data-index="1" onclick="window.open('https://www.drinkdonchico.com/products/watermelon-sorbet', '_blank')">
          WATERMELON SORBET
        </button>
        <button class="flavor-btn soda-btn lemon" data-index="0" onclick="window.open('https://www.drinkdonchico.com/products/strawberry-cream', '_blank')">
          STRAWBERRY CREAM
        </button>
      </div>
    </section>
    <div class="model"></div>
  `;

  // Initialize Three.js and footer animation after DOM is set
  initThreeJS();
  initFooterAnimation();

  const fruits = [
    document.querySelector(".fruit-1"),
    document.querySelector(".fruit-2"),
    document.querySelector(".fruit-3"),
  ];

  let currentFruitIndex = -1;
  let lastDirection = 1;

  function showFruit(index) {
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

  setupScrollAnimations(() => {});
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

    mainCan.classList.add("fade-out");
    setTimeout(() => {
      mainCan.src = flavors[index].src;
      mainCan.classList.remove("fade-out");
      mainCan.classList.add("fade-in");
    }, 150);

    setTimeout(() => mainCan.classList.remove("fade-in"), 300);

    leftBgCan.src = flavors[(index - 1 + flavors.length) % flavors.length].src;
    rightBgCan.src = flavors[(index + 1) % flavors.length].src;

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
      const color = can.dataset.color;
      const darkerColor = can.dataset.darkerColor;
      const flavor = can.dataset.flavor;
      const text = can.dataset.text;
      const btnText = can.dataset.btn;

      const bgImg = can.dataset.bgimg;
      section.style.backgroundImage = `url(${bgImg})`;
      title.textContent = flavor;
      desc.textContent = text;

      btnRow.innerHTML = `
        <button class="soda-btn" style="background: linear-gradient(145deg, ${color}, ${darkerColor});">
          ${btnText}
        </button>
      `;

      can.classList.add("hovered");
    });

    can.addEventListener("mouseleave", () => {
      title.textContent = defaultState.title;
      desc.textContent = defaultState.desc;
      btnRow.innerHTML = defaultState.buttons;

      cans.forEach((c) => c.classList.remove("hovered"));
    });
  });

  ScrollTrigger.create({
    trigger: ".can-hero-section",
    start: "top bottom",
    end: "top top",
    onEnter: () => {
      requestAnimationFrame(() => {
        const poppy = document.querySelector(".poppy-section");
        poppy.style.position = "absolute";
        poppy.style.top = "-100vh";
        poppy.style.left = "0";
        poppy.style.width = "100%";
        poppy.style.zIndex = "-1";
      });
    },
    onLeaveBack: () => {
      const poppy = document.querySelector(".poppy-section");
      poppy.style.position = "relative";
      poppy.style.top = "0";
    },
  });
});

let lastBubbleTime = 0;
const bubbleInterval = 150;

document.addEventListener("mousemove", (e) => {
  const now = Date.now();
  if (now - lastBubbleTime < bubbleInterval) return;
  lastBubbleTime = now;

  const bubble = document.createElement("img");
  bubble.src =
    "https://donchico.s3.eu-north-1.amazonaws.com/de7b6738e9c3be8feb23abc4b1116b8d-removebg-preview_1_h5zpws.png";
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
  reviewSection();
  socialsSection();

  const footer = document.createElement("footer");
  footer.className = "donchico-footer";
  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-column">
        <h3>The World of Don Chico’s</h3>
        <ul>
          <li><a href="https://www.drinkdonchico.com/collections/all" target="_blank" rel="noopener noreferrer">Shop Don Chico's</a></li>
          <li><a href="https://www.drinkdonchico.com/pages/our-story" target="_blank" rel="noopener noreferrer">About Us</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h3>Legal</h3>
        <ul>
          <li><a href="https://www.drinkdonchico.com/policies/terms-of-service" target="_blank" rel="noopener noreferrer">Terms & Conditions</a></li>
          <li><a href="https://www.drinkdonchico.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
          <li><a href="https://www.drinkdonchico.com/policies/shipping-policy" target="_blank" rel="noopener noreferrer">Shipping</a></li>
          <li><a href="https://www.drinkdonchico.com/policies/refund-policy" target="_blank" rel="noopener noreferrer">Returns & Refunds</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h3>Say Hola!</h3>
        <ul>
          <li><a href="https://www.drinkdonchico.com/pages/contact" target="_blank" rel="noopener noreferrer">Contact Us</a></li>
          <li><a href="https://www.instagram.com/drinkdonchico/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-socials">
      <a href="https://www.facebook.com/drinkdonchico" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook-f"></i></a>
      <a href="https://www.instagram.com/drinkdonchico/" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i></a>
    </div>
  `;

  document.querySelector("#app").appendChild(footer);
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

  const image = document.createElement("img");
  image.src =
    "https://donchico.s3.eu-north-1.amazonaws.com/IMG_7339_1_z1aot3.png";
  image.alt = "Extra image";
  image.style.height = "60vh";
  image.style.paddingBottom = "5vh";
  image.classList.add("assorted-class");

  const paragraph = document.createElement("p");
  paragraph.textContent = "Don’s Assorted Pack of 6";
  paragraph.classList.add("assorted");

  const button = document.createElement("button");
  button.textContent = "+ 6 Pack";
  button.classList.add("soda-btn");

  button.addEventListener("click", () => {
    window.open(
      "https://www.drinkdonchico.com/products/don-chicos-sodas-with-benefit-assorted-pack-of-6",
      "_blank"
    );
  });

  image.addEventListener("click", () => {
    window.open(
      "https://www.drinkdonchico.com/products/don-chicos-sodas-with-benefit-assorted-pack-of-6",
      "_blank"
    );
  });

  wrapper.appendChild(image);
  wrapper.appendChild(paragraph);
  wrapper.appendChild(button);

  container.appendChild(wrapper);

  console.log(
    "%c👋 Website crafted with love by Vedant Dubey\n📧 Contact: vedant.db99@gmail.com",
    "color: #fff; background: #ff4d4d; padding: 8px 16px; font-size: 14px; font-family: monospace; border-radius: 4px;"
  );
});

let hasScrolledOnce = false;

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const scrollHeight = document.body.scrollHeight;
  const clientHeight = window.innerHeight;
  const scrollBottom = scrollTop + clientHeight;

  if (!hasScrolledOnce && scrollTop > 10) {
    hasScrolledOnce = true;
    parent.postMessage({ type: "expandIframe" }, "*");
  }

  if (scrollBottom >= scrollHeight - 10) {
    parent.postMessage({ type: "showBottom" }, "*");
  }

  if (scrollTop <= 10) {
    parent.postMessage({ type: "showHeader" }, "*");
  }
});
