<script setup lang="ts">
import { Badge as ABadge, Tabs as ATabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

import { useSearchFormSchema } from '../data';

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema(),
  wrapperClass: 'grid-cols-12 md:grid-cols-9',
  commonConfig: {
    componentProps: {
      class: 'w-full mr-2',
    },
    hideLabel: true,
  },
});
</script>

<template>
  <div class="box-border rounded-xl bg-white px-6 pb-6 pt-2">
    <ATabs>
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

:deep(.ant-tabs-tab-btn) {
  color: #979899;
}
</style>
