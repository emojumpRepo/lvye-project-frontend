<script setup lang="ts">
import type { DeptGradeClassOption } from '@vben/types';

import type { CrisisEventListReq } from '#/api/psychology/crisis';

import { onMounted, ref } from 'vue';

import { Badge as ABadge, Tabs as ATabs, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import LyButton from '#/components/LyButton/index.vue';
import { getDeptGradeClassDictOptions } from '#/utils/transformDeptToTree';

import { useSearchFormSchema } from '../data';

const emit = defineEmits<{
  loading: [loading: boolean];
  search: [params: CrisisEventListReq];
}>();

const activeTabKey = defineModel<string>('activeKey');
const deptOptions = ref<DeptGradeClassOption[]>([]);

// 搜索参数
const crisisEventListReq = ref<CrisisEventListReq>({
  pageNo: 1,
  pageSize: 10,
});

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema({ deptOptions: deptOptions.value }),
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

onMounted(async () => {
  deptOptions.value = await getDeptGradeClassDictOptions();
  formApi.updateSchema(useSearchFormSchema({ deptOptions: deptOptions.value }));
});
</script>

<template>
  <div class="box-border rounded-xl bg-white px-6 pb-6 pt-2">
    <ATabs v-model:active-key="activeTabKey">
      <ATabs.TabPane key="board" tab="心理干预看板" />
      <ATabs.TabPane key="list">
        <template #tab>
          <div class="flex items-center gap-1">
            事件处理列表
            <ABadge count="999" />
          </div>
        </template>
      </ATabs.TabPane>
    </ATabs>

    <Form>
      <template #reset-before>
        <div class="flex items-center gap-3">
          <LyButton type="default" size="middle">
            <div class="flex items-center gap-2">
              <span>待处理</span>
              <ABadge count="6" color="#FF9C05" />
            </div>
          </LyButton>
          <LyButton type="default" size="middle">
            <div class="flex items-center gap-2">
              <span>紧急事件</span>
              <ABadge count="6" color="#FF0831" />
            </div>
          </LyButton>
        </div>
      </template>
    </Form>
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
