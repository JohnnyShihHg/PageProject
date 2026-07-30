<template>
  <div style="padding: 20px;">
    <h1>Masonry Test</h1>
    <masonry-wall 
      :items="items" 
      :column-width="200" 
      :gap="20"
    >
      <template #default="{ item }">
        <div :style="{ height: item.height + 'px', background: 'lightblue', borderRadius: '8px' }">
          {{ item.id }}
        </div>
      </template>
    </masonry-wall>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const items = ref(
  Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    height: 100 + Math.random() * 200
  }))
);
</script>
