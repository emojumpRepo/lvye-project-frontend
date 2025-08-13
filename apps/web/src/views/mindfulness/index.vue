<script lang="ts" setup>
import PracticeModule from './components/PracticeModule.vue';
import ScienceModule from './components/ScienceModule.vue';
</script>

<template>
  <div class="min-h-screen p-6 lg:p-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-emerald-900 lg:text-3xl">正念冥想</h1>
      <p class="mt-2 text-emerald-700/80">
        通过科普学习和实践练习，培养正念意识
      </p>
    </div>

    <!-- 主要内容区域 -->
    <div class="space-y-8">
      <!-- 科普模块 -->
      <ScienceModule />

      <!-- 练习室模块 -->
      <PracticeModule />
    </div>
  </div>
</template>
