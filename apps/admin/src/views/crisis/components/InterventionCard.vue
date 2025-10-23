<script setup lang="ts">
import type { CrisisBoardData, StudentInterventionItem } from '@vben/types';

import type { InterventionType } from '#/api/constants';
import type { CrisisBoardDataPageReq } from '#/api/psychology/crisis';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Badge as ABadge,
  Divider as ADivider,
  Empty as AEmpty,
  Pagination as APagination,
  Spin as ASpin,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getInterventionTypeByDictValue } from '#/api/constants';
import { getRiskLevelBoardData } from '#/api/psychology/crisis';
import StudentDrawer from '#/components/Drawer/StudentDetailDrawer/index.vue';
import { truncateText } from '#/utils/calculateTool';
import { getDictLabel } from '#/utils/dict';

const props = defineProps<{
  interventionItem: CrisisBoardData;
  searchParams: CrisisBoardDataPageReq | undefined;
}>();

const emit = defineEmits<{
  updateStudentPage: [page: CrisisBoardData['studentPage']];
}>();

const currentPage = ref(1);
const pageSize = ref(5);
const loading = ref(false);

const [StudentDetailDrawer, studentDetailDrawerApi] = useVbenDrawer({
  class: 'w-[800px]',
  connectedComponent: StudentDrawer,
});

// 当前干预卡片类型
const interventionType = computed((): InterventionType | undefined => {
  return getInterventionTypeByDictValue(props.interventionItem.dictValue);
});

/** 分页
 * @param page 页码
 */
async function handlePageChange(page: number) {
  try {
    loading.value = true;
    const response = await getRiskLevelBoardData({
      pageNo: page,
      pageSize: pageSize.value,
      riskLevel: props.interventionItem.dictValue,
      ...props.searchParams,
    });

    emit('updateStudentPage', response);
  } catch (error) {
    console.error('获取风险等级看板数据失败:', error);
  } finally {
    loading.value = false;
  }
}

/** 查看学生详情 */
function handleStudentClick(board: StudentInterventionItem) {
  studentDetailDrawerApi.setData({ id: board.studentProfileId }).open();
}
</script>

<template>
  <div
    class="relative flex h-[740px] flex-col gap-5 rounded-xl bg-white px-5 py-6"
    :style="{
      background: `linear-gradient(180.05deg, ${interventionType?.bgColor} -1.81%, #fff 13.82%, #fff 99.96%)`,
    }"
  >
    <ASpin :spinning="loading">
      <div class="flex h-full flex-col justify-between gap-5">
        <div class="absolute right-3 top-3 z-10">
          <img :src="interventionType?.icon" class="w-20" />
        </div>

        <!-- 标题和描述 -->
        <div>
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold">
              {{ getDictLabel('crisis_level', interventionItem.dictValue) }}
            </span>
            <ABadge
              v-if="interventionItem.count"
              :count="interventionItem.count"
              :color="interventionType?.color"
            />
          </div>
          <span class="text-xs text-[#00000066]">
            {{ interventionType?.description }}
          </span>
        </div>

        <!-- 学生信息 -->
        <div class="scroll-area flex-1 space-y-4 overflow-y-auto">
          <template v-if="interventionItem.studentPage.list.length > 0">
            <div
              v-for="board in interventionItem.studentPage.list"
              :key="board.studentProfileId"
              class="mr-1 cursor-pointer space-y-2 rounded-xl bg-[#F7F8FA] p-4 hover:bg-[#f2f3f5]"
              @click="handleStudentClick(board)"
            >
              <div class="flex items-center gap-1 text-sm font-bold">
                <span>{{ truncateText(board.studentName, 6) }}</span>
                <ADivider type="vertical" />
                <span>{{ board.className }}</span>
              </div>
              <div class="text-xs text-[#979899]">
                <span>负责人：</span>
                <span>{{ board.counselorName || '--' }}</span>
              </div>
              <div class="text-xs text-[#979899]">
                {{ dayjs(board.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss') }}
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
            :total="interventionItem.studentPage.total"
            :default-page-size="pageSize"
            :show-size-changer="false"
            simple
            @change="handlePageChange"
          />
        </div>
      </div>
    </ASpin>

    <StudentDetailDrawer />
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-pagination) {
  display: flex !important;
}

:deep(.ant-spin-nested-loading) {
  height: 100% !important;
}

:deep(.ant-spin-container) {
  height: 100% !important;
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
