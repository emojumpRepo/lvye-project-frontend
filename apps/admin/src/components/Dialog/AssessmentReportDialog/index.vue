<script lang="ts" setup>
import type { AssessmentRecord } from '@vben/types';

import type { InfraFileApi } from '#/api/infra/file';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Tag as ATag, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getFileById } from '#/api/infra/file';
import LyTag from '#/components/LyTag/index.vue';

const assessmentReport = ref<AssessmentRecord>();

const attachmentList = ref<InfraFileApi.File[]>([]);

const [AssessmentReportModal, assessmentReportModalApi] = useVbenModal({
  fullscreenButton: false,
  header: false,
  footer: false,
  class: '!w-[760px]',
  onOpenChange: async (open) => {
    if (open) {
      assessmentReportModalApi.setState({ loading: true });
      const data = assessmentReportModalApi.getData();
      assessmentReport.value = data.assessmentReport;
      if (
        assessmentReport.value?.attachmentIds &&
        assessmentReport.value?.attachmentIds.length > 0
      ) {
        attachmentList.value = await Promise.all(
          assessmentReport.value?.attachmentIds.map((id: number) =>
            getFileById(id),
          ),
        );
      }
      assessmentReportModalApi.setState({ loading: false });
    }
  },
});

/** 检查文件名是否为图片
 * @param fileName 文件名
 */
function isImageFile(fileName: null | string | undefined): boolean {
  if (!fileName) return false;
  // 常见图片扩展名列表
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.svg',
    '.webp',
  ];
  const lowerCaseName = fileName.toLowerCase();
  // 检查文件名是否以后缀结尾
  return imageExtensions.some((ext) => lowerCaseName.endsWith(ext));
}

/** 下载文件 */
function downloadFile(file: InfraFileApi.File) {
  if (!file.url) return message.error('文件不存在，无法下载');

  if (isImageFile(file.name)) {
    window.open(file.url, '_blank');
  } else {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name || '新文件';
    document.body.append(link);
    link.click();
    link.remove();
  }
}
</script>

<template>
  <AssessmentReportModal>
    <div class="space-y-8 p-6">
      <!-- 报告总结部分 -->
      <div>
        <div class="mb-2 flex items-center">
          <div class="mr-3 h-6 w-1 bg-blue-500"></div>
          <h2 class="text-lg font-semibold text-gray-800">评估总结</h2>
        </div>
        <div class="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
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
          <div class="flex items-center text-sm">
            <span class="mr-4">
              评估时间：
              {{
                dayjs(assessmentReport?.createTime).format(
                  'YYYY-MM-DD HH:mm:ss',
                )
              }}
            </span>
          </div>
          <div class="flex items-center">
            <span>是否有就医用药情况：</span>
            <span>
              {{ assessmentReport?.hasMedicalVisit ? '是' : '否' }}
            </span>
          </div>
          <div class="flex items-center">
            <span>风险等级：</span>
            <LyTag
              tag-category-key="risk_level"
              :dict-value="assessmentReport?.riskLevel"
            />
          </div>
        </div>
      </div>

      <!-- 报告内容部分 -->
      <div>
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
          <span class="ml-2 text-sm text-gray-500">
            （{{ attachmentList.length }} 个文件）
          </span>
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
              <IconifyIcon
                icon="mdi:download"
                color="#1966FF"
                @click="downloadFile(file)"
                class="cursor-pointer transition-colors group-hover:text-[#1966FF14]"
              />
            </div>
          </div>
        </div>
        <div v-else class="flex items-center gap-2">
          <div class="ml-4 text-sm text-gray-500">暂无附件</div>
        </div>
      </div>

      <!-- 就医用药情况 -->
      <div v-if="assessmentReport?.medicalVisitRecord">
        <div>
          <div class="mb-3 flex items-center">
            <div class="mr-3 h-6 w-1 bg-[#FF418D]"></div>
            <h2 class="text-lg font-semibold text-gray-800">就医用药情况</h2>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div
            class="prose max-w-none"
            v-dompurify-html="
              assessmentReport?.medicalVisitRecord || '暂无内容'
            "
          ></div>
        </div>
      </div>

      <!-- 观察记录 -->
      <div v-if="assessmentReport?.observationRecord">
        <div>
          <div class="mb-3 flex items-center">
            <div class="mr-3 h-6 w-1 bg-[#009DFF]"></div>
            <h2 class="text-lg font-semibold text-gray-800">观察记录</h2>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div
            class="prose max-w-none"
            v-dompurify-html="assessmentReport?.observationRecord || '暂无内容'"
          ></div>
        </div>
      </div>
    </div>
  </AssessmentReportModal>
</template>
