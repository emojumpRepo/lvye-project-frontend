import type { ComputedRef } from 'vue';

import type { MtuiUniversityQuestionnaireResult } from '#/api/psychology/assessment/index';

import { computed } from 'vue';

import { specialLevel } from '@vben/types';

interface DimensionResult {
  dimensionCode: string;
  dimensionName: string;
  formattedName: string;
  questionnaireName: string;
  riskLevel: number;
  level: string;
  score: number;
  teacherComment: string;
  dimensionDescription: string;
  categoryName: string;
  showScore: number;
}

/**
 * 维度结果分类接口
 */
export interface CategorizedDimensions {
  /** 极端行为问卷的所有维度 */
  extremeBehavior: Array<DimensionResult>;
  /** 参与测评计算的其他问卷的所有维度 */
  participatingOther: Array<DimensionResult>;
  /** 不参与测评计算的剩余问卷的所有维度 */
  nonParticipating: Array<DimensionResult>;
}

/**
 * 维度格式化公共逻辑
 * 用于雷达图和综合风险评级的维度名称统一处理
 */
export function useDimensionFormatter(
  questionnaireResults:
    | ComputedRef<MtuiUniversityQuestionnaireResult[]>
    | MtuiUniversityQuestionnaireResult[],
) {
  // 确保 questionnaireResults 是响应式的
  const results = computed(() => {
    return Array.isArray(questionnaireResults)
      ? questionnaireResults
      : questionnaireResults.value;
  });

  // 格式化问卷结果：去除 MTUI 前缀和极端意念后缀，处理维度名称空格
  const formattedResults = computed(() => {
    return results.value.map((item) => ({
      ...item,
      questionnaireName: (item.questionnaireName ?? '')
        .replace(/^MTUI[:：]\s*/, '')
        .replace(/与极端意念\s*$/, '')
        .trim(),
      dimensionResults: item.dimensionResults.map((d) => ({
        ...d,
        questionnaireName: item.questionnaireName,
        dimensionName: (d.dimensionName ?? '').replaceAll(' ', '').trim(),
      })),
    }));
  });

  // 按问卷统计参与测评计算的维度数量（排除极端行为）
  const dimensionCountByQuestionnaire = computed(() => {
    const countMap = new Map<string, number>();
    formattedResults.value.forEach((questionnaire) => {
      const count = questionnaire.dimensionResults.filter(
        (d) =>
          d.participateAssessmentCalc === 1 &&
          !d.dimensionName.includes('极端行为'),
      ).length;
      if (count > 0) {
        countMap.set(questionnaire.questionnaireName, count);
      }
    });
    return countMap;
  });

  /**
   * 格式化维度显示名称
   * @param questionnaireName 问卷名称
   * @param dimensionName 维度名称
   * @returns 格式化后的名称
   * - 如果问卷只有1个维度：只显示问卷名称
   * - 如果问卷有多个维度：显示 问卷名称(维度名称)
   */
  function formatDimensionName(
    questionnaireName: string,
    dimensionName: string,
  ): string {
    const count = dimensionCountByQuestionnaire.value.get(questionnaireName);
    return count === 1
      ? questionnaireName
      : `${questionnaireName}(${dimensionName})`;
  }

  /**
   * 按风险等级获取格式化后的参与测评计算的维度名称列表
   * @param riskLevel 风险等级 (1-4)
   * @param excludeExtremeBehavior 是否排除极端行为，默认true
   * @returns 格式化后的维度名称数组
   */
  function getFormattedDimensionsByRiskLevel(
    riskLevel: number,
    excludeExtremeBehavior = true,
  ): string[] {
    return formattedResults.value
      .flatMap((questionnaire) =>
        questionnaire.dimensionResults
          .filter((d) => {
            const isParticipate = d.participateAssessmentCalc === 1;
            const isTargetLevel = d.riskLevel === riskLevel;
            const shouldExclude =
              excludeExtremeBehavior && d.dimensionName.includes('极端行为');
            return isParticipate && isTargetLevel && !shouldExclude;
          })
          .map((d) =>
            formatDimensionName(
              questionnaire.questionnaireName,
              d.dimensionName,
            ),
          ),
      )
      .filter(Boolean);
  }

  /**
   * 对维度结果进行排序
   * 特殊规则：生活事件问卷中，"近期负性生活事件造成的总应激强度"排在第一位
   */
  function sortDimensions(dimensions: DimensionResult[]): DimensionResult[] {
    return dimensions.sort((a, b) => {
      // 如果都是生活事件问卷的维度
      if (
        a.questionnaireName.includes('生活事件') &&
        b.questionnaireName.includes('生活事件')
      ) {
        // "近期负性生活事件造成的总应激强度"排在最前面
        const aIsStress =
          a.dimensionName.includes('近期负性生活事件造成的总应激强度');
        const bIsStress =
          b.dimensionName.includes('近期负性生活事件造成的总应激强度');

        if (aIsStress && !bIsStress) return -1;
        if (!aIsStress && bIsStress) return 1;
      }
      // 其他情况保持原顺序
      return 0;
    });
  }

  /**
   * 筛选出所有 riskLevel >= 3 的维度结果，按三个分类返回
   * @returns 分类后的高风险维度结果
   */
  function getHighRiskDimensionsByCategory(): CategorizedDimensions {
    const categorized: CategorizedDimensions = {
      extremeBehavior: [],
      participatingOther: [],
      nonParticipating: [],
    };

    // 先计算维度数量映射，避免在循环中重复访问 computed
    const countMap = dimensionCountByQuestionnaire.value;

    formattedResults.value.forEach((questionnaire) => {
      const isExtremeBehavior =
        questionnaire.questionnaireName.includes('极端行为');

      questionnaire.dimensionResults.forEach((d) => {
        // 排除"极端行为风险"维度
        if (d.dimensionName.includes('极端行为风险')) return;

        // 筛选条件：riskLevel >= 3 或 level 包含 specialLevel 中的任一值
        const hasSpecialLevel = specialLevel.some((sl) =>
          d.level?.includes(sl),
        );
        if (!hasSpecialLevel && d.riskLevel < 3) return;

        // 直接计算 formattedName，避免调用可能触发循环的函数
        const count = countMap.get(questionnaire.questionnaireName);
        const formattedName =
          count === 1
            ? questionnaire.questionnaireName
            : `${questionnaire.questionnaireName}(${d.dimensionName})`;

        const dimensionData = {
          dimensionName: d.dimensionName,
          questionnaireName: questionnaire.questionnaireName,
          riskLevel: d.riskLevel,
          score: d.score ?? 0,
          formattedName,
          level: d.level ?? '',
          teacherComment: d.teacherComment ?? '',
          dimensionDescription: d.dimensionDescription ?? '',
          dimensionCode: d.dimensionCode ?? '',
          showScore: d.showScore ?? 0,
          categoryName: '',
        };

        // 分类逻辑
        if (isExtremeBehavior) {
          categorized.extremeBehavior.push(dimensionData);
        } else if (d.participateAssessmentCalc === 1) {
          categorized.participatingOther.push(dimensionData);
        } else {
          categorized.nonParticipating.push(dimensionData);
        }
      });
    });

    // 对每个分类的维度进行排序
    return {
      extremeBehavior: sortDimensions(categorized.extremeBehavior),
      participatingOther: sortDimensions(categorized.participatingOther),
      nonParticipating: sortDimensions(categorized.nonParticipating),
    };
  }

  /**
   * 获取所有问卷的所有维度结果，按三个分类返回
   * @returns 分类后的所有维度结果
   */
  function getAllDimensionsByCategory(): CategorizedDimensions {
    const categorized: CategorizedDimensions = {
      extremeBehavior: [],
      participatingOther: [],
      nonParticipating: [],
    };

    // 先计算维度数量映射，避免在循环中重复访问 computed
    const countMap = dimensionCountByQuestionnaire.value;

    formattedResults.value.forEach((questionnaire) => {
      const isExtremeBehavior =
        questionnaire.questionnaireName.includes('极端行为');

      questionnaire.dimensionResults.forEach((d) => {
        // 排除"极端行为风险"维度
        if (d.dimensionName.includes('极端行为风险')) return;

        // 直接计算 formattedName，避免调用可能触发循环的函数
        const count = countMap.get(questionnaire.questionnaireName);
        const formattedName =
          count === 1
            ? questionnaire.questionnaireName
            : `${questionnaire.questionnaireName}(${d.dimensionName})`;

        const dimensionData = {
          dimensionName: d.dimensionName,
          questionnaireName: questionnaire.questionnaireName,
          riskLevel: d.riskLevel,
          score: d.score ?? 0,
          formattedName,
          level: d.level ?? '',
          teacherComment: d.teacherComment ?? '',
          dimensionDescription: d.dimensionDescription ?? '',
          dimensionCode: d.dimensionCode ?? '',
          categoryName: '',
          showScore: d.showScore ?? 0,
        };

        // 分类逻辑
        if (isExtremeBehavior) {
          categorized.extremeBehavior.push(dimensionData);
        } else if (d.participateAssessmentCalc === 1) {
          categorized.participatingOther.push(dimensionData);
        } else {
          categorized.nonParticipating.push(dimensionData);
        }
      });
    });

    // 对每个分类的维度进行排序
    return {
      extremeBehavior: sortDimensions(categorized.extremeBehavior),
      participatingOther: sortDimensions(categorized.participatingOther),
      nonParticipating: sortDimensions(categorized.nonParticipating),
    };
  }

  return {
    formattedResults,
    dimensionCountByQuestionnaire,
    formatDimensionName,
    getFormattedDimensionsByRiskLevel,
    getHighRiskDimensionsByCategory,
    getAllDimensionsByCategory,
  };
}
