<script setup lang="ts">
import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

import { useGridFormSchema } from '../data';

const [Form] = useVbenForm({
  schema: useGridFormSchema(),
  layout: 'horizontal',
  wrapperClass: 'grid-cols-10',
  commonConfig: { componentProps: { class: 'w-full mr-2' } },
  submitButtonOptions: { content: '查询', class: 'bg-[#04DC70]' },
});
</script>

<template>
  <div class="box-border rounded-xl bg-white p-6">
    <LyCardTitle
      icon="ph:student"
      title="学生管理"
      icon-bg="linear-gradient(143.39deg, #B6CDFF 11.39%, #DB88FF 89.3%)"
    />
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
