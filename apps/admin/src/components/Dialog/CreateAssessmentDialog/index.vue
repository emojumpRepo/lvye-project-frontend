<script lang="ts" setup>
import { ref } from 'vue';

import { Modal as AModal } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

import CreateAssessmentDialogContent from './CreateAssessmentDialogContent.vue';
import CreateAssessmentDialogHeader from './CreateAssessmentDialogHeader.vue';

type BasicModel = {
  description: string;
  receiveType: string;
  timeRange: [null | string, null | string];
};

// v-model for open state
const open = defineModel<boolean>('open', { default: false });

const step = ref(1);
const basic = ref<BasicModel>({
  receiveType: '',
  timeRange: [null, null],
  description: '',
});

function handleClose() {
  open.value = false;
  // 可选：关闭时重置为第一步
  step.value = 1;
}

function onNext() {
  if (step.value < 4) step.value += 1;
}

function onPrev() {
  if (step.value > 1) step.value -= 1;
}
</script>

<template>
  <AModal
    v-model:open="open"
    :footer="false"
    :title="null"
    width="100%"
    wrap-class-name="full-modal"
    @cancel="handleClose"
  >
    <div class="p-6">
      <CreateAssessmentDialogHeader :current-step="step" />

      <div class="mt-6">
        <!-- Step 1: 基本信息设置 -->
        <CreateAssessmentDialogContent
          v-if="step === 1"
          v-model="basic"
          @next="onNext"
        />

        <!-- Step 2: 选择测评量表（占位实现，按 Figma 结构） -->
        <div
          v-else-if="step === 2"
          class="mx-auto max-w-[1049px] rounded-xl bg-white p-8"
        >
          <div class="text-[20px] font-bold">选择测评量表</div>
          <div class="mt-8 grid grid-cols-1 gap-9 md:grid-cols-3">
            <div
              class="rounded-2xl border-2 border-[#14E77E] bg-[rgba(20,231,126,0.06)] p-6"
            >
              <div class="text-[20px] font-semibold">初测动态测评问卷</div>
              <div class="mt-2 flex gap-2">
                <span
                  class="rounded border border-[#00EC76] bg-[#F2FFF6] px-1.5 py-1 text-[10px] text-[#01BE5F]"
                >
                  15-30分钟
                </span>
                <span
                  class="rounded border border-[#0060FF] bg-[rgba(0,96,255,0.05)] px-1.5 py-1 text-[10px] text-[#0060FF]"
                >
                  45题
                </span>
              </div>
              <div class="mt-3 text-[14px] text-[#979899]">
                适用于新生入学、转班学生的首次心理健康筛查……
              </div>
              <div class="mt-1 text-[14px] text-[#0060FF] underline">
                查看详情
              </div>
            </div>
            <div class="rounded-2xl bg-[#F7F8FA] p-6">
              <div class="text-[20px] font-semibold">复测动态测评问卷</div>
              <div class="mt-2 flex gap-2">
                <span
                  class="rounded border border-[#00EC76] bg-[#F2FFF6] px-1.5 py-1 text-[10px] text-[#01BE5F]"
                >
                  15-30分钟
                </span>
                <span
                  class="rounded border border-[#0060FF] bg-[rgba(0,96,255,0.05)] px-1.5 py-1 text-[10px] text-[#0060FF]"
                >
                  45题
                </span>
              </div>
              <div class="mt-3 text-[14px] text-[#979899]">
                适用于新生入学、转班学生的首次心理健康筛查……
              </div>
              <div class="mt-1 text-[14px] text-[#0060FF] underline">
                查看详情
              </div>
            </div>
            <div class="rounded-2xl bg-[#F7F8FA] p-6">
              <div class="text-[20px] font-semibold">主题动态测评问卷</div>
              <div class="mt-2 flex gap-2">
                <span
                  class="rounded border border-[#00EC76] bg-[#F2FFF6] px-1.5 py-1 text-[10px] text-[#01BE5F]"
                >
                  15-30分钟
                </span>
                <span
                  class="rounded border border-[#0060FF] bg-[rgba(0,96,255,0.05)] px-1.5 py-1 text-[10px] text-[#0060FF]"
                >
                  45题
                </span>
              </div>
              <div class="mt-3 text-[14px] text-[#979899]">
                适用于新生入学、转班学生的首次心理健康筛查……
              </div>
              <div class="mt-1 text-[14px] text-[#0060FF] underline">
                查看详情
              </div>
            </div>
          </div>
          <div class="mt-8 flex gap-[19px]">
            <LyButton
              type="default"
              size="middle"
              class="h-12 w-[120px] justify-center"
              @click="onPrev"
            >
              上一步
            </LyButton>
            <LyButton
              type="success"
              size="middle"
              class="h-12 w-[120px] justify-center"
              @click="onNext"
            >
              下一步
            </LyButton>
          </div>
        </div>

        <!-- Step 3 & 4（占位） -->
        <div v-else class="mx-auto max-w-[1049px] rounded-xl bg-white p-8">
          <div class="text-[20px] font-bold">步骤 {{ step }}</div>
          <div class="mt-6 text-[14px] text-[#979899]">
            此步骤内容待接入后端接口后补充。
          </div>
          <div class="mt-8 flex gap-[19px]">
            <LyButton
              type="default"
              size="middle"
              class="h-12 w-[120px] justify-center"
              @click="onPrev"
            >
              上一步
            </LyButton>
            <LyButton
              type="success"
              size="middle"
              class="h-12 w-[120px] justify-center"
              @click="onNext"
            >
              下一步
            </LyButton>
          </div>
        </div>
      </div>
    </div>
  </AModal>
</template>

<style lang="less">
.full-modal {
  .ant-modal {
    max-width: 100%;
    top: 0;
    padding-bottom: 0;
    margin: 0;
  }
  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: calc(100vh);
  }
  .ant-modal-body {
    flex: 1;
    background: #f5f6f8; // 轻灰底与内容区域反差
  }
}
</style>
