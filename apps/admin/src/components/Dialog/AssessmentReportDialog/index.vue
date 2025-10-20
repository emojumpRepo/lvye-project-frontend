<script lang="ts" setup>
import type { AssessmentRecord } from '@vben/types';

import type { InfraFileApi } from '#/api/infra/file';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Tag as ATag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getFileById } from '#/api/infra/file';
import LyTag from '#/components/LyTag/index.vue';

const assessmentReport = ref<AssessmentRecord>();

const attachmentList = ref<InfraFileApi.File[]>([]);

const [AssessmentReportModal, assessmentReportModalApi] = useVbenModal({
  fullscreenButton: false,
  header: false,
  footer: false,
  class: '!w-[800px]',
  onOpenChange: async (open) => {
    if (open) {
      const data = assessmentReportModalApi.getData();
      assessmentReport.value = data.assessmentReport;
      if (
        assessmentReport.value?.attachments &&
        assessmentReport.value?.attachments.length > 0
      ) {
        attachmentList.value = await Promise.all(
          assessmentReport.value?.attachments.map((id: number) =>
            getFileById(id),
          ),
        );
      }
    }
  },
});

function downloadFile(file: InfraFileApi.File) {
  const link = document.createElement('a');
  link.href = file?.url ?? '';
  link.download = file?.name ?? '';
  link.click();
}
</script>

<template>
  <AssessmentReportModal>
    <div class="space-y-6 p-6">
      <!-- 报告总结部分 -->
      <div class="border-b border-gray-200 pb-4">
        <div class="mb-2 flex items-center">
          <div class="mr-3 h-6 w-1 bg-blue-500"></div>
          <h2 class="text-lg font-semibold text-gray-800">评估结论</h2>
        </div>
        <div class="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
          <div class="flex items-center">
            <span>风险水平：</span>
            <LyTag
              tag-category-key="crisis_level"
              :dict-value="assessmentReport?.riskLevel"
            />
          </div>
          <div class="flex items-center">
            <span>评估问题：</span>
            <div class="flex items-center">
              <ATag
                v-for="problem in assessmentReport?.problemTypes"
                :key="problem"
                type="default"
              >
                {{ problem }}
              </ATag>
            </div>
          </div>
          <div class="mt-2 flex items-center text-sm">
            <span class="mr-4">
              评估时间：
              {{
                dayjs(assessmentReport?.createTime).format(
                  'YYYY-MM-DD HH:mm:ss',
                )
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- 报告内容部分 -->
      <div class="border-b border-gray-200 pb-4">
        <div class="mb-3 flex items-center">
          <div class="mr-3 h-6 w-1 bg-green-500"></div>
          <h2 class="text-lg font-semibold text-gray-800">评估内容</h2>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div
            class="prose max-w-none"
            v-dompurify-html="assessmentReport?.content || '暂无内容'"
          ></div>
        </div>
      </div>

      <!-- 报告附件部分 -->
      <div>
        <div class="mb-3 flex items-center">
          <div class="mr-3 h-6 w-1 bg-orange-500"></div>
          <h2 class="text-lg font-semibold text-gray-800">评估附件</h2>
          <!-- <span class="ml-2 text-sm text-gray-500">
            ({{ attachments.length }} 个文件)
          </span> -->
        </div>
        <div
          v-if="attachmentList && attachmentList.length > 0"
          class="space-y-2"
        >
          <div
            v-for="(file, index) in attachmentList"
            :key="index"
            class="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
          >
            <div class="flex items-center gap-2">
              <!-- 文件类型图标 -->
              <IconifyIcon icon="bxs:file" color="#04DC70" class="size-5" />
              <div class="font-medium text-gray-900">{{ file.name }}</div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                class="rounded px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
                @click="downloadFile(file)"
              >
                下载
              </button>
            </div>
          </div>
        </div>
        <div v-else class="flex items-center gap-2">
          <IconifyIcon icon="bxs:file" color="#04DC70" class="size-5" />
          <div class="text-sm text-gray-500">暂无附件</div>
        </div>
      </div>
    </div>
  </AssessmentReportModal>
</template>
