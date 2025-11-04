<script lang="ts" setup>
import type { Assessment } from './components/AssessmentItem.vue'
import { onPageScroll } from '@dcloudio/uni-app'
import { ref } from 'vue'
import Navbar from '@/components/Navbar/index.vue'
import AssessmentItem from './components/AssessmentItem.vue'

defineOptions({
  name: 'AssessmentList',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '心理测评',
  },
})

// 页面滚动距离
const pageScrollTop = ref(0)

// 监听页面滚动
onPageScroll((e) => {
  pageScrollTop.value = e.scrollTop
})

const assessments = ref<Assessment[]>([
  {
    id: '1',
    title: '心理专项测评202510',
    deadline: '2025-10-15 00:00',
    progress: 100,
    status: 'completed',
  },
  {
    id: '2',
    title: '心理专项测评202511',
    deadline: '2025-10-15 00:00',
    progress: 60,
    status: 'in-progress',
  },
  {
    id: '3',
    title: '心理专项测评202512',
    deadline: '2025-10-15 00:00',
    progress: 60,
    status: 'pending',
  },
  {
    id: '3',
    title: '心理专项测评202512',
    deadline: '2025-10-15 00:00',
    progress: 60,
    status: 'pending',
  },
])

function handleBack() {
  uni.navigateBack()
}

function viewResult(id: string) {
  console.log('View result:', id)
  uni.showToast({
    title: '查看结果',
    icon: 'none',
  })
}

function continueAssessment(id: string) {
  console.log('Continue assessment:', id)
  uni.showToast({
    title: '继续作答',
    icon: 'none',
  })
}

function startAssessment(id: string) {
  console.log('Start assessment:', id)
  uni.showToast({
    title: '开始测评',
    icon: 'none',
  })
}

function handleButtonClick(assessment: Assessment) {
  if (assessment.status === 'completed') {
    viewResult(assessment.id)
  }
  else if (assessment.status === 'in-progress') {
    continueAssessment(assessment.id)
  }
  else {
    startAssessment(assessment.id)
  }
}
</script>

<template>
  <!-- Navbar -->
  <Navbar title="心理测评" :scroll-top="pageScrollTop" @back="handleBack" />

  <!-- Page content -->
  <view class="p-30rpx pt-45rpx">
    <!-- Header card -->
    <view class="rounded-2xl bg-white p-32rpx">
      <view class="title-text mb-12rpx text-lg font-medium">
        我的测评任务
      </view>
      <view class="desc-text text-24rpx font-medium">
        完成老师布置的心理测评任务
      </view>

      <view class="custom-divider" />

      <!-- Assessment list -->
      <view class="flex flex-col gap-24rpx">
        <AssessmentItem
          v-for="item in assessments"
          :key="item.id"
          :assessment="item"
          @click="handleButtonClick"
        />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* stylelint-disable declaration-property-value-no-unknown */
.custom-divider {
  width: 100%;
  height: 0;
  margin: 32rpx 0;
  border-top: 4rpx dashed var(--desc-text-color-light);
}
</style>
