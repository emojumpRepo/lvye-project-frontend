<script setup lang="ts">
import { ref } from 'vue';

import { Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import CreateAssessmentDialog from '#/components/Dialog/CreateAssessmentDialog/index.vue';

import { useGridFormSchema } from '../data';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'closed', label: '已关闭' },
];

const [Form] = useVbenForm({
  schema: useGridFormSchema(),
  layout: 'horizontal',
  wrapperClass: 'grid-cols-7',
  commonConfig: { componentProps: { class: 'w-full mr-2' } },
  submitButtonOptions: { content: '查询', class: 'bg-[#04DC70]' },
});

const isOpenModal = ref(false);
</script>

<template>
  <div class="box-border rounded-xl bg-white px-6 pb-5 pt-2">
    <Tabs :tab-bar-gutter="24">
      <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.label">
        <Form />
      </Tabs.TabPane>
    </Tabs>

    <CreateAssessmentDialog v-model:open="isOpenModal" />
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
