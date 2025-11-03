<script lang="ts" setup>
import type { RecordInfo } from '@vben/types';

import type { TagType } from '#/api/constants';

import { Divider } from 'ant-design-vue';

import { getColorConfig } from '#/api/constants';
import LyButton from '#/components/LyButton/index.vue';

defineProps<{
  cardInfo: RecordInfo;
}>();

const emits = defineEmits<{
  (e: 'handleRecord', recordId: number): void;
}>();

/** 处理记录 */
function handleClick(recordId: number) {
  emits('handleRecord', recordId);
}
</script>

<template>
  <div class="flex h-[200px] flex-col rounded-xl bg-[#F7F8FA]">
    <div class="flex items-center justify-between p-4">
      <span class="text-sm font-medium">{{ cardInfo.title }}</span>
      <span
        v-if="cardInfo.status"
        class="text-xs"
        :style="{
          color: getColorConfig({
            target: 'color',
            tagType: cardInfo.status.colorType as TagType,
          }) as string,
        }"
      >
        {{ cardInfo.status.label }}
      </span>
    </div>

    <Divider />

    <div class="flex flex-1 flex-col justify-between p-4 text-xs">
      <div class="flex flex-col gap-2.5">
        <template v-if="cardInfo.labelList">
          <div v-for="label in cardInfo.labelList" :key="label.value">
            <span class="font-bold">{{ label.label }}：</span>
            <span class="text-[#4B4B4D]">
              {{ label.value }}
            </span>
          </div>
        </template>

        <div v-if="cardInfo?.tags" class="flex items-center gap-2.5">
          <div v-for="tag in cardInfo?.tags" :key="tag">
            <span
              class="inline-block rounded-full border border-solid border-gray-200 px-2 py-1 text-xs text-gray-700"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="cardInfo.showButton"
        class="flex justify-end"
        @click="handleClick(cardInfo.id)"
      >
        <LyButton type="success" ghost>
          {{ cardInfo.buttonText }}
        </LyButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-divider-horizontal) {
  margin: 0 !important;
}
</style>
