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

const selectedRowKeys = defineModel<number[]>('selectedRowKeys', {
  default: () => [],
});

const deptOptions = ref<DeptGradeClassOption[]>([]);
const assessmentDetailSearchParams =
  ref<PsychologyAssessmentApi.ParticipantsQuestionnairePageReq>();

const [Form, formApi] = useVbenForm({
  schema: useGridFormSchema({ deptOptions: deptOptions.value }),
  layout: 'horizontal',
  wrapperClass: 'gap-2 grid-cols-8',
  commonConfig: { componentProps: { class: 'w-full' } },
  submitButtonOptions: { show: false },
  handleReset,
  handleValuesChange: async (values) => {
    selectedRowKeys.value = [];

    // 判断搜索关键词是学号还是姓名
    let name, studentNo;
    if (values.searchKeyword) {
      const trimmedKeyword = values.searchKeyword.trim();
      const isStudentNo = /^\d+$/.test(trimmedKeyword);
      if (isStudentNo) {
        studentNo = trimmedKeyword;
      } else {
        name = trimmedKeyword;
      }
    }

    // 构建并返回搜索参数对象，空值将被处理为 undefined
    const params: PsychologyAssessmentApi.ParticipantsQuestionnairePageReq = {
      studentNo: studentNo || undefined,
      name: name || undefined,
      status: values.status === '' ? undefined : values.status,
      riskLevel: values.riskLevel === '' ? undefined : values.riskLevel,
      classId: values.classId || undefined,
    };

    assessmentDetailSearchParams.value = params;

    await handleSearch();
  },
});

// 搜索
async function handleSearch() {
  try {
    emit('loading', true);
    if (assessmentDetailSearchParams.value) {
      emit('search', assessmentDetailSearchParams.value);
    }
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
