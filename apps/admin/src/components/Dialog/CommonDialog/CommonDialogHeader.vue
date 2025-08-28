<script lang="ts" setup>
import { computed } from 'vue';

import { Steps as ASteps } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

type StepItem = { description?: string; key?: number | string; label: string };

const props = withDefaults(
  defineProps<{
    currentStep?: number; // 1-based
    description?: string;
    showBack?: boolean;
    steps?: StepItem[];
    stepWrapperClass?: string;
    title?: string;
  }>(),
  {
    title: '',
    steps: () => [],
    currentStep: 1,
    showBack: true,
    description: '',
    stepWrapperClass: 'px-8 py-10',
  },
);

const emit = defineEmits<{
  (e: 'change', step: number): void;
  (e: 'back'): void;
}>();

const currentIndex = computed(() => Math.max(0, (props.currentStep || 1) - 1));

const items = computed(() =>
  (props.steps || []).map((s, idx) => ({
    index: idx + 1,
    label: s.label,
    description: s.description,
    active: (props.currentStep || 1) === idx + 1,
    done: (props.currentStep || 1) > idx + 1,
  })),
);
</script>

<template>
  <div>
    <!-- 顶部返回与标题 -->
    <div
      class="to-[rgba(255, 255, 255, 0.8)] mb-8 flex w-full items-center gap-4 bg-gradient-to-r from-[#FFFFFF] px-6 py-3"
    >
      <LyButton
        v-if="showBack"
        type="default"
        size="middle"
        class="rounded-[4px] px-[12px]"
        @click="emit('back')"
      >
        返回
      </LyButton>
      <div class="flex flex-col">
        <div class="text-[18px] font-bold">{{ props.title }}</div>
        <div class="text-[12px] text-[#979899]">
          {{ props.description }}
        </div>
      </div>
    </div>

    <!-- 步骤条 -->
    <div
      class="relative mx-auto w-full max-w-[1049px] rounded-2xl bg-gradient-to-b from-[#ffffff59] via-[#ffffff] to-[#ffffff]"
    >
      <div
        class="pointer-events-none absolute inset-0 rounded-2xl border border-white"
      ></div>

      <div :class="stepWrapperClass">
        <ASteps
          :current="currentIndex"
          label-placement="vertical"
          class="custom-steps"
        >
          <ASteps.Step
            v-for="it in items"
            :key="it.index"
            :title="it.label"
            :description="it.description"
          >
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
  </div>
</template>

<style scoped>
@media (min-width: 576px) {
  :deep(.custom-steps .ant-steps-item:last-child .ant-steps-item-container) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  :deep(.custom-steps .ant-steps-item:last-child .ant-steps-item-icon) {
    margin: 0;
  }

  /* 调整连线为 2px，纯色实现，并精确垂直居中到 40px 圆点的中心 */
  :deep(.custom-steps .ant-steps-item-tail) {
    top: 20px; /* 40/2 => 20，保证与圆心同一高度 */
    padding: 0 32px;
    margin-inline-start: 60px;
  }
}

:deep(.custom-steps .ant-steps-item-content) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 112px;
}

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
  line-height: 1;
}

:deep(.custom-steps .ant-steps-item-description) {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1;
  color: #b0b1b2 !important;
}

:deep(.custom-steps .ant-steps-item:not(:last-child) .ant-steps-item-content) {
  margin-left: 4px;
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
