<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type {
  AssessmentQuestionnaireResultVO,
  QuestionnaireResultDataVO,
} from '@vben/types';

import { computed, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  questionnaireResult: AssessmentQuestionnaireResultVO[];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const dimensions = computed(() => {
  return props.questionnaireResult.flatMap(
    (result: AssessmentQuestionnaireResultVO) => {
      const reportContent = JSON.parse(
        result.reportContent,
      ) as QuestionnaireResultDataVO[];
      return reportContent
        .filter((item) => Boolean(item.dimensionName))
        .map((item: QuestionnaireResultDataVO) => ({
          name: (item.dimensionName ?? '').replaceAll('自我评价', '').trim(),
          score: Number(item.score ?? 0),
        }));
    },
  );
});

const indicators = computed(() => dimensions.value);

const scores = computed(() => indicators.value.map((d) => d.score));

function renderChart() {
  renderEcharts({
    // legend: {
    //   bottom: 0,
    //   data: ['访问', '趋势'],
    // },
    radar: {
      indicator: indicators.value,
      radius: '60%',
      splitNumber: 8,
    },
    series: [
      {
        areaStyle: {
          opacity: 1,
          shadowBlur: 0,
          shadowColor: 'rgba(0,0,0,.2)',
          shadowOffsetX: 0,
          shadowOffsetY: 10,
        },
        data: [
          {
            itemStyle: {
              color: '#14E77E',
            },
            name: '维度',
            value: scores.value,
          },
        ],
        itemStyle: {
          // borderColor: '#fff',
          borderRadius: 10,
          borderWidth: 2,
        },
        symbolSize: 0,
        type: 'radar',
      },
    ],
    tooltip: {},
  });
}

watch(
  () => props.questionnaireResult,
  (newValue) => {
    if (newValue.length > 0) {
      renderChart();
    }
  },
  { immediate: true },
);
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
