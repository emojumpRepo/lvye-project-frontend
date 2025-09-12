<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Select as ASelect, Textarea as ATextarea } from 'ant-design-vue';

interface Params {
  type: 'allocate' | 'edit'; // 编辑 | 分配
}

const params = ref<Params>();
const currentOperator = ref('');
const eventContent = ref('');
const operators = ref([
  {
    label: '张三',
    value: '1',
  },
  {
    label: '李四',
    value: '2',
  },
  {
    label: '王五',
    value: '3',
  },
]);

const title = computed(() => {
  return params.value?.type === 'edit' ? '编辑事件内容' : '分配负责人';
});

const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  fullscreenButton: false,
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = editEventRecordApi.getData() as Params;
    params.value = data;
  },
});
</script>

<template>
  <EditEventRecordModal :title="title">
    <!-- 负责人选择 -->
    <div v-if="params?.type === 'allocate'" class="px-2">
      <ASelect
        v-model:value="currentOperator"
        class="w-full"
        placeholder="请选择负责人"
        :options="operators"
      />
    </div>

    <!-- 事件内容编辑 -->
    <div v-if="params?.type === 'edit'">
      <ATextarea
        v-model:value="eventContent"
        :rows="8"
        :maxlength="200"
        show-count
        placeholder="请输入内容"
      />
    </div>
  </EditEventRecordModal>
</template>

<style lang="scss" scoped>
textarea {
  resize: none;
}
</style>
