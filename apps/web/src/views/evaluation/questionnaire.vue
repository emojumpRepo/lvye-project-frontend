<script lang="ts" setup>
import type { EvaluationScene } from './data';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import QuestionnaireContainer from './components/QuestionnaireContainer.vue';
import { EVALUATION_SCENES } from './data';

const route = useRoute();
const router = useRouter();

const sceneData = ref<EvaluationScene | null>(null);
const iframeSrc = ref(
  'http://localhost:8080/render/zkBhlefz?t=1755843068206&userId=157&assessmentId=28&questionId=9',
);

// 根据场景数据判断是否需要介绍
const hasIntro = ref(true);

onMounted(() => {
  const scene = route.query.scene as string;
  sceneData.value = EVALUATION_SCENES.find((s) => s.id === scene) || null;

  // 根据场景数据或其他逻辑判断是否需要介绍
  // 这里可以根据实际需求调整逻辑
  hasIntro.value = !!sceneData.value;
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
