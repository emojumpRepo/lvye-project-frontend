import type {
  AssessmentScenarioDetailed,
  AssessmentScenarioSlotVO,
  AssessmentTask,
  ScenarioMetadata,
  SlotMetadata,
} from '@vben/types';

import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import {
  getAssessmentTask,
  startAssessment,
} from '#/api/psychology/assessment';

export const useEvaluationStore = defineStore('evaluation', () => {
  // 状态
  const currentTaskNo = ref<null | string>(null);
  const taskDetailInfo = ref<AssessmentTask | null>(null);
  const selectedSlot = ref<AssessmentScenarioSlotVO | null>(null);
  const loading = ref(false);
  const error = ref<null | string>(null);

  // 计算属性
  const scenarioData = computed<AssessmentScenarioDetailed | null>(() => {
    const scenarioDetail = taskDetailInfo.value?.scenarioDetail;
    if (!scenarioDetail) {
      return null;
    }

    try {
      // 创建深拷贝避免修改原始数据
      const processedDetail = {
        ...scenarioDetail,
        metadata: JSON.parse(
          scenarioDetail.metadataJson || '{}',
        ) as ScenarioMetadata,
        slots: scenarioDetail.slots
          ?.map((slot) => ({
            ...slot,
            metadata: JSON.parse(slot.metadataJson || '{}') as SlotMetadata,
          }))
          .sort((a, b) => a.slotOrder - b.slotOrder),
      };

      return processedDetail;
    } catch (parseError) {
      console.error('Failed to parse scenario metadata:', parseError);
      error.value = '场景数据解析失败';
      return null;
    }
  });

  const totalSlots = computed(() => scenarioData.value?.slots?.length || 0);
  const isLastScene = computed(
    () => selectedSlot.value?.slotOrder === totalSlots.value,
  );

  // 判断是否有测试场景
  const hasScenario = computed(() => !!scenarioData.value);

  // 获取下一个未完成的问卷（无场景模式）
  const getNextIncompleteQuestionnaire = computed(() => {
    if (!taskDetailInfo.value?.questionnaires) return null;
    return (
      taskDetailInfo.value.questionnaires.find((q) => !q.completed) || null
    );
  });

  // 计算总进度
  const progress = computed(() => {
    if (!taskDetailInfo.value?.questionnaires) return 0;
    const total = taskDetailInfo.value.questionnaires.length;
    return completedQuestionnaires.value > 0
      ? (completedQuestionnaires.value / total) * 100
      : 0;
  });

  // 计算总时长
  const totalDuration = computed(() => {
    if (!taskDetailInfo.value?.questionnaires) return 0;
    return taskDetailInfo.value.questionnaires.reduce(
      (acc, cur) => acc + (cur.estimatedDuration ?? 0),
      0,
    );
  });

  // 计算已完成问卷数量
  const completedQuestionnaires = computed(() => {
    if (!taskDetailInfo.value?.questionnaires) return 0;
    return taskDetailInfo.value.questionnaires.filter((q) => q.completed)
      .length;
  });

  // 方法
  async function loadTaskDetail(taskNo: string, isReload = false) {
    if (currentTaskNo.value === taskNo && taskDetailInfo.value && !isReload) {
      return; // 已经加载过，避免重复请求
    }

    loading.value = true;
    currentTaskNo.value = taskNo;

    try {
      const res = await getAssessmentTask(taskNo);
      taskDetailInfo.value = res;
    } catch (error) {
      console.error('loadTaskDetail error:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  function selectSlot(slotId: number | string) {
    if (!scenarioData.value?.slots) return;

    const slot = scenarioData.value.slots.find((s) => s.id === Number(slotId));
    selectedSlot.value = slot || null;
  }

  function getSlotById(
    slotId: number | string,
  ): AssessmentScenarioSlotVO | null {
    if (!scenarioData.value?.slots) return null;
    return (
      scenarioData.value.slots.find((s) => s.id === Number(slotId)) || null
    );
  }

  function getNextSlot(): AssessmentScenarioSlotVO | null {
    if (!selectedSlot.value || !scenarioData.value?.slots) return null;

    const nextOrder = selectedSlot.value.slotOrder + 1;
    return (
      scenarioData.value.slots.find((s) => s.slotOrder === nextOrder) || null
    );
  }

  function getPreviousSlot(): AssessmentScenarioSlotVO | null {
    if (!selectedSlot.value || !scenarioData.value?.slots) return null;

    const prevOrder = selectedSlot.value.slotOrder - 1;
    return (
      scenarioData.value.slots.find((s) => s.slotOrder === prevOrder) || null
    );
  }

  // 场景状态判断
  function getSlotStatus(
    slotId: number | string,
  ): 'available' | 'completed' | 'locked' {
    if (!scenarioData.value?.slots) return 'locked';

    const sortedSlots = [...scenarioData.value.slots].sort(
      (a, b) => a.slotOrder - b.slotOrder,
    );

    const currentIndex = sortedSlots.findIndex(
      (slot) => slot.id === Number(slotId),
    );
    if (currentIndex === -1) return 'locked';

    const currentSlot = sortedSlots[currentIndex];

    // 如果当前场景已完成
    if (currentSlot?.questionnaire?.completed) {
      return 'completed';
    }

    // 第一个场景总是可点击
    if (currentIndex === 0) {
      return 'available';
    }

    // 检查前一个场景是否已完成
    const previousSlot = sortedSlots[currentIndex - 1];
    return previousSlot?.questionnaire?.completed === true
      ? 'available'
      : 'locked';
  }

  function isSlotClickable(slotId: number | string): boolean {
    return getSlotStatus(slotId) === 'available';
  }

  function getNextAvailableSlot(): AssessmentScenarioSlotVO | null {
    if (!scenarioData.value?.slots) return null;

    const sortedSlots = [...scenarioData.value.slots].sort(
      (a, b) => a.slotOrder - b.slotOrder,
    );

    for (let i = 0; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];

      // 第一个 slot 总是可点击
      if (i === 0) {
        if (!currentSlot?.questionnaire?.completed) {
          return currentSlot || null;
        }
        continue;
      }

      // 检查前一个 slot 是否已完成
      const previousSlot = sortedSlots[i - 1];
      if (
        previousSlot?.questionnaire?.completed &&
        !currentSlot?.questionnaire?.completed
      ) {
        return currentSlot || null;
      }
    }

    return null;
  }

  // 开始测评（有场景模式）
  async function startEvaluation(taskNo: string, router: any) {
    if (!selectedSlot.value?.questionnaire) {
      throw new Error('No questionnaire selected');
    }

    try {
      await startAssessment(taskNo);
      router.replace({
        path: '/evaluation/questionnaire',
        query: {
          questionnaireId: selectedSlot.value.questionnaire.id,
          sceneId: selectedSlot.value.id,
          assessmentTaskNo: taskNo,
          questionnaireLink:
            selectedSlot.value.questionnaire?.externalLink?.split(
              'render/',
            )[1] || '',
        },
      });
    } catch (error_) {
      console.error('startEvaluation error:', error_);
      error.value = error_ instanceof Error ? error_.message : '开始测评失败';
      throw error_;
    }
  }

  // 开始测评（无场景模式 / 继续答题跳转）
  async function startEvaluationWithoutScenario(
    taskNo: string,
    questionnaire: any,
    router: any,
  ) {
    try {
      await startAssessment(taskNo);
      router.push({
        path: '/evaluation/questionnaire',
        query: {
          questionnaireId: questionnaire.questionnaireId,
          assessmentTaskNo: taskNo,
          questionnaireLink:
            questionnaire.externalLink?.split('render/')[1] || '',
        },
      });
    } catch (error_) {
      console.error('startEvaluationWithoutScenario error:', error_);
      error.value = error_ instanceof Error ? error_.message : '开始测评失败';
      throw error_;
    }
  }

  // 重置状态
  function reset() {
    currentTaskNo.value = null;
    taskDetailInfo.value = null;
    selectedSlot.value = null;
    loading.value = false;
  }

  return {
    // 状态
    currentTaskNo,
    taskDetailInfo,
    selectedSlot,
    loading,

    // 计算属性
    scenarioData,
    totalSlots,
    isLastScene,
    hasScenario,
    getNextIncompleteQuestionnaire,
    progress,
    totalDuration,
    completedQuestionnaires,

    // 方法
    loadTaskDetail,
    selectSlot,
    getSlotById,
    getNextSlot,
    getPreviousSlot,
    getSlotStatus,
    isSlotClickable,
    getNextAvailableSlot,
    startEvaluation,
    startEvaluationWithoutScenario,
    reset,
  };
});
