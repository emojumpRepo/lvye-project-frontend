<script lang="ts" setup>
import type { InterventionPlan, StudentInterventionItem } from '@vben/types';

import type { ButtonType } from '#/components/LyButton/index.vue';

import { ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Divider as ADivider, Tree as ATree } from 'ant-design-vue';

import { TAG_TYPE } from '#/api/constants';
import { getInterventionPlan } from '#/api/psychology';
import InterventionOperationLogDialog from '#/components/Dialog/InterventionOperationLogDialog/index.vue';
import CreateInterventionStepDrawer from '#/components/Drawer/CreateInterventionStepDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { getDictObj } from '#/utils/dict';

interface ActionButton {
  label: string;
  value: string;
  type: ButtonType;
  icon?: string;
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
const treeData = ref<TreeData[]>([]);

const bgImage =
  'https://6d65-mentor-3gyob3y3bdbc2bdb-1305613707.tcb.qcloud.la/lvye/bg.jpg';

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

// 危机干预弹窗
const [CrisisInterventionModal, crisisInterventionModalApi] = useVbenModal({
  fullscreen: true,
  fullscreenButton: false,
  destroyOnClose: true,
  closable: false,
  headerClass: '!hidden',
  footer: false,
  contentClass: '!p-0',
  appendToMain: true,
  onOpenChange: async (open) => {
    if (open) {
      const data = await crisisInterventionModalApi.getData();
      studentInfo.value = data.studentInfo;
      interventionPlanId.value = data.interventionPlanId;
      try {
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
                  color: sourceType.color,
                  bgColor: sourceType.backgroundColor,
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
                  color: stepStatusType.color,
                  bgColor: stepStatusType.backgroundColor,
                  selectable: false,
                };
              });
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  },
});

const actionButtons = ref<ActionButton[]>([
  {
    label: '操作日志',
    value: 'operationLog',
    type: 'default',
    onClick: () => viewOperationLog(),
  },
  {
    label: '获取报告模板',
    value: 'getReportTemplate',
    type: 'default',
  },
  {
    label: '导出ZIP',
    value: 'export',
    type: 'default',
  },
  {
    label: '结束干预',
    value: 'endIntervention',
    icon: 'mdi:check-circle',
    type: 'success',
  },
]);

/** 打开返回确认弹窗 */
function handleOpenCancelConfirmModal() {
  crisisInterventionModalApi.close();
}

/** 打开学生详情抽屉 */
function handleOpenStudentProfileDrawer() {
  // studentProfileId.value &&
  //   emit('openStudentProfileDrawer', studentProfileId.value);
}

/** 移除标签 */
function handleRemoveTag() {}

/** 打开设置步骤抽屉 */
function handleOpenSetInterventionStepDrawer() {
  if (!studentInfo.value?.studentProfileId) return;
  setInterventionStepDrawerApi
    .setData({
      studentProfileId: studentInfo.value.studentProfileId,
    })
    .open();
}

/** 打开操作日志弹窗 */
function viewOperationLog() {
  interventionOperationLogModalApi
    .setData({
      interventionPlanId: interventionPlanId.value,
    })
    .open();
}
</script>

<template>
  <CrisisInterventionModal>
    <div
      class="bg-background-deep relative box-border flex w-full !bg-[#f7f8fa] px-12 py-6"
    >
      <img :src="bgImage" width="100%" class="absolute inset-0" />

      <div class="z-10 flex w-1/2 flex-col gap-6">
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
              <LyButton :type="button.type">
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

        <div class="flex flex-col rounded-xl bg-white p-6">
          <!-- 干预信息 -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <div class="text-lg font-bold">
                {{ interventionPlan?.title }}（ID:
                {{ interventionPlan?.interventionId || '--' }}）
              </div>
              <IconifyIcon
                icon="mynaui:edit"
                color="#979899"
                class="size-5 cursor-pointer hover:!text-[#1966FF]"
              />
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

          <ADivider />

          <!-- 主体内容 -->
          <div class="space-y-4">
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
                <div class="cursor-pointer" @click="handleRemoveTag()">
                  <IconifyIcon
                    icon="material-symbols:close-rounded"
                    :color="event.color"
                  />
                </div>
              </div>

              <div
                class="dash inline-flex items-center gap-1 rounded-full border border-dashed border-[#d9d9d9] px-3 py-1 text-xs"
              >
                <IconifyIcon
                  icon="material-symbols:add-rounded"
                  color="#979899"
                />
                <span class="text-[#979899]"> 关联事件 </span>
              </div>
            </div>

            <!-- 拖拽事件 -->
            <div class="space-y-4 pt-3">
              <div class="text-xs text-[#979899]">您可以拖拽事件进行排序</div>

              <!-- 树形事件 -->
              <ATree draggable block-node :tree-data="treeData" class="">
                <template #title="{ name, statusLabel, bgColor, color }">
                  <div
                    class="flex items-center gap-2 rounded-xl p-3 text-xs hover:!bg-[#f6f8fa]/70"
                    :style="{ backgroundColor: bgColor }"
                    @click="handleOpenSetInterventionStepDrawer()"
                  >
                    <span
                      class="rounded-full px-3 py-1"
                      :style="{ color, border: `1px solid ${color}` }"
                    >
                      {{ statusLabel || '--' }}
                    </span>
                    <span class="font-bold" :style="{ color }">
                      {{ name }}
                    </span>
                  </div>
                </template>
              </ATree>

              <!-- 添加新步骤 -->
              <div
                class="flex cursor-pointer items-center gap-2 text-xs text-[#1966FF] hover:!text-[#1966FF]/80"
              >
                <IconifyIcon icon="material-symbols:add-rounded" />
                <span>添加新步骤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SetInterventionStepDrawer />
      <InterventionOperationLogModal />
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
</style>
