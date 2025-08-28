import { useUserStore } from '@vben/stores';

import { storeToRefs } from 'pinia';

import { useEvaluationStore } from '#/store/evaluation';

export function useEvaluation() {
  const evaluationStore = useEvaluationStore();
  const userStore = useUserStore();
  const { userInfo } = storeToRefs(userStore);

  const surveyBaseUrl = import.meta.env.VITE_SURVEY_URL;

  // 生成问卷 iframe 链接
  function generateIframeSrc(
    questionnaireId?: string,
    questionnaireLink?: string,
  ) {
    const { currentTaskNo, selectedSlot, hasScenario } =
      storeToRefs(evaluationStore);

    if (!currentTaskNo.value) {
      return '';
    }

    // 有场景模式：从 selectedSlot 获取问卷信息
    if (hasScenario.value && selectedSlot.value?.questionnaire) {
      const link =
        selectedSlot.value.questionnaire.externalLink?.split('render/')[1] ||
        '';
      const id = selectedSlot.value.questionnaire.id;

      return `${surveyBaseUrl}${link}&userId=${userInfo.value?.id}&assessmentNo=${currentTaskNo.value}&questionId=${id}`;
    }

    // 无场景模式：从传入的参数获取问卷信息
    if (questionnaireId && questionnaireLink) {
      return `${surveyBaseUrl}${questionnaireLink}&userId=${userInfo.value?.id}&assessmentNo=${currentTaskNo.value}&questionId=${questionnaireId}`;
    }

    return '';
  }

  // 获取场景提示信息
  function getSlotTipMessage(slot: any) {
    const status = evaluationStore.getSlotStatus(slot.id);

    if (status === 'locked') {
      const previousSlot = evaluationStore.scenarioData?.slots?.find(
        (s) => s.slotOrder === slot.slotOrder - 1,
      );
      return `${slot.slotName}未解锁，请先前往${previousSlot?.slotName || '前一个场景'}吧~`;
    } else if (status === 'completed') {
      const nextSlot = evaluationStore.scenarioData?.slots?.find(
        (s) => s.slotOrder === slot.slotOrder + 1,
      );
      return nextSlot
        ? `${slot.slotName}已完成，前往${nextSlot.slotName}吧~`
        : '本次测试已结束，请前往汇总报告查看结果';
    }

    return '';
  }

  return {
    evaluationStore,
    userInfo,
    surveyBaseUrl,
    generateIframeSrc,
    getSlotTipMessage,
  };
}
