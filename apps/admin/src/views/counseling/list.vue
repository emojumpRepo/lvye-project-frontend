<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { prompt, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import {
  RadioGroup as ARadioGroup,
  Steps as ASteps,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import AdjustAppointmentTimeDialog from '#/components/Dialog/AdjustAppointmentTimeDialog/index.vue';
import PsychologicalConsultDialog from '#/components/Dialog/PsychologicalConsultDialog/index.vue';
import StudentAppointmentDetailDrawer from '#/components/Drawer/StudentAppointmentDetailDrawer/index.vue';
import { getDictLabel } from '#/utils/dict';

import CounselingSearch from './components/CounselSearch.vue';
import { mockQuery, useGridColumns } from './data';

defineOptions({ name: 'CounselingList' });

const loading = ref(false);
const isOpenPsychologicalConsultDialogModal = ref(false);

/** 预约详情抽屉 */
const [AppointmentDetailDrawer, appointmentDetailDrawerApi] = useVbenDrawer({
  connectedComponent: StudentAppointmentDetailDrawer,
});

/** 调整预约时间弹窗 */
const [AdjustAppointmentTimeModal, appointmentDetailModalApi] = useVbenModal({
  connectedComponent: AdjustAppointmentTimeDialog,
});

// 表格
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: { query: mockQuery },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      refresh: false,
      search: false,
      custom: false,
      zoom: false,
    },
    cellConfig: {
      height: 60,
    },
  } as VxeTableGridOptions,
});

/** 处理搜索 */
function handleSearch(params: any) {
  gridApi.query({ ...params });
}

/** 查看详情 */
function handleViewDetail() {
  // message.warning('即将上线');
  appointmentDetailDrawerApi.open();
}

/** 完成 */
function handleFinish() {
  prompt({
    component: ARadioGroup,
    componentProps: {
      options: [
        { label: '立即填写评估', value: 1 },
        { label: '稍后填写评估', value: 2 },
      ],
    },
    content: '是否确认完成咨询，选择后续处理方式',
    icon: 'success',
    title: '完成咨询',
    modelPropName: 'value',
  }).then((val) => {
    if (val) {
      // noop
    } else {
      message.warning('请选择后续处理方式');
    }
  });
}

/** 评估 */
function handleEvalute() {
  isOpenPsychologicalConsultDialogModal.value = true;
}

/** 调整时间 */
function handleAdjustTime() {
  // message.warning('即将上线');
  appointmentDetailModalApi.open();
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 overflow-hidden">
    <!-- 咨询记录搜索栏 -->
    <CounselingSearch v-model:loading="loading" @search="handleSearch" />
    <!-- 表格 -->
    <div class="flex-1 overflow-hidden">
      <Grid>
        <!-- 学生信息 -->
        <template #studentName="{ row }">
          <div class="flex flex-col gap-1 px-2">
            <div class="font-bold text-[#4C4C4D]">
              {{ row.studentName }}
            </div>
            <p
              class="line-clamp-2 whitespace-normal text-xs leading-normal text-[#4C4C4D]"
            >
              {{ row.className }}
            </p>
          </div>
        </template>

        <!-- 时间 -->
        <template #consultTime="{ row }">
          <div class="flex flex-col gap-1 px-2">
            <div class="font-bold text-[#4C4C4D]">
              {{ dayjs(row.consultTime).format('YYYY-MM-DD HH:mm:ss') }}
            </div>
            <p class="w-full text-xs leading-normal text-[#4C4C4D]">
              {{ row.consultDuration }}分钟
            </p>
          </div>
        </template>

        <!-- 状态 -->
        <template #stauts="{ row }">
          <div class="text-[#4C4C4D]">
            <span>{{ getDictLabel('counseling_status', row.status) }}</span>
            <span class="text-[#FF0831]">（评估预期）</span>
          </div>
        </template>

        <!-- 进度 -->
        <template #progress>
          <ASteps
            type="inline"
            :current="0"
            :items="[{}, {}, {}]"
            class="!w-full !px-10"
          />
        </template>

        <!-- 操作 -->
        <template #actions>
          <TableAction
            :actions="[
              {
                label: '详情',
                type: 'link',
                onClick: handleViewDetail,
              },
              {
                label: '完成',
                type: 'link',
                onClick: handleFinish,
              },
              {
                label: '评估',
                type: 'link',
                onClick: handleEvalute,
              },
            ]"
            :drop-down-actions="[
              {
                label: '调整时间',
                type: 'link',
                onClick: handleAdjustTime,
              },
              {
                label: '取消预约',
                type: 'link',
                onClick: handleViewDetail,
              },
            ]"
          />
        </template>
      </Grid>
    </div>
    <AppointmentDetailDrawer />
    <AdjustAppointmentTimeModal />
    <PsychologicalConsultDialog
      v-model:open="isOpenPsychologicalConsultDialogModal"
    />
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-cell--label) {
  color: #4c4c4d !important;
}

:deep(.ant-btn-link) {
  color: #2c68ff !important;
}

:deep(.ant-steps-inline) {
  display: flex !important;
}

:deep(.ant-steps-item) {
  flex: 1 !important;
}

:deep(.ant-steps-item-icon) {
  width: 10px !important;
  height: 10px !important;
}

:deep(.ant-steps-icon-dot) {
  border-radius: 100% !important;
}

:deep(.ant-steps-item-tail) {
  top: 14px !important;
}
</style>
