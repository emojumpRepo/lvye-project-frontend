 <script setup lang="ts">
import { ref, onMounted } from 'vue';

import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { message } from 'ant-design-vue';

import {
  getStudentProfilePage,
  type PsychologyStudentProfileApi
} from '#/api/psychology/student-profile';
import { useSearchFormSchema } from '../data';

// 定义 emit 事件
const emit = defineEmits<{
  search: [params: PsychologyStudentProfileApi.StudentProfilePageReq];
  loading: [loading: boolean];
}>();

// 搜索参数
const searchParams = ref<PsychologyStudentProfileApi.StudentProfilePageReq>({
  pageNo: 1,
  pageSize: 10,
});

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema(),
  layout: 'horizontal',
  wrapperClass: 'grid-cols-12',
  commonConfig: {
    componentProps: {
      class: 'w-full mr-2',
    },
    hideLabel: true,
  },
  submitButtonOptions: {
    content: '查询',
    class: 'bg-[#04DC70]',
  },
  handleSubmit: async (values) => {
    await handleSearch(values);
  },
});

// 处理搜索
async function handleSearch(values: any) {
  try {
    emit('loading', true);

    // 构建搜索参数
    const params: PsychologyStudentProfileApi.StudentProfilePageReq = {
      ...searchParams.value,
      pageNo: 1, // 重置到第一页
      studentNo: values.searchKeyword || undefined,
      name: values.searchKeyword || undefined,
      gradeDeptId: values.grade || undefined,
      classDeptId: values.class || undefined,
      graduationStatus: values.isGraduated || undefined,
      psychologicalStatus: values.status || undefined,
    };

    searchParams.value = params;
    emit('search', params);
  } catch (error) {
    console.error('搜索失败:', error);
    message.error('搜索失败，请重试');
  } finally {
    emit('loading', false);
  }
}

// 重置搜索
function handleReset() {
  formApi.resetForm();
  searchParams.value = {
    pageNo: 1,
    pageSize: 10,
  };
  emit('search', searchParams.value);
}

// 暴露方法给父组件
defineExpose({
  handleSearch,
  handleReset,
  searchParams,
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
  grid-column: -3 / -1 !important;
  padding-bottom: 0 !important;
}
</style>


