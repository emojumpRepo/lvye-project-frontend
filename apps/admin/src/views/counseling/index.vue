<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { RadioButton, RadioGroup } from 'ant-design-vue';
import dayjs from 'dayjs';

import PsychologicalConsultDialog from '#/components/Dialog/PsychologicalConsultDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import PageTitle from '#/components/PageTitle/index.vue';

import CounselingCalendar from './calendar.vue';
import StatisticCard from './components/StatisticCard.vue';
import CounselingList from './list.vue';

defineOptions({ name: 'CounselingCenter' });

const viewTypeOptions = [
  { label: '咨询记录', value: 1 },
  { label: '日历视图', value: 2 },
];

const isOpenModal = ref(false); // 心理咨询评估弹窗开关
const viewType = ref(1); // 视图类型，1:咨询记录，2:日历视图

const today = computed(
  () => `${dayjs().format('YYYY-MM-DD')} ${dayjs().format('dddd')}`,
);
</script>

<template>
  <Page auto-content-height :height-offset="50">
    <div class="flex h-full flex-col overflow-hidden px-4">
      <!-- 页面标题 -->
      <PageTitle title="咨询管理" :description="today" margin-bottom="mb-4">
        <template #action>
          <div class="flex items-center gap-4">
            <RadioGroup v-model:value="viewType">
              <RadioButton
                v-for="option in viewTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </RadioButton>
            </RadioGroup>
            <LyButton size="middle" type="success" class="h-10 w-[96px]">
              新建预约
            </LyButton>
          </div>
        </template>
      </PageTitle>

      <!-- 统计卡片栏 -->
      <div class="mb-6 grid shrink-0 grid-cols-4 gap-8">
        <StatisticCard
          icon-bg="#f3f6ff"
          icon-color="#247eff"
          icon-src="flowbite:messages-solid"
          title="今天咨询数"
          :value="12000"
        />

        <StatisticCard
          icon-bg="#e6fbf2"
          icon-color="#04dc70"
          icon-src="fluent:clipboard-task-24-filled"
          title="已完成数"
          :value="900"
        />

        <StatisticCard
          icon-bg="#fff2de"
          icon-color="#ff9900"
          icon-src="ph:clock-countdown-fill"
          title="待完成数"
          :value="12"
        />

        <StatisticCard
          icon-bg="#ffeded"
          icon-color="#f4532f"
          icon-src="ph:seal-warning-fill"
          title="逾期评估数"
          :value="100"
        />
      </div>

      <Transition name="fade" mode="out-in">
        <template v-if="viewType === 1">
          <!-- 咨询记录列表 -->
          <CounselingList />
        </template>
        <template v-else>
          <!-- 日历视图 -->
          <CounselingCalendar />
        </template>
      </Transition>
    </div>
    <PsychologicalConsultDialog v-model:open="isOpenModal" />
  </Page>
</template>

<style lang="scss" scoped>
:deep(.ant-radio-group) {
  height: 40px;
  line-height: 40px;
  // border-radius: 4px;

  .ant-radio-button-wrapper {
    height: 40px;
    padding: 0 20px;
    line-height: 40px;
    color: #979899;
  }

  .ant-radio-button-wrapper-checked {
    color: #04dc70 !important;
    background-color: #14e77e14 !important;
  }

  .ant-radio-button-wrapper:first-child {
    border-radius: 4px 0 0 4px;
  }

  .ant-radio-button-wrapper:last-child {
    border-radius: 0 4px 4px 0;
  }
}
</style>
