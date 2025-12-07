<template>
    <div class="flex flex-wrap space-x-6 space-y-6 w-full h-full ">
        <div class="" v-for="(trashbin, index) in trashbins" :key="index">
            <img :src="trashbin" width="400" height="600" alt="trashbin image" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import birthday from '../assets/trashbins/birthday3.png'
import books from '../assets/trashbins/books.png'
import carpets from '../assets/trashbins/carpets.png'
import keys from '../assets/trashbins/keys.png'
import party from '../assets/trashbins/party.png'
import passports from '../assets/trashbins/passports.png'
import selo from '../assets/trashbins/selo.png'
import sybor from '../assets/trashbins/sybor2.png'
import tamqn from '../assets/trashbins/tamqn.png'
import tickets from '../assets/trashbins/tickets.png'
import toys from '../assets/trashbins/toys.png'
import tvscds from '../assets/trashbins/tvscds.png'

const trashbins = ref([keys, party, passports, selo, sybor, tamqn, tickets, toys, tvscds])




</script>