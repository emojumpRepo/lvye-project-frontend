<script lang="ts" setup>
export interface Assessment {
  id: string
  title: string
  deadline: string
  progress: number
  status: 'completed' | 'in-progress' | 'pending'
}

interface Props {
  assessment: Assessment
}

defineOptions({
  name: 'AssessmentItem',
})

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [assessment: Assessment]
}>()

function getStatusText(status: Assessment['status']) {
  const statusMap = {
    'completed': '已完成',
    'in-progress': '进行中',
    'pending': '待开始',
  }
  return statusMap[status]
}

function getStatusClass(status: Assessment['status']) {
  const classMap = {
    'completed': 'text-[var(--primary-color)] bg-[rgb(69,200,134,0.1)]',
    'in-progress': 'text-[#f59e0b] bg-[rgb(245,158,11,0.1)]',
    'pending': 'text-[#f59e0b] bg-[rgb(245,158,11,0.1)]',
  }
  return classMap[status]
}

function getButtonText(status: Assessment['status']) {
  const textMap = {
    'completed': '查看结果',
    'in-progress': '继续作答',
    'pending': '开始测评',
  }
  return textMap[status]
}

function handleClick() {
  emit('click', props.assessment)
}
</script>

<template>
  <view class="rounded-xl bg-[#F7FBFAFF] p-30rpx font-medium">
    <!-- Card header -->
    <view class="flex items-center justify-between">
      <view class="flex flex-col gap-2">
        <view class="title-text flex-1 text-sm">
          {{ assessment.title }}
        </view>

        <!-- Deadline -->
        <view class="desc-text text-xs">
          截止于：{{ assessment.deadline }}
        </view>
      </view>

      <view class="rounded-8rpx px-16rpx py-8rpx text-xs" :class="getStatusClass(assessment.status)">
        {{ getStatusText(assessment.status) }}
      </view>
    </view>
    <!-- Divider -->
    <view class="custom-divider" />

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
    <view class="mb-32rpx h-8rpx overflow-hidden rounded-4rpx bg-[#e5e7eb]">
      <view
        class="h-full rounded-4rpx transition-all duration-300"
        :style="{ width: `${assessment.progress}%`, backgroundColor: 'var(--primary-color)' }"
      />
    </view>

    <!-- Action button -->
    <LyButton type="primary" size="medium" block @click="handleClick">
      {{ getButtonText(assessment.status) }}
    </LyButton>
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
