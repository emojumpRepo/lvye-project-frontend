<script lang="ts" setup>
defineProps<{ tip: string }>();
</script>

<template>
  <div
    class="rounded-3xl border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow"
  >
    <div class="p-4 lg:p-6">
      <div class="flex items-center text-base lg:text-lg">
        <div
          class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg"
        >
          💡
        </div>
        <span
          class="bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text font-bold text-transparent"
        >
          心旅小贴士
        </span>
        <span
          class="ml-3 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 lg:text-xs"
        >
          今日更新
        </span>
      </div>
      <p
        class="mt-3 text-sm font-medium leading-relaxed text-amber-900/90 lg:mt-4"
      >
        {{ tip }}
      </p>
    </div>
  </div>
</template>
