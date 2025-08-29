<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { updateMyBasicInfo } from '#/api/psychology/student-profile';

import { useBasicInfoFormSchema } from './data';

// 表单
const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-2 gap-x-8',
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    hideRequiredMark: true,
  },
  schema: useBasicInfoFormSchema(),
  handleSubmit: onSubmit,
});

// 弹窗
const [Modal, modalApi] = useVbenModal({
  title: '完善个人基本信息',
  closeOnClickModal: false,
  fullscreenButton: false,
  cancelText: '重置',
  onConfirm: async () => {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    await onSubmit(values as Record<string, any>);
  },
  onCancel: () => {
    formApi.resetForm();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      if (data) {
        formApi.setValues(data);
      }
    } else {
      formApi.resetForm();
    }
  },
});

async function onSubmit(values: Record<string, any>) {
  const payload = transformToUpdatePayload(values);
  try {
    await updateMyBasicInfo(payload);
    message.success('提交成功');
    modalApi.close();
  } catch (error) {
    console.error(error);
  }
}

function transformToUpdatePayload(values: Record<string, any>) {
  const {
    id,
    gender,
    ethnicity,
    realAge,
    birthDate,
    height,
    weight,
    isOnlyChild,
    childrenCount,
    birthOrder,
    ageGapToSecond,
  } = values;

  return {
    id,
    sex: gender,
    ethnicity,
    actualAge: realAge,
    birthDate,
    height,
    weight,
    familyChildrenInfo: {
      isOnlyChild,
      childrenCount,
      birthOrder,
      ageGapToSecond,
    },
  } as any;
}

// 对外暴露 open 方法
function open(initialValues?: Record<string, any>) {
  if (initialValues) modalApi.setData(initialValues);
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[640px]">
    <Form class="mx-4" />
  </Modal>
</template>
