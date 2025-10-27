<script setup lang="ts">
import AssessmentProgress from './AssessmentProgress.vue';

withDefaults(
  defineProps<{
    gap?: number;
    item: any;
    showClassName?: boolean;
    showProgress?: boolean;
  }>(),
  {
    showClassName: true,
    showProgress: true,
    gap: 20,
  },
);
</script>

<template>
  <div
    class="flex w-full items-center justify-between"
    :style="{ gap: `${gap}px` }"
  >
    <!-- 班级名称 -->
    <template v-if="showClassName">
      <div class="w-1/5 whitespace-nowrap">
        {{ item.name }}
      </div>
    </template>

    <!-- 数量和进度条 -->
    <template v-if="showProgress">
      <div class="flex flex-1 items-center justify-between gap-10">
        <div class="grid w-1/3 grid-cols-4">
          <div
            v-for="child in item.riskLevelList"
            :key="child.riskLevel"
            class="col-span-1 text-center"
          >
            <span
              class="text-primary whitespace-nowrap text-sm"
              :style="{ color: child.color }"
            >
              {{ child.count }}
            </span>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="flex-1">
          <AssessmentProgress
            :segments="item.progressColor"
            :show-percent="false"
          />
        </div>
      </div>
    </template>
  </div>
</template>
