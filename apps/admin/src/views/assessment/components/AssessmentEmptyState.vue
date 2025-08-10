<script lang="ts" setup>
defineEmits<{
  create: [];
}>();
</script>

<template>
  <div class="flex min-h-[450px] items-center justify-center rounded-xl bg-white">
    <div class="flex flex-col items-center gap-4">
      <!-- 占位图标 -->
      <div
        class="flex h-[100px] w-[100px] items-center justify-center rounded bg-[#f8f8f8]"
      >
        <span class="text-[14px] leading-[22px] text-black">缺省图待补</span>
      </div>

      <!-- 提示文本 -->
      <p class="text-center text-[14px] leading-[22px] text-[#b0b1b2]">
        没有找到符合条件的测评任务
      </p>

      <!-- 创建按钮 -->
      <button
        class="rounded-md bg-[#14e77e] px-4 py-2 text-[14px] leading-[22px] text-white transition-colors hover:bg-[#12d174]"
        @click="$emit('create')"
      >
        立即创建
      </button>
    </div>
  </div>
</template>