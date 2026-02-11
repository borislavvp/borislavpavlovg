<template>
    <Suspense>
    <template #default>
      <div class="relative bg-white overflow-y-auto overflow-x-hidden h-screen">
        <!-- <QrTetris class="flex fixed z-100 w-screen h-screen bg-white overflow-hidden  pointer-events-none " /> -->
        <!-- <Trashbins /> -->
        <!-- <Solitaire /> -->
        <!-- <Minesweeper /> -->
          <Room />
      </div>
    </template>

    <template #fallback>
      <!-- optional loading UI -->
      <div style="position:fixed; inset:0; background:white;">
        loading…
      </div>
    </template>
  </Suspense>
</template>

<script setup>
import DnaWords from '../components/DNAWords.vue'
import Trashbins from '../components/Trashbins.vue'
import Solitaire from '../components/Solitaire.vue'
import Minesweeper from '../components/Minesweeper.vue'
import Room from '../components/Room.vue'
import QrTetris from '../components/QTetris.vue'
</script>

