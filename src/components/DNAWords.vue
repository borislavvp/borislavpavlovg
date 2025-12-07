<template>
  <div class="dna-wrapper">
    <div
      v-for="(n, i) in points"
      :key="i"
      class="word"
      :style="{
        transform: `translateX(${n.x}px) translateY(${n.y}px) scale(${n.scale})`,
        opacity: n.opacity,
        // zIndex uses the raw cosine value (z-depth) for correct stacking
        zIndex: Math.round(n.zDepth * 100 + 100),
        // Assign color based on the strand
        color: n.strand === 'A' ? 'cyan' : 'magenta',
        textShadow: n.strand === 'A' ? '0 0 6px rgba(0, 255, 255, 0.6)' : '0 0 6px rgba(255, 0, 255, 0.6)',
      }"
    >
      {{ n.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// --- MODIFICATION 1: Flatten sentences into a stream of words with sentence markers ---
const sentences = [
  "I archive emotions as files.",
  "Home feels like a lost protocol.",
  "They call it progress; I call it forgetting.",
  "Sometimes I dream in 480p.",
  "The silence before Wi-Fi connected.",
  "Every memory is cached somewhere.",
  "I don’t belong to updates.",
  "Analog ghosts in digital walls.",
  "Time drifts like dial-up tones.",
  "My nostalgia is open-source."
]

// Prepare the word stream: each object is { text: 'word', isEnd: boolean, sentenceId: number }
const wordStream = sentences.flatMap((s, sId) => {
    // Clean up punctuation and split into words
    const words = s.replace(/[,.]/g, '').split(/\s+/).filter(w => w.length > 0);
    return words.map((word, wIndex) => ({
        text: word,
        isEnd: wIndex === words.length - 1,
        sentenceId: sId // Keep track of which sentence this word belongs to
    }));
});
// -----------------------------------------------------------------------------------


const points = ref([])
// --- MODIFICATION 2: Increase point count and reduce pitch for word density ---
const wordStreamLength = wordStream.length
const pointCount = wordStreamLength * 4 // We need enough points to wrap the entire helix multiple times
const helixRadius = 150
const pitch = 15 // Vertical spacing (smaller is tighter stream)
const speed = 1.0 // Vertical flow speed
// -----------------------------------------------------------------------------

let intervalId = null
let nextWordIndex = 0; // Tracks which word from the stream is next to be spawned

onMounted(() => {
  initializePoints()
  intervalId = setInterval(animate, 30) 
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

function getNextWord() {
    const wordObj = wordStream[nextWordIndex % wordStreamLength];
    nextWordIndex++;
    return wordObj;
}

function initializePoints() {
  for (let i = 0; i < pointCount; i++) {
    const strand = i % 2 === 0 ? 'A' : 'B'
    
    // Y position, distributing points evenly along the visible helix initially
    const y = window.innerHeight + 100 - i * pitch
    
    // Base angle based on vertical distribution
    const baseAngle = y * (2 * Math.PI / (pitch * 8)); // 8 full turns for initial spread

    points.value.push({ 
      y, 
      ...getNextWord(), // Insert word properties (text, isEnd, sentenceId)
      strand,
      baseAngle,
      x: 0, 
      scale: 1, 
      opacity: 1,
      zDepth: 0
    })
  }
}

function calculateStrandPosition(point) {
    let angle = point.baseAngle;

    // Strand B is 180 degrees (PI radians) out of phase from Strand A
    if (point.strand === 'B') {
        angle += Math.PI;
    }

    // X (Horizontal position) based on sine
    const rawX = Math.sin(angle);
    point.x = rawX * helixRadius;

    // Z (Depth/Scale) based on cosine
    const rawZ = Math.cos(angle);
    point.zDepth = rawZ;
    
    // Normalize raw Z (-1 to 1) for scale and opacity
    const normalizedDepth = rawZ * 0.5 + 0.5; // normalized 0 to 1
    point.scale = 0.7 + normalizedDepth * 0.5; // Slightly smaller scaling range
    point.opacity = 0.4 + normalizedDepth * 0.6;
}

function animate() {
  for (const p of points.value) {
    // 1. Flow word upward
    p.y -= speed

    // 2. Re-calculate angle based on the new Y-position to keep the shape STATIC
    // The divisor in the angle calculation dictates the helix pitch/tightness
    p.baseAngle = p.y * (2 * Math.PI / (pitch * 8)); // 8 is a good multiplier for visual turns
    
    calculateStrandPosition(p);

    // 3. Loop: When a word flows off the top, reset it to the bottom with the next word
    if (p.y < -50) {
      p.y = window.innerHeight + 50
      
      // Assign the next word from the stream
      const newWord = getNextWord();
      p.text = newWord.text;
      p.isEnd = newWord.isEnd;
      p.sentenceId = newWord.sentenceId;
      
      // Recalculate position for the new word at the bottom
      p.baseAngle = p.y * (2 * Math.PI / (pitch * 8));
      calculateStrandPosition(p);
    }
  }
}
</script>

<style scoped>
.dna-wrapper {
  position: fixed; 
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  transform: translateX(0); 
  color: #fff;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  perspective: 800px; 
  background: #000;
}

.word {
  position: absolute;
  /* Center point for the helix's axis */
  left: 50%; 
  top: 0;
  font-size: clamp(0.7rem, 1.3vw, 1rem); /* Smaller font for single words */
  white-space: nowrap; 
  transform-style: preserve-3d;
  transition: transform 0.05s, opacity 0.1s, z-index 0.05s; 
  transform-origin: center center;
  /* Add subtle vertical alignment for better reading */
  line-height: 1;
}
</style>