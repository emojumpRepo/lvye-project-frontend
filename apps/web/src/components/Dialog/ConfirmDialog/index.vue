<script setup lang="ts">
import { Modal as AModal } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

withDefaults(
  defineProps<{
    cancelText?: string;
    confirmText?: string;
    showCancel?: boolean;
    showConfirm?: boolean;
    title?: string;
  }>(),
  {
    confirmText: '确定',
    cancelText: '取消',
    showCancel: true,
    showConfirm: true,
    title: '提示',
  },
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function handleCancel() {
  emit('cancel');
  show.value = false;
}

const show = defineModel<boolean>('show', { required: true });
</script>

<template>
  <AModal v-model:open="show" :title="null" centered :closable="false">
    <slot name="title">{{ title }}</slot>
    <template #footer>
      <slot name="footer">
        <div class="mt-4 flex items-center justify-end">
          <LyButton
            v-if="showCancel"
            type="default"
            size="middle"
            class="rounded-[4px] px-[12px]"
            @click="handleCancel"
          >
            {{ cancelText }}
          </LyButton>
          <LyButton
            v-if="showConfirm"
            type="success"
            size="middle"
            class="rounded-[4px] px-[12px]"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </LyButton>
        </div>
      </slot>
    </template>
  </AModal>
</template>
