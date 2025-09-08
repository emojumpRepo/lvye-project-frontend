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

const imgBaseUrl = '../../../../static/images/evaluation/questionnaire/';

const bgUrl = computed(() => {
  console.warn(props.sceneData);
  const introBgImgUrl =
    props.sceneData?.metadata?.introConfig.backgroundImageUrl;
  return showIntro.value
    ? introBgImgUrl ||
        new URL(
          `${imgBaseUrl}/${props.sceneData?.slotKey}.png`,
          import.meta.url,
        ).href
    : new URL(`${imgBaseUrl}answer_page_bg.png`, import.meta.url).href;
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
  (newVal, oldVal) => {
    console.warn('QuestionnaireContainer hasIntro 变化:', {
      oldValue: oldVal,
      newValue: newVal,
      currentShowIntro: showIntro.value,
      propsHasIntro: props.hasIntro,
    });
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
    console.warn('场景变更，重置介绍与完成状态');
  },
);

// 添加一个 watch 来监听 showIntro 的变化
watch(
  () => showIntro.value,
  (newVal) => {
    console.warn('showIntro 变化:', newVal);
  },
);
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
