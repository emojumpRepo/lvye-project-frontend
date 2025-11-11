<script setup lang="ts">
import type { Dimension } from '@vben/types'
import type { ModuleResultVO } from '@/api/assessment'
import { onLoad, onPageScroll } from '@dcloudio/uni-app'
import { IconifyIcon } from '@vben/icons'
import { getBucketFileUrl } from '@vben/utils'
import { ref } from 'vue'
import { getModuleResult } from '@/api/assessment'
import { getTagByCategory, MAP_MODULE_MAP, RISK_LEVEL_RESULT_ICON_MAP } from '@/api/types/constants'
import LyLoading from '@/components/LyLoading/index.vue'
import CommentItem from './components/CommentItem.vue'
import DimensionGrid from './components/DimensionGrid.vue'

defineOptions({
  name: 'AssessmentModule',
})

const taskNo = ref('')
const slotId = ref<number>(0)
const scrollTop = ref(0)
const loading = ref(false)
const moduleResult = ref<ModuleResultVO | null>(null)
const activeDimension = ref<Dimension | null>(null)

// 页面滚动监听
onPageScroll((e) => {
  scrollTop.value = e.scrollTop
})

// 页面加载
onLoad(async (options) => {
  if (options?.taskNo) {
    taskNo.value = options.taskNo
  }
  if (options?.slotId) {
    slotId.value = Number(options.slotId)
  }

  // 加载模块评估数据
  if (taskNo.value && slotId.value) {
    await fetchModuleResult()
  }
})

// 获取模块结果
async function fetchModuleResult() {
  try {
    loading.value = true
    const result = await getModuleResult(taskNo.value, slotId.value)
    moduleResult.value = result
  }
  catch (error) {
    console.error('获取模块结果失败:', error)
    uni.showToast({
      title: '获取模块结果失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="min-h-screen flex flex-col overflow-y-auto">
    <!-- 导航栏 -->
    <Navbar title="模块评估报告" :show-back="true" :scroll-top="scrollTop" />

    <template v-if="loading">
      <!-- 加载状态 -->
      <view class="flex flex-1 items-center justify-center">
        <LyLoading />
      </view>
    </template>

    <!-- 页面内容 -->
    <view v-else-if="moduleResult" class="mx-30rpx my-5 flex-1 rounded-2xl bg-#fff p-30rpx">
      <!-- 标题区域 -->
      <view class="flex items-center justify-between">
        <text class="modult-result-title">模块评估报告</text>
        <view class="desc-text flex items-center gap-1 text-sm font-medium">
          <IconifyIcon
            v-if="MAP_MODULE_MAP[moduleResult.slotKey.split('_')[1] as keyof typeof MAP_MODULE_MAP]"
            :icon="MAP_MODULE_MAP[moduleResult.slotKey.split('_')[1] as keyof typeof MAP_MODULE_MAP]?.icon"
            class="text-base"
          />
          <text>{{ moduleResult.slotName }}</text>
        </view>
      </view>

      <!-- 考拉插图以及情况综述 -->
      <view class="flex flex-col items-center justify-center gap-3">
        <image
          class="h-260rpx w-310rpx"
          :src="getBucketFileUrl(RISK_LEVEL_RESULT_ICON_MAP[moduleResult.riskLevel])"
          mode="aspectFit"
        />
        <view
          v-if="moduleResult.resultDataParsed?.level"
          class="desc-text px-4 text-center text-lg font-medium"
          :style="{ color: getTagByCategory('questionnaire_result_risk_level', moduleResult.riskLevel).tagStyle.color }"
        >
          {{ moduleResult.resultDataParsed.level }}
        </view>
      </view>

      <Divider />

      <!-- 总体情况 -->
      <view v-if="moduleResult.slotKey">
        <view class="modult-result-title">
          总体情况
        </view>
        <DimensionGrid v-model="activeDimension" :dimension-list="moduleResult.dimensionResults" />
      </view>

      <Divider />

      <!-- 主要结论 -->
      <view v-if="activeDimension">
        <view class="modult-result-title">
          主要结论
        </view>
        <view>
          <CommentItem v-if="activeDimension.studentComment" :content="activeDimension.studentComment" />
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="mx-30rpx my-5 flex flex-1 items-center justify-center rounded-2xl bg-#fff p-30rpx">
      <text class="desc-text text-sm">暂无数据</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.modult-result-title {
  @apply title-text mb-5 text-32rpx font-medium;
}
</style>
