<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Select as ASelect, Textarea as ATextarea } from 'ant-design-vue';

import LyLabel from '#/components/LyLabel/index.vue';

interface Params {
  content: string;
  type: 'content' | 'operator'; // 编辑内容 | 负责人
}

const params = ref<Params>();

const title = computed(() => {
  return params.value?.type === 'content' ? '编辑事件内容' : '选择负责人';
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
    <div v-if="params?.type === 'operator'">
      <LyLabel title="负责人" />
      <ASelect />
    </div>

    <!-- 事件内容编辑 -->
    <div v-if="params?.type === 'content'">
      <LyLabel title="事件内容" />
      <ATextarea
        :rows="5"
        :maxlength="200"
        show-count
        placeholder="请输入内容"
      />
    </div>
  </EditEventRecordModal>
</template>
