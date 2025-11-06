<script lang="ts" setup>
import type {
  InterventionPlan,
  InterventionPlanStep,
  RelativeEvent,
  StudentInterventionItem,
} from '@vben/types';

import type { InterventionPlanStepSortUpdateReqVO } from '#/api/psychology';
import type { ButtonType } from '#/components/LyButton/index.vue';

import { computed, ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Divider as ADivider,
  Input as AInput,
  Tree as ATree,
  message,
} from 'ant-design-vue';

import { TAG_TYPE } from '#/api/constants';
import {
  completeInterventionEvent,
  getInterventionPlan,
  removeInterventionPlanRelativeEvent,
  updateInterventionPlanSteps,
  updateInterventionPlanTitle,
} from '#/api/psychology';
import InterventionOperationLogDialog from '#/components/Dialog/InterventionOperationLogDialog/index.vue';
import RelatedInterventionEventDialog from '#/components/Dialog/RelatedInterventionEventDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { toChineseNumber } from '#/utils/calculateTool';
import { getDictObj } from '#/utils/dict';

import { useExportInterventionPlan } from '../composables/useExportInterventionPlan';
import ExportProgressDialog from './ExportProgressDialog.vue';

interface ActionButton {
  label: string;
  value: string;
  type: ButtonType;
  icon?: string;
  hide?: boolean;
  onClick?: () => void;
}

interface TreeData {
  key: number;
  name: string;
  status?: number;
  statusLabel?: string;
  sort: number;
  color?: string;
  bgColor?: string;
  selectable: boolean;
}

const props = defineProps<{
  interventionPlanId: number;
  studentInfo: StudentInterventionItem;
}>();

const emits = defineEmits<{
  (e: 'close'): void;
}>();

// --------------------------------------------------------------------------------
// 响应式状态 (Reactive State)
// --------------------------------------------------------------------------------
const interventionPlan = ref<InterventionPlan>();
const currentStep = ref<InterventionPlanStep>();
const treeData = ref<TreeData[]>([]);
const currentAction = ref<'add' | 'edit' | 'init' | 'view'>('init');

// 标题编辑
const isEditingTitle = ref(false);
const editingTitle = ref('');

// 导出功能
const { progress: exportProgress, exportInterventionPlanAsZip } =
  useExportInterventionPlan();

// --------------------------------------------------------------------------------
// 计算属性 (Computed Properties)
// --------------------------------------------------------------------------------

/**
 * 顶部操作按钮
 * @description
 */
const actionButtons = computed<ActionButton[]>(() => [
  {
    label: '操作日志',
    value: 'operationLog',
    type: 'default',
    hide: false,
    onClick: viewOperationLog,
  },
  {
    label: '获取报告模板',
    value: 'getReportTemplate',
    type: 'default',
    hide: false,
    onClick: () => message.warning('暂无报告模板'),
  },
  {
    label: '导出ZIP',
    value: 'export',
    type: 'default',
    hide: false,
    onClick: handleExportZip,
  },
  {
    label: '结束干预',
    value: 'endIntervention',
    icon: 'mdi:check-circle',
    type: 'success',
    hide: interventionPlan.value?.status === 2,
    onClick: handleEndInterventionPlan,
  },
]);

// --------------------------------------------------------------------------------
// 弹窗 & 抽屉 (Modals & Drawers)
// --------------------------------------------------------------------------------

// 操作日志弹窗
const [InterventionOperationLogModal, interventionOperationLogModalApi] =
  useVbenModal({
    connectedComponent: InterventionOperationLogDialog,
  });

// 关联事件弹窗
const [RelatedInterventionEventModal, relatedInterventionEventModalApi] =
  useVbenModal({
    connectedComponent: RelatedInterventionEventDialog,
  });

// 导出进度弹窗
const [ExportProgressModal, exportProgressModalApi] = useVbenModal({
  connectedComponent: ExportProgressDialog,
});

// --------------------------------------------------------------------------------
// 核心数据处理 (Core Data Handlers)
// --------------------------------------------------------------------------------

/**
 * 辅助函数：处理关联事件数据，添加 UI 所需的标签、颜色等
 */
function _processRelativeEvents(events: RelativeEvent[] = []) {
  return events.map((event) => {
    const sourceDict = getDictObj(
      'crisis_event_report_source',
      event.sourceType,
    );
    const sourceType = TAG_TYPE[sourceDict?.colorType as keyof typeof TAG_TYPE];
    return {
      ...event,
      label: sourceDict?.label,
      color: sourceType?.color || '#979899',
      bgColor: sourceType?.backgroundColor || '#f6f8fa',
    };
  });
}

/**
 * 辅助函数：处理干预步骤，转换
 * 为 AntDesign Tree 所需的 treeData 格式
 */
function _processTreeData(steps: InterventionPlanStep[] = []): TreeData[] {
  return steps.map((step) => {
    const stepStatus = getDictObj('intervention_step_status', step.status);
    const stepStatusType =
      TAG_TYPE[stepStatus?.colorType as keyof typeof TAG_TYPE];
    return {
      key: step.id,
      name: step.title,
      status: step.status,
      sort: step.sort,
      statusLabel: stepStatus?.label || '未知',
      color: stepStatusType?.color,
      bgColor: stepStatusType?.backgroundColor,
      selectable: false,
      hasLink: step.attachmentIds && step.attachmentIds.length > 0,
    };
  });
}

/**
 * 加载干预计划
 * @description
 */
async function loadInterventionPlan() {
  try {
    if (!props.interventionPlanId) return;

    const response = await getInterventionPlan(props.interventionPlanId);
    if (response) {
      response.relativeEvents = _processRelativeEvents(response.relativeEvents);
      interventionPlan.value = response;
      treeData.value = _processTreeData(response.steps);
    }
  } catch (error) {
    console.error('加载干预计划失败:', error);
    message.error('加载干预计划失败');
  }
}

watch(
  () => props.interventionPlanId,
  async (newInterventionPlanId) => {
    if (newInterventionPlanId) {
      await loadInterventionPlan();
    }
  },
  { immediate: true },
);

// --------------------------------------------------------------------------------
// 事件处理 (Event Handlers)
// --------------------------------------------------------------------------------

/** 打开学生360°档案 */
function handleViewStudentProfile() {
  currentAction.value = 'view';
}

/** 打开关联事件弹窗 */
function handleOpenRelatedInterventionEventDialog() {
  if (!props.studentInfo?.studentProfileId) return;
  relatedInterventionEventModalApi
    .setData({
      studentProfileId: props.studentInfo.studentProfileId,
      interventionPlanId: props.interventionPlanId,
      relativeEventIds: interventionPlan.value?.relativeEventIds || [],
    })
    .open();
}

/** 移除标签 */
async function handleRemoveEvent(relativeEventId: number) {
  if (!interventionPlan.value?.id) return;
  if (!relativeEventId) return message.error('事件ID不存在');

  try {
    const response = await removeInterventionPlanRelativeEvent(
      interventionPlan.value.id,
      relativeEventId,
    );

    if (response) {
      if (interventionPlan.value.relativeEvents) {
        interventionPlan.value.relativeEvents =
          interventionPlan.value.relativeEvents.filter(
            (event) => event.id !== relativeEventId,
          );
      }
      if (interventionPlan.value.relativeEventIds) {
        interventionPlan.value.relativeEventIds =
          interventionPlan.value.relativeEventIds.filter(
            (id) => id !== relativeEventId,
          );
      }
      message.success('移除事件成功');
    } else {
      message.error('移除事件失败');
    }
  } catch (error) {
    console.error('移除事件失败:', error);
    message.error('移除事件失败');
  }
}

/** 开始编辑标题 */
function handleStartEditTitle() {
  editingTitle.value = interventionPlan.value?.title || '';
  isEditingTitle.value = true;
}

/** 取消编辑标题 */
function handleCancelEditTitle() {
  isEditingTitle.value = false;
  editingTitle.value = '';
}

/** 更新标题 */
async function handleSaveTitle() {
  if (!interventionPlan.value?.id) return;
  if (editingTitle.value.trim() === '') return message.error('请输入标题');

  try {
    const response = await updateInterventionPlanTitle(
      interventionPlan.value.id,
      editingTitle.value.trim(),
    );
    if (response) {
      interventionPlan.value.title = editingTitle.value;
      message.success('更新标题成功');
    } else {
      message.error('保存标题失败');
    }
  } catch (error) {
    console.error('保存标题失败:', error);
    message.error('保存标题失败');
  } finally {
    isEditingTitle.value = false;
    editingTitle.value = '';
  }
}

/** 打开设置步骤抽屉 (新增或编辑) */
function handleOpenSetInterventionStepDrawer(key?: number) {
  if (
    interventionPlan.value?.steps?.length &&
    interventionPlan.value?.steps?.length > 20
  ) {
    return message.info('最多只能添加20个步骤');
  }
  currentAction.value = key ? 'edit' : 'add';
  if (!props.studentInfo?.studentProfileId || !interventionPlan.value?.id) {
    return;
  }

  currentStep.value = key
    ? interventionPlan.value?.steps.find((step) => step.id === key)
    : undefined;
}

/** 打开操作日志弹窗 */
function viewOperationLog() {
  interventionOperationLogModalApi
    .setData({
      interventionPlanId: props.interventionPlanId,
    })
    .open();
}

/** 开始拖拽 (检查是否允许) */
function handleDragStart(info: { event: DragEvent; node: any }) {
  if (interventionPlan.value?.status === 2) {
    info.event.preventDefault();
  }
}

/** 处理拖拽排序 */
async function handleDrop(info: any) {
  const dropKey = info.node.key as number;
  const dragKey = info.dragNode.key as number;
  const dropPos = info.node.pos.split('-');
  const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

  // 1. 找到被拖拽的节点
  const dragIndex = treeData.value.findIndex((item) => item.key === dragKey);
  if (dragIndex === -1) return;
  const dragItem = treeData.value[dragIndex];

  // 2. 先从数组中移除
  treeData.value.splice(dragIndex, 1);

  // 3. 计算新的插入位置
  let dropIndex = treeData.value.findIndex((item) => item.key === dropKey);
  if (dropPosition === 1) {
    // 放在目标节点后面
    dropIndex++;
  }
  // 插入到新位置
  treeData.value.splice(dropIndex, 0, dragItem as TreeData);

  // 4. 更新所有节点的 sort 值
  treeData.value.forEach((item, index) => {
    item.sort = index + 1;
  });

  // 5. 调用API更新后端排序
  if (interventionPlan.value?.id) {
    try {
      const params: InterventionPlanStepSortUpdateReqVO = {
        interventionId: interventionPlan.value.id,
        steps: treeData.value.map((item) => ({
          id: item.key,
          sort: item.sort,
        })),
      };
      await updateInterventionPlanSteps(params);
    } catch (error) {
      console.error('更新排序失败:', error);
    } finally {
      await loadInterventionPlan();
    }
  }
}

/** 导出ZIP */
function handleExportZip() {
  if (!props.interventionPlanId) {
    return message.error('干预计划ID不存在');
  }
  if (!props.studentInfo?.studentName) {
    return message.error('学生信息不存在');
  }

  exportProgressModalApi.open();
  exportInterventionPlanAsZip(
    props.interventionPlanId,
    props.studentInfo.studentName,
  );
}

/** 结束干预计划 */
async function handleEndInterventionPlan() {
  /** 检查所有步骤是否都已经完成 */
  const allStepsCompleted = interventionPlan.value?.steps.every(
    (step) => step.status === 3,
  );
  if (!allStepsCompleted) {
    return message.info('所有步骤必须都已完成才能结束干预计划');
  }

  confirm({
    title: '结束干预计划',
    content: '结束后无法再进行编辑，确定要结束干预计划吗？',
    icon: 'warning',
  })
    .then(async () => {
      if (!interventionPlan.value?.id) {
        return message.error('干预计划ID不存在');
      }

      try {
        const response = await completeInterventionEvent(
          interventionPlan.value.id,
        );
        if (response) {
          interventionPlan.value.status = 2;
          message.success('结束干预计划成功');
        } else {
          message.error('结束干预计划失败');
        }
      } catch (error) {
        console.error('结束干预计划失败:', error);
        message.error('结束干预计划失败');
      }
    })
    .catch(() => {
      // 用户点击取消
    });
}

defineExpose({
  interventionPlan,
  currentStep,
  loadInterventionPlan,
  currentAction,
});
</script>

<template>
  <div class="box-border flex h-full flex-col gap-6 overflow-hidden py-6 pl-8">
    <div class="flex items-center justify-between">
      <LyButton type="default" size="middle" @click="emits('close')">
        <IconifyIcon icon="mdi:arrow-left" />
      </LyButton>

      <div class="flex items-center gap-2">
        <template v-for="button in actionButtons" :key="button.value">
          <LyButton
            v-if="!button.hide"
            :type="button.type"
            @click="button.onClick"
          >
            <IconifyIcon
              v-if="button.icon"
              :icon="button.icon"
              class="size-4"
            />
            {{ button.label }}
          </LyButton>
        </template>
      </div>
    </div>

    <div class="flex flex-1 flex-col overflow-hidden rounded-xl bg-white p-6">
      <!-- 干预信息 -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <!-- 非编辑状态：显示标题 -->
          <div v-if="!isEditingTitle" class="text-lg font-bold">
            <span>{{ interventionPlan?.title }}</span>
            <span>
              （ID：{{ interventionPlan?.interventionId || '--' }}）
            </span>
          </div>

          <!-- 编辑状态：显示输入框 -->
          <AInput
            v-else
            v-model:value="editingTitle"
            :maxlength="20"
            class="w-1/2"
          />

          <!-- 非编辑状态：显示编辑图标 -->
          <template v-if="interventionPlan?.status !== 2">
            <IconifyIcon
              v-if="!isEditingTitle"
              icon="mynaui:edit"
              color="#979899"
              class="size-5 cursor-pointer hover:!text-[#1966FF]"
              @click="handleStartEditTitle"
            />

            <!-- 编辑状态：显示确认和取消图标 -->
            <template v-else>
              <IconifyIcon
                icon="mdi:check"
                color="#04DC70"
                class="size-5 cursor-pointer hover:opacity-80"
                @click="handleSaveTitle"
              />
              <IconifyIcon
                icon="mdi:close"
                color="#ff4d4f"
                class="size-5 cursor-pointer hover:opacity-80"
                @click="handleCancelEditTitle"
              />
            </template>
          </template>
        </div>
        <div class="text-sm font-bold">
          <span>学生：</span>
          <span
            class="cursor-pointer text-[#1966FF] hover:!text-[#1966FF]/80"
            @click="handleViewStudentProfile"
          >
            {{ studentInfo?.studentName }}（{{ studentInfo?.className }}）
          </span>
        </div>
      </div>

      <ADivider class="!my-4" />

      <!-- 主体内容 -->
      <div class="flex flex-1 flex-col gap-1 overflow-hidden">
        <LyLabel title="关联的事件" has-indicator />

        <!-- 关联事件 -->
        <div class="flex flex-wrap items-center gap-2">
          <div
            v-for="event in interventionPlan?.relativeEvents"
            :key="event.id"
            class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"
            :style="{ backgroundColor: event.bgColor }"
          >
            <span :style="{ color: event.color }">
              {{ event.label }}（任务编号：{{ event.eventId }}）
            </span>
            <div
              v-if="interventionPlan?.status !== 2"
              class="cursor-pointer"
              @click="handleRemoveEvent(event.id)"
            >
              <IconifyIcon
                icon="material-symbols:close-rounded"
                :color="event.color"
              />
            </div>
          </div>

          <div
            v-if="interventionPlan?.status !== 2"
            class="dash inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-[#d9d9d9] px-3 py-1 text-xs hover:bg-[#f6f8fa]/70"
            @click="handleOpenRelatedInterventionEventDialog()"
          >
            <IconifyIcon icon="material-symbols:add-rounded" color="#979899" />
            <span class="text-[#979899]"> 关联事件 </span>
          </div>
        </div>

        <!-- 拖拽事件 -->
        <div class="flex flex-1 flex-col gap-4 overflow-hidden pt-3">
          <div class="flex flex-1 flex-col gap-4 overflow-hidden">
            <div class="text-xs text-[#979899]">
              {{
                interventionPlan?.status !== 2
                  ? '您可以拖拽事件进行排序：'
                  : '您的干预计划步骤如下：'
              }}
            </div>

            <div class="scroll-area flex-1 overflow-y-auto">
              <!-- 树形事件 -->
              <ATree
                draggable
                block-node
                :tree-data="treeData"
                @dragstart="handleDragStart"
                @drop="handleDrop"
              >
                <template
                  #title="{
                    name,
                    statusLabel,
                    bgColor,
                    color,
                    key,
                    hasLink,
                    sort,
                  }"
                >
                  <div
                    class="flex w-full items-center justify-between rounded-xl p-3 text-xs hover:!bg-[#f6f8fa]/70"
                    :style="{ backgroundColor: bgColor || '#f6f8fa' }"
                    @click="handleOpenSetInterventionStepDrawer(key)"
                  >
                    <div class="flex items-center gap-3" :style="{ color }">
                      <span
                        class="rounded-full bg-white px-3 py-1"
                        :style="{
                          color,
                          border: `1px solid ${color || '#d9d9d9'}`,
                        }"
                      >
                        {{ statusLabel || '--' }}
                      </span>
                      <div class="flex font-bold">
                        <span> 步骤{{ toChineseNumber(sort) }}： </span>
                        <span>
                          {{ name }}
                        </span>
                      </div>
                    </div>
                    <div v-if="hasLink">
                      <IconifyIcon
                        icon="mynaui:link"
                        class="size-4"
                        :color="color"
                      />
                    </div>
                  </div>
                </template>
              </ATree>
            </div>
          </div>

          <!-- 添加新步骤 -->
          <div
            v-if="interventionPlan?.status !== 2"
            class="flex cursor-pointer items-center gap-2 text-xs text-[#1966FF] hover:!text-[#1966FF]/80"
            @click="handleOpenSetInterventionStepDrawer()"
          >
            <IconifyIcon icon="material-symbols:add-rounded" />
            <span>添加新步骤</span>
          </div>
        </div>
      </div>
    </div>
    <InterventionOperationLogModal />
    <RelatedInterventionEventModal @refresh="loadInterventionPlan" />
    <ExportProgressModal :progress="exportProgress" />
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-tree-switcher) {
  display: none !important;
}

:deep(.ant-tree-list-holder-inner) {
  gap: 6px !important;
}

:deep(.ant-tree-node-content-wrapper) {
  padding: 0 !important;
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
