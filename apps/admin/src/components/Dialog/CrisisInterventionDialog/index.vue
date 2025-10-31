<script lang="ts" setup>
import type { ButtonType } from '#/components/LyButton/index.vue';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Divider as ADivider } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

interface ActionButton {
  label: string;
  value: string;
  type: ButtonType;
  icon?: string;
}

const emit = defineEmits<{
  (e: 'openStudentProfileDrawer', studentProfileId: number): void;
}>();

const studentProfileId = ref<number>();

const bgImage =
  'https://6d65-mentor-3gyob3y3bdbc2bdb-1305613707.tcb.qcloud.la/lvye/bg.jpg';

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
      studentProfileId.value = data.studentProfileId;
      // if (data.studentProfileId) {
      //   emit('openStudentProfileDrawer', data.studentProfileId);
      // }
    }
  },
});

const actionButtons = ref<ActionButton[]>([
  {
    label: '操作日志',
    value: 'operationLog',
    type: 'default',
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

const relatedEvents = ref([
  {
    id: 1,
    title: '心理测评',
    taskNo: '2025001',
    bgColor: '#e7f2fe',
    color: '#1966FF',
  },
  {
    id: 2,
    title: '事件上报',
    taskNo: '2025001',
    bgColor: '#f5e8ff',
    color: '#8D00F1',
  },
]);

/** 打开返回确认弹窗 */
function handleOpenCancelConfirmModal() {
  crisisInterventionModalApi.close();
}

/** 打开学生详情抽屉 */
function handleOpenStudentProfileDrawer() {
  studentProfileId.value &&
    emit('openStudentProfileDrawer', studentProfileId.value);
}

/** 移除标签 */
function handleRemoveTag() {}
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
              <div class="text-lg font-bold">严重危机干预（ID: 2025-004）</div>
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
                李明（高一3班）
              </span>
            </div>
          </div>

          <ADivider />

          <!-- 主体内容 -->
          <div>
            <LyLabel title="关联的事件" has-indicator />

            <!-- 关联事件 -->
            <div class="flex flex-wrap items-center gap-2">
              <div
                v-for="event in relatedEvents"
                :key="event.id"
                class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                :style="{ backgroundColor: event.bgColor }"
              >
                <span :style="{ color: event.color }">
                  {{ event.title }}（任务编号：{{ event.taskNo }}）
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
          </div>
        </div>
      </div>
    </div>
  </CrisisInterventionModal>
</template>
