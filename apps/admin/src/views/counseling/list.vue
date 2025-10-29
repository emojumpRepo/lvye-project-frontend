<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { AssessmentComfirmInfo } from '@vben/types';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InterventionAssessmentReqVO } from '#/api/psychology';
import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

import { h, onMounted, ref } from 'vue';

import { alert, prompt, useVbenModal } from '@vben/common-ui';

import {
  Input as AInput,
  RadioGroup as ARadioGroup,
  Result as AResult,
  Steps as ASteps,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { COUNSELING_STATUS } from '#/api/constants';
import { getConfigPage } from '#/api/infra/config';
import {
  cancelConsultationRecord,
  completeConsultationRecord,
  saveAssessment,
  supplementEvalute,
} from '#/api/psychology/consultation';
import AdjustAppointmentTimeDialog from '#/components/Dialog/AdjustAppointmentTimeDialog/index.vue';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';
import CreateEvaluationDialog from '#/components/Dialog/CreateEvaluationDialog/index.vue';
import PsychologicalConsultDialog from '#/components/Dialog/PsychologicalConsultDialog/index.vue';
import SupplementEvaluteDialog from '#/components/Dialog/SupplementEvaluteDialog/index.vue';
import LyTag from '#/components/LyTag/index.vue';
import { getDictLabel } from '#/utils/dict';

import CounselingSearch from './components/CounselSearch.vue';
import { queryConsultationPage, useGridColumns } from './data';

defineOptions({ name: 'CounselingList' });

const emit = defineEmits<{
  (e: 'viewDetail', row: PsychologyConsultationApi.ConsultationRecord): void;
  (e: 'statistics'): void;
}>();

const loading = ref(false);
const isOpenPsychologicalConsultDialogModal = ref(false);
const uploadExpireTime = ref<number>(24);
const currentRowId = ref<number | undefined>();
const confirmInfo = ref<AssessmentComfirmInfo>({
  studentInfo: {
    studentName: '',
    className: '',
    studentNo: '',
  },
  consultInfo: {
    consultant: '',
    consultType: '',
    consultTime: '',
  },
});

/** 调整预约时间弹窗 */
const [AdjustAppointmentTimeModal, appointmentDetailModalApi] = useVbenModal({
  connectedComponent: AdjustAppointmentTimeDialog,
});

/** 确认取消预约弹窗 */
const [ConfirmCancelModal, confirmCancelModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

/** 补评估弹窗 */
const [SupplementEvaluteModal, supplementEvaluteModalApi] = useVbenModal({
  connectedComponent: SupplementEvaluteDialog,
});

/** 创建评估弹窗 */
const [CreateEvaluationModal, createEvaluationModalApi] = useVbenModal({
  connectedComponent: CreateEvaluationDialog,
});

const currentCancelRow =
  ref<null | PsychologyConsultationApi.ConsultationRecord>(null);
const currentCancelReason = ref<string>('');

// 表格
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: '550px',
    keepSource: true,
    pagerConfig: {
      pageSize: 10,
      pageSizes: [10, 20, 30, 40, 50, 60],
    },
    proxyConfig: {
      ajax: {
        query: queryConsultationPage,
      },
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
function handleViewDetail(row: PsychologyConsultationApi.ConsultationRecord) {
  emit('viewDetail', row);
}

/** 是否预约逾期 */
function isOverdue(row: PsychologyConsultationApi.ConsultationRecord) {
  return (
    dayjs(row.appointmentEndTime).add(30, 'minute').isBefore(dayjs()) &&
    row.status === COUNSELING_STATUS.APPOINTMENT
  );
}

/** 是否评估逾期 */
function isEvaluationOverdue(
  row: PsychologyConsultationApi.ConsultationRecord,
) {
  return (
    dayjs(row.appointmentEndTime)
      .add(uploadExpireTime.value, 'hour')
      .isBefore(dayjs()) && row.status === COUNSELING_STATUS.COMPLETED
  );
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
    content: '是否确认完成咨询，选择后续处理方式？',
    icon: 'success',
    title: '确定完成咨询',
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
      handleEvalute(row);
    } else {
      alert({
        buttonAlign: 'center',
        content: h(AResult, {
          status: 'success',
          subTitle: '请及时填写评估报告',
          title: '咨询已完成',
        }),
      });
    }
  });
}

/** 补录咨询 */
function handleSupplementEvalute(
  row: PsychologyConsultationApi.ConsultationRecord,
) {
  supplementEvaluteModalApi.setData(row).open();
}

/** 确认补录 */
async function confirmSupplementEvalute(
  form: {
    actualTime: Dayjs;
    id: number;
    notes: string;
  },
  row: PsychologyConsultationApi.ConsultationRecord,
) {
  if (!form.id) return message.error('咨询记录不存在');
  try {
    supplementEvaluteModalApi.lock();
    const result = await supplementEvalute({
      id: form.id,
      actualTime: dayjs(form.actualTime).valueOf(),
      notes: form.notes,
    });
    if (!result) return message.error('补录失败');

    await refresh();
    supplementEvaluteModalApi.close();
    message.success('补录成功');
    prompt({
      component: ARadioGroup,
      componentProps: {
        options: [
          { label: '点击上传纪要', value: 1 },
          { label: '稍后再来', value: 2 },
        ],
      },
      content: '您已完成咨询，是否开始上传报告？',
      icon: 'success',
      title: '确认上传',
      modelPropName: 'value',
      beforeClose: (scope) => {
        // 如果是确认操作但没有选择值，则阻拦关闭
        if (scope.isConfirm && !scope.value) {
          message.warning('请选择处理方式');
          return false; // 返回false阻拦关闭
        }
        return true; // 返回true允许关闭
      },
    }).then(async (val) => {
      if (val === 1) {
        handleEvalute(row);
      } else {
        alert({
          buttonAlign: 'center',
          content: h(AResult, {
            status: 'success',
            subTitle: '请及时填写上传报告',
            title: '咨询已完成',
          }),
        });
      }
    });
  } catch (error) {
    console.error('补录失败', error);
    message.error('补录失败');
    return false;
  } finally {
    supplementEvaluteModalApi.unlock();
  }
}

/** 评估 */
function handleEvalute(row: PsychologyConsultationApi.ConsultationRecord) {
  confirmInfo.value = {
    studentInfo: {
      studentName: row.studentName || '',
      className: row.className || '',
      studentNo: row.studentNumber || '',
    },
    consultInfo: {
      consultant: row.counselorName || '',
      consultType: row.consultationType || '',
      consultTime: dayjs(row.appointmentStartTime).format(
        'YYYY-MM-DD HH:mm:ss',
      ),
    },
  };
  currentRowId.value = row.id;
  createEvaluationModalApi
    .setData({
      confirmInfo: confirmInfo.value,
    })
    .open();
}

/** 确认完成评估 */
async function completedEvalute(params: InterventionAssessmentReqVO) {
  if (!currentRowId.value) return message.error('请先选择咨询记录');

  try {
    const response = await saveAssessment({
      ...params,
      appointmentId: currentRowId.value,
      content: params.consultRecord,
      draft: false,
    });
    if (!response) return false;
    await refresh();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
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

/** 刷新数据 */
function refresh() {
  gridApi.query();
  emit('statistics');
}

/** 获取上传逾期时间 */
async function getUploadExpireTime() {
  const result = await getConfigPage({
    pageNo: 1,
    pageSize: 10,
    key: 'intervention.reportExpireTime',
  });
  if (result?.list?.[0]?.value) {
    uploadExpireTime.value = Number(result?.list?.[0]?.value);
  }
}

defineExpose({
  refresh,
});

onMounted(async () => {
  gridApi.query();
  await getUploadExpireTime();
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
            <span class="text-[#FF0831]" v-if="isOverdue(row)">
              （已逾期）
            </span>
            <span class="text-[#FF0831]" v-if="isEvaluationOverdue(row)">
              （上传逾期）
            </span>
          </div>
        </template>

        <!-- 进度 -->
        <template #currentStep="{ row }">
          <ASteps
            type="inline"
            :initial="1"
            :current="row.currentStep"
            :items="[{}, {}, {}]"
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
                ifShow: () =>
                  !isOverdue(row) &&
                  row.status === COUNSELING_STATUS.APPOINTMENT,
                onClick: () => handleFinish(row),
              },
              {
                label: '补录咨询',
                type: 'link',
                color: 'success',
                ifShow: () =>
                  isOverdue(row) &&
                  row.status === COUNSELING_STATUS.APPOINTMENT,
                onClick: () => handleSupplementEvalute(row),
              },
              {
                label: '上传报告',
                type: 'link',
                color: 'success',
                ifShow: () => row.status === COUNSELING_STATUS.COMPLETED,
                onClick: () => handleEvalute(row),
              },
            ]"
            :drop-down-actions="[
              {
                label: '调整时间',
                type: 'link',
                ifShow: () =>
                  !isOverdue(row) &&
                  row.status === COUNSELING_STATUS.APPOINTMENT,
                onClick: () => handleAdjustTime(row),
              },
              {
                label: '取消预约',
                type: 'link',
                ifShow: () =>
                  !isOverdue(row) &&
                  row.status === COUNSELING_STATUS.APPOINTMENT,
                onClick: () => handleCancel(row),
              },
            ]"
          />
        </template>
      </Grid>
    </div>

    <AdjustAppointmentTimeModal @refresh="refresh" />
    <PsychologicalConsultDialog
      v-model:open="isOpenPsychologicalConsultDialogModal"
      :comfirm-info="confirmInfo"
      :publish="completedEvalute"
    />
    <ConfirmCancelModal
      @confirm="handleConfirmCancelModal"
      @cancel="handleCancelCancelModal"
    />
    <SupplementEvaluteModal @confirm="confirmSupplementEvalute" />
    <CreateEvaluationModal :publish="completedEvalute" />
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
