<script lang="ts" setup>
import type { UploadFile, UploadProps } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';

import type { FileUploadProps } from './typing';

import type { AxiosProgressEvent } from '#/api/infra/file';

import { computed, ref, toRefs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { isFunction, isObject, isString } from '@vben/utils';

import { message, Modal, Upload } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';
import uploadIcon from '#/static/icons/consulting/upload.svg';

import { checkFileType } from './helper';
import { UploadResultStatus } from './typing';
import { useUpload, useUploadType } from './use-upload';

defineOptions({ name: 'FileUpload', inheritAttrs: false });

const props = withDefaults(defineProps<FileUploadProps>(), {
  value: () => [], // 文件列表
  directory: 'admin', // 上传目录
  disabled: false, // 是否禁用
  dragger: true, // 是否使用拖拽模式
  helpText: '', // 帮助文本
  maxSize: 10, // 最大大小
  maxNumber: 1, // 最大数量
  accept: () => [], // 接受类型
  multiple: false, // 是否多选
  api: undefined, // 上传接口
  resultField: '', // 结果字段
  showDescription: false, // 是否显示描述
});
const emit = defineEmits([
  'change',
  'update:value',
  'delete',
  'returnText',
  'scroll',
]);
const { accept, helpText, maxNumber, maxSize } = toRefs(props);
const isInnerOperate = ref<boolean>(false);

// 动态计算使用的上传组件
const UploadComponent = computed(() => {
  return props.dragger ? Upload.Dragger : Upload;
});
const { getStringAccept } = useUploadType({
  acceptRef: accept,
  helpTextRef: helpText,
  maxNumberRef: maxNumber,
  maxSizeRef: maxSize,
});

const fileList = ref<UploadProps['fileList']>([]);
const isLtMsg = ref<boolean>(true); // 文件大小错误提示
const isActMsg = ref<boolean>(true); // 文件类型错误提示
const isFirstRender = ref<boolean>(true); // 是否第一次渲染
const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');

watch(
  () => props.value,
  (v) => {
    if (isInnerOperate.value) {
      isInnerOperate.value = false;
      return;
    }
    let value: { id: number; url: string }[] = [];
    if (v) {
      if (Array.isArray(v)) {
        value = v;
      } else {
        value.push(v);
      }
      fileList.value = value.map((item, i) => {
        if (item && isString(item)) {
          const fileUrl = item as unknown as string;
          return {
            uid: `${-i}`,
            name: fileUrl.slice(Math.max(0, fileUrl.lastIndexOf('/') + 1)),
            status: UploadResultStatus.DONE,
            url: fileUrl,
            response: { url: fileUrl },
          };
        } else if (item && isObject(item)) {
          const obj = item as any;
          const fileUrl: string = obj.url || '';
          return {
            uid: `${-i}`,
            name:
              obj.name ||
              (fileUrl
                ? fileUrl.slice(Math.max(0, fileUrl.lastIndexOf('/') + 1))
                : ''),
            status: UploadResultStatus.DONE,
            url: fileUrl,
            response: obj,
          } as any;
        }
        return null;
      }) as UploadProps['fileList'];
    }
    if (isFirstRender.value) {
      isFirstRender.value = false;
    } else {
      emit('change', value);
    }
  },
  {
    immediate: true,
    deep: true,
  },
);

/** 移除文件 */
async function handleRemove(file: UploadFile) {
  if (fileList.value) {
    const index = fileList.value.findIndex((item) => item.uid === file.uid);
    index !== -1 && fileList.value.splice(index, 1);
    const value = getValue();
    isInnerOperate.value = true;
    emit('update:value', value);
    emit('change', value);
    emit('delete', file);
  }
}

/** 上传文件前校验 */
async function beforeUpload(file: File) {
  const fileContent = await file.text();
  emit('returnText', fileContent);

  const { maxSize, accept, maxNumber } = props;

  // 检查文件数量（仅在允许多文件上传时检查）
  const currentCount = fileList.value?.length || 0;
  const isOverCount = maxNumber > 1 && currentCount >= maxNumber;
  if (isOverCount) {
    message.error(`最多只能上传 ${maxNumber} 个文件`);
    return Upload.LIST_IGNORE;
  }

  // 检查文件类型
  const isAct = checkFileType(file, accept);
  if (!isAct) {
    message.error($t('ui.upload.acceptUpload', [accept]));
    isActMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isActMsg.value = true), 1000);
  }

  // 检查文件大小
  const isLt = file.size / 1024 / 1024 > maxSize;
  if (isLt) {
    message.error($t('ui.upload.maxSizeMultiple', [maxSize]));
    isLtMsg.value = false;
    // 防止弹出多个错误提示
    setTimeout(() => (isLtMsg.value = true), 1000);
  }

  return (isAct && !isLt && !isOverCount) || Upload.LIST_IGNORE;
}

/** 自定义上传文件 */
async function customRequest(info: UploadRequestOption<any>) {
  let { api } = props;
  if (!api || !isFunction(api)) {
    api = useUpload(props.directory).httpRequest;
  }
  try {
    emit('scroll');
    // 上传文件
    const progressEvent: AxiosProgressEvent = (e) => {
      const percent = Math.trunc((e.loaded / e.total!) * 100);
      info.onProgress!({ percent });
    };
    const res = await api?.(info.file as File, progressEvent);
    info.onSuccess!(res);
    message.success($t('ui.upload.uploadSuccess'));

    // 更新文件
    const value = getValue();
    isInnerOperate.value = true;
    emit('update:value', value);
    emit('change', value);
  } catch (error: any) {
    console.error(error);
    info.onError!(error);
  }
}

/** 获取文件列表 */
function getValue() {
  const list = (fileList.value || [])
    .filter((item) => item?.status === UploadResultStatus.DONE)
    .map((item: any) => {
      if (item?.response && props?.resultField) {
        return item?.response;
      }
      return item?.response;
    });
  return list;
}

/** 获取文件base64 */
function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', (error) => reject(error));
  });
}

/** 常见的图片文件后缀 */
const IMAGE_EXTENSIONS = new Set([
  'bmp',
  'gif',
  'ico',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
]);

/** 触发文件下载的辅助函数 */
const triggerDownload = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.append(link);
  link.click();
  link.remove();
};

/** 预览文件列表 */
const handlePreview = async (file: any) => {
  // 1. 获取文件名并提取后缀
  const fileName = file.name || file.response?.name || '';
  const fileUrl = file.response?.url || file.url; // 获取文件的实际URL

  // 1. 获取文件名并提取后缀
  const lastDotIndex = fileName.lastIndexOf('.');
  const fileExtension =
    lastDotIndex === -1
      ? ''
      : fileName.slice(Math.max(0, lastDotIndex + 1)).toLowerCase();

  // 2. 判断文件是否是图片类型
  if (!IMAGE_EXTENSIONS.has(fileExtension)) {
    if (fileUrl) {
      triggerDownload(fileUrl, fileName);
    } else {
      console.warn(`文件 ${fileName} 无法下载：缺少文件URL。`);
    }

    return;
  }

  if (!file.url && !file.preview) {
    file.preview = (await getBase64(file.originFileObj)) as string;
  }

  previewImage.value = file.response?.url || file.preview;
  previewVisible.value = true;

  // 4. 更新预览标题
  previewTitle.value =
    file.name ||
    file.response?.url.slice(
      Math.max(0, file.response?.url.lastIndexOf('/') + 1),
    );
};

function handleCancel() {
  previewVisible.value = false;
  previewTitle.value = '';
}
</script>

<template>
  <div>
    <component
      :is="UploadComponent"
      v-bind="$attrs"
      v-model:file-list="fileList"
      :accept="getStringAccept"
      :before-upload="beforeUpload"
      :custom-request="customRequest"
      :disabled="disabled"
      :max-count="maxNumber"
      :multiple="multiple"
      list-type="picture"
      :show-upload-list="{ showDownloadIcon: true }"
      :progress="{ showInfo: true }"
      @remove="handleRemove"
      @preview="handlePreview"
    >
      <template v-if="fileList && fileList.length < maxNumber && !disabled">
        <div v-if="dragger" class="flex flex-col items-center justify-center">
          <img :src="uploadIcon" alt="上传" class="mb-1 h-[54px] w-[54px]" />
          <div class="mb-2 text-sm font-medium">
            <slot name="upload-text">
              <div>
                <span class="font-bold">将文件拖拽到此处或，</span>
                <span class="text-[#04DC70]">点击上传</span>
              </div>
            </slot>
          </div>
          <div class="mb-2 text-xs text-[#969997]">
            <slot name="upload-text-desc">
              支持{{
                accept.join('，').replaceAll('.', '').toLocaleUpperCase()
              }}格式, 最大{{ maxSize }}MB
            </slot>
          </div>
        </div>

        <div v-else class="mb-2 mt-3 flex items-center gap-1">
          <LyButton type="default" size="small">
            <div class="flex items-center gap-2">
              <IconifyIcon icon="icons8:upload-2" class="size-5" />
              <span>上传文件</span>
            </div>
          </LyButton>

          <slot name="upload-text-desc">
            <span class="text-xs text-[#969997]">
              （支持{{
                accept.join('，').replaceAll('.', '').toLocaleUpperCase()
              }}格式, 最大{{ maxSize }}MB）
            </span>
          </slot>
        </div>
      </template>

      <template #downloadIcon>
        <IconifyIcon icon="mdi:download" color="#969997" />
      </template>
    </component>
    <Modal
      :open="previewVisible"
      :title="previewTitle"
      :footer="null"
      @cancel="handleCancel"
    >
      <img style="width: 100%" :src="previewImage" />
    </Modal>
  </div>
</template>
