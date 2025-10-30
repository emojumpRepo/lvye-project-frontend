<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type {
  AssessmentQuestionnaireResultVO,
  QuestionnaireResultDataVO,
} from '@vben/types';

import type { MtuiUniversityQuestionnaireResult } from '#/api/psychology/assessment/index';

import { computed, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  questionnaireResult:
    | AssessmentQuestionnaireResultVO[]
    | MtuiUniversityQuestionnaireResult[];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 提取参与测评计算的维度
const dimensions = computed(() => {
  return props.questionnaireResult.flatMap((result: any) => {
    try {
      // 判断数据结构类型
      // 大学版：有 dimensionResults 属性
      if (
        'dimensionResults' in result &&
        Array.isArray(result.dimensionResults)
      ) {
        const questionnaireName = (result.questionnaireName ?? '')
          .replace(/^MTUI[:：]\s*/, '')
          .replace(/与极端意念\s*$/, '')
          .trim();

        return result.dimensionResults
          .filter(
            (item: any) =>
              Boolean(item.dimensionName) &&
              item.participateAssessmentCalc === 1,
          )
          .map((item: any) => ({
            name: (item.dimensionName ?? '').replaceAll(' ', '').trim(),
            questionnaireName,
            score: Number(item.score ?? 0),
            riskLevel: item.riskLevel ?? 1,
            level: item.level ?? '',
          }));
      }

      // 小学版：有 reportContent 属性（字符串，需要解析）
      if (
        'reportContent' in result &&
        typeof result.reportContent === 'string'
      ) {
        const reportContent = JSON.parse(
          result.reportContent,
        ) as QuestionnaireResultDataVO[];
        const questionnaireName = (result.questionnaireName ?? '')
          .replace(/^MTUI[:：]\s*/, '')
          .trim();

        return reportContent
          .filter(
            (item) =>
              Boolean(item.dimensionName) &&
              (item as any).participateAssessmentCalc === 1 &&
              // 过滤掉极端意念，只保留极端行为
              !item.dimensionName.includes('极端意念'),
          )
          .map((item: QuestionnaireResultDataVO) => ({
            name: (item.dimensionName ?? '').replaceAll('自我评价', '').trim(),
            questionnaireName,
            score: Number(item.score ?? 0),
            riskLevel: item.riskLevel ?? 1,
            level: item.level ?? '',
          }));
      }

      return [];
    } catch {
      return [];
    }
  });
});

// 自定义排序规则
const sortedDimensions = computed(() => {
  const dims = [...dimensions.value];

  // 定义优先级排序规则
  const getPriority = (d: any): number => {
    // 极端行为：优先级最高（0）
    if (
      d.name.includes('极端行为') ||
      d.questionnaireName.includes('极端行为')
    ) {
      return 0;
    }
    // 睡眠情况：优先级第二（1）
    if (d.name.includes('睡眠') || d.questionnaireName.includes('睡眠')) {
      return 1;
    }
    // 身体状况：优先级第三（2）
    if (d.name.includes('身体') || d.questionnaireName.includes('身体')) {
      return 2;
    }
    // 其他维度：优先级最低（3）
    return 3;
  };

  // 按问卷分组
  const groupByQuestionnaire = new Map<string, any[]>();
  dims.forEach((d) => {
    if (!groupByQuestionnaire.has(d.questionnaireName)) {
      groupByQuestionnaire.set(d.questionnaireName, []);
    }
    groupByQuestionnaire.get(d.questionnaireName)!.push(d);
  });

  // 对每个问卷内的维度按优先级排序
  const sortedGroups: any[] = [];
  groupByQuestionnaire.forEach((group) => {
    group.sort((a, b) => getPriority(a) - getPriority(b));
    sortedGroups.push(...group);
  });

  // 按问卷的最高优先级排序整体顺序
  const questionnaireOrder = [...groupByQuestionnaire.entries()]
    .map(([name, group]) => ({
      name,
      priority: Math.min(...group.map((d: any) => getPriority(d))),
      group,
    }))
    .sort((a, b) => a.priority - b.priority);

  // 重新组合最终排序结果
  const result: any[] = [];
  questionnaireOrder.forEach((item) => {
    result.push(...item.group);
  });

  return result;
});

// 按问卷分组统计维度数量
const dimensionCountByQuestionnaire = computed(() => {
  const countMap = new Map<string, number>();
  sortedDimensions.value.forEach((d) => {
    const count = countMap.get(d.questionnaireName) || 0;
    countMap.set(d.questionnaireName, count + 1);
  });
  return countMap;
});

// 格式化维度显示名称
function formatDimensionName(dimension: any): string {
  const count = dimensionCountByQuestionnaire.value.get(
    dimension.questionnaireName,
  );
  return count === 1
    ? dimension.questionnaireName
    : `${dimension.questionnaireName}\n(${dimension.name})`;
}

// 雷达图指示器配置
const indicators = computed(() => {
  return sortedDimensions.value.map((d) => ({
    name: formatDimensionName(d),
    max: 4, // 风险等级最大值为 4（重度风险）
  }));
});

// 数据值（使用 riskLevel 而不是 score）
const dataValues = computed(() => {
  return sortedDimensions.value.map((d) => d.riskLevel);
});

function renderChart() {
  if (dimensions.value.length === 0) {
    return;
  }

  renderEcharts({
    radar: {
      indicator: indicators.value,
      radius: '75%',
      splitNumber: 4,
      center: ['50%', '50%'],
      name: {
        textStyle: {
          color: '#666',
          fontSize: 12,
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
        },
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#CFD5DEFF',
          width: 1,
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#CFD5DEFF',
          width: 1,
        },
      },
    },
    // 添加图形配置用于显示刻度标签
    graphic: [
      {
        type: 'text',
        left: '50%',
        top: '10%',
        style: {
          text: '重度',
          fill: '#999',
          fontSize: 12,
        },
      },
      {
        type: 'text',
        left: '50%',
        top: '23%',
        style: {
          text: '中/中重度',
          fill: '#999',
          fontSize: 12,
        },
      },
      {
        type: 'text',
        left: '50%',
        top: '36%',
        style: {
          text: '轻度',
          fill: '#999',
          fontSize: 12,
        },
      },
      {
        type: 'text',
        left: '50%',
        top: '49%',
        style: {
          text: '无',
          fill: '#999',
          fontSize: 12,
        },
      },
    ],
    series: [
      // 雷达图系列（线和区域）
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        data: [
          {
            value: dataValues.value,
            name: '维度评估',
            lineStyle: {
              color: '#23BEAEFF',
              width: 2,
            },
            areaStyle: {
              color: '#23BEAEFF',
              opacity: 0.1,
            },
            itemStyle: {
              color: '#fff', // 空心圆的填充色为白色
              borderColor: '#23BEAEFF', // 边框颜色
              borderWidth: 2, // 边框宽度
            },
            emphasis: {
              itemStyle: {
                color: '#fff',
                borderColor: '#23BEAEFF',
                borderWidth: 2.5,
                shadowBlur: 4,
                shadowColor: '#23BEAEFF',
              },
            },
          },
        ],
      },
    ],
  });
}

watch(
  () => props.questionnaireResult,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      renderChart();
    }
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="assessment-radar">
    <EchartsUI
      v-if="dimensions.length > 0"
      ref="chartRef"
      height="100%"
      width="100%"
    />
    <div v-else class="flex-center h-full text-gray-400">暂无维度结果</div>
  </div>
</template>

<style scoped lang="scss">
.assessment-radar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
