<script lang="ts" setup>
import { getBucketFileUrl } from '@vben/utils'
import { sendSmsCode } from '@/api/login'
import { useTokenStore } from '@/store/token'
import { safeAreaInsets } from '@/utils/systemInfo'

defineOptions({
  name: 'Login',
})

const tokenStore = useTokenStore()

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '登录',
  },
})

// 颜色常量
const descTextColor = '#2D3E5066'

// 表单数据
const formData = reactive({
  phone: '',
  code: '',
})

// 倒计时
const countdown = ref(0)
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 获取验证码
async function handleGetCode() {
  if (!formData.phone) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    })
    return
  }

  // 手机号验证
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phoneReg.test(formData.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    })
    return
  }

  try {
    // 调用获取验证码接口
    await sendSmsCode(formData.phone)

    // 倒计时
    countdown.value = 60
    countdownTimer.value = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer.value!)
        countdownTimer.value = null
      }
    }, 1000)

    uni.showToast({
      title: '验证码已发送',
      icon: 'success',
    })
  }
  catch (error) {
    console.error('发送验证码失败:', error)
  }
}

// 登录
async function handleLogin() {
  if (!formData.phone) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    })
    return
  }

  if (!formData.code) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none',
    })
    return
  }

  try {
    uni.showLoading({ title: '登录中...' })

    // 调用登录接口
    await tokenStore.login({
      mobile: formData.phone,
      code: formData.code,
    })

    uni.hideLoading()
    uni.showToast({
      title: '登录成功',
      icon: 'success',
    })

    // 跳转到首页
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 1000)
  }
  catch (error) {
    console.error('登录失败:', error)
  }
}

// 查看服务条款
function handleViewTerms() {
  uni.showToast({
    title: '查看服务条款',
    icon: 'none',
  })
}

// 组件卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})
</script>

<template>
  <view class="h-screen flex flex-col items-center px-30rpx space-y-4" :style="{ paddingTop: `${safeAreaInsets?.top}px` }">
    <!-- Logo -->
    <view class="mt-30 flex flex-col items-center">
      <view class="mb-5 h-176rpx w-176rpx rounded-full shadow-[#D1F4F2] shadow-lg">
        <image :src="getBucketFileUrl('student_h5/logo/login_logo.png')" class="h-full w-full" mode="aspectFit" />
      </view>
      <text class="title-text mb-16rpx text-xl font-semibold">心之旅AI</text>
      <text class="desc-text text-sm font-medium">探索内心，开启成长之旅</text>
    </view>

    <!-- 表单区域 -->
    <view class="w-full lg:max-w-800rpx space-y-4">
      <!-- 手机号输入框 -->
      <view class="input-box">
        <view class="mr-16rpx center">
          <wd-icon name="call" size="36rpx" />
        </view>
        <input
          v-model="formData.phone"
          type="number"
          :maxlength="11"
          placeholder="请输入手机号"
          class="h-full flex-1 text-28rpx"
          :placeholder-style="`color: ${descTextColor}; font-weight: 500;`"
        >
      </view>

      <!-- 验证码输入框 -->
      <view class="input-box">
        <view class="mr-16rpx center">
          <wd-icon name="secured" size="36rpx" />
        </view>
        <input
          v-model="formData.code"
          type="number"
          :maxlength="6"
          placeholder="请输入验证码"
          class="h-full flex-1 text-28rpx"
          :placeholder-style="`color: ${descTextColor}; font-weight: 500;`"
        >
        <text
          v-if="countdown > 0"
          class="whitespace-nowrap text-28rpx text-[var(--primary-color-light)]"
        >
          再次获取验证码 {{ countdown }}s
        </text>
        <text
          v-else
          class="cursor-pointer whitespace-nowrap text-sm text-[var(--primary-color)]"
          @click="handleGetCode"
        >
          获取验证码
        </text>
      </view>

      <!-- 登录按钮 -->
      <view
        class="primary-btn mb-32rpx h-96rpx center rounded-2xl"
        @click="handleLogin"
      >
        <text class="text-sm text-white">登录</text>
      </view>

      <!-- 服务条款 -->
      <view class="mt-16rpx center text-22rpx font-medium">
        <text class="text-[var(--desc-text-color)]">登录即表示同意</text>
        <text class="cursor-pointer text-[var(--primary-color)]" @click="handleViewTerms">服务条款</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.input-box {
  @apply h-96rpx flex items-center rounded-2xl bg-white px-32rpx;
}
</style>
