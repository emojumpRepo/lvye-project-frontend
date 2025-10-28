<script lang="ts" setup>
import type { UploadFile, UploadProps } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';

import type { FileUploadProps } from './typing';

import type { AxiosProgressEvent } from '#/api/infra/file';

import { ref, toRefs, watch } from 'vue';

import { $t } from '@vben/locales';
import { isFunction, isObject, isString } from '@vben/utils';

import { message, Modal, Upload } from 'ant-design-vue';

import uploadIcon from '#/static/icons/consulting/upload.svg';

import { checkFileType } from './helper';
import { UploadResultStatus } from './typing';
import { useUpload, useUploadType } from './use-upload';

defineOptions({ name: 'FileUpload', inheritAttrs: false });

const props = withDefaults(defineProps<FileUploadProps>(), {
  value: () => [], // 文件列表
  directory: 'admin', // 上传目录
  disabled: false, // 是否禁用
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

/** 预览文件列表 */
const handlePreview = async (file: any) => {
  if (!file.url && !file.preview) {
    file.preview = (await getBase64(file.originFileObj)) as string;
  }
  previewImage.value = file.response?.url || file.preview;
  previewVisible.value = true;
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
    <Upload.Dragger
      v-bind="$attrs"
      v-model:file-list="fileList"
      :accept="getStringAccept"
      :before-upload="beforeUpload"
      :custom-request="customRequest"
      :disabled="disabled"
      :max-count="maxNumber"
      :multiple="multiple"
      list-type="picture"
      :progress="{ showInfo: true }"
      @remove="handleRemove"
      @preview="handlePreview"
    >
      <div class="flex flex-col items-center justify-center">
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
    </Upload.Dragger>
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
