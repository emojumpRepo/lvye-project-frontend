<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/store/auth'

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const authStore = useAuthStore()
const loading = ref(false)

// Use computed to avoid directly mutating prop
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

function handleClose() {
  emit('update:modelValue', false)
  emit('cancel')
}

async function handleConfirm() {
  try {
    loading.value = true
    await authStore.logout()

    emit('update:modelValue', false)
    emit('confirm')

    uni.showToast({
      title: '已退出登录',
      icon: 'success',
    })

    setTimeout(() => {
      uni.reLaunch({ url: '/pages/auth/login' })
    }, 1000)
  }
  catch (error) {
    console.error('退出登录失败:', error)
    uni.showToast({
      title: '退出失败，请重试',
      icon: 'none',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <wd-popup
    v-model="visible"
    position="center"
    custom-style="border-radius: 32rpx; width: 560rpx; max-width: 90vw;"
    custom-class="dialog-popup-pc"
    @close="handleClose"
  >
    <view class="logout-popup">
      <view class="logout-popup__title title-text">
        退出登录
      </view>

      <view class="logout-popup__content">
        <text class="desc-text-heavy">确定要退出当前账号吗？</text>
        <text class="logout-popup__tip desc-text">此操作会退出当前账号，下次登录需要重新登录才能继续使用</text>
      </view>

      <view class="logout-popup__footer">
        <LyButton
          type="info"
          size="medium"
          :disabled="loading"
          @click="handleClose"
        >
          取消
        </LyButton>

        <LyButton
          type="error"
          size="medium"
          :loading="loading"
          @click="handleConfirm"
        >
          确定退出
        </LyButton>
      </view>
    </view>
  </wd-popup>
</template>

<style lang="scss" scoped>
/* stylelint-disable declaration-property-value-no-unknown */
.logout-popup {
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
