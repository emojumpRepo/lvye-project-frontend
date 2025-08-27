<script setup lang="ts">
import type { UploadChangeParam, UploadProps } from 'ant-design-vue';

import { Upload as AUpload, message } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    accept?: string;
    maxCount?: number;
    maxSize?: number;
    multiple?: boolean;
    sizeErrorMessage?: string;
    typeErrorMessage?: string;
  }>(),
  {
    maxCount: 1,
    accept: '.doc,.docx,.pdf',
    maxSize: 10,
    multiple: false,
    sizeErrorMessage: '',
    typeErrorMessage: '',
  },
);

const emit = defineEmits<{
  (e: 'sync'): void;
  (e: 'fileReady'): void;
  (e: 'remove'): void;
}>();

const fileList = defineModel<UploadProps['fileList']>('fileList', {
  default: () => [],
});

const progress: UploadProps['progress'] = {
  strokeColor: {
    '0%': '#108ee9',
    '100%': '#87d068',
  },
  strokeWidth: 3,
  format: (percent) => `${Number.parseFloat((percent ?? 0).toFixed(2))}%`,
  class: 'test',
};

/**
 * 上传文件前校验
 * @param file 文件
 * @returns 是否上传
 */
function beforeUpload(file: File) {
  // 文件类型校验
  if (props.accept) {
    const acceptTypes = props.accept.split(',').map((type) => type.trim());
    const fileName = (file?.name || '').toLowerCase();
    const fileExtension = fileName.split('.').pop();

    const isAllowed = acceptTypes.some((type) => {
      if (type.startsWith('.')) {
        // 扩展名格式: .pdf, .doc
        return fileName.endsWith(type.toLowerCase());
      } else if (type.includes('/')) {
        // MIME类型格式: image/png, application/pdf
        return file.type === type;
      } else {
        // 扩展名无点格式: pdf, doc
        return fileExtension === type.toLowerCase();
      }
    });

    if (!isAllowed) {
      const errorMessage =
        props.typeErrorMessage || `仅支持 ${props.accept} 格式的文件`;
      message.error(errorMessage);
      return AUpload.LIST_IGNORE as unknown as boolean;
    }
  }

  // 文件大小校验
  if (props.maxSize && props.maxSize > 0) {
    const isLimitSize = file.size / 1024 / 1024 < props.maxSize;
    if (!isLimitSize) {
      const errorMessage =
        props.sizeErrorMessage || `文件大小不能超过 ${props.maxSize}MB`;
      message.error(errorMessage);
      return AUpload.LIST_IGNORE as unknown as boolean;
    }
  }

  const newFileList = [
    {
      uid: String(Date.now()),
      name: file.name,
      status: 'done',
      originFileObj: file,
    } as any,
  ];
  fileList.value = newFileList;
  emit('sync');

  return false;
}

function onChange(info: UploadChangeParam) {
  const status = info.file.status;
  if (status === 'done') {
    message.success(`${info.file.name} 文件选择成功`);
  } else if (status === 'error') {
    message.error(`${info.file.name} 文件选择失败`);
  }

  emit('fileReady');
}

function onRemove() {
  fileList.value = [];
  emit('remove');
}
</script>

<template>
  <AUpload.Dragger
    :before-upload="beforeUpload"
    v-model:file-list="fileList"
    name="file"
    :max-count="maxCount"
    :accept="accept"
    :multiple="multiple"
    :progress="progress"
    @change="onChange"
    @remove="onRemove"
  >
    <div class="flex flex-col items-center justify-center">
      <img
        src="../../static/icons/consulting/upload.svg"
        alt="上传"
        class="mb-1 h-[54px] w-[54px]"
      />
      <div class="mb-2 text-sm font-medium">
        <slot name="upload-text"></slot>
      </div>
      <div class="mb-2 text-xs text-[#969997]">
        <slot name="upload-text-desc"></slot>
      </div>
    </div>
  </AUpload.Dragger>
</template>

<style lang="scss" scoped>
:deep(.ant-upload) {
  padding: 20px !important;
}
</style>
