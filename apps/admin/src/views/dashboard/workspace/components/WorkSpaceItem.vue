<script setup lang="ts">
import type { ViewData } from '@vben/types';

import type { TagType } from '#/api/constants';

import { IconifyIcon } from '@vben/icons';

import { Progress } from 'ant-design-vue';

import { TAG_TYPE } from '#/api/constants';

withDefaults(
  defineProps<{
    viewData?: ViewData;
  }>(),
  {
    viewData: () => ({
      id: 0,
      studentName: '',
      className: '',
      tags: [],
      content: [],
    }),
  },
);

const emit = defineEmits<{
  (e: 'detail', item: ViewData): void;
}>();
</script>

<template>
  <div
    class="flex w-full cursor-pointer items-center rounded-lg bg-[#F7F8FA] p-5"
    :class="viewData.rightTopContent ? '' : 'justify-between'"
    @click="emit('detail', viewData)"
  >
    <div class="flex flex-1 flex-col gap-2">
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center gap-2">
          <!-- 学生姓名和班级 -->
          <span class="text-sm font-bold">
            {{ viewData.studentName
            }}{{ viewData.className ? ` · ${viewData.className}` : '' }}
          </span>

          <!-- 标签 -->
          <div class="flex items-center gap-2">
            <div v-for="(tag, index) in viewData.tags" :key="index">
              <span
                v-if="index === 0"
                class="rounded-full px-2 py-1 text-[10px] text-white"
                :style="{
                  backgroundColor:
                    TAG_TYPE[tag.colorType as TagType]?.color || '#979899',
                }"
              >
                {{ tag.label }}
              </span>

              <span
                v-if="index === 1"
                class="rounded-full border border-solid px-2 py-1 text-[10px]"
                :style="{
                  borderColor:
                    TAG_TYPE[tag.colorType as TagType]?.color || '#979899',
                  color: TAG_TYPE[tag.colorType as TagType]?.color || '#979899',
                }"
              >
                {{ tag.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- 右上内容 -->
        <div v-if="viewData.rightTopContent" class="text-xs text-[#959599]">
          {{ viewData.rightTopContent }}
        </div>
      </div>

      <!-- 内容 -->
      <div class="flex justify-between gap-4">
        <div class="flex flex-col gap-2">
          <div
            v-for="item in viewData.content"
            :key="item.label"
            class="flex text-xs text-[#959599]"
          >
            <span v-if="item.label" class="whitespace-nowrap">
              {{ item.label }}：
            </span>

            <span class="line-clamp-1">{{ item.value }}</span>
          </div>

          <Progress
            v-if="viewData.completionRate"
            :percent="viewData.completionRate"
            :show-info="false"
          />
        </div>

        <div v-if="viewData.rightTopContent" class="self-end">
          <IconifyIcon
            icon="mingcute:right-line"
            color="#959599"
            class="size-5"
          />
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="!viewData.rightTopContent">
      <IconifyIcon icon="mingcute:right-line" color="#959599" class="size-5" />
    </div>
  </div>
</template>
