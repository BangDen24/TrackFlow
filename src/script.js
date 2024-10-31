import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sky } from "three/examples/jsm/Addons.js";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import ScrollSmoother from "gsap/dist/ScrollSmoother";
import SplitText from "gsap/dist/SplitText";

const canvas = document.querySelector("canvas.webgl");
const greetings = document.querySelector(".Greetings");
// const desc = document.querySelector(".Description");
// const author = document.querySelector(".author");
// const para = document.querySelectorAll(".para");

/**
 * Base
 */
// Debug
// const gui = new GUI();

// Canvas

// Scene
const scene = new THREE.Scene();

//device pixel ratio

/**
 * Models
 */

// Loader
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// House
gltfLoader.load("./models/house/TrackFlow.glb", (gltf) => {
  scene.add(gltf.scene);
  scene.castShadow = true;
  scene.receiveShadow = true;
});

// Sky
const sky = new Sky();
sky.scale.set(50, 50, 50);
scene.add(sky);

sky.material.uniforms["turbidity"].value = 10;
sky.material.uniforms["rayleigh"].value = 3;
sky.material.uniforms["mieCoefficient"].value = 0.1;
sky.material.uniforms["mieDirectionalG"].value = 0.95;

//fog
scene.fog = new THREE.FogExp2("white", 0.0625, 10, 50);

// Land
const land = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50, 100, 100),
  new THREE.MeshStandardMaterial({
    color: "white",
  })
);

// const sphere = new THREE.Mesh(
//   new THREE.SphereGeometry(0.5, 32, 32),
//   new THREE.MeshBasicMaterial({
//     color: "green",
//   })
// );

// scene.add(sphere);

const sphereOffset = 0.1;

land.rotation.x = -Math.PI / 2;
land.position.y = -0.25;
land.receiveShadow = true;
land.castShadow = true;

scene.add(land);

// const object = new THREE.Mesh( 10, 10, 10);
//   new THREE.SphereGeometry()
// )

/**
 * Lights
 */

const sunPosition = new THREE.Vector3(20, 20, 20);
sky.material.uniforms["sunPosition"].value.copy(sunPosition);

const sunLight = new THREE.DirectionalLight("white", 1); // White sunlight
sunLight.position.copy(sunPosition);
sunLight.castShadow = true;

sunLight.shadow.mapSize.width = 1024; // Higher resolution shadows
sunLight.shadow.mapSize.height = 1024;

scene.add(sunLight);

const godRayLight = new THREE.SpotLight("orange", 5);
godRayLight.position.set(11.36, 1.47, 1.05);
godRayLight.rotation.y = Math.PI;
godRayLight.castShadow = true;

godRayLight.shadow.mapSize.width = 2048;
godRayLight.shadow.mapSize.height = 2048;

godRayLight.distance = 30;
godRayLight.angle = Math.PI / 4;
godRayLight.penumbra = 0.5;
godRayLight.decay = 2;

scene.add(godRayLight);

// const grayHelper = new THREE.SpotLightHelper(godRayLight)
// scene.add(grayHelper)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
scene.add(camera);

// const cameraFolder = gui.addFolder("Camera Position");
// cameraFolder.add(camera.position, "x").name("X Axis").listen();
// cameraFolder.add(camera.position, "y").name("Y Axis").listen();
// cameraFolder.add(camera.position, "z").name("Z Axis").listen();
// cameraFolder.open();

/**
 * Path Logic
 */
let curvePath;
let targetProgress = 0;
let currentProgress = 0;
const scrollSpeed = 0.015;
const smoothFactor = 0.015;

// Load curve path from JSON
fetch("./models/house/curvePath.json")
  .then((response) => response.json())
  .then((data) => {
    const points = data.points.map(
      (titik) => new THREE.Vector3(titik.x, titik.y, titik.z)
    );

    const reversedPoints = points.reverse();
    curvePath = new THREE.CatmullRomCurve3(reversedPoints);

    // Optional: Visualisasi path dengan TubeGeometry
    const geometry = new THREE.TubeGeometry(curvePath, 100, 0.1, 8, false);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
    });
    const tube = new THREE.Mesh(geometry, material);
    // scene.add(tube);
  });

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Mouse Scroll Control
 */
// window.addEventListener("wheel", (event) => {
//   if (event.deltaY < 0) {
//     targetProgress = Math.max(targetProgress - scrollSpeed, 0);
//   } else {
//     targetProgress = Math.min(targetProgress + scrollSpeed, 1);
//   }
// });

window.addEventListener("scroll", (event) => {
  const scrollTop = window.scrollY;

  const maxScroll = document.body.scrollHeight - window.innerHeight;
  targetProgress = scrollTop / maxScroll;

  targetProgress = Math.max(0, Math.min(targetProgress, 1));
});

/**
 * Animate
 */

const clock = new THREE.Clock();
let previousTime = 0;

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const smoother = ScrollSmoother.create({
  wrapper: ".scroll-wrapper",
  content: ".scroll-container",
  smooth: 5,
  effects: true,
  // normalizeScroll: true,
});

const splitGreetings = new SplitText(".Greetings", { type: "words,chars" });
const splitDesc = new SplitText(".Description", { type: "words,chars,lines" });
const splitAuthor = new SplitText(".author", { type: "words,chars" });
const splitPara = new SplitText(".para", { type: "words,chars" });

gsap.fromTo(
  ".Greetings",
  {
    opacity: 1,
    z: 0,
  },
  {
    z: 600,
    rotation: 0.01,
    y: "+=700",
    duration: 0.5,
    scrollTrigger: {
      trigger: ".content-section-1",
      start: "top top",
      end: "bottom center+=300",
      // markers: true,
      scrub: 1,
      toggleActions: "play none play reverse",
      // pin: true,
    },
  }
);

// Animasi untuk Description
gsap.fromTo(
  ".Description",
  {
    y: 0,
    opacity: 0,
    z: 0,
  },
  {
    opacity: 1,
    z: 500,
    y: "+=700",
    rotation: 0.01,
    duration: 2,
    stagger: 0.05,
    scrollTrigger: {
      onEnter: () => {
        gsap.fromTo(
          splitDesc.words,
          {
            opacity: 0,
            y: -100,
          },
          {
            opacity: 1,
            y: 0,
            rotation: 0.01,
            duration: 1,
            stagger: 0.05,
            scrollTrigger: {
              trigger: ".content-section-2",
              start: "top center",
              end: "bottom center",
              toggleActions: "play recverse play reverse",
            },
          }
        );
      },
      trigger: ".content-section-2",
      start: "top center-=100",
      end: "bottom top",
      scrub: 1,
      markers: true,
      toggleActions: "play none none reverse",
    },
  }
);

// Animasi untuk Author
// gsap.fromTo(
//   ".author",
//   {
//     opacity: 1,
//     z: 0,
//   },
//   {
//     opacity: 1,
//     z: 500,
//     duration: 2,
//     scrollTrigger: {
//       trigger: ".content-section-3",
//       start: "top-=300 bottom",
//       end: "bottom center",
//       scrub: 1,
//       markers: true,
//       toggleActions: "play none none reverse",
//     },
//   }
// );

gsap.fromTo(
  ".author",
  {
    opacity: 0,
    z: 0,
  },
  {
    opacity: 1,
    z: 700,
    rotation: 0.01,
    y: "+=600",
    x:"-=300",
    duration: 1,
    scrollTrigger: {
      onEnter: () => {
        gsap.fromTo(
          splitAuthor.words,
          {
            opacity: 0,
            y: -100,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            stagger: 0.05,
            scrollTrigger: {
              trigger: ".content-section-3",
              start: "top center",
              end: "bottom center",
              toggleActions: "play none none reverse",
            },
          }
        );
      },
      trigger: ".content-section-3",
      start: "top center+=300",
      end: "bottom top+=200",
      scrub: 1,
      // markers: true,
      toggleActions: "play none none reverse",
    },
  }
);

// Animasi untuk Para
gsap.fromTo(
  ".para",
  {
    opacity: 0,
    z: -100,
  },
  {
    opacity: 1,
    z: 450,
    y: 0,
    rotation: 0.01,
    duration: 1.5,
    scrollTrigger: {
      onEnter: () => {
        gsap.fromTo(
          splitPara.words,
          {
            opacity: 0,
            y: -100,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            scrollTrigger: {
              trigger: ".content-section-4",
              start: "top center",
              end: "bottom center",
              toggleActions: "play none none reverse",
            },
          }
        );
      },
      trigger: ".content-section-4",
      start: "top bottom-=500",
      end: "bottom top+=50",
      scrub: 1,
      toggleActions: "play none none reverse",
    },
  }
);

// Animasi untuk Para
// gsap.fromTo(
//   ".para",
//   {
//     opacity: 0,
//     z: -100,
//   },
//   {
//     opacity: 1,
//     z: 450,
//     // duration: 2,
//     scrollTrigger: {
//       trigger: ".content-section-4",
//       start: "top bottom-=500",
//       end: "bottom top+=50",
//       // markers:true,
//       scrub: 1,
//       toggleActions: "play none none reverse",
//     },
//   }
// );

const cameraHelper = new THREE.CameraHelper(camera);
// scene.add(cameraHelper)

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  currentProgress += (targetProgress - currentProgress) * smoothFactor;

  if (curvePath) {
    const position = curvePath.getPointAt(currentProgress);
    const lookAtPoint = curvePath.getPointAt(
      Math.min(currentProgress + 0.075, 1)
    );
    camera.position.copy(position);
    camera.lookAt(lookAtPoint);
  }

  // if (currentProgress >= 0.3 && currentProgress <= 0.5) {
  //   showGreetings();
  // }

  // if (currentProgress <= 0.2 ) {
  //   gsap.to(greetings, {
  //     opacity: 0,
  //     duration: 1, // Durasi menghilang
  //   });
  // }

  cameraHelper.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
