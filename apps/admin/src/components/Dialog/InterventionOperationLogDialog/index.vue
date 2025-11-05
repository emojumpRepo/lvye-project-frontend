<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

import { getStudentProfileOperationLog } from '#/api/psychology';

interface InterventionOperationLog {
  meta: {
    action: string;
    description: string;
  };
  operator: string;
  createTime: number;
}

const interventionPlanId = ref<number>();
const interventionOperationLogList = ref<InterventionOperationLog[]>([]);

const interventionTimelineIconMap = {
  create: 'mingcute:new-folder-line',
  update: 'material-symbols:update',
  upload: 'icon-park-outline:link',
  write: 'solar:document-add-outline',
  updateRelativeEvents: 'mingcute:link-2-line',
  addStep: 'solar:document-add-outline',
  updateSort: 'bx:sort',
  complete: 'material-symbols:check-box-outline',
};

const [InterventionOperationLogModal, interventionOperationLogModalApi] =
  useVbenModal({
    fullscreenButton: false,
    destroyOnClose: true,
    confirmText: '关闭',
    showCancelButton: false,
    class: '!w-[750px]',
    onOpenChange: async (open) => {
      if (open) {
        const data = await interventionOperationLogModalApi.getData();
        interventionPlanId.value = data.interventionPlanId;

        try {
          const response = await getStudentProfileOperationLog(
            interventionPlanId.value!,
          );

          interventionOperationLogList.value = response
            .filter((item) => item?.meta?.action)
            .map((item) => ({
              meta: {
                action: item.meta.action,
                description: item.meta.description,
              },
              operator: item.operator,
              createTime: item.createTime,
            }));
        } catch (error) {
          console.error(error);
        } finally {
          interventionOperationLogModalApi.setState({ loading: false });
        }
      }
    },
    onConfirm: () => {
      interventionOperationLogModalApi.close();
    },
  });
</script>

<template>
  <InterventionOperationLogModal title="操作日志">
    <div class="flex flex-col px-2">
      <template
        v-for="(log, index) in interventionOperationLogList"
        :key="index"
      >
        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-4">
            <IconifyIcon
              :icon="
                interventionTimelineIconMap[
                  log.meta.action as keyof typeof interventionTimelineIconMap
                ]
              "
              color="#979899"
            />
            <div class="flex gap-1 text-sm">
              <span class="whitespace-nowrap font-bold">{{
                log.operator
              }}</span>
              <span class="font-normal text-[#979899]">
                {{ log.meta.description }}
              </span>
            </div>
          </div>

          <div class="ml-4 whitespace-nowrap text-xs text-gray-400">
            {{ dayjs(log.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </div>
        </div>
      </template>
    </div>
  </InterventionOperationLogModal>
</template>
