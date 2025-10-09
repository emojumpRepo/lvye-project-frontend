<script setup lang="ts">
import type { DeptGradeClassOption } from '@vben/types';

import type { CrisisEventListReq } from '#/api/psychology/crisis';

import { onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { parseSearchKeyword } from '#/utils/calculateTool';
import { getDeptGradeClassDictOptions } from '#/utils/transformDeptToTree';

import { useSearchFormSchema } from '../data';

const emit = defineEmits<{
  loading: [loading: boolean];
  search: [params: CrisisEventListReq];
}>();

const deptOptions = ref<DeptGradeClassOption[]>([]);

// 搜索参数
const crisisEventListReq = ref<CrisisEventListReq>({
  pageNo: 1,
  pageSize: 10,
});

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema({ deptOptions: deptOptions.value }),
  wrapperClass: 'grid-cols-12 md:grid-cols-9',
  submitButtonOptions: {
    content: '查询',
  },
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
    emit('loading', true);

    // 智能识别搜索关键词是学号还是姓名
    const { studentNo, name } = parseSearchKeyword(values.searchKeyword);

    // 构建搜索参数
    const params: CrisisEventListReq = {
      ...crisisEventListReq.value,
      studentNo: studentNo || undefined,
      studentName: name || undefined,
      classId: values.classId || undefined,
      counselorUserId: values.counselorUserId || undefined,
    };

    crisisEventListReq.value = params;
    emit('search', params);
  } catch (error) {
    console.error('搜索失败:', error);
    message.error('搜索失败，请重试');
  } finally {
    emit('loading', false);
  }
}

onMounted(async () => {
  deptOptions.value = await getDeptGradeClassDictOptions();
  formApi.updateSchema(useSearchFormSchema({ deptOptions: deptOptions.value }));
});
</script>

<template>
  <div class="box-border rounded-xl bg-white px-6 pb-6 pt-4">
    <LyCardTitle
      icon="carbon:tree-fall-risk"
      title="风险评估管理"
      :pb="4"
      icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
    >
      <template #right>
        <slot name="actions"></slot>
      </template>
    </LyCardTitle>

    <Form />
  </div>
</template>

<style lang="scss" scoped>
:deep(.form-item) {
  padding-bottom: 0 !important;
}

:deep(.form-actions) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 0 !important;
}

:deep(.ant-tabs-tab-btn) {
  color: #979899;
}
</style>
