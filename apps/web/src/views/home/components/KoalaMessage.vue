<script lang="ts" setup>
import Kaola from '#/static/images/evaluation/questionnaire/teaching_teacher.png';
</script>

<template>
  <div
    class="h-40 rounded-3xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow lg:h-48"
  >
    <div class="flex h-full flex-col justify-between px-4 py-5">
      <div class="flex">
        <p class="flex-1 leading-relaxed text-emerald-900/80">
          亲爱的同学，欢迎来到我们的心理测评世界。这里就像情绪的游乐场，充满了各种有趣的体验。通过测评，我们能更好地了解自己，期待看到更美好的你！
        </p>
        <img
          class="ml-3 h-full w-16 object-cover opacity-90 lg:w-24"
          :src="Kaola"
          alt="koala"
        />
      </div>
      <div
        class="mt-2 bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text pr-2 text-right text-xs font-bold italic text-transparent lg:text-sm"
      >
        --- 考拉老师寄语
      </div>
    </div>
  </div>
</template>
