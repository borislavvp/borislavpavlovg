<script setup lang="ts">
import { ref } from 'vue'
import { useAnimations, useGLTF } from '@tresjs/cientos'

const { scene: model, animations } = await useGLTF(
  'src/gallery/objects/gallery.gltf',
)
</script>
 
<template>
  <primitive :object="model" />
</template> 