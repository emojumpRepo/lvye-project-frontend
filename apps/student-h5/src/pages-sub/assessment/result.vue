<script setup lang="ts">
import type { AssessmentResult } from '@/api/assessment'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getAssessmentResult } from '@/api/assessment'
import LyLoading from '@/components/LyLoading/index.vue'

defineOptions({
  name: 'AssessmentResult',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '测评结果',
  },
})

const positions: Record<string, string> = {
  行为: 'top-[5%] left-[30%]',
  智力与学校情况: 'top-[5%] left-[65%]',
  合群: 'top-[50%] left-[10%]',
  躯体外貌属性: 'top-[50%] right-[10%]',
  幸福与满足: 'bottom-[5%] left-[30%]',
  焦虑: 'bottom-[5%] left-[65%]',
}

const taskNo = ref('')
const mentalHealthStatus = ref<AssessmentResult | null>(null)
const onlineGameUse = ref<AssessmentResult | null>(null)
const sleepQuality = ref<AssessmentResult | null>(null)
const loading = ref(true)
const activeTooltip = ref<string>('')

// 格式化心理健康状况
const formattedMentalHealthStatus = computed(() => {
  return mentalHealthStatus.value?.resultDataParsed.map((item) => {
    const cleanDimensionName = item.dimensionName.replace('自我评价', '')
    return {
      ...item,
      dimensionName: cleanDimensionName,
      position: positions[cleanDimensionName],
    }
  })
})

function handleBack() {
  uni.reLaunch({
    url: '/pages/home/index',
  })
}

// 切换提示框
function toggleTooltip(dimensionName: string) {
  if (activeTooltip.value === dimensionName) {
    activeTooltip.value = ''
  }
  else {
    activeTooltip.value = dimensionName
  }
}

// 获取测评结果数据
async function getAssessmentResultData() {
  try {
    loading.value = true
    const res = await getAssessmentResult(taskNo.value)
    res.forEach((item) => {
      if (
        item.resultDataParsed.some(
          item => item.dimensionCode === 'behavior_self_evaluation',
        )
      ) {
        mentalHealthStatus.value = item
      }
      if (
        item.resultDataParsed.some(
          item => item.dimensionCode === 'game_addiction_risk',
        )
      ) {
        onlineGameUse.value = item
      }
      if (
        item.resultDataParsed.some(
          item => item.dimensionCode === 'sleep_quality',
        )
      ) {
        sleepQuality.value = item
      }
    })
  }
  catch (error) {
    console.error(error)
    uni.showToast({
      title: '加载结果失败',
      icon: 'none',
    })
  }
  finally {
    loading.value = false
  }
}

onLoad(async (options) => {
  taskNo.value = (options?.taskNo as string) || ''
  if (taskNo.value) {
    await getAssessmentResultData()
  }
})
</script>

<template>
  <view class="result-page">
    <!-- 主要内容卡片 -->
    <view class="result-container">
      <view class="result-content">
        <!-- 标题区域 -->
        <view class="mb-4 shrink-0 text-center">
          <view class="section-title">
            <text class="text-2xl text-gray-800 font-medium">总报告</text>
            <view class="title-divider mx-auto h-1" />
          </view>
          <!-- 横幅图片 -->
          <view class="result-header mt-6 h-32 w-full overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat" />
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="flex flex-1 items-center justify-center">
          <view class="flex flex-col items-center space-y-4">
            <LyLoading />
            <text class="text-gray-500">正在加载测评结果...</text>
          </view>
        </view>

        <!-- 主要内容区域 -->
        <scroll-view
          v-else
          scroll-y
          class="flex-1"
        >
          <view class="grid grid-cols-1 gap-8 pb-4">
            <!-- 心理健康状况 -->
            <view
              v-if="formattedMentalHealthStatus"
              class="flex flex-col"
            >
              <view class="section-title">
                <text>心理健康状况</text>
                <view class="title-divider h-0.5" />
              </view>

              <text class="section-content">
                心理健康状况分为合群、行为、智力与学校情况、躯体外貌属性、焦虑、幸福与满足等6个维度进行自我评价。
              </text>

              <view class="mental-health-bg relative flex flex-1 items-center justify-center p-12">
                <image src="/static/images/evaluation/result/report_logo.png" mode="aspectFit" class="h-50 w-40" />
                <!-- 心理健康结果评语 -->
                <view
                  v-for="item in formattedMentalHealthStatus"
                  :key="item.dimensionName"
                  class="absolute z-10"
                  :class="[item.position, activeTooltip === item.dimensionName ? 'text-emerald-500' : 'text-gray-700']"
                  @click="toggleTooltip(item.dimensionName)"
                >
                  <view class="flex items-center space-x-2">
                    <image
                      :src="item.isAbnormal ? '/static/images/evaluation/result/report_upset_icon.svg' : '/static/images/evaluation/result/report_happy_icon.svg'"
                      mode="aspectFit"
                      class="h-9 w-9"
                    />
                    <text class="text-xs font-medium sm:text-sm">
                      {{ item.dimensionName }}
                    </text>
                  </view>
                  <!-- 提示框 -->
                  <view
                    v-if="activeTooltip === item.dimensionName"
                    class="absolute left-0 top-full z-20 mt-2 w-80 rounded-xl bg-green-50 p-4 shadow-lg"
                  >
                    <text class="text-sm text-gray-600 leading-relaxed">
                      {{ item.studentComment }}
                    </text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 网络游戏使用 -->
            <view v-if="onlineGameUse">
              <view class="section-title">
                <view class="flex items-center gap-3">
                  <image
                    :src="onlineGameUse?.resultDataParsed[0]?.isAbnormal
                      ? '/static/images/evaluation/result/report_upset_icon.svg'
                      : '/static/images/evaluation/result/report_happy_icon.svg'"
                    mode="aspectFit"
                    class="h-9 w-9"
                  />
                  <text>网络游戏使用</text>
                </view>
                <view class="title-divider h-0.5" />
              </view>
              <text class="section-content">
                {{ onlineGameUse?.resultDataParsed[0]?.studentComment }}
              </text>
            </view>

            <!-- 睡眠质量 -->
            <view v-if="sleepQuality">
              <view class="section-title">
                <view class="flex items-center gap-3">
                  <image
                    :src="sleepQuality?.resultDataParsed[0]?.isAbnormal
                      ? '/static/images/evaluation/result/report_upset_icon.svg'
                      : '/static/images/evaluation/result/report_happy_icon.svg'"
                    mode="aspectFit"
                    class="h-9 w-9"
                  />
                  <text>睡眠质量 / 失眠症状严重程度</text>
                </view>
                <view class="title-divider h-0.5" />
              </view>
              <text class="section-content">
                {{ sleepQuality?.resultDataParsed[0]?.studentComment }}
              </text>
            </view>
          </view>
        </scroll-view>

        <!-- 底部区域 -->
        <view class="mt-8 flex flex-col items-center pb-safe space-y-6">
          <!-- 分割线 -->
          <view class="w-full flex items-center justify-center">
            <view class="flex items-center space-x-6">
              <view class="h-px w-64 from-transparent to-gray-300 bg-gradient-to-r" />
              <view class="flex items-center space-x-2">
                <view class="h-1 w-1 rounded-full bg-emerald-400" />
                <view class="h-1.5 w-1.5 rounded-full bg-green-400" />
                <view class="h-1 w-1 rounded-full bg-emerald-400" />
              </view>
              <view class="h-px w-64 from-transparent to-gray-300 bg-gradient-to-r" />
            </view>
          </view>

          <!-- 返回按钮 -->
          <view
            class="back-btn"
            @click="handleBack"
          >
            <text class="text-sm text-white">返回</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.result-page {
  min-height: 100vh;
  background-color: #f9fafb;
  background-image: url('/static/images/evaluation/result/result_bg.png');
  background-position: center;
  background-size: cover;
}

.result-container {
  display: flex;
  height: 100vh;
  padding: 16px 24px;
}

.result-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 10%);
}

.section-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 500;
  color: #1f2937;

  .title-divider {
    width: 64px;
    background: linear-gradient(to right, #34d399, #10b981);
    border-radius: 9999px;
  }
}

.section-content {
  display: block;
  line-height: 1.75;
  color: #4b5563;
  text-indent: 2em;
}

.result-header {
  background-image: url('/static/images/evaluation/result/result_header.png');
}

.mental-health-bg {
  background-image: url('/static/images/evaluation/result/logo_bg.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

.back-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 32px;
  overflow: hidden;
  font-weight: 500;
  color: white;
  background: linear-gradient(to right, #10b981, #059669);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgb(16 185 129 / 30%);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
  }
}
</style>
