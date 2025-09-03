<script setup lang="ts">
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { ref, watch } from 'vue';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

import { useSearchFormSchema } from '../data';

const props = defineProps<{
  deptListLoaded: boolean;
}>();

// 定义 emit 事件
const emit = defineEmits<{
  loading: [loading: boolean];
  search: [params: PsychologyStudentProfileApi.StudentProfilePageReq];
}>();

// 搜索参数
const searchParams = ref<PsychologyStudentProfileApi.StudentProfilePageReq>({
  pageNo: 1,
  pageSize: 10,
});

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema(),
  layout: 'horizontal',
  wrapperClass: 'grid-cols-12 md:grid-cols-9',
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

    // 智能识别搜索关键词是学号还是姓名
    const { studentNo, name } = parseSearchKeyword(values.searchKeyword);

    // 构建搜索参数
    const params: PsychologyStudentProfileApi.StudentProfilePageReq = {
      ...searchParams.value,
      pageNo: 1, // 重置到第一页
      studentNo,
      name,
      gradeDeptId: values.gradeDeptId || undefined,
      classDeptId: values.classDeptId || undefined,
      graduationStatus: values.graduationStatus || undefined,
      psychologicalStatus: values.psychologicalStatus || undefined,
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

/**
 * 智能解析搜索关键词，判断是学号还是姓名
 * @param keyword 搜索关键词
 * @returns 返回解析后的学号和姓名字段
 */
function parseSearchKeyword(keyword?: string) {
  if (!keyword || keyword.trim() === '') {
    return { studentNo: undefined, name: undefined };
  }

  const trimmedKeyword = keyword.trim();

  // 判断是否为学号的特征：
  // 1. 纯数字
  // 2. 以数字开头
  const isStudentNo = /^\d+$/.test(trimmedKeyword);

  // 如果符合学号特征，则赋值给学号字段，否则认为是姓名
  return isStudentNo
    ? { studentNo: trimmedKeyword, name: undefined }
    : { studentNo: undefined, name: trimmedKeyword };
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

watch(
  () => props.deptListLoaded,
  () => {
    if (props.deptListLoaded) {
      formApi.updateSchema(useSearchFormSchema());
    }
  },
  { immediate: true },
);

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
