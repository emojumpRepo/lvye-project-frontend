<script lang="ts" setup>
import { Divider } from 'ant-design-vue';

defineProps<{
  buttonText: string;
  cardInfo: {
    createTime: string;
    name: string;
    status?: string;
    tags?: string[];
    teacher?: string;
    type?: string;
  };
}>();
</script>

<template>
  <div class="block rounded-xl bg-[#F7F8FA]">
    <div class="flex items-center justify-between p-4">
      <span class="text-sm font-medium">{{ cardInfo.name }}</span>
      <span
        v-if="cardInfo.status"
        class="text-xs"
        :class="
          cardInfo.status === 'success' ? 'text-[#04DC70]' : 'text-[#FF9C05]'
        "
      >
        {{ cardInfo.status === 'success' ? '已完成' : '待填写' }}
      </span>
    </div>
    <Divider />
    <div class="p-4 text-xs">
      <div class="flex flex-col gap-2.5">
        <div v-if="cardInfo.type">
          <span class="font-bold">测评对象：</span>
          <span class="text-[#4B4B4D]">{{ cardInfo.type }}</span>
        </div>
        <div v-if="cardInfo.createTime">
          <span class="font-bold">测评时间 ：</span>
          <span class="text-[#4B4B4D]">{{ cardInfo.createTime }}</span>
        </div>
        <div v-if="cardInfo.teacher">
          <span class="font-bold">老师 ：</span>
          <span class="text-[#4B4B4D]">{{ cardInfo.teacher }}</span>
        </div>
        <div v-if="cardInfo.tags" class="flex items-center gap-2.5">
          <div v-for="tag in cardInfo.tags" :key="tag">
            <span
              class="inline-block rounded-full border border-solid border-gray-200 px-2 py-1 text-xs text-gray-700"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          class="cursor-pointer rounded-md border border-solid border-[#04DC70] px-3 py-1 text-sm text-[#04DC70] hover:bg-[#04DC70]/10"
        >
          {{ buttonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-divider-horizontal) {
  margin: 0 !important;
}
</style>
