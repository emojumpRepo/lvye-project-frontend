<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';

import { loadQuestionnaireOptions, useGridFormSchema } from '../data';

const emit = defineEmits<{
  (e: 'search', params: any): void;
  (e: 'tabChange', status: number | undefined): void;
  (e: 'reset'): void;
  (e: 'createAssessment'): void;
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
    if (formData.date === 'custom' && formData.customDateRange) {
      // 自定义时间范围
      const [startDate, endDate] = formData.customDateRange;
      searchParams.createTime = [
        dayjs(startDate).format('YYYY-MM-DDTHH:mm:ss'),
        dayjs(endDate).format('YYYY-MM-DDTHH:mm:ss'),
      ];
    } else {
      // 预设时间范围
      const [startDate, endDate] = formatDate(formData.date);
      searchParams.createTime = [startDate, endDate];
    }
  }

  const currentTab = tabs.find((tab) => tab.key === activeTab.value);
  searchParams.status = currentTab?.status;

  emit('search', searchParams);
};

function formatDate(date: string): [string, string] {
  switch (date) {
    case '7': {
      return [
        dayjs().subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss'),
        dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      ];
    }
    case '30': {
      return [
        dayjs().subtract(30, 'day').format('YYYY-MM-DDTHH:mm:ss'),
        dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      ];
    }
    case '90': {
      return [
        dayjs().subtract(90, 'day').format('YYYY-MM-DDTHH:mm:ss'),
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
  wrapperClass: 'grid-cols-8',
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

// 在组件挂载时加载问卷选项
onMounted(async () => {
  await loadQuestionnaireOptions();
});
</script>

<template>
  <div class="box-border rounded-xl bg-white px-6 pb-5 pt-2">
    <Tabs
      v-model:active-key="activeTab"
      :tab-bar-gutter="24"
      @change="handleTabChange"
    >
      <template #tabBarExtraContent>
        <slot name="extra" />
      </template>
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
