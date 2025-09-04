<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { QuestionnaireResultDataVO } from '@vben/types';

import { computed, onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  questionnaireResult: QuestionnaireResultDataVO[];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const indicators = computed(() => {
  return props.questionnaireResult.map((item) => ({
    name: (item.dimensionName ?? '').replaceAll('自我评价', '').trim(),
  }));
});
const scores = computed(() => {
  return props.questionnaireResult.map((item) => item.score);
});

onMounted(() => {
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
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
