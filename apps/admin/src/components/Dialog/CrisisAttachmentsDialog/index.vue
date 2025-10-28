<script lang="ts" setup>
import type { InfraFileApi } from '#/api/infra/file';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { getFileById } from '#/api/infra/file';

const attachmentIds = ref<InfraFileApi.File[]>([]);

const [CrisisAttachmentsModal, crisisAttachmentsModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  header: false,
  footer: false,
  class: '!w-[720px]',
  onOpenChange: async (open) => {
    if (open) {
      const data = crisisAttachmentsModalApi.getData();
      if (data.attachmentIds.length > 0) {
        crisisAttachmentsModalApi.lock();
        attachmentIds.value = await Promise.all(
          data.attachmentIds.map((id: number) => getFileById(id)),
        );
        crisisAttachmentsModalApi.unlock();
      }
    }
  },
});

// 文件类型判断
const getFileType = (fileName: string, mimeType: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (
    ['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'].includes(ext) ||
    mimeType.startsWith('image/')
  ) {
    return 'image';
  }

  if (
    ['7z', 'gz', 'rar', 'tar', 'zip'].includes(ext) ||
    mimeType.includes('zip') ||
    mimeType.includes('compressed')
  ) {
    return 'archive';
  }

  return 'document';
};

// 分类文件
const categorizedFiles = computed(() => {
  if (!attachmentIds.value) return { images: [], documents: [], archives: [] };

  const images: InfraFileApi.File[] = [];
  const documents: InfraFileApi.File[] = [];
  const archives: InfraFileApi.File[] = [];

  attachmentIds.value.forEach((file) => {
    const type = getFileType(file.name ?? '', file.type ?? '');
    if (type === 'image') images.push(file);
    else if (type === 'archive') archives.push(file);
    else documents.push(file);
  });

  return { images, documents, archives };
});

// 预览图片
const previewImage = (url: string) => {
  window.open(url, '_blank');
};

// 下载文件
const downloadFile = (file: InfraFileApi.File) => {
  const link = document.createElement('a');
  link.href = file?.url ?? '';
  link.download = file?.name ?? '';
  link.click();
};
</script>

<template>
  <CrisisAttachmentsModal>
    <div class="max-h-80vh overflow-y-auto p-6">
      <!-- 标题 -->
      <div class="mb-6 flex items-center">
        <IconifyIcon icon="mdi:attachment" class="mr-2 text-xl text-blue-500" />
        <h3 class="text-lg font-semibold text-gray-800">附件列表</h3>
        <div class="ml-auto text-sm text-gray-500">
          共 {{ attachmentIds?.length || 0 }} 个文件
        </div>
      </div>

      <!-- 图片区域 -->
      <div v-if="categorizedFiles.images.length > 0" class="mb-8">
        <div class="mb-4 flex items-center">
          <IconifyIcon icon="mdi:image" class="mr-2 text-lg text-green-500" />
          <h4 class="font-medium text-gray-700">
            图片 ({{ categorizedFiles.images.length }})
          </h4>
        </div>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="image in categorizedFiles.images"
            :key="image.id"
            class="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-colors hover:border-blue-300"
            @click="previewImage(image?.url ?? '')"
          >
            <div class="aspect-square">
              <img
                :src="image.url"
                :alt="image.name"
                class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div
              class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-20"
            >
              <IconifyIcon
                icon="mdi:eye"
                class="text-2xl text-white opacity-0 transition-opacity group-hover:opacity-70"
              />
            </div>
            <div class="bg-white p-2">
              <div class="truncate text-xs text-gray-600" :title="image.name">
                {{ image.name }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文档区域 -->
      <div v-if="categorizedFiles.documents.length > 0" class="mb-8">
        <div class="mb-4 flex items-center">
          <IconifyIcon
            icon="mdi:file-document"
            class="mr-2 text-lg text-blue-500"
          />
          <h4 class="font-medium text-gray-700">
            文档 ({{ categorizedFiles.documents.length }})
          </h4>
        </div>
        <div class="space-y-2">
          <div
            v-for="doc in categorizedFiles.documents"
            :key="doc.id"
            class="group flex cursor-pointer items-center rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
            @click="downloadFile(doc)"
          >
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium text-gray-800" :title="doc.name">
                {{ doc.name }}
              </div>
            </div>
            <IconifyIcon
              icon="mdi:download"
              class="text-gray-400 transition-colors group-hover:text-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- 压缩包区域 -->
      <div v-if="categorizedFiles.archives.length > 0" class="mb-4">
        <div class="mb-4 flex items-center">
          <IconifyIcon
            icon="mdi:archive"
            class="mr-2 text-lg text-orange-500"
          />
          <h4 class="font-medium text-gray-700">
            压缩包 ({{ categorizedFiles.archives.length }})
          </h4>
        </div>
        <div class="space-y-2">
          <div
            v-for="archive in categorizedFiles.archives"
            :key="archive.id"
            class="group flex cursor-pointer items-center rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-orange-300 hover:bg-orange-50"
            @click="downloadFile(archive)"
          >
            <div class="min-w-0 flex-1">
              <div
                class="truncate font-medium text-gray-800"
                :title="archive.name"
              >
                {{ archive.name }}
              </div>
            </div>
            <IconifyIcon
              icon="mdi:download"
              class="text-gray-400 transition-colors group-hover:text-orange-500"
            />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="!attachmentIds || attachmentIds.length === 0"
        class="py-12 text-center"
      >
        <IconifyIcon
          icon="mdi:attachment-off"
          class="mb-4 text-6xl text-gray-300"
        />
        <div class="text-gray-500">暂无附件</div>
      </div>
    </div>
  </CrisisAttachmentsModal>
</template>
