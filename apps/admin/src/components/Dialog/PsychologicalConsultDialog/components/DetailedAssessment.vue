<script setup lang="ts">
import type { CoreAssessmentType, DetailedAssessmentType } from '@vben/types';

import { ref, watch } from 'vue';

import { Radio as ARadio } from 'ant-design-vue';

import { INTERVENTION_TYPE_MAP } from '#/api/constants';
import RichTextEditor from '#/components/Common/RichTextEditor.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { FileUpload } from '#/components/upload';
import { getDictLabel } from '#/utils/dict';
import { downloadPsychologicalReportTemplate } from '#/utils/export';

const props = withDefaults(
  defineProps<{
    modelValue?: DetailedAssessmentType;
    summary?: CoreAssessmentType;
  }>(),
  {
    modelValue: () => ({ report: '', file: undefined }),
    summary: () => ({
      riskLevel: INTERVENTION_TYPE_MAP[0]?.key || 0,
      issues: ['人际关系'],
      recommendation: 1,
    }),
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: DetailedAssessmentType): void;
}>();

type Method = 'free' | 'template';
const method = ref<Method>('free');
const freeText = ref(props.modelValue.report || ''); // 自由输入
const fileList = ref<{ id: number; url: string }[]>([]); // 上传文件列表

/** 同步数据 */
function sync() {
  emit('update:modelValue', {
    report: freeText.value,
    fileId: fileList.value.length > 0 ? fileList.value[0]?.id : undefined,
  });
}

watch(freeText, sync);
watch(fileList, sync, { deep: true });

/** 校验数据 */
function validate() {
  if (method.value === 'free') {
    return !!freeText.value.trim();
  }
  return !!fileList.value?.length;
}

/** 切换评估方式 */
function handleSelectedChange() {
  if (method.value === 'free') {
    fileList.value = [];
  } else {
    freeText.value = '';
  }
  sync();
}

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
          <span>
            {{ getDictLabel('crisis_level', props.summary.riskLevel) || '—' }}
          </span>
        </div>
        <div>
          <span class="desc-title">问题类型：</span>
          <span>{{ props.summary.issues.join('、') || '—' }}</span>
        </div>
        <div>
          <span class="desc-title">后续建议：</span>
          <span>
            {{
              getDictLabel(
                'follow_up_suggestion',
                props.summary.recommendation,
              ) || '—'
            }}
          </span>
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
        <ARadio.Group v-model:value="method" @change="handleSelectedChange">
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
          <FileUpload
            v-model:value="fileList"
            :accept="['pdf', 'doc', 'docx']"
            :max-size="5"
          />
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
