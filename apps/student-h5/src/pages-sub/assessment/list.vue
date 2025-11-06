<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types'
import { onPageScroll } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getMyAssessmentTask } from '@/api/assessment'
import LyLoading from '@/components/LyLoading/index.vue'
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

// 任务列表和加载状态
const tasksLoading = ref(false)
const myTasks = ref<AssessmentTask[]>([])

/**
 * 任务排序函数
 * 排序规则：
 * 1. 进行中/未开始的任务（未过期） - 最优先
 * 2. 已过期但未完成的任务 - 次优先
 * 3. 已完成的任务 - 最后
 */
function compareTasks(a: AssessmentTask, b: AssessmentTask) {
  const now = Date.now()
  const progressA = (a as any).progress ?? 0
  const progressB = (b as any).progress ?? 0
  const doneA = progressA === 100
  const doneB = progressB === 100
  const deadlineA = Number(a.deadline ?? 0)
  const deadlineB = Number(b.deadline ?? 0)
  const expiredA = deadlineA < now
  const expiredB = deadlineB < now
  const startTimeA = Number((a as any).startTime ?? 0)
  const startTimeB = Number((b as any).startTime ?? 0)
  const genA = (a as any)?.resultGenerating === true
  const genB = (b as any)?.resultGenerating === true

  // 三级分组：
  // 0 = 进行中/未开始（未过期）
  // 1 = 已过期但未完成
  // 2 = 已完成
  const getGroup = (done: boolean, expired: boolean) => {
    if (done)
      return 2 // 已完成排最后
    if (expired)
      return 1 // 已过期但未完成排中间
    return 0 // 进行中/未开始排最前
  }

  const groupA = getGroup(doneA, expiredA)
  const groupB = getGroup(doneB, expiredB)

  // 先按分组排序
  if (groupA !== groupB)
    return groupA - groupB

  // 同组内的排序规则
  if (groupA === 0) {
    // 进行中/未开始：按截止日期升序（越早截止越靠前）
    if (deadlineA !== deadlineB)
      return deadlineA - deadlineB
    if (startTimeA !== startTimeB)
      return startTimeB - startTimeA
  }
  else if (groupA === 1) {
    // 已过期但未完成：按开始时间降序（越新的越靠前）
    if (startTimeA !== startTimeB)
      return startTimeB - startTimeA
  }
  else {
    // 已完成：生成中的在前，然后按完成时间降序（越新完成的越靠前）
    if (genA !== genB)
      return genA ? -1 : 1
    if (startTimeA !== startTimeB)
      return startTimeB - startTimeA
  }

  // 兜底：创建时间较新在前
  const createA = Number((a as any).createTime ?? 0)
  const createB = Number((b as any).createTime ?? 0)
  return createB - createA
}

/**
 * 获取我的测评任务列表
 */
async function getMyTasks() {
  try {
    tasksLoading.value = true
    const res = await getMyAssessmentTask()
    const tasks = (res as unknown as AssessmentTask[]) || []

    myTasks.value = tasks.sort(compareTasks)
  }
  catch (error) {
    console.error('获取测评任务失败:', error)
    uni.showToast({
      title: '获取任务列表失败',
      icon: 'none',
    })
  }
  finally {
    tasksLoading.value = false
  }
}

/**
 * 返回上一页
 */
function handleBack() {
  uni.navigateBack()
}

/**
 * 页面挂载时加载任务列表
 */
onMounted(async () => {
  await getMyTasks()
})
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

      <Divider />

      <!-- Loading state -->
      <view v-if="tasksLoading" class="flex justify-center py-80rpx">
        <LyLoading />
      </view>

      <!-- Assessment list -->
      <view v-else-if="myTasks.length > 0" class="flex flex-col gap-24rpx">
        <AssessmentItem
          v-for="item in myTasks"
          :key="item.id ?? item.taskNo"
          :assessment="item"
        />
      </view>

      <!-- Empty state -->
      <view v-else class="py-80rpx text-center">
        <view class="desc-text text-28rpx">
          暂无测评任务
        </view>
      </view>
    </view>
  </view>
</template>
