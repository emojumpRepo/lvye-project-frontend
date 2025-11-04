<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

import { InterventionOperationLogTypeEnum } from '#/api/psychology';

const interventionPlanId = ref<number>();

const interventionTimelineIconMap = {
  [InterventionOperationLogTypeEnum.CREATE]: 'mingcute:new-folder-line',
  [InterventionOperationLogTypeEnum.UPDATE]: 'mdi:clock',
  [InterventionOperationLogTypeEnum.UPLOAD]: 'icon-park-outline:link',
  [InterventionOperationLogTypeEnum.WRITE]: 'solar:document-add-outline',
};

const [InterventionOperationLogModal, interventionOperationLogModalApi] =
  useVbenModal({
    fullscreenButton: false,
    destroyOnClose: true,
    confirmText: '关闭',
    showCancelButton: false,
    class: '!w-[700px]',
    onOpenChange: async (open) => {
      if (open) {
        const data = await interventionOperationLogModalApi.getData();
        interventionPlanId.value = data.interventionPlanId;
      }
    },
    onConfirm: () => {
      interventionOperationLogModalApi.close();
    },
  });

const interventionOperationLogList = [
  {
    meta: {
      action: 1,
      description: '创建了干预事件',
    },
    operator: '王心理师',
    createTime: 1_762_185_361_000,
  },
  {
    meta: {
      action: 2,
      description: '将 [步骤二：上报学生管理处报案] 的状态从[待处理]更改为',
      text: '[处理中]',
    },
    operator: '王心理师',
    createTime: 1_762_185_522_000,
  },
  {
    meta: {
      action: 3,
      description: '在 [步骤一：心理评估] 中添加了教师笔记',
    },
    operator: '王心理师',
    createTime: 1_762_185_646_000,
  },
  {
    meta: {
      action: 4,
      description: '将 [步骤二：上报学生管理处报案] 中上传了文件',
      subDescription: '评估报告初稿.pdf',
    },
    operator: '王心理师',
    createTime: 1_762_185_716_000,
  },
];
</script>

<template>
  <InterventionOperationLogModal title="操作日志">
    <div class="flex flex-col p-2">
      <template
        v-for="(log, index) in interventionOperationLogList"
        :key="index"
      >
        <div class="flex items-center justify-between py-2">
          <div class="flex items-center gap-2">
            <IconifyIcon
              :icon="
                interventionTimelineIconMap[
                  log.meta.action as keyof typeof interventionTimelineIconMap
                ]
              "
              color="#cbcdcf"
            />
            <div class="text-sm">
              <span class="font-bold">{{ log.operator }}</span>
              <span class="text-gray-500">{{ log.meta.description }}</span>
              <span v-if="log.meta.text" class="text-[#1966FF]">
                {{ log.meta.text }}
              </span>
            </div>
          </div>

          <div class="text-xs text-gray-400">
            {{ dayjs(log.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </div>
        </div>
      </template>
    </div>
  </InterventionOperationLogModal>
</template>
