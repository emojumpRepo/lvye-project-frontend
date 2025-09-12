<script setup lang="ts">
import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

import { useSearchFormSchema } from '../data';

interface SearchParams {
  pageNo?: number;
  pageSize?: number;
  classDeptId?: number;
  status?: string;
  consultTime?: string;
  studentNo?: string;
}

// 定义 emit 事件
const emit = defineEmits<{
  loading: [loading: boolean];
  search: [params: SearchParams];
}>();

// 搜索参数
const searchParams = ref<SearchParams>({
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
  handleSubmit: async (values) => {
    await handleSearch(values);
  },
});

// 处理搜索
async function handleSearch(values: any) {
  try {
    // 构建搜索参数
    const params: SearchParams = {
      ...searchParams.value,
      pageNo: 1, // 重置到第一页
      studentNo: values.searchKeyword,
      status: values.status || undefined,
      consultTime: values.consultTime || undefined,
      classDeptId: values.classDeptId || undefined,
    };

    searchParams.value = params;
    emit('search', params);
  } catch (error) {
    console.error('搜索失败:', error);
    message.error('搜索失败，请重试');
  }
}
</script>

<template>
  <div class="box-border rounded-xl bg-white p-6">
    <LyCardTitle
      icon="ix:user-filled"
      title="咨询记录管理"
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
