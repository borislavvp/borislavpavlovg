<template>
  <div class="family-drawing">
    <img :src="currentImage" alt="family dinner" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import people1 from '../assets/img/people1.jpg'
import people2 from '../assets/img/people2.png'
import people3 from '../assets/img/people3.png'
import people4 from '../assets/img/people4.png'
import people5 from '../assets/img/people5.png'
import people6 from '../assets/img/people6.png'

const emotionLevel = ref(1)

const drawings = [people1, people2, people3, people4, people5, people6]

</script>

<style scoped>
.family-drawing {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}
.family-drawing img {
  width: 60vw;
  height: auto;
  transition: opacity 0.6s ease;
}
</style>
