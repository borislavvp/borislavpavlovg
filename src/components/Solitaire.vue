<template>
  <div class="solitaire-container">
    <div class="solitaire-board">
      <!-- Top row: Stock and Waste -->
      <div class="top-row">
        <div class="pile stock" @click="drawCard">
          <div v-if="stock.length === 0" class="empty">Empty</div>
          <div v-else class="card back horizontal"></div>
        </div>
        <div class="pile waste">
          <div v-for="(c, i) in waste" :key="i" class="card revealed horizontal">
            <span :class="{'red': c.suit === '♥' || c.suit === '♦'}">{{ c.rank }}{{ c.suit }}</span>
          </div>
        </div>
      </div>

      <!-- Tableau -->
      <div class="tableau-row">
        <div v-for="(pile, pi) in tableau" :key="pi" class="tableau">
          <div
            v-for="(card, ci) in pile"
            :key="ci"
            :class="['card', card.revealed ? 'revealed' : 'hidden', 'horizontal']"
            @click="toggleCard(pi, ci)"
          >
            <span :class="{'red': card.suit === '♥' || card.suit === '♦'}" v-if="card.revealed">
              {{ card.rank }}{{ card.suit }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const suits = ["♠","♥","♦","♣"];
const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

export default {
  name: "MobileSolitaireHalfHeight",
  data() {
    return {
      deck: [],
      stock: [],
      waste: [],
      tableau: [[], [], [], [], [], [], []],
    };
  },
  mounted() {
    this.initDeck();
    this.dealTableau();
  },
  methods: {
    initDeck() {
      this.deck = [];
      suits.forEach(suit => {
        ranks.forEach(rank => {
          this.deck.push({ rank, suit, revealed: false });
        });
      });
      this.shuffle(this.deck);
      this.stock = [...this.deck];
    },
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    },
    dealTableau() {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j <= i; j++) {
          const card = this.stock.shift();
          if (j === i) card.revealed = true;
          this.tableau[i].push(card);
        }
      }
    },
    drawCard() {
      if (this.stock.length === 0) {
        this.stock = this.waste.splice(0).reverse();
        this.stock.forEach(c => c.revealed = false);
      } else {
        const c = this.stock.shift();
        c.revealed = true;
        this.waste.unshift(c);
      }
    },
    toggleCard(pileIndex, cardIndex) {
      const card = this.tableau[pileIndex][cardIndex];
      card.revealed = !card.revealed;
    }
  }
};
</script>

<style scoped>
/* CONTAINER */
.solitaire-container {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 40vh; 
  /* background-color: #0b6623; */
  background-image: url("/src/assets/qrcode.svg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  margin: 8px;
  box-sizing: border-box;
  overflow: hidden;

  border: 3px solid #000000;
}

/* BOARD */
.solitaire-board {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  justify-content: space-between; /* evenly space top row and tableau */
}

/* TOP ROW */
.top-row {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
  padding: 2px;
}

.pile {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.pile .empty {
  font-size: 10px;
  color: #fff;
}

/* TABLEAU */
.tableau-row {
  display: flex;
  gap: 4px;
  justify-content: space-between;
  overflow-x: auto; /* scrollable for mobile if needed */
  padding: 2px;
}

.tableau {
  display: flex;
  flex-direction: column;
  gap: 4px; /* small overlap so all cards fit */
}

/* CARD */
.card {
  width: 50px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  text-align: center;
  user-select: none;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #999;
  box-shadow: 1px 1px 1px rgba(0,0,0,0.25);
  position: relative;
  z-index: 1;
}

/* REVEALED CARD */
.card.revealed {
  background: #fff;
  border: 1px solid #999;
}

/* HIDDEN CARD */
.card.hidden {
  background: #888;
  border: 1px solid #666;
}

/* BACK OF STOCK */
.card.back {
  background: #003366;
  border: 1px solid #000;
  box-shadow: inset 1px 1px 1px rgba(255,255,255,0.2);
}

/* RED SUITS */
.red {
  color: #d00;
}

/* HORIZONTAL ROTATION */
.card.horizontal {
  transform: rotate(-90deg);
  transform-origin: center;
}
</style>
