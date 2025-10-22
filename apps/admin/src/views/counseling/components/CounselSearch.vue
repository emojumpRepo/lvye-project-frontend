<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getTeacherUserList } from '#/api/system/user';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

import { useSearchFormSchema } from '../data';

interface SearchParams {
  pageNo?: number;
  pageSize?: number;
  counselorUserId?: number;
  status?: string;
  consultTime?: number;
  studentName?: string;
}

// 定义 emit 事件
const emit = defineEmits<{
  loading: [loading: boolean];
  search: [params: SearchParams];
}>();

const teacherOptions = ref<{ label: string; value: number }[]>([]);

// 搜索参数
const searchParams = ref<SearchParams>();

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema(),
  layout: 'horizontal',
  wrapperClass: 'grid-cols-12 md:grid-cols-9',
  submitButtonOptions: {
    show: false,
  },
  commonConfig: {
    componentProps: {
      class: 'w-full mr-2',
    },
    hideLabel: true,
  },
  handleValuesChange: async (values) => {
    try {
      // 构建搜索参数
      const params: SearchParams = {
        studentName: values.searchKeyword,
        status: values.status || undefined,
        consultTime: values.consultTime || undefined,
        counselorUserId: values.counselorUserId || undefined,
      };

      searchParams.value = params;
      emit('search', params);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请重试');
    }
  },
});

async function getTeacherOptions() {
  try {
    const teacherList = await getTeacherUserList();
    teacherOptions.value = (teacherList || [])
      .filter((item) => typeof item?.id === 'number')
      .map((item) => ({
        label: item.nickname,
        value: item.id as number,
      }));
    formApi.updateSchema(
      useSearchFormSchema({ teacherOptions: teacherOptions.value }),
    );
  } catch (error) {
    console.error('获取教师列表失败:', error);
  }
}

onMounted(async () => {
  await getTeacherOptions();
});

defineExpose({
  searchParams,
});
</script>

<template>
  <div class="box-border rounded-xl bg-white p-6">
    <LyCardTitle
      icon="ix:user-filled"
      title="访谈记录管理"
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
