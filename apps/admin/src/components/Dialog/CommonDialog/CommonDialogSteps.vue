<script lang="ts" setup>
import { computed } from 'vue';

import { Steps as ASteps } from 'ant-design-vue';

import LyTag from '#/components/LyTag/index.vue';

type StepItem = {
  description?: string;
  done?: boolean;
  key?: number;
  label: string;
};

const props = withDefaults(
  defineProps<{
    currentStep?: number;
    steps?: StepItem[];
    titleColor?: string;
    type?: 'default' | 'tag';
  }>(),
  {
    steps: () => [],
    currentStep: 1,
    titleColor: '#000',
    type: 'default',
  },
);

// 索引从0开始
const currentIndex = computed(() => {
  const index =
    props.steps.findIndex((step) => step.key === props.currentStep) + 1;
  return index || Math.max(0, props.currentStep || 1);
});

const items = computed(() =>
  props.steps.map((s, idx) => ({
    key: s.key,
    index: idx + 1,
    label: s.label,
    description: s.description,
    done: s.done ?? (props.currentStep || 1) > idx + 1,
  })),
);
</script>

<template>
  <div
    class="relative flex h-full rounded-2xl bg-gradient-to-b from-[#fff] via-[#fff] to-[#ffffff59]"
  >
    <div class="scroll-area flex overflow-y-auto p-8">
      <ASteps
        :current="currentIndex"
        label-placement="vertical"
        direction="vertical"
      >
        <ASteps.Step v-for="it in items" :key="it.index">
          <template #title>
            <div class="flex items-center gap-2">
              <span
                class="whitespace-nowrap font-bold"
                :style="
                  currentIndex === it.index - 1
                    ? `color: ${props.titleColor}`
                    : 'color: #000'
                "
              >
                {{ it.label }}
              </span>
              <LyTag
                v-if="type === 'tag'"
                :color-type="it.done ? 'success' : 'processing'"
                :tag-label="it.description"
              />
            </div>
          </template>
          <template #description>
            <div class="flex flex-col gap-2">
              <div
                v-if="type === 'default'"
                class="whitespace-nowrap text-sm text-[#979899]"
              >
                {{ it.description }}
              </div>
              <slot name="event" :index="it.index" :key="it.key"></slot>
            </div>
          </template>
        </ASteps.Step>
      </ASteps>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 35%);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 999px;
}
</style>
