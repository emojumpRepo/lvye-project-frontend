<script setup lang="ts">
import { ref } from 'vue';

import { Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';

import { useGridFormSchema } from '../data';

const emit = defineEmits<{
  (e: 'search', params: any): void;
  (e: 'tabChange', status: number | undefined): void;
  (e: 'reset'): void;
}>();

const tabs = [
  { key: 'all', label: '全部', status: undefined },
  { key: 'pending', label: '已发布', status: 1 },
  { key: 'completed', label: '已结束', status: 2 },
  { key: 'closed', label: '已取消', status: 3 },
];

const activeTab = ref('all');

// 处理表单提交
const handleSubmit = async (formData: any) => {
  const searchParams: any = {
    name: formData.name,
    createTime: [],
    questionnaireId: formData.questionnaireId,
    status: undefined,
  };

  if (formData.date) {
    const [startDate, endDate] = formatDate(formData.date);
    searchParams.createTime = [startDate, endDate];
  }

  const currentTab = tabs.find((tab) => tab.key === activeTab.value);
  searchParams.status = currentTab?.status;

  emit('search', searchParams);
};

function formatDate(date: string): [string, string] {
  switch (date) {
    case 'month': {
      return [
        dayjs().subtract(1, 'month').format('YYYY-MM-DDTHH:mm:ss'),
        dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      ];
    }
    case 'week': {
      return [
        dayjs().subtract(1, 'week').format('YYYY-MM-DDTHH:mm:ss'),
        dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      ];
    }
    case 'year': {
      return [
        dayjs().subtract(1, 'year').format('YYYY-MM-DDTHH:mm:ss'),
        dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      ];
    }
    default: {
      return [
        dayjs().subtract(1, 'month').format('YYYY-MM-DDTHH:mm:ss'),
        dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      ];
    }
  }
}

const handleReset = () => {
  formRef?.resetForm();
  emit('reset');
};

const [Form, formRef] = useVbenForm({
  schema: useGridFormSchema(),
  layout: 'horizontal',
  wrapperClass: 'grid-cols-7',
  commonConfig: { componentProps: { class: 'w-full mr-2' } },
  submitButtonOptions: { content: '查询', class: 'bg-[#04DC70]' },
  handleSubmit,
  handleReset,
});

// 处理tab切换
const handleTabChange = (key: number | string) => {
  activeTab.value = key as string;
  const currentTab = tabs.find((tab) => tab.key === key);
  emit('tabChange', currentTab?.status);
};
</script>

<template>
  <div class="box-border rounded-xl bg-white px-6 pb-5 pt-2">
    <Tabs
      v-model:active-key="activeTab"
      :tab-bar-gutter="24"
      @change="handleTabChange"
    >
      <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.label">
        <Form />
      </Tabs.TabPane>
    </Tabs>
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

:deep(.ant-tabs-tab-btn) {
  color: #979899;
}

:deep(.ant-tabs-nav::before) {
  border-bottom: 1px solid #f7f8fa !important;
}

:deep(.ant-tabs-tab-active) {
  font-weight: 500 !important;
}

:deep(.ant-tabs-ink-bar) {
  height: 4px !important;
}
</style>
