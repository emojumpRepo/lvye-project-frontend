<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    currentStep?: number; // 1-based
    steps?: string[];
  }>(),
  {
    currentStep: 1,
    steps: () => ['基本信息', '选择量表', '选择对象', '确认发布'],
  },
);

// Figma Dev assets
const ellipseActive =
  'http://localhost:3845/assets/7d58263d5a0edaf864022bc38df80e564779fe75.svg';
const ellipseInactive =
  'http://localhost:3845/assets/08ccc5cc49260e5fd95b8637dd8fe74003a481d7.svg';
const lineActive =
  'http://localhost:3845/assets/7858ba218830a2f9cd819d0d70ad39a9c00c4a85.svg';
const lineInactive =
  'http://localhost:3845/assets/6d99145b2e3331e1a25ab25ada889dcac9164865.svg';

const items = computed(() =>
  props.steps.map((label, idx) => ({
    index: idx + 1,
    label,
    active: props.currentStep === idx + 1,
    done: props.currentStep > idx + 1,
  })),
);
</script>

<template>
  <div
    class="relative rounded-2xl bg-gradient-to-b from-[#ffffff59] via-[#ffffff] to-[#ffffff]"
  >
    <div
      class="pointer-events-none absolute inset-0 rounded-2xl border border-white"
    ></div>

    <div class="px-8 py-8">
      <div class="flex items-center justify-between">
        <template v-for="(it, i) in items" :key="it.index">
          <div class="flex w-1/4 flex-col items-center gap-4">
            <div class="relative h-10 w-10">
              <img
                :src="it.active || it.done ? ellipseActive : ellipseInactive"
                alt=""
                class="h-10 w-10"
              />
              <div
                class="pointer-events-none absolute inset-0 flex items-center justify-center text-white"
              >
                <span class="text-[16px] font-semibold">{{ it.index }}</span>
              </div>
            </div>
            <div
              class="text-[16px]"
              :class="
                it.active ? 'font-semibold text-[#14E77E]' : 'text-[#979899]'
              "
            >
              {{ it.label }}
            </div>
          </div>

          <div v-if="i < items.length - 1" class="flex w-1/12 items-center">
            <img
              :src="items[i] && items[i].done ? lineActive : lineInactive"
              alt=""
              class="h-[2px] w-full"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
