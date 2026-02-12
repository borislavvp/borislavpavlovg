<template>
  <div ref="container" class="room-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import * as THREE from "three"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
const clock = new THREE.Clock();
let scene, camera, renderer, animationId, flyingChair, workoutMixer, readingMixer
let floor, leftWall, rightWall, frontWall, backWall, currentAction
const spiralConfig = {
  speed1: 11.0,          // speed of first spiral
  speed2: 2.0,          // speed of second spiral
  freq1: 1.0,          // frequency of first spiral
  freq2: 9.0,          // frequency of second spiral
  twist1: 5.0,          // angular twist of first spiral
  twist2: 22.0,         // angular twist of second spiral
  blackHoleRadius: 3.25,// radius of black hole at center
  cutHeight: 1.5        // max wall height for spiral
}
const tornadoConfig = {
  numLines: 100,
  speed: 1.0,
  radius: 0.6,
  height: 6.5
}

const container = ref(null)
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader()
const fbxLoader = new FBXLoader()

const tornadoItems = [];

const qrTexture = textureLoader.load('/textures/qr.png')
qrTexture.wrapS = THREE.RepeatWrapping
qrTexture.wrapT = THREE.RepeatWrapping
qrTexture.repeat.set(8, 8) // controls how many QR codes appear

const qrMaterial = new THREE.MeshBasicMaterial({
  map: qrTexture
})

function loadCharacter() {
  fbxLoader.load("/character/person3.fbx", (character) => {
    
    const baseMap = textureLoader.load('/textures/suit.png')
    const qrTexture = textureLoader.load('/textures/qr.png')
    qrTexture.wrapS = THREE.RepeatWrapping
    qrTexture.wrapT = THREE.RepeatWrapping
    qrTexture.repeat.set(8, 8) // controls how many QR codes appear

    const qrMaterial = new THREE.MeshBasicMaterial({
      map: qrTexture
    })

    character.scale.setScalar(0.028);       // tweak to make it big enough
    character.position.set(-1.8, -2.8, -4);       // center
    // character.rotation.y += 0.5 ; 
    console.log(character);       // face camera

    // Make sure all meshes are visible
    character.traverse((obj) => {
      if (obj.isBone) {
         obj.name = obj.name.replace("mixamorig7","mixamorig8")
      }
      if(obj.isMesh && obj.name.includes("Shirt")) {
        obj.material = qrMaterial
      }
      if(obj.isMesh && obj.name.includes("Body")) {
        obj.material = qrMaterial
      }
    });

    scene.add(character);
    console.log('Reading character loaded:', character);
    // pushUpCharacter = character
    fbxLoader.load('/character/sitting3.fbx', (anim) => {
            readingMixer = new THREE.AnimationMixer(character);
            // Play all clips in the animation file
            anim.animations.forEach((clip) => {
                const action = readingMixer.clipAction(clip);
                action.play();
                action.setLoop(THREE.LoopRepeat); // Loop the animation
            });
        });
  })
}


// Helper: add a new mesh with random orbiting & spinning properties
function addTornadoItem(mesh) {
  const item = {
    mesh,
    // Radius: varies between base ± amp
    baseRadius: 0.1 + Math.random() * 0.001,
    radiusAmp: 0.4 + Math.random() * 0.8,
    radiusFreq: 0.2 + Math.random() * 0.6,
    // Height: varies between base ± amp
    baseHeight: 0.9 + Math.random() * 1.2,
    heightAmp: 0.2 + Math.random() * 0.6,
    heightFreq: 0.3 + Math.random() * 0.7,
    // Speed: varies between base ± amp
    baseSpeed: 0.05 + Math.random() * 0.1, 
    speedAmp: 0.05 + Math.random() * 0.415,
    speedFreq: 0.1 + Math.random() * 0.4,
    // Spin
    spinSpeed: 0.2 ,
    spinFreq: 0.2 + Math.random() /0.5,
    spinAxisSeed: Math.random() * 100,
    // Starting angle
    angleOffset: Math.random() * Math.PI * 2
  };
  tornadoItems.push(item);
}

function loadItem(itemName, scalar=1){
    loader.load(`/items/${itemName}.glb`, (gltf) => {
    const rep = Math.random()*10 
    qrTexture.repeat.set(rep, rep+1)
    const item = gltf.scene
    item.scale.setScalar(scalar)
    item.position.set(0, 0, 0)
    item.traverse((child) => {
      if (child.isMesh) {
        child.material = qrMaterial
      }
    })
    addTornadoItem(item);
    scene.add(item);    
  });
}

let sheepMixer = null
function loadSheepItem(scalar=1){
   loader.load(`/items/sheep3.glb`, (gltf) => {
    const item = gltf.scene
    
      item.scale.setScalar(scalar)
      item.position.set(0, 0, 0)
      item.traverse((child) => {
        if (child.isMesh) {
          child.material = qrMaterial
        }
      })
      sheepMixer = new THREE.AnimationMixer(item);
      gltf.animations.forEach((clip) => {
        const action = sheepMixer.clipAction(clip);
        // action.play(); 
      });
      addTornadoItem(item);
      scene.add(item);    
  });
}


function loadNewspaper(){
  const frontTex = textureLoader.load('/textures/newspaper.png');
  const backTex  = textureLoader.load('/textures/newspaper-back.png');

  frontTex.colorSpace = THREE.SRGBColorSpace;
  backTex.colorSpace  = THREE.SRGBColorSpace;
  const paperMaterial = new THREE.ShaderMaterial({
    uniforms: {
      frontMap: { value: frontTex },
      backMap:  { value: backTex }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D frontMap;
      uniform sampler2D backMap;
      varying vec2 vUv;

      void main() {
        if (gl_FrontFacing) {
          gl_FragColor = texture2D(frontMap, vUv);
        } else {
          gl_FragColor = texture2D(backMap, vec2(1.0 - vUv.x, vUv.y));
        }
      }
    `,
    side: THREE.DoubleSide
  });
  loader.load("/newspaper42.glb", (gltf) => {
    const char = gltf.scene
    
      char.traverse((child) => {
        if (child.isMesh) {
          child.material = paperMaterial;
        }
      })

      char.scale.setScalar(0.9)
      char.position.set(-1.8, -0.9, -4.4)   
      // char.rotation.y = Math.PI /2 
      char.rotation.x -= 0.5
      console.log("char", char); 
      scene.add(char);      // face camera
  });
  loader.load("/character/chair.glb", (gltf) => {
    const char = gltf.scene
    
      char.scale.setScalar(0.6)
      char.position.set(-1.8, -2.6, -4)   
      // char.rotation.y = Math.PI /2 
      char.rotation.x -= 0.2
      console.log("char", char); 
      scene.add(char);      // face camera
  });
}


let cameraQueue = []
let activeAction = null
let lastTime = null

// ----- Move to a position while looking at a target (snap look) -----
function moveTo(toPos,duration) {
  return new Promise(resolve => {
    cameraQueue.push({
      type: 'move',
      fromPos: null, // will be set when action starts
      toPos: toPos.clone(),
      toLook: null,
      duration,
      resolve
    })
    startNextAction()
  })
}

// ----- Smoothly look at a target (no position change) -----
function lookAtSmooth(toLook, duration) {
  return new Promise(resolve => {
    cameraQueue.push({
      type: 'look',
      fromLook: null, // will be set when action starts
      toLook: toLook.clone(),
      duration,
      resolve
    })
    startNextAction()
  })
}

// ----- Start the next action in the queue -----
function startNextAction() {
  if (activeAction || cameraQueue.length === 0) return

  const next = cameraQueue.shift()
  activeAction = {
    ...next,
    elapsed: 0
  }

  if (next.type === 'move') {
    activeAction.fromPos = camera.position.clone()
  } else if (next.type === 'look') {
    // Capture current look‑at point in world space
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    activeAction.fromLook = camera.position.clone().add(dir)
  }
}

// ----- Call this EVERY frame inside your main animate() -----
function updateCameraActions(time) {
  if (lastTime === null) {
    lastTime = time
    return
  }

  // 🛡️ Cap delta to 100ms – kills tab‑switch glitches
  const delta = Math.min(time - lastTime, 100)
  lastTime = time

  if (!activeAction) {
    startNextAction()
    if (!activeAction) return
  }

  activeAction.elapsed += delta
  const t = Math.min(activeAction.elapsed / activeAction.duration, 1)
  const eased = t * t * (3 - 2 * t) // smoothstep

  // --- Handle move action ---
  if (activeAction.type === 'move') {
    camera.position.lerpVectors(activeAction.fromPos, activeAction.toPos, eased)
    // camera.lookAt(activeAction.toLook) // immediate look (no interpolation)
  }

  // --- Handle look action ---
  else if (activeAction.type === 'look') {
    const currentLook = new THREE.Vector3().lerpVectors(
      activeAction.fromLook,
      activeAction.toLook,
      eased
    )
    camera.lookAt(currentLook)
  }

  // --- Completion ---
  if (t >= 1) {
    if (activeAction.type === 'move') {
      camera.position.copy(activeAction.toPos)
      // camera.lookAt(activeAction.toLook)
    } else if (activeAction.type === 'look') {
      camera.lookAt(activeAction.toLook)
    }
    activeAction.resolve()
    activeAction = null
  }
}
function startAnimation(){
  camera.position.set(-1.5, 0.6, -6.2)
  camera.lookAt(-2, -2, -3) ////start
  setTimeout(() => {
    moveTo(new THREE.Vector3(-1.8, 1.0, -5.1), 5000)
    .then(() => lookAtSmooth(new THREE.Vector3(-1.3, -2, -3), 2000))
    .then(() =>  moveTo(new THREE.Vector3(-1.2, -0.6, -4.7), 3000))
    .then(() => lookAtSmooth(new THREE.Vector3(-1.2, -0.2, -3), 2000))
    .then(() => lookAtSmooth(new THREE.Vector3(-2.0, -0.2, -3), 5000))
    .then(() => lookAtSmooth(new THREE.Vector3(-1.2, -0.2, -3), 2000))
    .then(() => lookAtSmooth(new THREE.Vector3(-0.7, 1.5, -3), 5000))
    .then(() =>  moveTo(new THREE.Vector3(-1.2, 1, -3.7), 3000))
    .then(() => lookAtSmooth(new THREE.Vector3(1, -3, 1), 20000))
    .then(() =>  moveTo(new THREE.Vector3(-1.2, 1, -1.5), 3000))
    .then(() => lookAtSmooth(new THREE.Vector3(-1.35, 1, -2), 2000)) //
    .then(() => lookAtSmooth(new THREE.Vector3(-1.10, -3, -1.5), 20000))
    .then(() => moveTo(new THREE.Vector3(0, 5, -0.6), 10000))//
    .then(() => lookAtSmooth(new THREE.Vector3(0, 0, 0), 10000))
    .then(() => lookAtSmooth(new THREE.Vector3(-1, -1, -3), 2000))
    .then(() => moveTo(new THREE.Vector3(0, 3, 2), 10000))
    .then(() => lookAtSmooth(new THREE.Vector3(0, 2, 0), 5000))
    .then(() => moveTo(new THREE.Vector3(0, 3, 6), 10000))
  }, 5000);
}

function createRoom() {
  // ----------------------------
  // Scene & Camera
  // ----------------------------
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)
    
  // ----------------------------
  // Room dimensions
  // ----------------------------
  const roomWidth = 6
  const roomDepth = 10
  const wallHeight = 10
  const floorY = -3


  const width = container.value.clientWidth
  const height = container.value.clientHeight

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
  camera.position.set(0, 3, 6)
  camera.lookAt(0, 0, 0) ////test
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.value.appendChild(renderer.domElement)

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.3,  // adjust shadow intensity
    side: THREE.DoubleSide,
  })

  // ----------------------------
  // Floor
  // ----------------------------
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth, 200, 200),
    baseMat
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = floorY

  // ----------------------------
  // Left wall
  // ----------------------------
  leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomDepth, wallHeight, 200, 200),
    baseMat
  )
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.set(-roomWidth / 2, wallHeight / 2 + floorY, 0)

  // ----------------------------
  // Right wall
  // ----------------------------
  rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomDepth, wallHeight, 200, 200),
    baseMat
  )
  rightWall.rotation.y = -Math.PI / 2
  rightWall.position.set(roomWidth / 2, wallHeight / 2 + floorY, 0)

  // ----------------------------
  // Front wall
  // ----------------------------
  frontWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, wallHeight, 200, 200),
    baseMat
  )
  frontWall.position.set(0, wallHeight / 2 + floorY, -roomDepth / 2)

  backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, wallHeight, 200, 200),
    baseMat
  );
  backWall.rotation.y = Math.PI;           // 🔁 face inward
  backWall.position.set(0, wallHeight / 2 + floorY, roomDepth / 2); // no extra offset
  // ----------------------------
  // Spiral Shader
  // ----------------------------
  const bgTexture = textureLoader.load('/textures/bg.jpg', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
  })

  const spiralMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uBackgroundTex: { value: bgTexture },
      uTime: { value: 0 },
      uRoomWidth: { value: roomWidth },
      uRoomDepth: { value: roomDepth },
      uWallHeight: { value: wallHeight },
      uFloorY: { value: floorY },
      uSpeed1: { value: spiralConfig.speed1 },
      uSpeed2: { value: spiralConfig.speed2 },
      uFreq1: { value: spiralConfig.freq1 },
      uFreq2: { value: spiralConfig.freq2 },
      uTwist1: { value: spiralConfig.twist1 },
      uTwist2: { value: spiralConfig.twist2 },
      uBlackHoleRadius: { value: spiralConfig.blackHoleRadius },
      uCutHeight: { value: spiralConfig.cutHeight }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
        uniform sampler2D uBackgroundTex;
        uniform float uTime;
        uniform float uRoomWidth;
        uniform float uRoomDepth;
        uniform float uFloorY;
        uniform float uSpeed1;
        uniform float uSpeed2;
        uniform float uFreq1;
        uniform float uFreq2;
        uniform float uTwist1;
        uniform float uTwist2;
        uniform float uBlackHoleRadius;
        uniform float uCutHeight;

        varying vec3 vWorldPosition;

        void main() {
        vec2 bgUV = vec2(
          (vWorldPosition.x / uRoomWidth) + 0.5,
          (vWorldPosition.y / (uCutHeight))
        );
        vec2 coverUV = bgUV;
        float imageAspect = 900.0 / 600.0;
        float surfaceAspect = 900.0 / 600.0;
        if (surfaceAspect > imageAspect) {
            // surface wider than image → scale Y
            float scale = surfaceAspect / imageAspect;
            coverUV.y = (bgUV.y - 0.5) * scale + 0.5;
        } else {
            // surface taller than image → scale X
            float scale = imageAspect / surfaceAspect;
            coverUV.x = (bgUV.x - 0.5) * scale + 0.5;
        }
        bgUV = clamp(bgUV, 0.0, 1.0);
        vec3 bgColor = texture2D(uBackgroundTex, coverUV).rgb;
        // -----------------------------
        // GLOBAL SPIRAL SPACE
        // -----------------------------
        float h = max(vWorldPosition.y - uFloorY, 0.0);
        // vec3 shiftedPos = vWorldPosition - vec3(0,13.5,0); 
        vec2 radial = vec2(vWorldPosition.x, vWorldPosition.z)+ vec2(0, 1.0);
        float r = length(radial); // center on back wall
        float angle = atan(radial.y, radial.x);
        
        bool isFrontWall = abs(vWorldPosition.z + uRoomDepth * 0.5) < 0.001;

        if (isFrontWall) {
            // rotate polar frame so spiral continues upward
                vec2 floorRadial = vec2(vWorldPosition.x, -uRoomDepth * 0.5);
                angle = atan(floorRadial.y , floorRadial.x ) ;
            } else {
                // angle = atan(radial.y, radial.x);
        }
                    

        float maxDepth = 6.0; // how far “down” the tunnel appears

        vec2 spiralPos = radial;    
        if (r < uBlackHoleRadius) {
            float t = r / uBlackHoleRadius;            // 0 at center, 1 at edge
            float depthFactor = pow(1.0 - t, 2.0); // stronger near center
            float scale = 0.2 + 0.8 * t;         // shrink coordinates near center
            spiralPos *= scale;

            // Optional: add twisting as it goes down
            float twist = depthFactor * 10.0; 
            float s = sin(twist);
            float c = cos(twist);
            spiralPos = vec2(spiralPos.x * c - spiralPos.y * s,
                            spiralPos.x * s + spiralPos.y * c);
        }

        // Compute spiral using warped coordinates
        angle = atan(spiralPos.y, spiralPos.x);

        angle += h * 0.25;
        // vertical progression (used for walls)

        // -----------------------------
        // SPIRAL FIELD (continuous)
        // -----------------------------
        float spiralA = sin(
            uFreq1 * r
            - uTime * uSpeed1
            + uTwist1 * angle
            + h * 1.5          // THIS makes it climb the walls
        );

        float spiralB = cos(
            uFreq2 * r * r
            - uTime * uSpeed2
            + uTwist2 * angle
            + h * 2.5
        );

        float spiral = spiralA + spiralB * 0.5;

        // normalize
        float intensity = spiral * 0.5 + 0.7;
        intensity = spiral*0.5 + 0.7;
        if(r < uBlackHoleRadius) {
            intensity *= 0.2 + 0.8; // darker at center
        }

        bool isFloor = vWorldPosition.y <= uFloorY + 0.01;

        // -----------------------------
        // BLACK HOLE CORE
        // -----------------------------
        
        // float holeMask = pow(1.0 - smoothstep(0.0, uBlackHoleRadius, r), 2.0);
        float rNorm = clamp(r / uBlackHoleRadius, 0.0, 1.0); // normalized radius [0,1]
        float holeMask = pow(rNorm, 1.5);  // 0 at center, 1 at edge
        intensity *= mix(0.0, 1.0, holeMask); // force center dark, edges normal
        
        // float spiralVisible = step(vWorldPosition.y, uFloorY + uCutHeight);
        float spiralVisible = smoothstep(
          uFloorY + uCutHeight + 0.2,
          uFloorY + uCutHeight - 0.2,
          vWorldPosition.y
        );
        if(spiralVisible<0.01){
            intensity = 5.5;
        }

        // -----------------------------
        // HARD HEIGHT CUT (no fade)
        // -----------------------------
        float alpha = step(vWorldPosition.y, uFloorY + uCutHeight);
        float shadow = 1.0;

        // Apply shadows to walls only
        bool isSideWall = !isFloor && abs(vWorldPosition.z + uRoomDepth * 0.5) > 0.01;
        if(isSideWall) {
            float dzFront = abs(vWorldPosition.z + uRoomDepth * 0.5);
            float dxSide = abs(vWorldPosition.x);
            float cornerShadow = smoothstep(0.9, 0.1, dzFront) * smoothstep(0.0, uRoomWidth/3.0, dxSide);
            // shadow *= 1.0 - 0.4 * cornerShadow; // darken up to 50%
        }
        gl_FragColor = vec4(vec3(intensity*shadow), 1.0);
        // vec3 spiralColor = vec3(intensity * shadow);

        // vec3 finalColor = mix(
        //   bgColor,
        //   spiralColor,
        //   spiralVisible
        // );
        // gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    transparent: true
  })
  scene.add(floor)
  scene.add(leftWall)
  scene.add(rightWall)
  scene.add(frontWall)
  scene.add(backWall)
  // Apply shader to all surfaces
  floor.material = spiralMaterial
  leftWall.material = spiralMaterial
  rightWall.material = spiralMaterial
  frontWall.material = spiralMaterial
  backWall.material = spiralMaterial

   // Create initial tornado cables
  createCableTornado(roomWidth, roomDepth, wallHeight, floorY)
  loadCharacter()
  loadNewspaper()
  
  loadItem("chair", 0.8)
  // loadItem("ball", 0.01)
  // loadItem("egg", 0.01)
  // loadItem("egg", 0.01)
  // loadItem("egg", 0.01)
  // loadItem("egg_cover", 2.04)
  loadItem("polaroid", 0.01)
  loadItem("frame", 0.09)
  loadItem("shoe", 0.02)
  loadItem("shoe", 0.02)
  // loadItem("cake", 0.13)
  loadItem("table", 0.13)
  loadItem("baloon", 0.23)
  loadItem("umbrella", 0.1)
  loadItem("flowers", 1)
  loadSheepItem(1.5)

  setTimeout(() => {
    startAnimation();
  }, 20000);
}

function createCableTornado(roomWidth, roomDepth, wallHeight, floorY) {
  const cableCount = tornadoConfig.numLines
  const segments = 60
  const tornadoHeight = tornadoConfig.height
  const baseRadius = tornadoConfig.radius
  const topRadius = 0.05 // never zero
  const cableMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 2
  })

  for (let i = 0; i < cableCount; i++) {
    const positions = new Float32Array((segments + 1) * 3)
    const startAngle = (i / cableCount) * Math.PI * 2
    const speedVariation = 0.3 + Math.random() * 0.5

    for (let j = 0; j <= segments; j++) {
      let t = j / segments
      t = Math.min(Math.max(t, 0.0), 1.0)

    const y = floorY + tornadoHeight - t * tornadoHeight
    //   const y = floorY + t * tornadoHeight
      const radius = baseRadius * (1 - t) + topRadius
      const angle = startAngle + t * Math.PI * 6 // 3 turns

      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue

      const idx = j * 3
      positions[idx] = x
      positions[idx + 1] = y
      positions[idx + 2] = z
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.computeBoundingSphere() // now safe
    const cable = new THREE.Line(geometry, cableMaterial)
    cable.userData = { startAngle, speed: speedVariation }
    // cable.position.y -= 1.0
    cable.position.z -= 1.0
    // cable.scale.y = -1
    scene.add(cable)
  }

  // Central swirling cable
  const centralSegments = 50
  const centralPositions = new Float32Array((centralSegments + 1) * 3)
  for (let i = 0; i <= centralSegments; i++) {
    let t = i / centralSegments
    t = Math.min(Math.max(t, 0.0), 1.0)
    const y = floorY + tornadoHeight - t * tornadoHeight

    // const y = floorY + t * tornadoHeight
    const radius = 0.05
    const angle = t * Math.PI * 8

    const x = Math.sin(angle * 1.3) * radius
    const z = Math.cos(angle * 1.1) * radius

    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue

    const idx = i * 3
    centralPositions[idx] = x
    centralPositions[idx + 1] = y 
    centralPositions[idx + 2] = z
  }

  const centralGeometry = new THREE.BufferGeometry()
  centralGeometry.setAttribute("position", new THREE.BufferAttribute(centralPositions, 3))
  centralGeometry.computeBoundingSphere()

  const centralCable = new THREE.Line(
    centralGeometry,
    new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 })
  )
  centralCable.userData = { speed: 0.6 }
    // centralCable.scale.y = -1
  // centralCable.position.y += 1.0
  centralCable.position.z -= 1.0
  scene.add(centralCable)
}

// ----------------------------
// Animation tweak for tornado
// ----------------------------
function animate(time) {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta();
  const elapsedTime = time * 0.001
  // Spiral update
  updateCameraActions(time)
  if(sheepMixer) sheepMixer.update(0.03)
  if (floor) floor.material.uniforms.uTime.value = elapsedTime
  if (readingMixer) readingMixer.update(0.03) 
  // Animate cables
  scene.children.forEach(child => {
    if (child.isLine && child.userData) {
      const positions = child.geometry.attributes.position.array
      const segments = positions.length / 3 - 1
      for (let i = 0; i <= segments; i++) {
        const idx = i * 3
        const t = i / segments
        const y = positions[idx + 1]
        const speed = child.userData.speed || 0.5
        const radius = 1.5 * (1 - t) + 0.1
        const baseAngle = (child.userData.startAngle || 0) + t * Math.PI * 6
        const wiggle = Math.sin(elapsedTime * 2 + t * Math.PI * 3) * 0.05
        positions[idx] = Math.cos(baseAngle + elapsedTime * speed) * radius + wiggle
        positions[idx + 2] = Math.sin(baseAngle + elapsedTime * speed) * radius + wiggle
      }
      child.geometry.attributes.position.needsUpdate = true
    } 
  })
  tornadoItems.forEach(item => {
    const t = elapsedTime;

    // Smoothly varying orbit radius
    const radius = item.baseRadius + item.radiusAmp * Math.sin(t * item.radiusFreq);
    // Smoothly varying height
    const height = item.baseHeight + item.heightAmp * Math.sin(t * item.heightFreq);
    // Smoothly varying speed
    const speed = item.baseSpeed + item.speedAmp * Math.sin(t * item.speedFreq) * 0.2;
    const angle = delta * speed + item.angleOffset;

    item.mesh.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    // Spin axis wanders smoothly using sine waves
    const ax = Math.sin(t * 0.2 + item.spinAxisSeed);
    const ay = Math.sin(t * 0.3 + item.spinAxisSeed + 1);
    const az = Math.sin(t * 0.25 + item.spinAxisSeed + 2);
    const axis = new THREE.Vector3(ax, ay, az).normalize();

    item.mesh.rotateOnWorldAxis(axis, item.spinSpeed * 0.006);

    // // --- Spin ---
    // item.mesh.rotation.x = Math.sin(elapsedTime * item.spinSpeed * 2) * 0.5;
    // item.mesh.rotation.y = Math.cos(elapsedTime * item.spinSpeed * 1.3) * 0.5;
    // item.mesh.rotation.z = Math.sin(elapsedTime * item.spinSpeed * 0.7) * 0.5;
    // item.mesh.rotateOnWorldAxis(item.spinAxis, item.spinSpeed * elapsedTime);
  });
  renderer.render(scene, camera)
}
// ----------------------------
// Resize
// ----------------------------
function resize() {
  const w = container.value.clientWidth
  const h = container.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

// ----------------------------
// Lifecycle hooks
// ----------------------------
onMounted(() => {
  createRoom()
  animate()
  resize()
  window.addEventListener("resize", resize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener("resize", resize)
  renderer.dispose()
})
</script>

<style scoped>
.room-container {
  width: 100vw;
  height: 100vh;
  background: white;
  overflow: hidden;
}
</style>
