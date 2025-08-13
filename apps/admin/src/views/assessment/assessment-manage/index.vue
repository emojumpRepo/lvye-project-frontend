<script setup lang="ts">
import List from './components/List.vue';
import Search from './components/Search.vue';
</script>

<template>
  <div class="flex min-h-screen flex-col gap-4 bg-gray-50 p-6">
    <Search />
    <List />
  </div>
</template>
