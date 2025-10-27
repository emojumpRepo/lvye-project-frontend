<script setup lang="ts">
import type { DeptGradeClassOption } from '@vben/types';

import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { getDeptGradeClassDictOptions } from '#/utils/transformDeptToTree';

import { useGridFormSchema } from '../data';

const emit = defineEmits<{
  loading: [loading: boolean];
  search: [params: PsychologyAssessmentApi.ParticipantsQuestionnairePageReq];
}>();

const deptOptions = ref<DeptGradeClassOption[]>([]);
const assessmentDetailSearchParams =
  ref<PsychologyAssessmentApi.ParticipantsQuestionnairePageReq>();

const [Form, formApi] = useVbenForm({
  schema: useGridFormSchema({ deptOptions: deptOptions.value }),
  layout: 'horizontal',
  wrapperClass: 'gap-2 grid-cols-8',
  commonConfig: { componentProps: { class: 'w-full' } },
  submitButtonOptions: { content: '查询', class: 'bg-[#04DC70]' },
  handleSubmit: async (values) => {
    await handleSearch(values);
  },
});

// 搜索
async function handleSearch(values: any) {
  try {
    emit('loading', true);

    // 判断搜索关键词是学号还是姓名
    if (values.searchKeyword) {
      const isStudentNo = /^\d+$/.test(values.searchKeyword.trim());
      if (isStudentNo) {
        values.studentNo = values.searchKeyword;
      } else {
        values.name = values.searchKeyword;
      }
    }

    // 构建搜索参数
    const params: PsychologyAssessmentApi.ParticipantsQuestionnairePageReq = {
      studentNo: values.studentNo || undefined,
      name: values.name || undefined,
      status: values.status === '' ? undefined : values.status,
      riskLevel: values.riskLevel === '' ? undefined : values.riskLevel,
      classId: values.classId || undefined,
    };

    assessmentDetailSearchParams.value = params;
    emit('search', assessmentDetailSearchParams.value);
  } catch (error) {
    console.error('搜索失败:', error);
    message.error('搜索失败，请重试');
  } finally {
    emit('loading', false);
  }
}

// 重置搜索
function handleReset() {
  formApi.form.resetForm();
  assessmentDetailSearchParams.value = undefined;
}

onMounted(async () => {
  deptOptions.value = await getDeptGradeClassDictOptions();
  formApi.updateSchema(useGridFormSchema({ deptOptions: deptOptions.value }));
});

defineExpose({
  handleReset,
  assessmentDetailSearchParams,
});
</script>

<template>
  <div class="box-border rounded-xl bg-white p-6">
    <LyCardTitle
      icon="ph:student"
      title="学生管理"
      icon-bg="linear-gradient(143.39deg, #B6CDFF 11.39%, #DB88FF 89.3%)"
    />
    <Form />
  </div>
</template>

<style lang="scss" scoped>
:deep(.form-item) {
  padding-bottom: 0 !important;
}

:deep(.form-actions) {
  grid-column: -3 / -1 !important;
  padding-bottom: 0 !important;
}
</style>
