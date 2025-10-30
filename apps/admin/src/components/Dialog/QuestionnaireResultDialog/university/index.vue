<script setup lang="ts">
import type { QuestionnaireResultDataVO } from '@vben/types';

import type { MtuiUniversityResultRespVO } from '#/api/psychology/assessment/index';

import dayjs from 'dayjs';

import CoreRiskOverview from './components/CoreRiskOverview.vue';
import DetailDimensionOverview from './components/DetailDimensionOverview.vue';

const props = defineProps<{
  dimensions?: QuestionnaireResultDataVO[];
  mtuiResult?: MtuiUniversityResultRespVO;
  queryData: {
    finishTime: number;
    name: string;
    questionnaireName: string;
    studentNo: string;
    taskName: string;
    userId: number;
  };
  scenarioName: string;
}>();
</script>

<template>
  <div class="mx-auto w-full space-y-6">
    <!-- 测评报告标题 -->
    <div
      class="w-full text-center text-[36px] font-bold tracking-wider text-[#202D40]"
    >
      {{ scenarioName }}测评报告
    </div>

    <!-- 学生信息 -->
    <div class="student-info-card space-x-4 px-4 py-3">
      <span>姓名：{{ props.queryData.name }}</span>
      <span class="vertical-divider"></span>
      <span>学号：{{ props.queryData.studentNo }}</span>
      <span class="vertical-divider"></span>
      <span>
        测评时间：{{
          dayjs(props.queryData.finishTime).format('YYYY-MM-DD HH:mm:ss')
        }}
      </span>
    </div>
    <!-- 核心风险速览 -->
    <CoreRiskOverview :mtui-result="mtuiResult" />
    <!-- 细分维度总览 -->
    <DetailDimensionOverview :mtui-result="mtuiResult" />
  </div>
</template>

<style scoped lang="scss">
.student-info-card {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  color: #000000a6;
  background: rgb(255 255 255 / 60%);
  border-radius: 8px;

  &::before {
    position: absolute;
    inset: 0;
    padding: 1px;
    pointer-events: none;
    content: '';
    background: linear-gradient(
      180deg,
      rgb(255 255 255 / 100%),
      rgb(255 255 255 / 0%)
    );
    border-radius: 8px;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: xor;
    mask-composite: exclude;
  }

  .vertical-divider {
    display: inline-block;
    width: 1px;
    height: 16px;
    background: #0000001f;
  }
}
</style>
