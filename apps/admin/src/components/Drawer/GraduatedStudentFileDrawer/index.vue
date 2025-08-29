<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { StudentApi } from '#/api/student/index';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { useGraduatedStudentFileGridSchema, useSearchFormSchema } from './data';

const [Drawer, DrawerApi] = useVbenDrawer({
  title: '毕业学生档案',
  class: 'w-[1000px]',
  onConfirm: () => {
    message.warning('即将上线');
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(),
    compact: true,
    showCollapseButton: false,
    commonConfig: {
      hideLabel: true,
    },
    wrapperClass: '!flex gap-2 flex-nowrap',
  },
  gridOptions: {
    columns: useGraduatedStudentFileGridSchema(),
    height: '100%',
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return [];
        },
      },
    },
    toolbarConfig: {
      refresh: false,
      search: false,
      custom: false,
      zoom: false,
    },
  } as VxeTableGridOptions<StudentApi.GraduatedStudentFile>,
});
</script>

<template>
  <Drawer>
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/graduate-file_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">已毕业学生档案</span>
      </div>
    </template>

    <Grid />
  </Drawer>
</template>

<style lang="scss" scoped>
:deep(.form-item) {
  padding-bottom: 0 !important;
}

:deep(.form-actions) {
  grid-column: -3 / -1 !important;
  padding-bottom: 0 !important;
}

:deep(.bg-background-deep) {
  display: none !important;
}

:deep(.vxe-grid--form-wrapper > div) {
  padding-top: 0 !important;
  padding-bottom: 24px !important;
}
</style>
