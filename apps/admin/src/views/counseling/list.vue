<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

import { onMounted, ref } from 'vue';

import { prompt, useVbenModal } from '@vben/common-ui';

import {
  Input as AInput,
  RadioGroup as ARadioGroup,
  Steps as ASteps,
  message,
} from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { COUNSELING_STATUS } from '#/api/constants';
import {
  cancelConsultationRecord,
  completeConsultationRecord,
} from '#/api/psychology/consultation';
import AdjustAppointmentTimeDialog from '#/components/Dialog/AdjustAppointmentTimeDialog/index.vue';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';
import PsychologicalConsultDialog from '#/components/Dialog/PsychologicalConsultDialog/index.vue';
import LyTag from '#/components/LyTag/index.vue';
import { getDictLabel } from '#/utils/dict';

import CounselingSearch from './components/CounselSearch.vue';
import { queryConsultationPage, useGridColumns } from './data';

defineOptions({ name: 'CounselingList' });

const emit = defineEmits<{
  (e: 'viewDetail', row: PsychologyConsultationApi.ConsultationRecord): void;
}>();

const loading = ref(false);
const isOpenPsychologicalConsultDialogModal = ref(false);

/** 调整预约时间弹窗 */
const [AdjustAppointmentTimeModal, appointmentDetailModalApi] = useVbenModal({
  connectedComponent: AdjustAppointmentTimeDialog,
});

/** 确认取消预约弹窗 */
const [ConfirmCancelModal, confirmCancelModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

const currentCancelRow =
  ref<null | PsychologyConsultationApi.ConsultationRecord>(null);
const currentCancelReason = ref<string>('');

// 表格
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: '520px',
    keepSource: true,
    proxyConfig: {
      ajax: { query: queryConsultationPage },
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
  console.log('params', params);
  gridApi.query({ ...params });
}

/** 查看详情 */
function handleViewDetail(row: PsychologyConsultationApi.ConsultationRecord) {
  emit('viewDetail', row);
}

/** 完成心理咨询预约 */
function handleFinish(row: PsychologyConsultationApi.ConsultationRecord) {
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
    beforeClose: (scope) => {
      // 如果是确认操作但没有选择值，则阻拦关闭
      if (scope.isConfirm && !scope.value) {
        message.warning('请选择后续处理方式');
        return false; // 返回false阻拦关闭
      }
      return true; // 返回true允许关闭
    },
  }).then(async (val) => {
    if (val) {
      await completeConsultationRecord(row.id as number);
    }
    gridApi.query();
    if (val === 1) {
      handleEvalute();
    }
  });
}

/** 评估 */
function handleEvalute() {
  isOpenPsychologicalConsultDialogModal.value = true;
}

/** 调整时间 */
function handleAdjustTime(row: PsychologyConsultationApi.ConsultationRecord) {
  appointmentDetailModalApi.setData(row).open();
}

/** 取消预约 */
function handleCancel(row: PsychologyConsultationApi.ConsultationRecord) {
  currentCancelRow.value = row;
  prompt({
    component: AInput.TextArea,
    componentProps: {
      placeholder: '请输入取消原因',
      rows: 4,
      showCount: true,
      maxLength: 200,
    },
    content: '请输入取消原因，取消原因会同步给学生',
    icon: 'warning',
    title: '取消预约',
    modelPropName: 'value',
    // 关闭前进行二次确认：在此弹出确认框，确认后才允许关闭
    beforeClose: (scope) => {
      if (!scope.isConfirm) return true;
      if (!scope.value) {
        message.warning('请输入取消原因');
        return false;
      }
      // 二次确认：返回一个 Promise，依据确认/取消决定是否关闭
      return new Promise<boolean>((resolve) => {
        // 先保存输入值，便于确认后使用
        currentCancelReason.value = scope.value as string;
        confirmCancelModalApi
          .setData({
            title: '确定取消本次预约吗？取消后预约将失效且不可恢复',
            zIndex: 5000,
          })
          .open();

        const onConfirm = async () => {
          try {
            await handleCancelConfirm();
            gridApi.query();
            resolve(true); // 提交成功，允许关闭 prompt
          } catch {
            resolve(false); // 提交失败，阻止关闭 prompt
          } finally {
            confirmCancelModalApi.close();
          }
        };
        const onCancel = () => {
          confirmCancelModalApi.close();
          resolve(false); // 阻止关闭 prompt
        };

        // 将处理函数挂到全局可见的方法上（确认框按钮应调用这两个方法）
        (confirmCancelModalApi as any)._pendingConfirm = onConfirm;
        (confirmCancelModalApi as any)._pendingCancel = onCancel;
      });
    },
  }).then(() => {
    // 到这里，说明已通过二次确认并关闭了 prompt
    // 后续真正提交逻辑可在这里或现有 handleCancelConfirm 中进行
    // 保留现有流程，由二次确认按钮触发 handleCancelConfirm
  });
}

/** 确认取消预约 */
async function handleCancelConfirm() {
  try {
    await cancelConsultationRecord(
      currentCancelRow.value?.id as number,
      currentCancelReason.value,
    );
  } catch (error) {
    console.error(error);
  }
  confirmCancelModalApi.close();
}

// 确认框：确认按钮 -> 调用挂载的 pending 回调
function handleConfirmCancelModal() {
  const fn = (confirmCancelModalApi as any)._pendingConfirm as
    | (() => void)
    | undefined;
  fn?.();
}

// 确认框：取消按钮 -> 调用挂载的 pending 回调
function handleCancelCancelModal() {
  const fn = (confirmCancelModalApi as any)._pendingCancel as
    | (() => void)
    | undefined;
  fn?.();
}

defineExpose({
  refresh: () => {
    gridApi.query();
  },
});

onMounted(() => {
  gridApi.query();
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <!-- 咨询记录搜索栏 -->
    <CounselingSearch v-model:loading="loading" @search="handleSearch" />
    <!-- 表格 -->
    <div class="flex-1">
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
              {{ row.consultTime }}
            </div>
            <p class="w-full text-xs leading-normal text-[#4C4C4D]">
              {{ row.durationMinutes }}分钟
            </p>
          </div>
        </template>

        <!-- 状态 -->
        <template #stauts="{ row }">
          <div class="text-[#4C4C4D]">
            <LyTag
              :dict-value="row.status"
              tag-category-key="counseling_status"
              :tag-label="getDictLabel('counseling_status', row.status)"
            />
            <span class="text-[#FF0831]" v-if="row.overdue">（评估逾期）</span>
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
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: '详情',
                type: 'link',
                color: 'success',
                onClick: () => handleViewDetail(row),
              },
              {
                label: '完成',
                type: 'link',
                color: 'success',
                ifShow: () => row.status === COUNSELING_STATUS.APPOINTMENT,
                onClick: () => handleFinish(row),
              },
              {
                label: '评估',
                type: 'link',
                color: 'success',
                ifShow: () => row.status === COUNSELING_STATUS.COMPLETED,
                onClick: handleEvalute,
              },
            ]"
            :drop-down-actions="[
              {
                label: '调整时间',
                type: 'link',
                ifShow: () => row.status === COUNSELING_STATUS.APPOINTMENT,
                onClick: () => handleAdjustTime(row),
              },
              {
                label: '取消预约',
                type: 'link',
                ifShow: () => row.status === COUNSELING_STATUS.APPOINTMENT,
                onClick: () => handleCancel(row),
              },
            ]"
          />
        </template>
      </Grid>
    </div>

    <AdjustAppointmentTimeModal @refresh="gridApi.query()" />
    <PsychologicalConsultDialog
      v-model:open="isOpenPsychologicalConsultDialogModal"
    />
    <ConfirmCancelModal
      @confirm="handleConfirmCancelModal"
      @cancel="handleCancelCancelModal"
    />
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-cell--label) {
  color: #4c4c4d !important;
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
