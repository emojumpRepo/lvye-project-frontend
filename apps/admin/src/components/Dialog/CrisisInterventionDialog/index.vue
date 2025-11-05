<script lang="ts" setup>
import type {
  InterventionPlan,
  InterventionPlanStep,
  StudentInterventionItem,
} from '@vben/types';

import type { InterventionPlanStepSortUpdateReqVO } from '#/api/psychology';
import type { ButtonType } from '#/components/LyButton/index.vue';

import { ref } from 'vue';

import { confirm, useVbenDrawer, useVbenModal } from '@vben/common-ui';
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
import CreateInterventionStepDrawer from '#/components/Drawer/CreateInterventionStepDrawer/index.vue';
import StudentDetailDrawer from '#/components/Drawer/StudentDetailDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { getDictObj } from '#/utils/dict';

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

const studentInfo = ref<StudentInterventionItem>();
const interventionPlanId = ref<number>();
const interventionPlan = ref<InterventionPlan>();
const currentStep = ref<InterventionPlanStep>();
const treeData = ref<TreeData[]>([]);
const isFullScreen = ref(false);

// 标题编辑相关
const isEditingTitle = ref(false);
const editingTitle = ref('');

const bgImage =
  'https://6d65-mentor-3gyob3y3bdbc2bdb-1305613707.tcb.qcloud.la/lvye/bg.jpg';

const actionButtons = ref<ActionButton[]>([
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
  },
  {
    label: '导出ZIP',
    value: 'export',
    type: 'default',
    hide: false,
  },
  {
    label: '结束干预',
    value: 'endIntervention',
    icon: 'mdi:check-circle',
    type: 'success',
    hide: interventionPlan?.value?.status !== 2,
    onClick: handleEndInterventionPlan,
  },
]);

// 步骤详情抽屉
const [SetInterventionStepDrawer, setInterventionStepDrawerApi] = useVbenDrawer(
  {
    connectedComponent: CreateInterventionStepDrawer,
  },
);

// 操作日志弹窗
const [InterventionOperationLogModal, interventionOperationLogModalApi] =
  useVbenModal({
    connectedComponent: InterventionOperationLogDialog,
  });

// 学生详情抽屉
const [StudentProfileDrawer, studentProfileDrawerApi] = useVbenDrawer({
  connectedComponent: StudentDetailDrawer,
});

// 关联事件弹窗
const [RelatedInterventionEventModal, relatedInterventionEventModalApi] =
  useVbenModal({
    connectedComponent: RelatedInterventionEventDialog,
  });

// 危机干预弹窗
const [CrisisInterventionModal, crisisInterventionModalApi] = useVbenModal({
  fullscreen: true,
  fullscreenButton: false,
  destroyOnClose: true,
  closable: false,
  headerClass: '!hidden',
  footer: false,
  contentClass: '!p-0 !overflow-hidden',
  appendToMain: true,
  onOpenChange: async (open) => {
    if (open) {
      const data = await crisisInterventionModalApi.getData();
      studentInfo.value = data.studentInfo;
      interventionPlanId.value = data.interventionPlanId;
      if (data.fullScreen) {
        isFullScreen.value = true;
        crisisInterventionModalApi.setState({
          appendToMain: false,
        });
      }
      await loadInterventionPlan();
    }
  },
});

/** 加载干预计划 */
async function loadInterventionPlan() {
  try {
    crisisInterventionModalApi.lock();
    if (interventionPlanId.value) {
      const response = await getInterventionPlan(interventionPlanId.value);
      if (response) {
        interventionPlan.value = {
          ...response,
          relativeEvents: (response.relativeEvents || []).map((event) => {
            const sourceDict = getDictObj(
              'crisis_event_report_source',
              event.sourceType,
            );
            const sourceType =
              TAG_TYPE[sourceDict?.colorType as keyof typeof TAG_TYPE];

            return {
              ...event,
              label: sourceDict?.label,
              color: sourceType?.color || '#979899',
              bgColor: sourceType?.backgroundColor || '#f6f8fa',
            };
          }),
        };

        if (interventionPlan.value?.steps.length) {
          treeData.value = interventionPlan.value?.steps.map((step) => {
            const stepStatus = getDictObj(
              'intervention_step_status',
              step.status,
            );
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
            };
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    crisisInterventionModalApi.unlock();
  }
}

/** 打开返回确认弹窗 */
function handleOpenCancelConfirmModal() {
  crisisInterventionModalApi.close();
}

/** 打开学生详情抽屉 */
function handleOpenStudentProfileDrawer() {
  if (!studentInfo.value?.studentProfileId) return;
  studentProfileDrawerApi
    .setData({
      id: studentInfo.value?.studentProfileId,
    })
    .open();
}

/** 打开关联事件弹窗 */
function handleOpenRelatedInterventionEventDialog() {
  if (!studentInfo.value?.studentProfileId) return;
  relatedInterventionEventModalApi
    .setData({
      studentProfileId: studentInfo.value.studentProfileId,
      interventionPlanId: interventionPlanId.value,
      relativeEventIds: interventionPlan.value?.relativeEventIds || [],
    })
    .open();
}

/** 移除标签 */
async function handleRemoveTag(relativeEventId: number) {
  if (!interventionPlan.value?.id) return;
  if (!relativeEventId) return message.error('事件ID不存在');
  if (interventionPlan.value.relativeEventIds.length === 1)
    return message.error('至少保留一个关联事件');

  try {
    const response = await removeInterventionPlanRelativeEvent(
      interventionPlan.value?.id,
      relativeEventId,
    );

    if (response) {
      interventionPlan.value.relativeEvents =
        interventionPlan.value.relativeEvents.filter(
          (event) => event.id !== relativeEventId,
        );
      message.success('移除标签成功');
    } else {
      message.error('移除标签失败');
    }
  } catch (error) {
    console.error('移除标签失败:', error);
    message.error('移除标签失败');
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

/** 打开设置步骤抽屉 */
function handleOpenSetInterventionStepDrawer(key?: number) {
  if (!studentInfo.value?.studentProfileId || !interventionPlan.value?.id)
    return;

  currentStep.value = key
    ? interventionPlan.value?.steps.find((step) => step.id === key)
    : undefined;
  setInterventionStepDrawerApi.open();
}

/** 打开操作日志弹窗 */
function viewOperationLog() {
  interventionOperationLogModalApi
    .setData({
      interventionPlanId: interventionPlanId.value,
    })
    .open();
}

/** 开始拖拽 */
function handleDragStart(info: any) {
  if (interventionPlan.value?.status === 2) {
    return info.event.preventDefault();
  }
}
/** 处理拖拽排序 */
async function handleDrop(info: any) {
  const dropKey = info.node.key;
  const dragKey = info.dragNode.key;
  const dropPos = info.node.pos.split('-');
  const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

  // 从treeData中移除拖拽的节点
  const dragIndex = treeData.value.findIndex((item) => item.key === dragKey);
  if (dragIndex === -1) return;

  const dragItem = treeData.value[dragIndex];
  treeData.value.splice(dragIndex, 1);

  // 计算新的插入位置
  let dropIndex = treeData.value.findIndex((item) => item.key === dropKey);
  if (dropPosition === 1) {
    // 放在目标节点后面
    dropIndex++;
  }

  // 插入到新位置
  treeData.value.splice(dropIndex, 0, dragItem as TreeData);

  // 更新所有节点的sort值
  treeData.value.forEach((item, index) => {
    item.sort = index + 1;
  });

  // 调用API更新后端排序
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
      // 更新成功后重新加载数据
      await loadInterventionPlan();
    } catch (error) {
      console.error('更新排序失败:', error);
      // 如果失败,重新加载原始数据
      await loadInterventionPlan();
    }
  }
}

/** 结束干预计划 */
async function handleEndInterventionPlan() {
  confirm({
    title: '结束干预计划',
    content: '结束后无法再进行编辑，确定要结束干预计划吗？',
    icon: 'warning',
  })
    .then(async () => {
      if (!interventionPlan.value?.id) {
        message.error('干预计划ID不存在');
        return false;
      }

      try {
        const response = await completeInterventionEvent(
          interventionPlan.value.id,
        );
        if (response) {
          interventionPlan.value.status = 2;
          message.success('结束干预计划成功');
          return true;
        } else {
          message.error('结束干预计划失败');
          return false;
        }
      } catch (error) {
        console.error('结束干预计划失败:', error);
        message.error('结束干预计划失败');
        return false;
      }
    })
    .catch(() => {
      return false;
    });
}
</script>

<template>
  <CrisisInterventionModal>
    <div
      class="bg-background-deep relative box-border flex h-full w-full !bg-[#f7f8fa] py-6 pl-10 pr-8"
      :class="{ '!pl-36': isFullScreen }"
    >
      <img :src="bgImage" width="100%" class="absolute left-0 top-0" />

      <div class="z-10 flex h-full w-1/2 flex-col gap-6">
        <div class="flex items-center justify-between">
          <LyButton
            type="default"
            size="middle"
            @click="handleOpenCancelConfirmModal"
          >
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

        <div
          class="flex flex-1 flex-col overflow-hidden rounded-xl bg-white p-6"
        >
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
                @click="handleOpenStudentProfileDrawer()"
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
                  @click="handleRemoveTag(event.id)"
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
                <IconifyIcon
                  icon="material-symbols:add-rounded"
                  color="#979899"
                />
                <span class="text-[#979899]"> 关联事件 </span>
              </div>
            </div>

            <!-- 拖拽事件 -->
            <div class="flex flex-1 flex-col gap-4 overflow-hidden pt-3">
              <div class="flex flex-1 flex-col gap-4 overflow-hidden">
                <div class="text-xs text-[#979899]">
                  {{
                    interventionPlan?.status !== 2
                      ? '您可以拖拽事件进行排序'
                      : '您的干预计划步骤'
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
                      #title="{ name, statusLabel, bgColor, color, key }"
                    >
                      <div
                        class="flex items-center gap-2 rounded-xl p-3 text-xs hover:!bg-[#f6f8fa]/70"
                        :style="{ backgroundColor: bgColor || '#f6f8fa' }"
                        @click="handleOpenSetInterventionStepDrawer(key)"
                      >
                        <span
                          class="rounded-full bg-white px-3 py-1"
                          :style="{
                            color,
                            border: `1px solid ${color || '#d9d9d9'}`,
                          }"
                        >
                          {{ statusLabel || '--' }}
                        </span>
                        <span class="font-bold" :style="{ color }">
                          {{ name }}
                        </span>
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
      </div>

      <SetInterventionStepDrawer
        v-if="
          studentInfo?.studentProfileId &&
          interventionPlan?.id &&
          interventionPlan?.status
        "
        :student-profile-id="studentInfo.studentProfileId"
        :intervention-id="interventionPlan.id"
        :step="currentStep"
        :status="interventionPlan?.status"
        @refresh="loadInterventionPlan"
      />
      <InterventionOperationLogModal />
      <StudentProfileDrawer />
      <RelatedInterventionEventModal @refresh="loadInterventionPlan" />
    </div>
  </CrisisInterventionModal>
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
