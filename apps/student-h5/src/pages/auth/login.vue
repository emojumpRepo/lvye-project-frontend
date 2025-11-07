<script lang="ts" setup>
import { onHide, onShow } from '@dcloudio/uni-app'
import { getBucketFileUrl } from '@vben/utils'
import { onUnmounted, reactive, ref, watch } from 'vue'
import { sendSmsCode } from '@/api/login'
import { useAuthStore } from '@/store/auth'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'Login',
})

const authStore = useAuthStore()

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '登录',
  },
})

// 颜色常量
const descTextColor = '#2D3E5066'

// 表单数据 - 从本地存储恢复（如果有的话）
const savedFormData = uni.getStorageSync('login_form_data')
const formData = reactive({
  phone: savedFormData?.phone || '',
  code: savedFormData?.code || '',
})

// 倒计时
const countdown = ref(0)
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 登录成功标志，用于停止自动保存表单
const loginSuccess = ref(false)

// 监听表单数据变化，自动保存到本地存储
watch(formData, () => {
  // 登录成功后不再保存表单数据
  if (loginSuccess.value)
    return

  uni.setStorageSync('login_form_data', {
    phone: formData.phone,
    code: formData.code,
  })
}, { deep: true })

// 页面隐藏时保存表单数据
onHide(() => {
  // 登录成功后不再保存表单数据
  if (loginSuccess.value)
    return

  uni.setStorageSync('login_form_data', {
    phone: formData.phone,
    code: formData.code,
  })
})

// 页面显示时恢复表单数据
onShow(() => {
  // 重置登录成功标志
  loginSuccess.value = false

  const data = uni.getStorageSync('login_form_data')
  if (data) {
    formData.phone = data.phone || ''
    formData.code = data.code || ''
  }
})

// 获取重定向URL
function getRedirectUrl() {
  // #ifdef H5
  const urlParams = new URLSearchParams(window.location.search)
  const redirect = urlParams.get('redirect')
  if (redirect) {
    return decodeURIComponent(redirect)
  }
  // #endif
  return '/pages/home/index'
}

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

    // 调用登录接口，token会自动保存到store
    const tokenRes = await authStore.login({
      mobile: formData.phone,
      code: formData.code,
      isParent: 0,
    })

    console.log('登录成功，token已保存:', tokenRes)

    // 设置登录成功标志，停止自动保存
    loginSuccess.value = true

    // 清空表单数据
    formData.phone = ''
    formData.code = ''

    // 清除本地存储的表单数据
    uni.removeStorageSync('login_form_data')

    uni.hideLoading()
    uni.showToast({
      title: '登录成功',
      icon: 'success',
    })

    // 获取用户store，检查是否已确认信息
    const userStore = useUserStore()
    const isConfirmed = userStore.isInfoConfirmed

    // 跳转到重定向页面或首页
    setTimeout(() => {
      if (!isConfirmed) {
        // 未确认信息，跳转到确认页面
        uni.reLaunch({ url: '/pages/user/confirm' })
      }
      else {
        // 已确认信息，跳转到重定向页面或首页
        const redirectUrl = getRedirectUrl()
        uni.reLaunch({ url: redirectUrl })
      }
    }, 1000)
  }
  catch (error) {
    uni.hideLoading()
    console.error('登录失败:', error)
    uni.showToast({
      title: '登录失败，请检查验证码',
      icon: 'none',
    })
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
  <view class="h-screen flex flex-col items-center px-30rpx space-y-4">
    <!-- Logo -->
    <view class="mt-50 w-full flex flex-col items-center">
      <view class="mb-3 h-68rpx w-full">
        <image :src="getBucketFileUrl('student_h5/logo/logo_long_black.png')" class="h-full w-full" mode="aspectFit" />
      </view>
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
      <view class="w-full">
        <LyButton
          type="primary"
          block
          @click="handleLogin"
        >
          登录
        </LyButton>
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
