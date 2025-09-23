<script lang="ts" setup>
import type { AssessmentScenarioSlotVO } from '@vben/types';

import { computed, ref, watch } from 'vue';

import { ArrowRight, Check } from '@vben/icons';

import LyButton from '#/components/LyButton/index.vue';

import QuestionnaireIframe from './QuestionnaireIframe.vue';
import QuestionnaireIntro from './QuestionnaireIntro.vue';

interface Props {
  sceneData: AssessmentScenarioSlotVO | null;
  iframeSrc: string;
  hasIntro?: boolean;
  showContinueButton?: boolean;
  isLastScene?: boolean;
  hasScenario?: boolean;
  isAllQuestionnairesCompleted?: boolean;
}

interface Emits {
  (e: 'continue'): void;
  (e: 'submit'): void;
  (e: 'back'): void;
  (e: 'complete', payload: null | Record<string, unknown>): void;
}

const props = withDefaults(defineProps<Props>(), {
  hasIntro: false,
  showContinueButton: true,
  isLastScene: false,
  hasScenario: true,
  isAllQuestionnairesCompleted: false,
});

const emit = defineEmits<Emits>();

const showIntro = ref(false);
const isIframeCompleted = ref(false);
const iframeCompletionPayload = ref<null | Record<string, unknown>>(null);

const bgUrl = computed(() => {
  const introBgImgUrl =
    props.sceneData?.metadata?.introConfig.backgroundImageUrl;
  return showIntro.value
    ? introBgImgUrl
    : 'https://kangpei-1371067330.cos.ap-guangzhou.myqcloud.com/20250923/answer_page_bg_1758608768536.png';
});

function handleIntroClose() {
  emit('back');
}

function handleIntroStart() {
  showIntro.value = false;
}

function handleIframeComplete(payload: null | Record<string, unknown>) {
  isIframeCompleted.value = true;
  iframeCompletionPayload.value = payload;
  emit('complete', payload);
}

function handleContinue() {
  emit('continue');
}

function handleBack() {
  emit('back');
}

watch(
  () => props.hasIntro,
  (newVal) => {
    showIntro.value = newVal;
  },
  { immediate: true },
);

// 场景切换时，强制展示介绍并重置完成状态
watch(
  () => props.sceneData?.id,
  () => {
    // 每个场景进入时都显示介绍
    showIntro.value = true;
    // 重置完成状态
    isIframeCompleted.value = false;
    iframeCompletionPayload.value = null;
    // 最小必要日志：保留一次场景变更提示
    console.warn('[Questionnaire] 场景变更，重置介绍与完成状态');
  },
);

// 不再冗余输出 showIntro 的每次变化
</script>

<template>
  <div
    class="questionnaire-container"
    :style="{
      backgroundImage: `url(${bgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }"
  >
    <!-- 引导弹窗 -->
    <QuestionnaireIntro
      :scene-data="sceneData"
      :show="showIntro"
      @close="handleIntroClose"
      @start="handleIntroStart"
    />

    <!-- 问卷内容区域 -->
    <div v-if="!showIntro" class="questionnaire-content">
      <QuestionnaireIframe
        :src="iframeSrc"
        @complete="handleIframeComplete"
        @back="handleBack"
      />

      <!-- 继续/提交按钮 -->
      <template v-if="showContinueButton && isIframeCompleted">
        <!-- 有场景模式 -->
        <template v-if="hasScenario">
          <template v-if="!isLastScene">
            <LyButton
              type="success"
              size="middle"
              class="continue-button"
              @click="handleContinue"
            >
              继续答题
              <ArrowRight class="ml-2 size-5" />
            </LyButton>
          </template>
          <template v-else>
            <LyButton
              type="success"
              size="middle"
              class="continue-button"
              @click="handleContinue"
            >
              提交回答
              <Check class="ml-2 size-5" />
            </LyButton>
          </template>
        </template>
        <!-- 无场景模式 -->
        <template v-else>
          <template v-if="!isAllQuestionnairesCompleted">
            <LyButton
              type="success"
              size="middle"
              class="continue-button"
              @click="handleContinue"
            >
              继续答题
              <ArrowRight class="ml-2 size-5" />
            </LyButton>
          </template>
          <template v-else>
            <LyButton
              type="success"
              size="middle"
              class="continue-button"
              @click="handleContinue"
            >
              提交回答
              <Check class="ml-2 size-5" />
            </LyButton>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.questionnaire-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.questionnaire-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.continue-button {
  @apply absolute bottom-10 right-12 flex h-12 w-[120px] items-center justify-center rounded-full text-[14px] font-bold hover:translate-y-[-2px];
}
</style>
