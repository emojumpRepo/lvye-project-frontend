<script lang="ts" setup>
import { computed } from 'vue';

import { Steps as ASteps } from 'ant-design-vue';

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

const emit = defineEmits<{
  (e: 'change', step: number): void;
}>();

const currentIndex = computed(() => Math.max(0, (props.currentStep || 1) - 1));

const items = computed(() =>
  props.steps.map((label, idx) => ({
    index: idx + 1,
    label,
    active: (props.currentStep || 1) === idx + 1,
    done: (props.currentStep || 1) > idx + 1,
  })),
);
</script>

<template>
  <div
    class="relative mx-auto w-full max-w-[1049px] rounded-2xl bg-gradient-to-b from-[#ffffff59] via-[#ffffff] to-[#ffffff]"
  >
    <div
      class="pointer-events-none absolute inset-0 rounded-2xl border border-white"
    ></div>

    <div class="px-8 py-10">
      <ASteps
        :current="currentIndex"
        label-placement="vertical"
        class="custom-steps"
        @change="(i: number) => emit('change', i + 1)"
      >
        <ASteps.Step v-for="it in items" :key="it.index" :title="it.label">
          <template #icon>
            <div
              class="step-dot"
              :class="
                it.active
                  ? 'step-dot--active'
                  : it.done
                    ? 'step-dot--done'
                    : 'step-dot--wait'
              "
            >
              <span class="step-dot__num">{{ it.index }}</span>
            </div>
          </template>
        </ASteps.Step>
      </ASteps>
    </div>
  </div>
</template>

<style scoped>
/* 调整 Steps 在不同状态下的标题颜色和字重 */
:deep(.custom-steps .ant-steps-item-process .ant-steps-item-title),
:deep(.custom-steps .ant-steps-item-finish .ant-steps-item-title) {
  font-weight: 600;
  color: #000;
}

:deep(.custom-steps .ant-steps-item-wait .ant-steps-item-title) {
  font-weight: 500;
  color: #979899;
}

:deep(.custom-steps .ant-steps-item-title) {
  margin-left: 8px;
}

:deep(.custom-steps .ant-steps-item:last-child) {
  margin-right: 8px;
}

/* 调整连线为 2px，纯色实现，并精确垂直居中到 40px 圆点的中心 */
:deep(.custom-steps .ant-steps-item-tail) {
  top: 20px; /* 40/2 => 20，保证与圆心同一高度 */
  padding: 0 32px;
  margin-inline-start: 60px; /* 半径: 40/2 => 20，使线从圆心开始 */
}

:deep(.custom-steps .ant-steps-item-tail::after) {
  height: 1px;
  background-color: #e6e7eb;
}

/* 进行中与待处理（灰色） */
:deep(.custom-steps .ant-steps-item-process .ant-steps-item-tail::after),
:deep(.custom-steps .ant-steps-item-wait .ant-steps-item-tail::after) {
  background-color: #e6e7eb;
}

/* 调整图标容器大小，避免默认 32px 限制 */
:deep(.custom-steps .ant-steps-item-icon) {
  width: 40px;
  height: 40px;
}

:deep(.custom-steps .ant-steps-item-active .ant-steps-item-tail::after) {
  background-color: #04dc70;
}

.step-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 9999px;
}

.step-dot__num {
  line-height: 1;
}

.step-dot--active,
.step-dot--done {
  color: #fff;
  background-color: #04dc70;
}

.step-dot--wait {
  font-weight: 500;
  color: #b0b1b2;
  background-color: #f0f2f5;
}
</style>
