<script lang="ts" setup>
import LyButton from '#/components/LyButton/index.vue';

defineProps<{
  createdAt: string;
  expireAt: string;
  finished: number;
  id: string;
  progress: number;
  status: '已关闭' | '已完成' | '进行中';
  total: number;
  type: string;
}>();
</script>

<template>
  <div class="relative rounded-xl bg-white p-6">
    <div class="flex items-start justify-between">
      <div class="text-[16px] font-semibold text-[#17191A]">{{ id }}</div>
      <div
        class="text-[14px]"
        :class="{
          'text-[#1966FF]': status === '进行中',
          'text-[#14E77E]': status === '已完成',
          'text-[#979899]': status === '已关闭',
        }"
      >
        {{ status }}
      </div>
    </div>
    <div class="mt-2 flex items-center gap-3 text-[12px] text-[#979899]">
      <span>创建时间：{{ createdAt }}</span>
      <span
        class="inline-block h-4 w-2.5 bg-[url('http://localhost:3845/assets/e0df124f15c17d9f442dcda28d54694319f04b1d.svg')] bg-center bg-no-repeat"
      ></span>
      <span>有效期至{{ expireAt }}</span>
      <span
        class="rounded bg-[rgba(20,231,126,0.12)] px-1 py-0.5 text-[#14E77E]"
      >
        {{ type }}
      </span>
    </div>
    <div class="mt-5 h-1 w-full rounded-2xl bg-[#EAEBED]">
      <div
        class="h-1 rounded-2xl bg-[#14E77E]"
        :style="{ width: `${Math.round(progress)}%` }"
      ></div>
    </div>
    <div class="mt-2 text-[12px] text-[#4C4C4D]">
      已完成 {{ finished }}/{{ total }} （{{ progress }}%）
    </div>
    <div class="absolute right-6 top-6">
      <LyButton type="success" size="small">查看详情</LyButton>
    </div>
  </div>
</template>

<style scoped></style>
