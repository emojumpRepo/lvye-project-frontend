<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Spin } from 'ant-design-vue';
import { storeToRefs } from 'pinia';

import { useEvaluation } from '#/composables/useEvaluation';
import { useEvaluationStore } from '#/store/evaluation';

import QuestionnaireContainer from './components/QuestionnaireContainer.vue';

const route = useRoute();
const router = useRouter();

const evaluationStore = useEvaluationStore();
const {
  loading,
  isLastScene,
  selectedSlot,
  currentTaskNo,
  hasScenario,
  getNextIncompleteQuestionnaire,
} = storeToRefs(evaluationStore);
const {
  selectSlot,
  getNextSlot,
  startEvaluation,
  startEvaluationWithoutScenario,
  loadTaskDetail,
  exitFullscreen,
} = evaluationStore;

const { generateIframeSrc } = useEvaluation();

const hasIntro = ref(false); // 是否需要介绍
const hasScene = ref(false); // 是否需要场景

const iframeSrc = ref('');

// 页面关闭前确认函数
function handleBeforeUnload(event: BeforeUnloadEvent) {
  event.preventDefault();
}

onMounted(async () => {
  const sceneId = route.query.sceneId as string;
  const assessmentTaskNo = route.query.assessmentTaskNo as string;

  // 确保任务数据已加载
  if (assessmentTaskNo) {
    await loadTaskDetail(assessmentTaskNo);
  }

  if (sceneId) {
    hasScene.value = true;
    hasIntro.value = true;
    selectSlot(sceneId);
  }

  // 从 URL 参数获取问卷信息（无场景模式使用）
  const questionnaireId = route.query.questionnaireId as string;
  const questionnaireLink = route.query.questionnaireLink as string;

  iframeSrc.value = generateIframeSrc(questionnaireId, questionnaireLink);

  // 注册页面关闭前确认事件
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

function handleBack() {
  const targetPath = hasScenario.value
    ? '/evaluation/scene'
    : `/evaluation/assessment/${currentTaskNo.value}`;

  // 移除页面关闭前确认事件
  window.removeEventListener('beforeunload', handleBeforeUnload);

  // 先退出全屏模式，再跳转页面
  exitFullscreen();

  // 延迟跳转，确保退出全屏操作完成
  setTimeout(() => {
    router.replace({
      path: targetPath,
      query: {
        taskNo: currentTaskNo.value,
      },
    });
  }, 100);
}

async function handleContinue() {
  // 有测试场景的模式
  if (hasScenario.value) {
    // 如果当前是最后一个场景，则不进行跳转，直接提交回答
    if (isLastScene.value) {
      console.warn('last scene');
      // 移除页面关闭前确认事件
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 先退出全屏模式，再跳转页面
      exitFullscreen();

      setTimeout(() => {
        router.replace({
          path: '/evaluation/scene',
          query: {
            taskNo: currentTaskNo.value,
          },
        });
      }, 100);
      return;
    }
    const nextScene = getNextSlot();
    console.warn(nextScene);
    if (nextScene) {
      // 先切换到下一个插槽
      selectSlot(nextScene.id || 0);
      // 然后跳转到下一个插槽的问卷页面
      await startEvaluation(currentTaskNo.value || '', router);
      router.afterEach(() => {
        window.location.reload();
      });
    }
  } else {
    // 无测试场景的模式
    const nextQuestionnaire = getNextIncompleteQuestionnaire.value;
    if (nextQuestionnaire) {
      // 跳转到下一个未完成的问卷
      await startEvaluationWithoutScenario(
        currentTaskNo.value || '',
        nextQuestionnaire,
        router,
      );
      router.afterEach(() => {
        window.location.reload();
      });
    } else {
      // 所有问卷都已完成，跳转到测评详情页面
      console.warn('all questionnaires completed');
      // 移除页面关闭前确认事件
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 先退出全屏模式，再跳转页面
      exitFullscreen();

      setTimeout(() => {
        router.replace({
          path: `/evaluation/assessment/${currentTaskNo.value}`,
        });
      }, 100);
    }
  }
}

function handleComplete(payload: null | Record<string, unknown>) {
  // 处理问卷完成逻辑
  console.warn('Questionnaire completed:', payload);

  // 更新当前问卷的完成状态
  if (hasScenario.value && selectedSlot.value?.questionnaire) {
    // 有场景模式：更新当前场景的问卷状态
    selectedSlot.value.questionnaire.completed = true;
  } else {
    // 无场景模式：更新当前问卷的完成状态
    const questionnaireId = route.query.questionnaireId as string;
    if (questionnaireId && evaluationStore.taskDetailInfo?.questionnaires) {
      const currentQuestionnaire =
        evaluationStore.taskDetailInfo.questionnaires.find(
          (q) => q.questionnaireId === Number(questionnaireId),
        );
      if (currentQuestionnaire) {
        currentQuestionnaire.completed = true;
      }
    }
  }
}
</script>

<template>
  <Transition>
    <template v-if="loading">
      <div class="flex h-full items-center justify-center">
        <Spin size="large" />
      </div>
    </template>
    <template v-else>
      <QuestionnaireContainer
        :scene-data="selectedSlot"
        :iframe-src="iframeSrc"
        :has-intro="hasIntro"
        :is-last-scene="isLastScene"
        :has-scenario="hasScenario"
        :is-all-questionnaires-completed="!getNextIncompleteQuestionnaire"
        @continue="handleContinue"
        @back="handleBack"
        @complete="handleComplete"
      />
    </template>
  </Transition>
</template>
