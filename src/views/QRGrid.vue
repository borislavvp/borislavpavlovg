
<script setup lang="ts">
import { ref } from 'vue'

const size = 16 

// Create the grid data
const cells = ref(
  Array.from({ length: size * size }, () => ({
    revealed: false,
    content: ''
  }))
)

// Handle click on a cell
function revealCell(index:number) {
  if (cells.value[index].revealed) return

  const isBomb = Math.random() < 0.1
  cells.value[index].revealed = true
  cells.value[index].content = isBomb ? '💣' : '✔️'
}
</script>

<template>
  <div class="minesweeper-container">
    <div class="minesweeper-window">
      <!-- Title bar -->
      <div class="title-bar">
        <span class="title-text">Minesweeper</span>
      </div>

      <!-- Game board -->
      <div
        class="board"
        :style="{ gridTemplateColumns: `repeat(${size}, 1fr)` }"
      >
        <div
          v-for="(cell, index) in cells"
          :key="index"
          @click="revealCell(index)"
          class="cell"
          :class="{ revealed: cell.revealed, bomb: cell.revealed && cell.content === '💣' }"
        >
          <span v-if="cell.revealed">{{ cell.content }}</span>
          <img v-else src="../assets/qrcode.svg" class="qr" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 🪟 Window container */
.minesweeper-container {
  @apply flex items-center justify-center min-h-screen bg-[#008080];
}

/* 💻 Classic window */
.minesweeper-window {
  background: #c0c0c0;
  border: 2px solid #808080;
  box-shadow: inset 2px 2px #ffffff, inset -2px -2px #404040;
  width: fit-content;
  padding: 4px;
}

/* 📁 Title bar */
.title-bar {
  background: linear-gradient(to bottom, #000080, #000060);
  color: white;
  font-family: "Tahoma", sans-serif;
  font-size: 14px;
  padding: 4px 8px;
  border-bottom: 2px solid #808080;
  box-shadow: inset 1px 1px #00a, inset -1px -1px #000040;
}

.title-text {
  font-weight: bold;
  text-shadow: 1px 1px #000;
}

/* 🧩 Game board */
.board {
  display: grid;
  margin-top: 4px;
  border: 2px solid #808080;
  box-shadow: inset 2px 2px #fff, inset -2px -2px #404040;
}

/* 🔲 Cells */
.cell {
  width: 28px;
  height: 28px;
  background: #c0c0c0;
  border: 2px solid #808080;
  box-shadow: inset 2px 2px #fff, inset -2px -2px #404040;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: "Consolas", monospace;
  font-size: 20px;
  user-select: none;
  transition: all 0.1s ease-in-out;
}

.cell:hover {
  background: #d0d0d0;
}

.cell:active {
  box-shadow: inset -2px -2px #fff, inset 2px 2px #404040;
}

/* 📜 Revealed state */
.cell.revealed {
  background: #e0e0e0;
  border: 1px solid #a0a0a0;
  box-shadow: inset 1px 1px #fff, inset -1px -1px #808080;
}

/* 💣 Bomb cell */
.cell.bomb {
  background: #ffcccc;
  color: #b00;
}

/* 📷 QR icon */
.qr {
  width: 20px;
  height: 20px;
  pointer-events: none;
}
</style>