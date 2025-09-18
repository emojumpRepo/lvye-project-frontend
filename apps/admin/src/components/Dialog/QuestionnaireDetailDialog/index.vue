<script setup lang="ts">
import type { QuestionnaireVO } from '@vben/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  RadioButton,
  RadioGroup,
  Select,
  Spin,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getQuestionnaire,
  updateQuestionnaire,
} from '#/api/psychology/questionnaire';
import LyButton from '#/components/LyButton/index.vue';
import { getDictOptions } from '#/utils/dict';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const [Modal, modalApi] = useVbenModal({
  title: '问卷详情',
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      const currentQuestionnaireId = modalApi.getData().id;
      if (currentQuestionnaireId) {
        await fetchDetail(currentQuestionnaireId);
      }
    } else {
      currentQuestionnaire.value = null;
      isEditMode.value = false;
      originalFormData.value = null;
    }
  },
});

const loading = ref(false);
const isEditMode = ref(false);
const currentQuestionnaire = ref<null | QuestionnaireVO>(null);
const formRef = ref();

// 表单数据
const formData = ref({
  title: '',
  externalId: '',
  questionnaireType: '',
  estimatedDuration: 0,
  externalLink: '',
  description: '',
  supportIndependentUse: 0,
  status: '',
  targetAudience: '',
});

// 用于"取消编辑"时恢复到详情初始状态
const originalFormData = ref<null | typeof formData.value>(null);

// 字典选项
const questionnaireTypeOptions = getDictOptions('questionnaire_type');
const statusOptions = getDictOptions('questionnaire_status');
const targetAudienceOptions = getDictOptions('questionnaire_target_audience');

const isReadOnly = computed(() => !isEditMode.value);

// 底部按钮文本
const footerSecondaryText = computed(() =>
  isEditMode.value ? '取消' : '关闭',
);
const footerPrimaryText = computed(() => (isEditMode.value ? '保存' : '编辑'));

async function fetchDetail(id?: number) {
  if (!id) return;
  loading.value = true;
  try {
    const data = await getQuestionnaire(id);
    currentQuestionnaire.value = data;

    // 填充表单数据
    formData.value = {
      title: data.title || '',
      externalId: data.externalId || '',
      questionnaireType: String(data.questionnaireType || ''),
      estimatedDuration: data.estimatedDuration || 0,
      externalLink: data.externalLink || '',
      description: data.description || '',
      supportIndependentUse: data.supportIndependentUse || 0,
      status: String(data.status || ''),
      targetAudience: String(data.targetAudience || ''),
    };

    // 记录原始数据快照用于"取消编辑"恢复
    originalFormData.value = { ...formData.value };
  } finally {
    loading.value = false;
  }
}

// 底部按钮点击处理
function onFooterSecondaryClick() {
  // 编辑状态：恢复快照并切回只读
  if (isEditMode.value) {
    if (originalFormData.value) {
      formData.value = { ...originalFormData.value };
    }
    isEditMode.value = false;
    return;
  }
  // 其他：关闭弹窗
  modalApi.close();
}

function onFooterPrimaryClick() {
  if (isEditMode.value) {
    handleSave();
  } else {
    handleEdit();
  }
}

function handleEdit() {
  isEditMode.value = true;
}

async function handleSave() {
  loading.value = true;
  try {
    await updateQuestionnaire({
      ...currentQuestionnaire.value,
      ...formData.value,
      questionnaireType: Number(formData.value.questionnaireType),
      status: Number(formData.value.status),
      targetAudience: Number(formData.value.targetAudience),
    });
    isEditMode.value = false;
    emit('refresh');
    modalApi.close();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal>
    <Spin :spinning="loading">
      <h3 class="mb-2 ml-4 text-lg font-semibold">
        {{ currentQuestionnaire?.title || '-' }}
      </h3>

      <Form
        ref="formRef"
        :class="{ 'custom-disable': isReadOnly }"
        class="p-4"
        :model="formData"
      >
        <FormItem label="问卷类型">
          <Select
            v-model:value="formData.questionnaireType"
            :disabled="isReadOnly"
            :options="questionnaireTypeOptions"
            placeholder="请选择问卷类型"
            class="max-w-[50%]"
          />
        </FormItem>

        <FormItem label="状态">
          <Select
            v-model:value="formData.status"
            :disabled="isReadOnly"
            :options="statusOptions"
            placeholder="请选择状态"
            class="max-w-[50%]"
          />
        </FormItem>

        <FormItem label="目标受众">
          <Select
            v-model:value="formData.targetAudience"
            :disabled="isReadOnly"
            :options="targetAudienceOptions"
            placeholder="请选择目标受众"
            class="max-w-[50%]"
          />
        </FormItem>

        <FormItem label="预计用时 (分钟)">
          <InputNumber
            v-model:value="formData.estimatedDuration"
            :disabled="isReadOnly"
            placeholder="请输入预计用时"
            class="max-w-[50%]"
          />
        </FormItem>

        <FormItem label="是否为独立问卷">
          <RadioGroup
            v-model:value="formData.supportIndependentUse"
            button-style="solid"
            :disabled="isReadOnly"
          >
            <RadioButton :value="1">是</RadioButton>
            <RadioButton :value="0">否</RadioButton>
          </RadioGroup>
        </FormItem>

        <FormItem label="问卷描述">
          <Input.TextArea
            v-model:value="formData.description"
            :disabled="isReadOnly"
            :rows="3"
            placeholder="请输入问卷描述"
          />
        </FormItem>

        <FormItem label="创建时间">
          {{
            currentQuestionnaire?.createTime
              ? dayjs(currentQuestionnaire.createTime).format(
                  'YYYY-MM-DD HH:mm:ss',
                )
              : '-'
          }}
        </FormItem>
      </Form>
    </Spin>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-3">
        <LyButton
          size="middle"
          :disabled="loading"
          @click="onFooterSecondaryClick"
        >
          {{ footerSecondaryText }}
        </LyButton>
        <LyButton
          size="middle"
          type="success"
          :loading="loading"
          @click="onFooterPrimaryClick"
        >
          {{ footerPrimaryText }}
        </LyButton>
      </div>
    </template>
  </Modal>
</template>

<style lang="scss" scoped></style>
