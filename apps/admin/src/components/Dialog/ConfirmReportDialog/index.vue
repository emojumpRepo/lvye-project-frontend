<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import LyTag from '#/components/LyTag/index.vue';

interface Params {
  studentProfileId: number;
  studentInfo: string;
  title: string;
  description: string;
  eventTime: string;
  location: string;
  riskLevel: number;
  priority: number;
}

const params = ref<Params>();

const [ConfirmReportModal, confirmReportModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  headerClass: 'px-5 py-3',
  onOpenChange: async (open) => {
    if (open) {
      const data = await confirmReportModalApi.getData<Params>();
      if (data.studentProfileId) {
        params.value = data;
      } else {
        confirmReportModalApi.close();
        message.error('请选择正确的学生');
      }
    }
  },
});
</script>

<template>
  <ConfirmReportModal>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon icon="mdi:alert-circle" color="#FF9C05" class="size-6" />
        <span>确认上报信息</span>
      </div>
    </template>

    <div class="p-2">
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div class="space-y-4 text-sm">
          <!-- 学生信息 -->
          <div class="flex items-start gap-4">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#04DC7014]"
            >
              <IconifyIcon icon="tabler:user" color="#04DC70" class="size-4" />
            </div>
            <div class="flex-1">
              <div class="mb-1 text-[#6B7280]">学生信息</div>
              <div class="font-semibold text-[#1F2937]">
                {{ params?.studentInfo || '--' }}
              </div>
            </div>
          </div>

          <!-- 事件标题 -->
          <div class="flex items-start gap-4">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF418D14]"
            >
              <IconifyIcon
                icon="fluent:slide-text-title-16-regular"
                color="#FF418D"
                class="size-4"
              />
            </div>
            <div class="flex-1">
              <div class="mb-1 text-[#6B7280]">事件标题</div>
              <div class="font-semibold text-[#1F2937]">
                {{ params?.title || '--' }}
              </div>
            </div>
          </div>

          <!-- 事件描述 -->
          <div class="flex items-start gap-4">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#009DFF14]"
            >
              <IconifyIcon
                icon="fluent:textbox-16-regular"
                color="#009DFF"
                class="size-4"
              />
            </div>

            <div class="flex-1">
              <div class="mb-1 text-[#6B7280]">事件描述</div>
              <div class="leading-relaxed text-[#1F2937]">
                {{ params?.description || '--' }}
              </div>
            </div>
          </div>

          <!-- 发生时间 -->
          <div class="flex items-start gap-4">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#1966FF14]"
            >
              <IconifyIcon
                icon="mdi:clock-outline"
                color="#1966FF"
                class="size-4"
              />
            </div>

            <div class="flex-1">
              <div class="mb-1 text-[#6B7280]">发生时间</div>
              <div class="font-semibold text-[#1F2937]">
                {{
                  params?.eventTime
                    ? dayjs(params.eventTime).format(
                        'YYYY年MM月DD日 HH:mm-HH:mm',
                      )
                    : '--'
                }}
              </div>
            </div>
          </div>

          <!-- 发生地点 -->
          <div class="flex items-start gap-4">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#F59E0B14]"
            >
              <IconifyIcon
                icon="mingcute:location-line"
                color="#FF9C05"
                class="size-4"
              />
            </div>

            <div class="flex-1">
              <div class="mb-1 text-[#6B7280]">发生地点</div>
              <div class="font-semibold text-[#1F2937]">
                {{ params?.location || '--' }}
              </div>
            </div>
          </div>

          <!-- 紧急程度 -->
          <div class="flex items-start gap-4">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B5CF614]"
            >
              <IconifyIcon
                icon="mdi:priority-high"
                color="#8B5CF6"
                class="size-4"
              />
            </div>

            <div class="flex-1">
              <div class="mb-2 text-[#6B7280]">紧急程度</div>
              <div class="font-semibold text-[#1F2937]">
                <LyTag
                  v-if="params?.priority"
                  tag-category-key="crisis_event_priority"
                  :dict-value="params?.priority"
                />
                <span v-else>--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ConfirmReportModal>
</template>
