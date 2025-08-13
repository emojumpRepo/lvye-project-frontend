<script setup lang="ts">
import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

import { useSearchFormSchema } from '../data';

const [Form] = useVbenForm({
  schema: useSearchFormSchema(),
  layout: 'horizontal',
  wrapperClass: 'grid-cols-12',
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
