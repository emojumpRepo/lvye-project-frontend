<script setup lang="ts">
import type { DeptGradeClassOption } from '@vben/types';

import type { CrisisBoardDataPageReq } from '#/api/psychology/crisis';

import { onMounted, ref, watch } from 'vue';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { getDeptGradeClassDictOptions } from '#/utils/transformDeptToTree';

import { useSearchFormSchema } from '../data';

const props = defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  search: [params: CrisisBoardDataPageReq];
}>();

const deptOptions = ref<DeptGradeClassOption[]>([]);

// 搜索参数
const crisisEventListReq = ref<CrisisBoardDataPageReq>();

// 用于控制表单是否禁用
watch(
  () => props.loading,
  (newVal: boolean) => {
    if (newVal) {
      formApi.setState({
        commonConfig: {
          disabled: true,
        },
      });
    } else {
      formApi.setState({
        commonConfig: {
          disabled: false,
        },
      });
    }
  },
);

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema({ deptOptions: deptOptions.value }),
  wrapperClass: 'grid-cols-6',
  submitButtonOptions: {
    show: false,
  },
  commonConfig: {
    componentProps: {
      class: 'w-full mr-2',
    },
    hideLabel: true,
  },
  handleValuesChange: async (values: any) => {
    try {
      const params: CrisisBoardDataPageReq = {
        classId: values.classId[values.classId.length - 1] || undefined,
        counselorType: values.counselorType || undefined,
      };

      crisisEventListReq.value = params;
      emit('search', params);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请重试');
    }
  },
});

onMounted(async () => {
  deptOptions.value = await getDeptGradeClassDictOptions();
  formApi.updateSchema(useSearchFormSchema({ deptOptions: deptOptions.value }));
});

defineExpose({
  crisisEventListReq,
});
</script>

<template>
  <div class="box-border rounded-xl bg-white px-6 pb-6 pt-4">
    <LyCardTitle
      icon="carbon:connect-reference"
      title="危机干预管理"
      :pb="4"
      icon-bg="linear-gradient(143.39deg, #B6CDFF 11.39%, #DB88FF 89.3%)"
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

<style lang="scss" scoped>
:deep(.form-item) {
  padding-bottom: 0 !important;
}

:deep(.form-actions) {
  grid-column: -3 / -1 !important;
  padding-bottom: 0 !important;
}
</style>
