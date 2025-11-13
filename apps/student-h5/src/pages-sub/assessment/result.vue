<script setup lang="ts">
import type { AppMyAssessmentResultVO } from '@/api/assessment'
import { onLoad, onPageScroll } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { getAssessmentResult } from '@/api/assessment'
import { getTagByCategory } from '@/api/types/constants'
import LyLoading from '@/components/LyLoading/index.vue'
import { useEvaluationStore } from '@/store'
import CommentItem from './components/result/CommentItem.vue'
import ModuleResultGuide from './components/result/ModuleResultGuide.vue'
import RiskLevelSector from './components/result/RiskLevelSector.vue'
import { ASSESSMENT_RESULT_PAGE_CONFIG, COMPONENTS_TYPE } from './data'

defineOptions({
  name: 'AssessmentResult',
})

definePage({
  layout: 'default',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '最终测评结果',
  },
})

const evaluationStore = useEvaluationStore()
const {
  loadTaskDetail,
} = evaluationStore

const {
  loading: isLoadingTaskInfo,
  taskDetailInfo,
} = storeToRefs(evaluationStore)

const taskNo = ref('')
const scrollTop = ref(0)
const loading = ref(false)
const assessmentResult = ref<AppMyAssessmentResultVO | null>(null)

// 当前页面配置
const currentPageConfig = computed(() => {
  if (!taskDetailInfo.value)
    return null
  // 使用场景code作为配置key
  const scenarioCode = taskDetailInfo.value.scenarioDetail?.code
  return ASSESSMENT_RESULT_PAGE_CONFIG[scenarioCode]?.[0] || null
})

// 获取part的内容值
function getPartContent(prop: string) {
  if (!assessmentResult.value?.resultDataParsed)
    return ''
  return assessmentResult.value.resultDataParsed[prop] || ''
}

const modulesList = computed(() => {
  if (!taskDetailInfo.value)
    return []
  return taskDetailInfo.value.scenarioDetail.slots.filter((slot) => {
    return slot.hasModuleResultConfig
  })
})

// 页面滚动监听
onPageScroll((e) => {
  scrollTop.value = e.scrollTop
})

// 页面加载
onLoad(async (options) => {
  if (options?.taskNo) {
    taskNo.value = options.taskNo
  }

  // 加载最终测评结果数据以及测评任务详情
  if (taskNo.value) {
    await fetchAssessmentResult()
    await loadTaskDetail(taskNo.value, true)
  }
})

// 获取模块结果
async function fetchAssessmentResult() {
  try {
    loading.value = true
    const result = await getAssessmentResult(taskNo.value, false)
    assessmentResult.value = result
  }
  catch (error) {
    console.error('获取最终测评结果失败:', error)
    uni.showToast({
      title: '获取最终测评结果失败',
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
    <Navbar title="最终测评结果" :show-back="true" :scroll-top="scrollTop" />

    <template v-if="loading || isLoadingTaskInfo">
      <!-- 加载状态 -->
      <view class="flex flex-1 items-center justify-center">
        <LyLoading />
      </view>
    </template>

    <!-- 页面内容 -->
    <view v-else-if="assessmentResult && currentPageConfig" class="mx-30rpx my-5 flex-1 rounded-2xl bg-#fff p-30rpx">
      <!-- 动态渲染各个 part -->
      <template v-for="(part, index) in currentPageConfig.parts" :key="index">
        <!-- Part 标题 -->
        <view
          v-if="part.title"
          class="result-title"
          :class="{
            'text-center': part.titleAlign === 'center',
            'text-left': part.titleAlign === 'left',
            'text-right': part.titleAlign === 'right',
          }"
        >
          {{ part.title }}
        </view>

        <!-- 可视化组件 -->
        <template v-if="part.components?.includes(COMPONENTS_TYPE.Sector)">
          <view class="flex flex-col items-center justify-center">
            <RiskLevelSector :current-level="assessmentResult.combinedRiskLevel" />

            <view
              v-if="part.showTotalLevel"
              class="center text-lg font-medium"
              :style="{ color: getTagByCategory('questionnaire_result_risk_level', assessmentResult.combinedRiskLevel).tagStyle.color }"
            >
              {{ assessmentResult.resultDataParsed.studentLevel }}
            </view>
          </view>
        </template>

        <!-- 评论内容 -->
        <template v-if="part.showComment && part.prop">
          <CommentItem :content="getPartContent(part.prop)" />
        </template>

        <!-- 模块导航 -->
        <template v-if="part.showModuleGuide">
          <CommentItem content="您可以持续关注在模块测试中反馈的身心健康问题。" />
          <ModuleResultGuide :modules="modulesList" :current-task-no="taskDetailInfo?.taskNo" />
        </template>

        <!-- 分隔线 -->
        <Divider v-if="index < currentPageConfig.parts.length - 1" />
      </template>

      <!-- footer -->
      <template v-if="currentPageConfig.showFooter">
        <Divider />
        <view class="desc-text px-8 text-center text-xs">
          您可前往口袋工具模块，了解更多心理健康知识，尝试进行正念练习哦！
        </view>
      </template>
    </view>

    <!-- 空状态 -->
    <view v-else class="mx-30rpx my-5 flex flex-1 items-center justify-center rounded-2xl bg-#fff p-30rpx">
      <text class="desc-text text-sm">暂无数据</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.result-title {
  @apply mb-5 text-32rpx font-medium;

  color: var(--title-text-color);
}
</style>
