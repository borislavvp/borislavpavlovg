<template>
  <div class="win31-container">
    <div class="win31-frame p-2">
      <div class="title-bar px-2 py-1 mb-2">MINESWEEPER</div>

      <div class="board inline-block p-1">
        <div v-for="(row, r) in board" :key="r" class="row flex">
          <div
            v-for="(cell, c) in row"
            :key="c"
            class="cell flex items-center justify-center m-0.5"
            :class="{
              'revealed': cell.revealed,
              'mine': cell.mine && cell.revealed
            }"
            @click="reveal(r, c)"
          >
            <!-- <img v-if="!cell.revealed" src="/src/assets/qrcode.svg" class="w-full h-full" /> -->
            <span v-if="cell.revealed && !cell.mine && cell.number > 0" class="number">
              {{ cell.number }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Win31Minesweeper",
  data() {
    return {
      rows: 9,
      cols: 9,
      mines: 10,
      board: []
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      const b = [];
      for (let r = 0; r < this.rows; r++) {
        b.push([]);
        for (let c = 0; c < this.cols; c++) {
          b[r].push({ mine: false, revealed: false, number: 0 });
        }
      }

      let placed = 0;
      while (placed < this.mines) {
        const r = Math.floor(Math.random() * this.rows);
        const c = Math.floor(Math.random() * this.cols);
        if (!b[r][c].mine) { b[r][c].mine = true; placed++; }
      }

      const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (b[r][c].mine) continue;
          let count = 0;
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && b[nr][nc].mine) count++;
          }
          b[r][c].number = count;
        }
      }
      this.board = b;
    },
    reveal(r, c) {
      const cell = this.board[r][c];
      if (cell.revealed) return;
      cell.revealed = true;
      if (!cell.mine && cell.number === 0) this.flood(r, c);
    },
    flood(r, c) {
      const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      dirs.forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          const n = this.board[nr][nc];
          if (!n.revealed && !n.mine) {
            n.revealed = true;
            if (n.number === 0) this.flood(nr, nc);
          }
        }
      });
    }
  }
};
</script>

<style scoped>
/* FULL SCREEN CONTAINER TO CENTER THE WINDOW */
.win31-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40vh; /* full viewport height */
  width: 100vw;
  background: #ffffff; /* page background */
}

/* WINDOW FRAME */
.win31-frame {
  border: 3px solid #000000;
  background: #a0a0a0; /* vintage gray */
  font-family: "MS Sans Serif", Tahoma, sans-serif;
  font-size: clamp(12px, 3vw, 16px);
  display: inline-block;
  padding: 4px;
}

/* TITLE BAR */
.title-bar {
  background: #000080;
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  border-bottom: 2px solid #000000;
  border-right: 2px solid #000000;
  color: #ffffff;
  font-weight: bold;
  font-size: clamp(12px, 3vw, 14px);
  user-select: none;
  text-shadow: 1px 1px #000000;
}

/* BOARD */
.board {
  background-image: url("/src/assets/qrcode.svg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  /* background: #a0a0a0; */
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  border-right: 2px solid #808080;
  border-bottom: 2px solid #808080;
  padding: 2px;
}

/* ROW */
.row {
  display: flex;
}

/* CELL */
.cell {
  width: clamp(28px, 9vw, 36px);
  height: clamp(28px, 9vw, 36px);
  /* background-image: "/src/assets/qrcode.svg"; */
  /* background-image: #c0c0c0; */
  background: transparent;
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  border-right: 2px solid #808080;
  border-bottom: 2px solid #808080;
  outline: 1px solid #000000;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: clamp(14px, 3vw, 18px);
  user-select: none;
  touch-action: manipulation;
}

/* REVEALED CELL */
.cell.revealed {
  background: #a0a0a0;
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
}

/* MINE CELL */
.cell.mine {
  background: #ff0000;
  box-shadow: inset 1px 1px #800000;
}

/* NUMBER */
.number {
  font-weight: bold;
  color: black;
  text-shadow: 1px 1px #ffffff;
}
</style>
