<template>
  <div>
    <canvas style="width:100%; z-index: 3;" ref="canvas"></canvas>
  </div>
  <!-- <div class="family-drawing">
    <img :src="drawings[emotionLevel]" />
  </div> -->
    
</template>

<script setup>
import { onMounted, ref, onUnmounted } from "vue"
// Assuming this file exists and contains the SVG data as a string
import { QrCodeSVGData } from './qrCodeSVGData' 

// import people1 from '../assets/img/people1.jpg'
// import people2 from '../assets/img/people2.png'
// import people3 from '../assets/img/people3.png'
// import people4 from '../assets/img/people4.png'
// import people5 from '../assets/img/people5.png'
// import people6 from '../assets/img/people6.png'

const emotionLevel = ref(0)

// const drawings = [people1, people2, people3, people4, people5, people6]

const canvas = ref(null)
let ctx

const DROP_INTERVAL = 100 
let dropTimer = null
let isDragging = false
let lastDragX = 0
let dragDeltaX = 0
// Constants
const BLOCK = 26
const MAX_COLS = 30 
const MAX_ROWS = 40 
// Use the floor of the window dimension divided by BLOCK size for grid calculation
const COLS = Math.min(Math.floor(window.innerWidth / BLOCK), MAX_COLS)
const ROWS = Math.min(Math.floor(window.innerHeight / BLOCK), MAX_ROWS)

// --- QR CODE TEXTURE VARIABLES ---
const QR_CODE_SIZE_PX = 200; 
const TILE_COUNT = 2; 

let qrCodeCanvas = null; 
let isTextureReady = false;

// Calculate board dimensions based on the fixed grid size (COLS and ROWS)
const boardWidthPx = COLS * BLOCK;
const boardHeightPx = ROWS * BLOCK;

// Determine the side length of one tile on the game canvas (square aspect ratio enforced)
const TILE_SIDE_GAME_PX = Math.min(boardWidthPx / TILE_COUNT, boardHeightPx / TILE_COUNT);
const SCALE_FACTOR = QR_CODE_SIZE_PX / TILE_SIDE_GAME_PX;
// ------------------------------------

// Game state
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
let currentPiece = null
let gameOver = false
let round = 0

// Tetris shapes (unchanged)
const SHAPES = {
  I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]], 
  S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]], 
  L: [[1, 0], [1, 0], [1, 1]], J: [[0, 1], [0, 1], [1, 1]],
}

// ----------------------------------------------------
// Drawing Functions 
// ----------------------------------------------------
// Track the last measured even height so we know when to update emotionLevel
// let lastEvenHeight = 0

// function updateEmotionLevelBasedOnHeight() {
//   // find the tallest filled cell (highest block)
//   let highestFilledRow = ROWS // initialize as bottom
//   for (let r = 0; r < ROWS; r++) {
//     if (board[r].some(cell => cell === 1)) {
//       highestFilledRow = r
//       break
//     }
//   }

//   const currentHeight = ROWS - highestFilledRow
//   const nearestEven = Math.floor(currentHeight / 4) * 4 // nearest even number (2,4,6,...)

//   // only react when we pass an even threshold (up or down)
//   if (nearestEven !== lastEvenHeight) {
//     const diff = nearestEven - lastEvenHeight
//     if (diff > 0) {
//       // increased by an even step
//       emotionLevel.value =  emotionLevel.value === drawings.length-1 ? emotionLevel.value : emotionLevel.value + 1;
//     } else if (diff < 0) {
//       // decreased by an even step
//       emotionLevel.value = emotionLevel.value === 0 ? 0 : emotionLevel.value - 1;
//     }
//     lastEvenHeight = nearestEven
//   }
// //   if (currentHeight < 8 && Math.random() < 0.3) {
// //   // artificially "grow" the tower by adding one random block row
// //   const noisyRow = Array.from({ length: COLS }, () =>
// //     Math.random() < 0.3 ? Math.floor(Math.random() * COLS) + 1 : 0
// //   )
// //   board[ROWS - currentHeight - 1] = noisyRow
// // }
// }

function setupQrCodeTexture() {
  return new Promise((resolve) => {
    const svgBase64 = btoa(QrCodeSVGData);
    const img = new Image();
    
    img.onload = () => {
      qrCodeCanvas = document.createElement('canvas');
      qrCodeCanvas.width = QR_CODE_SIZE_PX;
      qrCodeCanvas.height = QR_CODE_SIZE_PX;
      const tempCtx = qrCodeCanvas.getContext('2d');
      
      tempCtx.drawImage(img, 0, 0, QR_CODE_SIZE_PX, QR_CODE_SIZE_PX);
      isTextureReady = true;
      resolve();
    };
    
    img.src = `data:image/svg+xml;base64,${svgBase64}`;
  });
}

function drawQRBlock(x, y) {
  const px = x * BLOCK
  const py = y * BLOCK
  
  ctx.fillStyle = "#fff";
  ctx.fillRect(px, py, BLOCK, BLOCK);
  
  if (isTextureReady) {
    const relativeX = (x * BLOCK) % TILE_SIDE_GAME_PX;
    const relativeY = (y * BLOCK) % TILE_SIDE_GAME_PX;

    const sx = relativeX * SCALE_FACTOR;
    const sy = relativeY * SCALE_FACTOR;
    
    const sw = BLOCK * SCALE_FACTOR;
    const sh = BLOCK * SCALE_FACTOR;

    ctx.drawImage(
      qrCodeCanvas, 
      sx, sy, sw, sh,      
      px, py, BLOCK, BLOCK 
    );
  }
  
  ctx.strokeStyle = "rgba(0,0,0,0.2)"
  ctx.strokeRect(px, py, BLOCK, BLOCK)
}


function resetGame() {
  // 1. Reset state variables
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  gameOver = false
  round = 0
  
  // 2. Clear canvas and start with a fresh piece
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  currentPiece = spawnSmartPiece()
  emotionLevel.value = 0
  // 3. Restart the drop and draw loops
  // startGameLoop()
}

function drawBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawQRBlock(c, r)
    }
  }
}

function drawPiece(piece) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        drawQRBlock(piece.x + c, piece.y + r)
      }
    }
  }
}

// ----------------------------------------------------
// AI and Game Logic (Unchanged)
// ----------------------------------------------------

function collides(piece, offX, offY) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const nx = piece.x + c + offX
        const ny = piece.y + r + offY
        if (ny >= ROWS || nx < 0 || nx >= COLS || (ny >= 0 && board[ny][nx])) {
          return true
        }
      }
    }
  }
  return false
}

function merge(piece) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const x = piece.x + c
        const y = piece.y + r
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          board[y][x] = 1
        }
      }
    }
  }
}

function clearFullRows() {
  board = board.filter(row => row.some(cell => !cell))
  while (board.length < ROWS) {
    board.unshift(Array(COLS).fill(0))
  }
}

function rotateShape(shape) {
  const rows = shape.length
  const cols = shape[0].length
  const newShape = Array.from({ length: cols }, () => Array(rows).fill(0))

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      newShape[c][rows - 1 - r] = shape[r][c]
    }
  }
  return newShape
}

function mergeInto(tempBoard, piece) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const x = piece.x + c
        const y = piece.y + r
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          tempBoard[y][x] = 1
        }
      }
    }
  }
}

function countHoles(b) {
  let holes = 0
  for (let c = 0; c < COLS; c++) {
    let blockFound = false
    for (let r = 0; r < ROWS; r++) {
      if (b[r][c]) blockFound = true
      else if (blockFound && !b[r][c]) holes++
    }
  }
  return holes
}

function countClearedRows(tempBoard) {
  let cleared = 0
  for (let r = 0; r < tempBoard.length; r++) {
    if (tempBoard[r].every(cell => cell === 1)) {
      cleared++
    }
  }
  return cleared
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function evaluateBoard(tempBoard) {
  const heights = Array(COLS).fill(0)
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (tempBoard[r][c]) {
        heights[c] = ROWS - r
        break
      }
    }
  }
  const clearedRows = countClearedRows(tempBoard)
  const holes = countHoles(tempBoard)
  const variance =
    heights.reduce((a, b) => a + (b - average(heights)) ** 2, 0) / COLS
  return (holes * 5) + (variance * 1.0) - (clearedRows * 10)
}

function simulatePlacement(piece, xOffset) {
  let tempBoard = board.map(r => r.slice())
  let test = { ...piece, x: xOffset, y: piece.y }
  while (!collides(test, 0, 1)) {
    test.y++
  }
  mergeInto(tempBoard, test)
  return evaluateBoard(tempBoard)
}

function spawnSmartPiece() {
  const keys = Object.keys(SHAPES)
  const randomType = keys[Math.floor(Math.random() * keys.length)]
  let initialShape = SHAPES[randomType]
  
  let bestPiece = null
  let bestScore = Infinity

  let currentShape = initialShape
  for (let rot = 0; rot < 4; rot++) {

    const piece = { shape: currentShape, x: 0, y: 0 }
    
    for (let x = 0; x <= COLS - currentShape[0].length; x++) {
      
      const score = simulatePlacement(piece, x)

      if (score < bestScore) {
        bestScore = score
        bestPiece = { ...piece, x: x, shape: currentShape }
      }
    }

    currentShape = rotateShape(currentShape)
  }

  if (!bestPiece) {
      bestPiece = { shape: initialShape, x: Math.floor((COLS - initialShape[0].length) / 2), y: 0 }
  }

  return bestPiece
}

// ----------------------------------------------------
// Game Loop (Separated Movement and Drawing)
// ----------------------------------------------------

function movePieceDown() {
  if (gameOver) {
    clearInterval(dropTimer)
    return
  }
  if (!currentPiece) {
    currentPiece = spawnSmartPiece()
  }
  if (!collides(currentPiece, 0, 1)) {
    currentPiece.y++
  } else {
    merge(currentPiece)
    clearFullRows()
    
    // 👇 update emotion level based on current tower height
    // updateEmotionLevelBasedOnHeight()

    round++
    currentPiece = spawnSmartPiece()
    if (collides(currentPiece, 0, 0)) {
      resetGame() 
      return // Exit the movePieceDown function
    }
  }
}

let animationFrameId = null;
function draw() {
  if (gameOver) {
    drawBoard()
  }
  
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  drawBoard()
  if (currentPiece) drawPiece(currentPiece)

  animationFrameId = requestAnimationFrame(draw)
}
// function startDrag(e) {
//   isDragging = true
//   lastDragX = e.touches ? e.touches[0].clientX : e.clientX
// }

// function onDrag(e) {
//   if (!isDragging || !currentPiece) return

//   const clientX = e.touches ? e.touches[0].clientX : e.clientX
//   dragDeltaX += clientX - lastDragX
//   lastDragX = clientX

//   const moveThreshold = BLOCK / 2 // how far you drag to move one step
//   if (Math.abs(dragDeltaX) > moveThreshold) {
//     const dir = dragDeltaX > 0 ? 1 : -1
//     if (!collides(currentPiece, dir, 0)) {
//       currentPiece.x += dir
//     }
//     dragDeltaX = 0
//   }
// }

// function endDrag() {
//   isDragging = false
//   dragDeltaX = 0
// }

onMounted(async () => {
  const c = canvas.value
  
  // Set the canvas dimensions to exactly match the Tetris grid size.
  c.width = COLS * BLOCK
  c.height = ROWS * BLOCK
  
  // Center the canvas using CSS properties.
  // c.style.margin = 'auto'; 
  // c.style.position = 'absolute';
  c.style.top = '0';
  c.style.bottom = '0';
  c.style.left = '0';
  c.style.right = '0';

  ctx = c.getContext("2d")
  
  await setupQrCodeTexture();
  
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, c.width, c.height)
  
  currentPiece = spawnSmartPiece()
  
  dropTimer = setInterval(movePieceDown, DROP_INTERVAL)
  animationFrameId = requestAnimationFrame(draw)
  // // --- DRAG CONTROLS ---
  // c.addEventListener("mousedown", startDrag)
  // c.addEventListener("mousemove", onDrag)
  // window.addEventListener("mouseup", endDrag)

  // c.addEventListener("touchstart", startDrag)
  // c.addEventListener("touchmove", onDrag)
  // window.addEventListener("touchend", endDrag)
})

onUnmounted(() => {
  if (dropTimer) {
    clearInterval(dropTimer)
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  // const c = canvas.value
  // c.removeEventListener("mousedown", startDrag)
  // c.removeEventListener("mousemove", onDrag)
  // window.removeEventListener("mouseup", endDrag)
  // c.removeEventListener("touchstart", startDrag)
  // c.removeEventListener("touchmove", onDrag)
  // window.removeEventListener("touchend", endDrag)
})
</script>

<style>
/* CRITICAL FIX: Reset all browser default margins and padding on the body/html */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevents scrollbars from appearing */
}
</style>

<style scoped>

canvas {
  display: block;
}
.family-drawing {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}
.family-drawing img {
  width: 100vw;
  height: auto;
  transition: opacity 0.6s ease;
}
</style>