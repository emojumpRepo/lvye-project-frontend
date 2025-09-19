<script setup lang="ts">
import type { CrisisBoardData, StudentInterventionItem } from '@vben/types';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Badge as ABadge,
  Divider as ADivider,
  Empty as AEmpty,
  Pagination as APagination,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import StudentDrawer from '#/components/Drawer/StudentDrawer/index.vue';
import { truncateText } from '#/utils/calculateTool';

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
  interventionItem: CrisisBoardData;
}>();

const currentPage = ref(1);
const pageSize = ref(5);
const InterventionBoard = computed(() => {
  console.log('InterventionBoard', props.interventionItem);
  return props.interventionItem;
});

const [StudentDetailDrawer, studentDetailDrawerApi] = useVbenDrawer({
  class: 'w-[800px]',
  connectedComponent: StudentDrawer,
});

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
  return interventionTypeMap[InterventionBoard.value.dictValue];
});

/** 分页 */
function handlePageChange(page: number) {
  console.log('page', page);
  currentPage.value = page;
  // TODO 请求数据
}

/** 查看学生详情 */
function handleStudentClick(item: StudentInterventionItem) {
  console.log('item', item);
  studentDetailDrawerApi.open();
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
          v-if="interventionItem.count"
          :count="interventionItem.count"
          :color="interventionType?.color"
        />
      </div>
      <span class="text-xs text-[#00000066]">{{
        interventionType?.description
      }}</span>
    </div>

    <!-- 学生信息 -->
    <div class="scroll-area flex-1 space-y-4 overflow-y-auto">
      <template v-if="InterventionBoard.studentPage.list.length > 0">
        <div
          v-for="item in InterventionBoard.studentPage.list"
          :key="item.studentName"
          class="mr-1 cursor-pointer space-y-2 rounded-xl bg-[#F7F8FA] p-4 hover:bg-[#f2f3f5]"
          @click="handleStudentClick(item)"
        >
          <div class="flex items-center gap-1 text-sm font-bold">
            <span>{{ truncateText(item.studentName, 6) }}</span>
            <ADivider type="vertical" />
            <span>{{ item.className }}</span>
          </div>
          <div class="text-xs text-[#979899]">
            <span>负责人：</span>
            <span>{{ item.counselorName }}</span>
          </div>
          <div class="text-xs text-[#979899]">
            {{ dayjs(item.lastAssessmentTime).format('YYYY-MM-DD HH:mm:ss') }}
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

    <StudentDetailDrawer />
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-pagination) {
  display: flex !important;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 35%);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 999px;
}
</style>
