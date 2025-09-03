<script lang="ts" setup>
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { Divider } from 'ant-design-vue';
import dayjs from 'dayjs';

import LyButton from '#/components/LyButton/index.vue';
import { getDictObj } from '#/utils/dict';

defineProps<{
  buttonText: string;
  cardInfo: PsychologyStudentProfileApi.StudentAssessmentHistory;
}>();
</script>

<template>
  <div class="block rounded-xl bg-[#F7F8FA]">
    <div class="flex items-center justify-between p-4">
      <span class="text-sm font-medium">{{ cardInfo.taskName }}</span>
      <span
        v-if="cardInfo.status"
        class="text-xs"
        :class="cardInfo.status === 1 ? 'text-[#04DC70]' : 'text-[#FF9C05]'"
      >
        {{ cardInfo.status === 1 ? '已完成' : '待填写' }}
      </span>
    </div>
    <Divider />
    <div class="p-4 text-xs">
      <div class="flex flex-col gap-2.5">
        <div
          v-if="
            cardInfo.targetAudience !== undefined &&
            cardInfo.targetAudience !== null
          "
        >
          <span class="font-bold">测评对象：</span>
          <span class="text-[#4B4B4D]">
            {{
              getDictObj('assessment_target_audience', cardInfo.targetAudience)
                ?.label
            }}
          </span>
        </div>
        <div v-if="cardInfo.startline">
          <span class="font-bold">测评时间 ： </span>
          <span class="text-[#4B4B4D]">
            {{ dayjs(cardInfo.startline).format('YYYY-MM-DD') }}
          </span>
        </div>
        <!-- <div v-if="cardInfo.deadline">
          <span class="font-bold">老师 ：</span>
          <span class="text-[#4B4B4D]">
            {{ cardInfo.deadline }}
          </span>
        </div> -->
        <!-- <div v-if="cardInfo?.tags" class="flex items-center gap-2.5">
          <div v-for="tag in cardInfo?.tags" :key="tag">
            <span
              class="inline-block rounded-full border border-solid border-gray-200 px-2 py-1 text-xs text-gray-700"
            >
              {{ tag }}
            </span>
          </div>
        </div> -->
      </div>
      <div class="mt-4 flex justify-end">
        <LyButton type="success" ghost size="middle">
          {{ buttonText }}
        </LyButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-divider-horizontal) {
  margin: 0 !important;
}
</style>
