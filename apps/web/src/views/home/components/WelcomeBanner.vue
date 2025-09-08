<script lang="ts" setup>
import WelcomeKaola from '#/static/images/evaluation/result/report_logo.png';
</script>

<template>
  <div
    class="h-40 rounded-3xl border-0 from-emerald-100 via-teal-50 to-cyan-100 lg:h-48"
  >
    <div class="relative flex h-full flex-col justify-center p-6 lg:p-8">
      <!-- <div
        class="absolute right-0 top-0 h-20 w-20 -translate-y-10 translate-x-10 rounded-full bg-gradient-to-br from-teal-200/50 to-emerald-200/50"
      ></div> -->
      <div class="z-10">
        <h2
          class="mb-2 bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-2xl font-bold text-transparent lg:text-3xl"
        >
          欢迎来到心之旅
        </h2>
        <p class="text-base font-medium text-emerald-800/80 lg:text-lg">
          探索自己心中的奥秘，开启成长之路
        </p>
      </div>
      <img
        class="absolute bottom-0 right-4 h-1/2 w-24 object-cover object-top opacity-90 lg:w-28"
        :src="WelcomeKaola"
        alt="banner mascot"
        style="max-height: 100%"
      />
    </div>
  </div>
</template>
