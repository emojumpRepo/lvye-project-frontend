<script setup lang="ts">
import type { QuestionnaireDimensionVO } from '#/api/psychology/questionnaire/index';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createQuestionnaireDimension,
  updateQuestionnaireDimension,
} from '#/api/psychology/questionnaire/index';

import { useDimensionFormSchema } from '../data';

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const formData = ref<QuestionnaireDimensionVO>();

const getTitle = computed(() => {
  return formData.value?.id ? '编辑维度' : '新增维度';
});

// 创建表单
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 130,
  },
  wrapperClass: 'grid-cols-1',
  layout: 'horizontal',
  schema: useDimensionFormSchema(),
  showDefaultActions: false,
});

// 创建主弹窗
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();

    // 提交表单
    const data = (await formApi.getValues()) as QuestionnaireDimensionVO;
    const modalData = modalApi.getData<{
      questionnaireId?: number;
      selectedDimension?: QuestionnaireDimensionVO;
    }>();
    const payload = {
      ...data,
      questionnaireId: modalData?.questionnaireId || 0,
    };

    try {
      if (formData.value?.id) {
        await updateQuestionnaireDimension({
          id: formData.value.id,
          createTime: formData.value.createTime,
          updateTime: formData.value.updateTime,
          ...payload,
        });
        message.success('更新成功');
      } else {
        await createQuestionnaireDimension(payload);
        message.success('创建成功');
      }

      await modalApi.close();
      emit('success');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      modalApi.unlock();
    }
  },
  onCancel() {
    emit('cancel');
    modalApi.close();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }

    // 加载数据
    const data = modalApi.getData<{
      questionnaireId?: number;
      selectedDimension?: QuestionnaireDimensionVO;
    }>();

    if (data?.selectedDimension) {
      formData.value = data.selectedDimension;
      // 设置到 values，处理boolean到number的转换
      const dimension = data.selectedDimension;
      await formApi.setValues({
        ...dimension,
        questionnaireId: data.questionnaireId,
        // 确保布尔值转换为数字
        participateModuleCalc:
          typeof dimension.participateModuleCalc === 'boolean'
            ? (dimension.participateModuleCalc ? 1 : 0)
            : dimension.participateModuleCalc,
        participateAssessmentCalc:
          typeof dimension.participateAssessmentCalc === 'boolean'
            ? (dimension.participateAssessmentCalc ? 1 : 0)
            : dimension.participateAssessmentCalc,
        participateRanking:
          typeof dimension.participateRanking === 'boolean'
            ? (dimension.participateRanking ? 1 : 0)
            : dimension.participateRanking,
        showScore:
          typeof dimension.showScore === 'boolean'
            ? (dimension.showScore ? 1 : 0)
            : dimension.showScore,
      });
    } else {
      // 设置默认值
      await formApi.setValues({
        questionnaireId: data?.questionnaireId,
        participateModuleCalc: 1,
        participateAssessmentCalc: 1,
        participateRanking: 1,
        showScore: 1,
        sortOrder: 1,
        status: 1,
      });
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
