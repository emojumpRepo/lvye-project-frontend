<script setup lang="ts">
import { computed, ref } from 'vue';

import {
  Badge as ABadge,
  Divider as ADivider,
  Empty as AEmpty,
  Pagination as APagination,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import crisisContinuousIcon from '../../../static/icons/crisis/crisis_continuous_icon.png';
import crisisCriticalIcon from '../../../static/icons/crisis/crisis_critical_icon.png';
import crisisEvaluationIcon from '../../../static/icons/crisis/crisis_evaluation_icon.png';
import crisisGeneralIcon from '../../../static/icons/crisis/crisis_general_icon.png';
import crisisSevereIcon from '../../../static/icons/crisis/crisis_severe_icon.png';

interface InterventionType {
  bgColor: string;
  color: string;
  description: string;
  icon: string;
  title: string;
}

const props = defineProps<{
  interventionItem: {
    count: number;
    list: {
      className: string;
      counselor: string;
      name: string;
      updateTime: number;
    }[];
    type: number;
  };
}>();

const currentPage = ref(1);
const pageSize = ref(5);

// 干预卡片类型
const interventionTypeMap: Record<number, InterventionType> = {
  1: {
    title: '一般(一类)',
    description: '需要关注但无需干预',
    icon: crisisGeneralIcon,
    bgColor: '#CFFFF1',
    color: '#25D94C',
  },
  2: {
    title: '严重(二类)',
    description: '需要定期咨询干预',
    icon: crisisSevereIcon,
    bgColor: '#FFEAD2',
    color: '#FF9C05',
  },
  3: {
    title: '重大(三类)',
    description: '需要紧急干预',
    icon: crisisCriticalIcon,
    bgColor: '#FFDBD0',
    color: '#FF0831',
  },
  4: {
    title: '持续观察',
    description: '需要长期跟踪观察的学生',
    icon: crisisContinuousIcon,
    bgColor: '#D0E5FF',
    color: '#1966FF',
  },
  5: {
    title: '待评估',
    description: '等待教师专业评估',
    icon: crisisEvaluationIcon,
    bgColor: '#DDE3FF',
    color: '#8D00F1',
  },
};

// 干预卡片类型
const interventionType = computed((): InterventionType | undefined => {
  return interventionTypeMap[props.interventionItem.type];
});

function handlePageChange(page: number) {
  console.log('page', page);
  currentPage.value = page;
  // TODO 请求数据
}
</script>

<template>
  <div
    class="relative flex h-[740px] flex-col justify-between gap-5 rounded-xl bg-white px-5 py-6"
    :style="{
      background: `linear-gradient(180.05deg, ${interventionType?.bgColor} -1.81%, #fff 13.82%, #fff 99.96%)`,
    }"
  >
    <div class="absolute right-3 top-3 z-10">
      <img :src="interventionType?.icon" class="w-20" />
    </div>

    <!-- 标题和描述 -->
    <div>
      <div class="flex items-center gap-2">
        <span class="text-lg font-bold">{{ interventionType?.title }}</span>
        <ABadge
          :count="interventionItem.count"
          :color="interventionType?.color"
        />
      </div>
      <span class="text-xs text-[#00000066]">{{
        interventionType?.description
      }}</span>
    </div>

    <!-- 学生信息 -->
    <div class="flex-1 space-y-4">
      <template v-if="interventionItem.list.length > 0">
        <div
          v-for="item in interventionItem.list"
          :key="item.name"
          class="space-y-2 rounded-xl bg-[#F7F8FA] p-4"
        >
          <div class="flex items-center gap-1 text-sm font-bold">
            <span>{{ item.name }}</span>
            <ADivider type="vertical" />
            <span>{{ item.className }}</span>
          </div>
          <div class="text-xs text-[#979899]">
            <span>负责人：</span>
            <span>{{ item.counselor }}</span>
          </div>
          <div class="text-xs text-[#979899]">
            {{ dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss') }}
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex-center h-full">
          <AEmpty />
        </div>
      </template>
    </div>

    <!-- 分页 -->
    <div class="flex justify-end">
      <APagination
        v-model:current="currentPage"
        :total="100"
        :default-page-size="pageSize"
        :show-size-changer="false"
        simple
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-pagination) {
  display: flex !important;
}
</style>
