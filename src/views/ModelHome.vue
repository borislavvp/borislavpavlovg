<template>
    <div 
    class="rotated-container"
  >
    <div
      class="plaque"
      v-show="!showHouseImages"
    >
      <div class="rust-overlay"></div>
      <div class="border-rim"></div>

      <div class="header">ОБРАЗЦОВ ДОМ</div>

      <div class="info">
        <span style="padding-left: 60px;">Год: 2025</span>
        <span style="padding-right: 60px;">№ 16</span>
      </div>

      <div @click="showHouseImages = true" class="image-container" >
        <img width="241" height="245" src="../assets/img/shpionka.png"/>
        <!-- eyelid canvas sits on top of that image -->
        <canvas ref="canvasRefEye" class="eye-layer"></canvas>
      </div>

      <!-- Screws -->
      <div class="screws top-left"></div>
      <div class="screws top-right"></div>
      <div class="screws bottom-left"></div>
      <div class="screws bottom-right"></div>

      <!-- Person walking overlay -->
      <canvas ref="canvasRef" class="person-layer"></canvas>
    </div>
    

    <div v-show="showHouseImages" class="plaque" >
      <span @click="showHouseImages = false" style="position: absolute; left: 0%; bottom: 0%; color: #1a3475; margin-left: 40px; margin-bottom: 25px; font-size: 1.6rem;">ИЗХОД</span>
      <img
        v-for="(img, index) in houseImages"
        :key="index"
        :src="img"
        v-show="index === currentIndex"
        style="width: 100%; height: 100%; object-fit: cover; "
        @click="currentIndex = (currentIndex + 1) % houseImages.length"
      />
    </div>

  </div>

</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

import img1 from '@/assets/img/obrazcov1.jpg'
import img2 from '@/assets/img/obrazcov2.jpg'
import img3 from '@/assets/img/obrazcov3.jpg'
import img5 from '@/assets/img/obrazcov5-2.png'
import img7 from '@/assets/img/obrazcov7.jpg'
import img9 from '@/assets/img/obrazcov9.jpg'
import img10 from '@/assets/img/obrazcov10.jpg'

const houseImages = [img5, img7, img9, img3, img2, img1, img10 ]
const currentIndex = ref(0)

const showHouseImages = ref(false)

/* -------------------------
   --- Person walking canvas ---
   ------------------------- */
const canvasRef = ref(null)
const canvasRefEye = ref(null)

onMounted(() => {
  /* -------- person canvas setup -------- */
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const person = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      angle: Math.random() * Math.PI * 2,
      step: 1.5,
      turnChance: 0.02
    }

    const footsteps = []

    function drawPerson() {
      ctx.save()
      ctx.translate(person.x, person.y)
      ctx.rotate(person.angle)

      const tilt = 0.6
      const bodyLength = 10
      const legLength = 6
      const headRadius = 2.5

      ctx.save()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      ctx.beginPath()
      ctx.ellipse(2, 4, 3, 1.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      const gradient = ctx.createLinearGradient(0, -headRadius * 2, 0, bodyLength)
      gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
      gradient.addColorStop(1, 'rgba(180,180,180,0.3)')
      ctx.strokeStyle = gradient
      ctx.lineWidth = 1.8

      ctx.beginPath()
      ctx.ellipse(0, -headRadius * 2 * tilt, headRadius, headRadius * tilt, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, -headRadius * 1.2 * tilt)
      ctx.lineTo(0, bodyLength * 0.8)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-3, 0)
      ctx.lineTo(-5, 2 * tilt)
      ctx.moveTo(3, 0)
      ctx.lineTo(5, 2 * tilt)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, bodyLength * 0.8)
      ctx.lineTo(-2, bodyLength + legLength * 0.5)
      ctx.moveTo(0, bodyLength * 0.8)
      ctx.lineTo(2, bodyLength + legLength * 0.5)
      ctx.stroke()

      ctx.restore()
    }

    function drawFootsteps() {
      for (let i = 0; i < footsteps.length; i++) {
        const f = footsteps[i]
        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.rotate(f.angle)
        ctx.fillStyle = `rgba(255,255,255,${f.alpha})`
        ctx.beginPath()
        ctx.ellipse(0, 0, 2, 1, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        f.alpha -= 0.01
      }
      while (footsteps.length && footsteps[0].alpha <= 0) footsteps.shift()
    }

    function update() {
      if (Math.random() < person.turnChance) {
        person.angle += (Math.random() - 0.5) * 0.5
      }
      person.x += Math.cos(person.angle) * person.step
      person.y += Math.sin(person.angle) * person.step
      if (person.x < 10 || person.x > canvas.width - 10) {
        person.angle = Math.PI - person.angle
      }
      if (person.y < 10 || person.y > canvas.height - 10) {
        person.angle = -person.angle
      }
      if (Math.random() < 0.2) {
        footsteps.push({
          x: person.x,
          y: person.y,
          angle: person.angle,
          alpha: 1
        })
      }
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      update()
      drawFootsteps()
      drawPerson()
      requestAnimationFrame(loop)
    }
    loop()
  } // end person canvas if

  /* -------- eye canvas setup -------- */
  const canvasEye = canvasRefEye.value
  const ctxEye = canvasEye.getContext('2d')

  function resizeEye() {
    canvasEye.width = canvasEye.offsetWidth
    canvasEye.height = canvasEye.offsetHeight
  }
  resizeEye()
  window.addEventListener('resize', resizeEye)

  let blinkProgress = 0;
  let blinking = false;
  let blinkCount = 0;
  let lastBlink = 0;
  let nextBlink = 2000 + Math.random() * 4000;
  let blinkSpeed = 0.25;

function animateEyes(timestamp) {
  ctxEye.clearRect(0, 0, canvasEye.width, canvasEye.height);

  // Trigger random double blink
  if (!blinking && timestamp - lastBlink > nextBlink) {
    blinking = true;
    blinkCount = 0;
    lastBlink = timestamp;
    nextBlink = 1000 + Math.random() * 4000; // next double blink interval
  }

  if (blinking) {
    blinkProgress += blinkSpeed;

    if (blinkProgress >= 1) {
      blinkProgress = 1;
      blinkSpeed = -0.25; // reverse (open eyes)
    }

    if (blinkProgress <= 0 && blinkSpeed < 0) {
      blinkCount++;
      if (blinkCount < 2) {
        // do another quick blink
        blinkSpeed = 0.35; // second blink is faster
      } else {
        // done blinking
        blinkSpeed = 0.25;
        blinking = false;
      }
    }
  }

  // draw eyelid
  const h = canvasEye.height;
  const w = canvasEye.width;
  const lidHeight = h * blinkProgress;

  ctxEye.fillStyle = 'black';
  ctxEye.fillRect(0, 0, w, lidHeight / 2); // top lid
  ctxEye.fillRect(0, h - lidHeight / 2, w, lidHeight / 2); // bottom lid

  requestAnimationFrame(animateEyes);
}

  requestAnimationFrame(animateEyes)

})
</script>

<style scoped>
/* ---- keep your style unchanged ---- */
.rotated-container {
  position: fixed;
  inset: 0;
  background: #0c0c0c;
  transform: rotate(90deg);
  transform-origin: center center;
  height: 100vw;
}

.plaque {
  position: relative;
  width: 100vh;
  height: 100vw;
  background: linear-gradient(145deg, #000a23 0%, #102350 90%);
  box-shadow:
    0 0 0 3px #142b5f inset,
    2px 2px 10px rgba(0, 0, 0, 0.8),
    inset -2px -2px 6px rgba(255, 255, 255, 0.1);
  color: #fff;
  overflow: hidden;
  user-select: none;
  font-family: 'Impact', 'Oswald', sans-serif;
}

.header {
  position: absolute;
  top: 16%;
  left: 22%;
  width: 30%;
  transform: translateX(-50%);
  font-size: clamp(4rem, 4vw, 6rem);
  letter-spacing: 2px;
  text-shadow: 2px 2px 0 #000, -1px -1px 0 #999;
  z-index: 3;
}

.image-container {
  position: absolute;
  top: 9vh;    /* 17% of the viewport height */
  left: 70vw;   /* 40% of the viewport width */
  transform: translateX(50%);
  z-index: 3;
}

.info {
  position: absolute;
  bottom: 15%;
  width: 100%;
  display: flex;
  font-size: 2.1rem;
  text-shadow: 1px 1px 1px #000;
  color: #ddd;
  z-index: 3;
  gap: 70px;
}

.protest {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #ffae00;
  color: #fff;
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 1px;
  text-shadow: 1px 1px 1px #000;
  z-index: 4;
  font-family: 'Courier New', monospace;
}

/* Transparent overlay for walking animation */
.person-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 6;
  background: transparent;
  pointer-events: none;
}
.screws {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ccc, #555 90%);
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
  z-index: 5;
}
.top-left { top: 10px; left: 10px; }
.top-right { top: 10px; right: 10px; }
.bottom-left { bottom: 10px; left: 10px; }
.bottom-right { bottom: 10px; right: 10px; }

.eye-layer {
  position: absolute;
  inset: 0;
  width: 190px;
  height: 190px;
  border-radius: 50%; /* makes it circular */
  background: transparent;
  pointer-events: none;
  z-index: 4; /* sits above image but below screws/person layer */
  overflow: hidden; /* ensures child elements stay inside the circle */
  left:12%;
  top:12%;
}

</style>
