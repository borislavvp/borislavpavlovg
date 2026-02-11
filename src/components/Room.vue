<template>
  <div ref="container" class="room-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import * as THREE from "three"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useAnimations, useGLTF } from '@tresjs/cientos'

let scene, camera, renderer, animationId, flyingChair
let floor, leftWall, rightWall, frontWall
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

  loader.load("/chair.glb", (gltf) => {
    const chair = gltf.scene
    const qrTexture = textureLoader.load('/textures/qr.png')
    qrTexture.wrapS = THREE.RepeatWrapping
    qrTexture.wrapT = THREE.RepeatWrapping
    qrTexture.repeat.set(8, 8) // controls how many QR codes appear

    const qrMaterial = new THREE.MeshBasicMaterial({
      map: qrTexture
    })

    chair.traverse((child) => {
      if (child.isMesh) {
        child.material = qrMaterial
      }
    })

    chair.scale.setScalar(1)
    chair.position.set(0, 0, 0)
    flyingChair = chair
    scene.add(flyingChair)
  });

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
  camera.position.set(0, 3, 6)
  camera.lookAt(0, 0, 0)

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

  // ----------------------------
  // Spiral Shader
  // ----------------------------
  const spiralMaterial = new THREE.ShaderMaterial({
    uniforms: {
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

        // -----------------------------
        // GLOBAL SPIRAL SPACE
        // -----------------------------
        vec2 radial = vec2(vWorldPosition.x, vWorldPosition.z);
        float r = length(radial);
        float angle = atan(radial.y, radial.x);
        
        float h = max(vWorldPosition.y - uFloorY, 0.0);
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
        
        float spiralVisible = step(vWorldPosition.y, uFloorY + uCutHeight);
        if(spiralVisible<0.01){
            intensity = 1.5;
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
      }
    `,
    transparent: true
  })
  scene.add(floor)
  scene.add(leftWall)
  scene.add(rightWall)
  scene.add(frontWall)
  // Apply shader to all surfaces
  floor.material = spiralMaterial
  leftWall.material = spiralMaterial
  rightWall.material = spiralMaterial
  frontWall.material = spiralMaterial

   // Create initial tornado cables
  createCableTornado(roomWidth, roomDepth, wallHeight, floorY)
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
  scene.add(centralCable)
}

// ----------------------------
// Animation tweak for tornado
// ----------------------------
function animate(time) {
  animationId = requestAnimationFrame(animate)
  const elapsedTime = time * 0.001

  // Spiral update
  if (floor) floor.material.uniforms.uTime.value = elapsedTime

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
  if(flyingChair) {
      const orbitRadius = 2.0;
      const orbitHeight = 2.0;

      const angle = elapsedTime;

      flyingChair.position.set(
        Math.cos(angle) * orbitRadius,
        orbitHeight,
        Math.sin(angle) * orbitRadius
      );

      flyingChair.rotation.y = angle;
    }

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
