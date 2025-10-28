<script lang="ts" setup>
import type { InfraFileApi } from '#/api/infra/file';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Spin } from 'ant-design-vue';

import { getFileById } from '#/api/infra/file';

type AttachmentFile = InfraFileApi.File & { downding: boolean };

const attachmentList = ref<AttachmentFile[]>([]);

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
        crisisAttachmentsModalApi.setState({ loading: true });
        attachmentList.value = await Promise.all(
          data.attachmentIds.map(async (id: number) => {
            const file = await getFileById(id);
            return {
              ...file,
              downding: false,
            };
          }),
        );
        crisisAttachmentsModalApi.setState({ loading: false });
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
  if (!attachmentList.value) return { images: [], documents: [], archives: [] };

  const images: AttachmentFile[] = [];
  const documents: AttachmentFile[] = [];
  const archives: AttachmentFile[] = [];

  attachmentList.value.forEach((file) => {
    const type = getFileType(file.name ?? '', file.type ?? '');
    if (type.includes('image')) images.push(file);
    else if (type.includes('archive')) archives.push(file);
    else documents.push(file);
  });

  return { images, documents, archives };
});

// 预览图片
const previewImage = (url: string) => {
  window.open(url, '_blank');
};

// 下载文件
function downloadAttachment(file: AttachmentFile) {
  if (file.downding) {
    return;
  }

  try {
    file.downding = true;

    // 直链下载
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || '新文件';
      document.body.append(link);
      link.click();
      link.remove();

      file.downding = false;
      return;
    }

    message.error('无法下载：缺少文件地址');
    file.downding = false;
  } catch (error) {
    console.error('下载文件失败', error);
    message.error('下载文件失败');
    file.downding = false;
  }
}
</script>

<template>
  <CrisisAttachmentsModal>
    <div class="max-h-80vh overflow-y-auto p-6">
      <!-- 标题 -->
      <div class="mb-6 flex items-center">
        <IconifyIcon icon="mdi:attachment" class="mr-2 text-xl text-blue-500" />
        <h3 class="text-lg font-semibold text-gray-800">附件列表</h3>
        <div class="ml-auto text-sm text-gray-500">
          共 {{ attachmentList?.length || 0 }} 个文件
        </div>
      </div>

      <template v-if="attachmentList && attachmentList.length > 0">
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
              @click="downloadAttachment(doc)"
            >
              <div class="min-w-0 flex-1">
                <div
                  class="truncate font-medium text-gray-800"
                  :title="doc.name"
                >
                  {{ doc.name }}
                </div>
              </div>
              <Spin v-if="doc.downding" size="small" />
              <IconifyIcon
                v-else
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
              @click="downloadAttachment(archive)"
            >
              <div class="min-w-0 flex-1">
                <div
                  class="truncate font-medium text-gray-800"
                  :title="archive.name"
                >
                  {{ archive.name }}
                </div>
              </div>
              <Spin v-if="archive.downding" size="small" />
              <IconifyIcon
                v-else
                icon="mdi:download"
                class="cursor-pointer text-gray-400 transition-colors group-hover:text-orange-500"
              />
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="!attachmentList || attachmentList.length === 0"
          class="flex-center flex-col py-12 text-center"
        >
          <IconifyIcon
            icon="mdi:attachment-off"
            class="mb-4 text-6xl text-gray-300"
          />
          <div class="text-gray-500">暂无附件</div>
        </div>
      </template>
    </div>
  </CrisisAttachmentsModal>
</template>
