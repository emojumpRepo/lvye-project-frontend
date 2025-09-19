<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';

interface ConfirmDialogProps {
  cancelText?: string;
  confirmText?: string;
  showCancel?: boolean;
  showConfirm?: boolean;
  title?: string;
  contentClass?: string;
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  showConfirm: true,
  title: '提示',
  contentClass: 'min-h-0',
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const [ConfirmModal, confirmModalApi] = useVbenModal({
  bordered: false,
  fullscreenButton: false,
  centered: true,
  contentClass: props.contentClass,
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
        {{ props.title }}
      </div>
    </slot>
  </ConfirmModal>
</template>
