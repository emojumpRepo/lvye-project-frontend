<script setup lang="ts">
import { computed } from 'vue';

import { preferences } from '@vben/preferences';

const props = withDefaults(
  defineProps<{
    /** 头像地址 */
    avatar?: string;
    /** 班级名称 */
    className: string;
    /** 学生姓名 */
    name: string;
    /** 学号 */
    studentNo: number | string;
  }>(),
  {
    avatar: '',
    size: 'md',
  },
);

defineEmits<{
  (e: 'click'): void;
}>();

const avatarUrl = computed(() => props.avatar || preferences.app.defaultAvatar);
</script>

<template>
  <div class="inline-block w-full select-none" @click="$emit('click')">
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
    >
      <!-- 背景装饰 -->
      <div class="pointer-events-none absolute inset-0">
        <div
          class="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl"
        ></div>
        <div
          class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-black/10 blur-2xl"
        ></div>
      </div>

      <!-- 头像与右上角标 -->
      <div class="relative flex items-center gap-3">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="`${props.name} avatar`"
          class="h-12 w-12 rounded-full bg-white/20 object-cover p-1"
        />
        <div
          v-else
          class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl"
        >
          👤
        </div>

        <div class="ml-auto">
          <slot name="corner">
            <span
              class="rounded-md bg-white/15 px-2 py-0.5 text-sm font-semibold tracking-wider"
            >
              学生卡
            </span>
          </slot>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="relative mt-4 space-y-1">
        <div class="text-xl font-bold leading-none">{{ props.name }}</div>
        <div class="text-sm text-white/90">{{ props.className }}</div>
        <div class="text-xs text-white/80">学号：{{ props.studentNo }}</div>
      </div>

      <!-- 可扩展自定义内容 -->
      <div class="relative mt-3">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
