<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  modelValue?: boolean
  title?: string
  content?: string
  tip?: string
  confirmText?: string
  cancelText?: string
  confirmType?: 'primary' | 'success' | 'info' | 'warning' | 'error'
  showCancel?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '提示',
  content: '',
  tip: '',
  confirmText: '确定',
  cancelText: '取消',
  confirmType: 'primary',
  showCancel: true,
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

function handleClose() {
  emit('update:modelValue', false)
  emit('cancel')
}

function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
  if (!props.loading) {
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <wd-popup
    v-model="visible"
    position="center"
    custom-style="border-radius: 32rpx; width: 560rpx;"
    @close="handleClose"
  >
    <view class="confirm-dialog">
      <view class="confirm-dialog__title title-text">
        {{ title }}
      </view>

      <view class="confirm-dialog__content">
        <text class="desc-text-heavy">{{ content }}</text>
        <text v-if="tip" class="confirm-dialog__tip desc-text">{{ tip }}</text>
      </view>

      <view class="confirm-dialog__footer">
        <LyButton
          v-if="showCancel"
          type="info"
          size="medium"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </LyButton>

        <LyButton
          :type="confirmType"
          size="medium"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </LyButton>
      </view>
    </view>
  </wd-popup>
</template>

<style lang="scss" scoped>
.confirm-dialog {
  padding: 40rpx 32rpx 32rpx;

  &__title {
    margin-bottom: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    text-align: center;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    margin-bottom: 40rpx;
    font-size: 28rpx;
    line-height: 1.6;
    text-align: center;
  }

  &__tip {
    font-size: 24rpx;
    line-height: 1.5;
  }

  &__footer {
    display: flex;
    gap: 24rpx;

    :deep(.ly-button) {
      flex: 1;
    }
  }
}
</style>
