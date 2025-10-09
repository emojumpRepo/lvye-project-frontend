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
      class="student-card group relative overflow-hidden rounded-3xl border border-gray-200/50 bg-gradient-to-br from-white via-slate-50 to-gray-100 p-6 text-gray-800 shadow transition-all duration-500 hover:scale-105 hover:shadow-xl active:scale-100"
    >
      <!-- 动态背景装饰 -->
      <div class="pointer-events-none absolute inset-0">
        <!-- 主要光晕效果 -->
        <div
          class="absolute -right-12 -top-12 h-40 w-40 animate-pulse rounded-full bg-gradient-to-br from-emerald-200/20 to-teal-200/15 blur-3xl transition-all duration-1000 group-hover:scale-150"
        ></div>
        <div
          class="absolute -bottom-16 -left-16 h-48 w-48 animate-pulse rounded-full bg-gradient-to-tr from-blue-200/15 to-cyan-200/20 blur-3xl transition-all duration-1000 group-hover:scale-125"
        ></div>

        <!-- 几何装饰元素 -->
        <div
          class="absolute right-4 top-4 h-20 w-20 text-emerald-400 opacity-5"
        >
          <svg viewBox="0 0 100 100" class="animate-spin-slow h-full w-full">
            <polygon
              points="50,5 90,25 90,75 50,95 10,75 10,25"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="2"
              fill-opacity="0.1"
            />
          </svg>
        </div>

        <!-- 网格背景 -->
        <div class="bg-grid-pattern absolute inset-0 opacity-5"></div>
      </div>

      <!-- 头像与右上角标 -->
      <div class="relative flex items-center gap-4">
        <div class="relative">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="`${props.name} avatar`"
            class="border-3 h-16 w-16 rounded-full border-emerald-200/60 object-cover shadow transition-all duration-300 group-hover:border-emerald-300/80 group-hover:shadow-xl"
          />
          <div
            v-else
            class="border-3 flex h-16 w-16 items-center justify-center rounded-full border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 text-2xl text-emerald-600 shadow transition-all duration-300 group-hover:border-emerald-300/80"
          >
            👤
          </div>
          <!-- 头像光环 -->
          <div
            class="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-300/40 to-teal-300/40 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100"
          ></div>
        </div>

        <div class="ml-auto">
          <slot name="corner">
            <div class="relative cursor-pointer">
              <span
                class="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-100/80 to-teal-100/60 px-3 py-1.5 text-sm font-bold tracking-wider text-emerald-700 backdrop-blur-sm transition-all duration-300 group-hover:from-emerald-200/90 group-hover:to-teal-200/70"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fill-rule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                学生卡
              </span>
              <!-- 角标光效 -->
              <div
                class="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-300/25 to-teal-300/25 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100"
              ></div>
            </div>
          </slot>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="relative mt-6 space-y-2">
        <div class="flex items-center gap-2">
          <div
            class="text-xl font-black leading-none tracking-wide drop-shadow"
          >
            {{ props.name }}
          </div>
          <div
            class="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
          ></div>
        </div>
        <div class="flex items-center gap-2 text-base text-gray-600">
          <svg
            class="h-4 w-4 text-emerald-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          {{ props.className }}
        </div>
        <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <svg
            class="h-4 w-4 text-teal-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="shrink-0">学号：</div>
          <div class="font-mono font-semibold tracking-wider">
            {{ props.studentNo }}
          </div>
        </div>
      </div>

      <!-- 装饰性底部条纹 -->
      <div
        class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent"
      ></div>

      <!-- 可扩展自定义内容 -->
      <div class="relative mt-4">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .student-card {
    padding: 1rem;
  }
}

.student-card {
  position: relative;
  backdrop-filter: blur(10px);
}

.student-card::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  background: linear-gradient(
    135deg,
    rgb(255 255 255 / 60%) 0%,
    rgb(255 255 255 / 30%) 50%,
    rgb(255 255 255 / 60%) 100%
  );
  border-radius: inherit;
}

.bg-grid-pattern {
  background-image:
    linear-gradient(rgb(255 255 255 / 10%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 10%) 1px, transparent 1px);
  background-size: 20px 20px;
}

.animate-spin-slow {
  animation: spin 20s linear infinite;
}

.border-3 {
  border-width: 3px;
}

/* 悬浮时的额外光效 */
.student-card:hover {
  box-shadow:
    0 25px 50px -12px rgb(0 0 0 / 15%),
    0 0 0 1px rgb(16 185 129 / 20%),
    0 0 30px rgb(16 185 129 / 25%);
}
</style>
