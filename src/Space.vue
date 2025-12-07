<script setup>
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'

import Frame from './gallery/Frame.vue';

const gl = {
  clearColor: '#d9dadb',
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
  windowSize: true,
}
</script>
<template>
  <TresCanvas 
    v-bind="gl" 
  >
    <TresPerspectiveCamera
    :position="[150, 60, 100]"
    :look-at="[0, 50, 0]"
  />
    <OrbitControls />
    
    <!-- Left -->
    <!-- <TresMesh :position="[-40, 20, -30]" :scale="[5,20,70]" cast-shadow>
      <TresBoxGeometry :args="[8, 8, 8]" />
      <TresMeshToonMaterial color="#FFFFFF" />
    </TresMesh> -->
    <!-- Right -->
    <!-- <TresMesh :position="[300, 20, -30]" :scale="[5,20,70]" cast-shadow> -->
      <!-- <TresBoxGeometry :args="[8, 8, 8]" />
      <TresMeshToonMaterial color="#FFFFFF" />
    </TresMesh> -->
    <!-- Forward -->
    <!-- <TresMesh :position="[140, 20, -300]" :scale="[40,20,2]" cast-shadow>
      <TresBoxGeometry :args="[8, 8, 8]" />
      <TresMeshToonMaterial color="#FFFFFF" />
    </TresMesh> -->
    <!-- Down -->
    <!-- <TresMesh :position="[120, -52, -30]" :scale="[40,2,70]" cast-shadow>
      <TresBoxGeometry :args="[8, 8, 8]" />
      <TresMeshToonMaterial color="#FFFFFF" />
    </TresMesh> -->
    <!-- Top -->
    <!-- <TresMesh :position="[120, 92, -30]" :scale="[40,2,70]" cast-shadow>
      <TresBoxGeometry :args="[8, 8, 8]" />
      <TresMeshToonMaterial color="#FFFFFF" />
    </TresMesh> -->
    <Suspense>
      <Frame 
        :position="[7, 0, 5.5]"  
        :rotation="[0, -Math.PI/2, 0]"
        :scale="[20,20,20]"
      />
    </Suspense>
  
    <TresPointLight
      :position="[130, 150, 0]"
      :intensity="10000"
      cast-shadow
    />
    <TresPointLight
      :position="[130, 150, 150 ]"
      :intensity="10000"
      cast-shadow
    />
    <!-- <TresAmbientLight :intensity="3" :position="[130, 20, 0]" color="#828282"/> -->

  </TresCanvas>
</template>