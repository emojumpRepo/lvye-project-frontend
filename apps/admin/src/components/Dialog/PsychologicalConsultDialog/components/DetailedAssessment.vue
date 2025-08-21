<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import type { CoreAssessmentType, DetailedAssessmentType } from '#/api/consult';

import { ref, watch } from 'vue';

import {
  Radio as ARadio,
  UploadDragger as AUpload,
  message,
} from 'ant-design-vue';

import { riskOptions } from '#/api/consult';
import RichTextEditor from '#/components/Common/RichTextEditor.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { downloadPsychologicalReportTemplate } from '#/utils/export';

const props = withDefaults(
  defineProps<{
    modelValue?: DetailedAssessmentType;
    summary?: CoreAssessmentType;
  }>(),
  {
    modelValue: () => ({ report: '', file: undefined }),
    summary: () => ({
      riskLevel: riskOptions[0]?.key || '',
      issues: ['人际关系'],
      recommendations: '需要持续咨询',
    }),
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: DetailedAssessmentType): void;
}>();

type Method = 'free' | 'template';
const method = ref<Method>('free');
const freeText = ref(props.modelValue.report || '');

const fileList = ref<UploadProps['fileList']>([]);

function beforeUpload(file: File) {
  const name = (file?.name || '').toLowerCase();
  const isAllowed =
    name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
  if (!isAllowed) {
    message.error('仅支持 DOC、DOCX、PDF 格式');
    return AUpload.LIST_IGNORE as unknown as boolean;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB');
    return AUpload.LIST_IGNORE as unknown as boolean;
  }
  // 使用受控列表，构造 UploadFile 对象，确保 originFileObj 可用
  fileList.value = [
    {
      uid: String(Date.now()),
      name: file.name,
      status: 'done',
      originFileObj: file,
    } as any,
  ];
  sync();
  return false;
}

function onRemove() {
  fileList.value = [];
  sync();
}

function validate() {
  if (method.value === 'free') {
    return !!freeText.value.trim();
  }
  return !!fileList.value?.length;
}

function sync() {
  emit('update:modelValue', {
    report: freeText.value,
    file: (fileList.value?.[0]?.originFileObj as File) || undefined,
  });
}

watch(freeText, sync);
watch(
  () => method.value,
  () => {
    // 切换方式时，清空另一种方式的值，避免脏数据
    if (method.value === 'free') {
      fileList.value = [];
    } else {
      freeText.value = '';
    }
    // 触发一次同步与父层实时校验
    sync();
  },
);

defineExpose({
  validate,
});
</script>

<template>
  <div class="space-y-6">
    <!-- 评估结论总结 -->
    <div>
      <LyLabel
        title="评估结论总结"
        has-indicator
        margin-bottom-class="mb-3"
        custom-title-class="text-[16px] font-semibold"
      />
      <section class="section-container">
        <div>
          <span class="desc-title">风险等级：</span>
          <span>{{
            riskOptions.find((opt) => opt.key === props.summary.riskLevel)
              ?.title || '—'
          }}</span>
        </div>
        <div>
          <span class="desc-title">问题类型：</span>
          <span>{{ props.summary.issues.join('、') || '—' }}</span>
        </div>
        <div>
          <span class="desc-title">后续建议：</span>
          <span>{{ props.summary.recommendations || '—' }}</span>
        </div>
      </section>
    </div>

    <!-- 选择评估方式 -->
    <section>
      <LyLabel
        title="请选择评估方式"
        required
        has-indicator
        margin-bottom-class="mb-3"
        custom-title-class="text-[16px] font-semibold"
      />
      <div class="mb-2 flex items-center gap-6 text-[14px]">
        <ARadio.Group v-model:value="method">
          <ARadio value="free">自由输入</ARadio>
          <ARadio value="template">模板上传</ARadio>
        </ARadio.Group>
      </div>

      <!-- 自由输入 -->
      <div v-if="method === 'free'">
        <RichTextEditor
          v-model="freeText"
          :height="260"
          placeholder="请输入本次详细评估的过程、观察、分析与结论要点…"
        />
      </div>

      <!-- 模板上传 -->
      <div v-else class="space-y-6">
        <div
          class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#F2F3F5] p-10 text-center"
        >
          <img
            src="../../../../static/icons/consulting/download.svg"
            alt="模板"
            class="mb-3 h-[45px] w-[45px]"
          />
          <div class="mb-2 text-[14px] font-medium">下载评估模板</div>
          <div class="mb-4 text-[12px] text-[#969997]">
            请先下载学校提供的标准评估模板，离线填写后上传完成的文档
          </div>
          <LyButton
            type="success"
            size="middle"
            class="h-12 w-[120px] justify-center"
            @click="downloadPsychologicalReportTemplate"
          >
            下载模板
          </LyButton>
        </div>

        <!-- 上传评估文档 -->
        <section>
          <LyLabel
            title="请上传完成的评估文档"
            required
            margin-bottom-class="mb-3"
            custom-title-class="text-[16px] font-semibold"
          />

          <AUpload
            :before-upload="beforeUpload"
            :file-list="fileList"
            :max-count="1"
            accept=".doc,.docx,.pdf"
            @remove="onRemove"
          >
            <div class="flex flex-col items-center justify-center">
              <img
                src="../../../../static/icons/consulting/upload.svg"
                alt="上传"
                class="mb-1 h-[54px] w-[54px]"
              />
              <div class="mb-2 text-[14px] font-medium">
                将评估文件拖拽到此处或，
                <span class="text-[#04DC70]">点击上传</span>
              </div>
              <div class="mb-2 text-[12px] text-[#969997]">
                支持 DOC、DOCX、PDF 格式，最大10MB
              </div>
            </div>
          </AUpload>
        </section>
      </div>
    </section>
  </div>
</template>
<style scoped lang="scss">
.section-container {
  @apply grid grid-cols-1 gap-1 rounded-xl bg-[#F7F8FA] px-6 py-4 text-[14px] text-[#4B4B4D];

  .desc-title {
    @apply mr-2 font-medium text-[#000];
  }
}

:deep(.ant-upload-wrapper .ant-upload-drag) {
  @apply border-2 border-dashed border-[#F2F3F5] bg-[#fff] p-10 text-center;
}
</style>
