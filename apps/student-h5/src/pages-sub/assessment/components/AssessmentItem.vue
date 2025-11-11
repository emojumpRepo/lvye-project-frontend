<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types'
import { ASSESSMENT_STATUS, AssessmentTaskParticipantStatus } from '@vben/types'
import dayjs from 'dayjs'
import { ref } from 'vue'

import PrivacyModal from './PrivacyModal.vue'

interface Props {
  assessment: AssessmentTask
}

defineOptions({
  name: 'AssessmentItem',
})

const props = defineProps<Props>()

// 任务状态映射
const TASK_STATUS_MAP: Record<
  AssessmentTaskParticipantStatus,
  { actionText: string }
> = {
  [AssessmentTaskParticipantStatus.NOT_STARTED]: {
    actionText: '去答题',
  },
  [AssessmentTaskParticipantStatus.IN_PROGRESS]: {
    actionText: '继续答题',
  },
  [AssessmentTaskParticipantStatus.COMPLETED]: {
    actionText: '查看结果',
  },
}

// 隐私提醒弹窗显示状态
const showPrivacyModal = ref(false)

/**
 * 获取按钮文本
 */
function getActionText(task: AssessmentTask) {
  if ((task as any)?.resultGenerating === true)
    return '结果生成中'
  if (task.status === ASSESSMENT_STATUS.ENDED && task.participantStatus !== AssessmentTaskParticipantStatus.COMPLETED)
    return '测评已结束'
  return TASK_STATUS_MAP[task.participantStatus]?.actionText ?? '去答题'
}

/**
 * 检查按钮是否禁用
 */
function isButtonDisabled(task: AssessmentTask) {
  return (
    (task as any)?.resultGenerating === true
    || (task.status === ASSESSMENT_STATUS.ENDED
      && task.participantStatus !== AssessmentTaskParticipantStatus.COMPLETED)
  )
}

/**
 * 处理卡片点击
 */
async function handleClick() {
  const { assessment: task } = props
  console.log('hasModuleResultConfig', task.hasModuleResultConfig)

  if (task.hasModuleResultConfig) {
    // 跳转到结果页面
    uni.navigateTo({
      url: `/pages-sub/assessment/scene?taskNo=${task.taskNo}`,
    })
    return
  }

  // 结果生成中的提示
  if (
    (task as any)?.participantStatus === AssessmentTaskParticipantStatus.COMPLETED
    && (task as any)?.resultGenerating === true
  ) {
    uni.showToast({
      title: '结果生成中，请稍后查看',
      icon: 'none',
    })
    return
  }

  // 任务已结束的提示
  if (task.status === ASSESSMENT_STATUS.ENDED && task.participantStatus !== AssessmentTaskParticipantStatus.COMPLETED) {
    uni.showToast({
      title: '此测评任务已结束，无法答题哦',
      icon: 'none',
    })
    return
  }

  // 根据参与状态跳转
  switch (task.participantStatus) {
    case AssessmentTaskParticipantStatus.NOT_STARTED:
    case AssessmentTaskParticipantStatus.IN_PROGRESS: {
      // 打开隐私提醒弹窗
      showPrivacyModal.value = true
      break
    }
    case AssessmentTaskParticipantStatus.COMPLETED: {
      // 跳转到结果页面
      uni.navigateTo({
        url: `/pages-sub/assessment/result?taskNo=${task.taskNo}`,
      })
      break
    }
  }
}

/**
 * 开始测评（隐私弹窗确认后）
 */
function startAssessment() {
  const { assessment: task } = props
  showPrivacyModal.value = false

  // 根据是否有场景ID决定跳转地址
  if (task.scenarioId) {
    uni.navigateTo({
      url: `/pages-sub/assessment/scene?taskNo=${task.taskNo}`,
    })
  }
  else {
    uni.navigateTo({
      url: `/pages-sub/assessment/detail?taskNo=${task.taskNo}`,
    })
  }
}

/**
 * 格式化截止时间
 */
function formatDeadline(deadline: Date | number | string | undefined) {
  if (!deadline)
    return ''
  return dayjs(deadline).format('YYYY-MM-DD HH:mm')
}
</script>

<template>
  <view class="rounded-xl bg-[#F7FBFAFF] p-30rpx font-medium">
    <!-- Card header -->
    <view class="flex items-center justify-between">
      <view class="flex flex-col gap-2">
        <view class="title-text flex-1 text-sm">
          {{ assessment.taskName }}
        </view>

        <!-- Deadline -->
        <view class="desc-text text-xs">
          截止于：{{ formatDeadline(assessment.deadline) }}
        </view>
      </view>

      <LyTag
        tag-category-key="participant_completion_status"
        :dict-value="String(assessment.participantStatus)"
      />
    </view>

    <Divider />

    <!-- Progress -->
    <view class="desc-text mb-12rpx flex justify-between text-xs">
      <view>
        完成度
      </view>
      <view>
        {{ assessment.progress }}%
      </view>
    </view>

    <!-- Progress bar -->
    <wd-progress
      :percentage="assessment.progress"
      color="var(--primary-color)"
      hide-text
      class="mb-32rpx"
    />

    <!-- Action button -->
    <LyButton
      type="primary"
      size="medium"
      block
      :disabled="isButtonDisabled(assessment)"
      @click="handleClick"
    >
      {{ getActionText(assessment) }}
    </LyButton>
  </view>

  <!-- 隐私提醒弹窗 -->
  <PrivacyModal
    v-model="showPrivacyModal"
    @confirm="startAssessment"
  />
</template>
