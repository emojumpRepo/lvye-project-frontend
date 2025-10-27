<script setup lang="ts">
import type { DeptGradeClassOption } from '@vben/types';

import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { parseSearchKeyword } from '#/utils/calculateTool';
import { getDictOptions } from '#/utils/dict';
import { getDeptGradeClassDictOptions } from '#/utils/transformDeptToTree';

import { useSearchFormSchema } from '../data';

// 定义 emit 事件
const emit = defineEmits<{
  report: [];
  search: [params: PsychologyStudentProfileApi.StudentProfilePageReq];
}>();

// 搜索参数
const searchParams = ref<PsychologyStudentProfileApi.StudentProfilePageReq>();
const deptOptions = ref<DeptGradeClassOption[]>([]);

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema({
    deptOptions: [],
    studentProfileStatusList: [],
    graduationStatusList: [],
    riskLevelList: [],
  }),
  layout: 'horizontal',
  wrapperClass: 'grid-cols-10 md:grid-cols-6',
  submitOnChange: true,
  commonConfig: {
    componentProps: {
      class: 'w-full mr-2',
    },
    hideLabel: true,
  },
  submitButtonOptions: {
    show: false,
  },
  handleValuesChange: async (values: any) => {
    try {
      formApi.setLoading(true);
      // 智能识别搜索关键词是学号还是姓名
      const { studentNo, name } = parseSearchKeyword(values.searchKeyword);

      // 构建搜索参数
      const params: PsychologyStudentProfileApi.StudentProfilePageReq = {
        studentNo,
        name,
        gradeDeptId: values.gradeDeptId || undefined,
        classDeptId: values.classDeptId || undefined,
        graduationStatus: values.graduationStatus || undefined,
        psychologicalStatus: values.psychologicalStatus || undefined,
        riskLevel: values.riskLevel || undefined,
      };

      searchParams.value = params;
      emit('search', params);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请重试');
    } finally {
      formApi.setLoading(false);
    }
  },
});

function reset() {
  formApi.form.resetForm();
}

onMounted(async () => {
  deptOptions.value = await getDeptGradeClassDictOptions();
  const studentProfileStatusList = getDictOptions(
    'student_psychological_status',
    'number',
  );
  const graduationStatusList = getDictOptions(
    'student_graduation_status',
    'number',
  );
  const riskLevelList = getDictOptions('risk_level', 'number');
  formApi.updateSchema(
    useSearchFormSchema({
      deptOptions: deptOptions.value,
      studentProfileStatusList,
      graduationStatusList,
      riskLevelList,
    }),
  );
});

// 暴露方法给父组件
defineExpose({
  searchParams,
  reset,
});
</script>

<template>
  <div class="box-border rounded-xl bg-white p-6">
    <LyCardTitle
      icon="ph:student"
      title="学生管理档案"
      icon-bg="linear-gradient(143.39deg, #B6CDFF 11.39%, #DB88FF 89.3%)"
    />
    <!-- 筛选表单 -->
    <Form />
  </div>
</template>

<style lang="scss" scoped>
:deep(.form-item) {
  padding-bottom: 0 !important;
}

:deep(.form-actions) {
  // grid-column: -3 / -1 !important;
  padding-bottom: 0 !important;
}
</style>
