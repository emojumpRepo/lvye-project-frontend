<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

interface ConfirmDialogProps {
  cancelText?: string;
  confirmText?: string;
  showCancel?: boolean;
  showConfirm?: boolean;
  contentClass?: string;
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  showConfirm: true,
  contentClass: 'min-h-0',
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const dialogTitle = ref<string>('提示');
const dialogZIndex = ref<number>(5000);

const [ConfirmModal, confirmModalApi] = useVbenModal({
  bordered: false,
  fullscreenButton: false,
  centered: true,
  contentClass: props.contentClass,
  zIndex: dialogZIndex.value,
  onOpenChange: (open: boolean) => {
    if (open) {
      const data = confirmModalApi.getData<{
        title?: string;
        zIndex?: number;
      }>();
      dialogTitle.value = data?.title || dialogTitle.value;
      dialogZIndex.value = data?.zIndex || dialogZIndex.value;
    }
  },
  onConfirm: () => {
    emit('confirm');
    confirmModalApi.close();
  },
  onCancel: () => {
    emit('cancel');
    confirmModalApi.close();
  },
});
</script>

<template>
  <ConfirmModal>
    <template #title>
      <slot name="title">
        <div></div>
      </slot>
    </template>
    <slot>
      <div class="px-4 text-[15px] text-[#4B4B4D]">
        {{ dialogTitle }}
      </div>
    </slot>
  </ConfirmModal>
</template>
