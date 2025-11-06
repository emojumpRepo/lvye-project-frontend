<script lang="ts" setup>
import { computed, ref } from 'vue'
import LogoutDialog from '@/components/Dialog/LogoutDialog/index.vue'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'ConfirmUserInfo',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '确认信息',
  },
})

const userStore = useUserStore()

// 复选框状态
const isChecked = ref(false)

// 退出登录弹窗状态
const showLogoutDialog = ref(false)

// 获取用户信息
const userInfo = computed(() => userStore.userInfo)

// 计算显示的用户信息
const displayInfo = computed(() => {
  const info = userInfo.value as any
  if (!info) {
    return {
      name: '',
      department: '',
      school: '',
      studentNo: '',
    }
  }

  return {
    name: info.nickname || info.username || '',
    department: info.deptName || '未分配院系',
    school: info.tenantName || '曼朗测试学校',
    studentNo: info.username || '暂无学号',
  }
})

// 退出登录
function handleLogout() {
  showLogoutDialog.value = true
}

// 确认信息
function handleConfirm() {
  // 保存用户信息确认状态
  userStore.setInfoConfirmed(true)

  uni.showToast({
    title: '信息确认成功',
    icon: 'success',
  })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/home/index' })
  }, 1000)
}
</script>

<template>
  <view
    class="h-screen flex flex-col px-30rpx pt-210rpx space-y-4"
  >
    <view class="title-text text-xl font-semibold">
      请确认您的账户信息
    </view>

    <view
      class="desc-text-heavy box-border flex items-center justify-between border-2 rounded-2xl border-solid bg-white p-5 text-sm font-medium transition-all duration-300"
      :class="isChecked ? 'border-[#C5E6D6FF] ' : 'border-transparent'"
      @click="isChecked = !isChecked"
    >
      <view class="flex-1 space-y-4">
        <view class="flex items-center">
          <text class="confirm-form-label">姓名：</text>
          <text class="confirm-form-value">
            {{ displayInfo.name }}丨
            {{ displayInfo.department }}
          </text>
        </view>

        <view class="flex items-center">
          <text class="confirm-form-label">学校：</text>
          <text class="confirm-form-value">
            {{ displayInfo.school }}
          </text>
        </view>

        <view class="flex items-center">
          <text class="confirm-form-label">学号：</text>
          <text class="confirm-form-value">
            {{ displayInfo.studentNo }}
          </text>
        </view>
      </view>
      <wd-checkbox v-model="isChecked" size="large" @click.stop />
    </view>

    <view class="px-3">
      <text class="desc-text text-xs">
        请确认您的信息，如果信息错误或没有对应您的信息，请点击退出登录，并联系辅导员，否则
        <text class="text-[var(--primary-color)]">答题结果可能无效</text>
      </text>
    </view>

    <view class="grid grid-cols-2 w-full gap-4">
      <LyButton
        type="default"
        block
        @click="handleLogout"
      >
        退出登录
      </LyButton>

      <LyButton
        type="primary"
        block
        :disabled="!isChecked"
        @click="handleConfirm"
      >
        确认
      </LyButton>
    </view>

    <!-- 退出登录弹窗 -->
    <LogoutDialog v-model="showLogoutDialog" />
  </view>
</template>

<style lang="scss" scoped>
.confirm-form-label {
  @apply mr-2;
}

.confirm-form-value {
  @apply flex-1;

  color: var(--title-text-color);
}

:deep(.wd-checkbox__label) {
  margin-left: 0;
}
</style>
