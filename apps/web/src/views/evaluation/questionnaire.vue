<script lang="ts" setup>
import type { EvaluationScene } from './data';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { storeToRefs } from 'pinia';

import QuestionnaireContainer from './components/QuestionnaireContainer.vue';
import { EVALUATION_SCENES } from './data';

const route = useRoute();
const router = useRouter();

const surveyBaseUrl = import.meta.env.VITE_SURVEY_URL;

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);

const sceneData = ref<EvaluationScene | null>(null);

const hasIntro = ref(false); // 是否需要介绍
const hasScene = ref(false); // 是否需要场景

const iframeSrc = ref('');

onMounted(() => {
  const questionnaireId = route.query.questionnaireId as string;
  const sceneId = route.query.sceneId as string;
  const questionnaireLink = route.query.questionnaireLink as string;
  const assessmentTaskNo = route.query.assessmentTaskNo as string;

  if (sceneId) {
    hasScene.value = true;
    hasIntro.value = true;
    sceneData.value = EVALUATION_SCENES.find((s) => s.id === sceneId) || null;
  }

  iframeSrc.value = `${surveyBaseUrl}${questionnaireLink}?t=1756195405906&userId=${userInfo.value?.id}&assessmentNo=${assessmentTaskNo}&questionId=${questionnaireId}`;
});

function handleBack() {
  router.back();
}

function handleContinue() {
  // 如果当前是最后一个场景，则不进行跳转，直接提交回答
  if (sceneData.value?.order === EVALUATION_SCENES.length) {
    console.warn('last scene');
    return;
  }
  const nextScene = EVALUATION_SCENES.find(
    (s) => s.order === (sceneData.value?.order ?? 0) + 1,
  );
  if (nextScene) {
    router.replace({
      path: '/evaluation/questionnaire',
      query: {
        scene: nextScene.id,
      },
    });

    router.afterEach(() => {
      window.location.reload();
    });
  }
}

function handleComplete(payload: null | Record<string, unknown>) {
  // 处理问卷完成逻辑
  console.warn('Questionnaire completed:', payload);
}

const isLastScene = computed(
  () => sceneData.value?.order === EVALUATION_SCENES.length,
);
</script>

<template>
  <QuestionnaireContainer
    :scene-data="sceneData"
    :iframe-src="iframeSrc"
    :has-intro="hasIntro"
    :is-last-scene="isLastScene"
    @continue="handleContinue"
    @back="handleBack"
    @complete="handleComplete"
  />
</template>
