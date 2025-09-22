<script setup lang="ts">
import { computed } from 'vue';

import {
  Button as AButton,
  Modal as AModal,
  Progress as AProgress,
} from 'ant-design-vue';

const props = defineProps<{
  pendingCount: number;
  total: number;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'complete'): void;
}>();

const openImportProgress = defineModel<boolean>('openImportProgress', {
  required: true,
});

const percent = computed(() => {
  return (props.pendingCount / props.total) * 100;
});

function handleAction() {
  if (props.pendingCount === props.total) {
    emit('complete');
  } else {
    emit('cancel');
  }
}
</script>

<template>
  <AModal
    v-model:open="openImportProgress"
    title="正在导入学生信息"
    centered
    class="right-0"
  >
    <div class="mt-5 flex flex-col items-center gap-2">
      <AProgress :percent="percent" :show-info="false" />
      <div class="text-sm text-[#979899]">
        已处理{{ pendingCount }} / {{ total }}条记录
      </div>
    </div>
    <template #footer>
      <AButton
        :type="pendingCount === total ? 'primary' : 'default'"
        @click="handleAction"
      >
        {{ pendingCount === total ? '完成' : '取消导入' }}
      </AButton>
    </template>
  </AModal>
</template>
