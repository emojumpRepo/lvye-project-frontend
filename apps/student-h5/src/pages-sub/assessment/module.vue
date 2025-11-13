<script setup lang="ts">
import type { Dimension } from '@vben/types'
import type { groupConfig } from './data'
import type { ModuleResultVO } from '@/api/assessment'
import { onLoad, onPageScroll } from '@dcloudio/uni-app'
import { getBucketFileUrl } from '@vben/utils'
import { ref } from 'vue'
import { getModuleResult } from '@/api/assessment'
import { getTagByCategory, MAP_MODULE_MAP, RISK_LEVEL_RESULT_ICON_MAP } from '@/api/types/constants'
import LyLoading from '@/components/LyLoading/index.vue'
import CommentItem from './components/result/CommentItem.vue'
import DimensionGrid from './components/result/DimensionGrid.vue'
import DimensionStep from './components/result/DimensionStep.vue'
import DimensionTable from './components/result/DimensionTable.vue'
import { COMMENTS_GROUP_TYPE, COMPONENTS_TYPE, MODULE_RESULT_PAGE_CONFIG, SHOW_COMMENT_MODE } from './data'

defineOptions({
  name: 'AssessmentModule',
})

definePage({
  layout: 'default',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '模块评估报告',
  },
})

const taskNo = ref('')
const slotId = ref<number>(0)
const scrollTop = ref(0)
const loading = ref(false)
const moduleResult = ref<ModuleResultVO | null>(null)
const activeDimension = ref<Dimension | null>(null)

// 当前结果页配置
const current_result_page_config = computed(() => {
  if (!moduleResult.value)
    return null
  const config = MODULE_RESULT_PAGE_CONFIG[moduleResult.value.slotKey]
  return config?.[0] || null
})

// 缓存分组内容，避免频繁计算
const groupContents = computed(() => {
  if (!moduleResult.value || !current_result_page_config.value)
    return new Map<string, string>()

  const contents = new Map<string, string>()

  // 遍历所有 parts，找到包含 groups 的 part
  for (const part of current_result_page_config.value.parts) {
    if (part.groups) {
      for (const group of part.groups) {
        contents.set(group.groupId, getGroupContent(group, moduleResult.value.dimensionResults))
      }
    }
  }

  return contents
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

// 获取一组的所有维度评论内容
function getGroupContent(group: groupConfig, dimensionResults: Dimension[]): string {
  const groupDimensions = dimensionResults.filter(dimension =>
    group.dimensions.includes(dimension.dimensionCode),
  )

  if (group.type === COMMENTS_GROUP_TYPE.MERGE_MAX) {
    // 按 riskLevel 降序排序，取第一个
    const sortedDimensions = [...groupDimensions].sort((a, b) => (b.riskLevel || 0) - (a.riskLevel || 0))
    return sortedDimensions[0]?.studentComment || ''
  }

  // 默认将所有维度的评论内容拼接起来
  return groupDimensions
    .map((dimension) => {
      const comment = dimension.studentComment || ''
      if (!comment)
        return ''
      return `<p>${comment}</p>`
    })
    .filter(content => content) // 过滤掉空内容
    .join('')
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
    <view v-else-if="moduleResult && current_result_page_config" class="mx-30rpx my-5 flex-1 rounded-2xl bg-#fff p-30rpx">
      <!-- 动态渲染各个 part -->
      <template v-for="(part, index) in current_result_page_config.parts" :key="index">
        <!-- Part 标题和顶部额外信息 -->
        <view v-if="part.title || part.showHeaderExtra" class="flex items-center justify-between">
          <text
            v-if="part.title"
            class="modult-result-title"
            :class="{
              'text-center': part.titleAlign === 'center',
              'text-left': part.titleAlign === 'left',
              'text-right': part.titleAlign === 'right',
            }"
          >
            {{ part.title }}
          </text>

          <!-- 模块额外信息 -->
          <view v-if="part.showHeaderExtra" class="desc-text flex items-center gap-1 text-sm font-medium">
            <image
              :src="getBucketFileUrl(MAP_MODULE_MAP[moduleResult.slotKey.split('_')[1]]?.gray_icon)"
              class="desc-text size-32rpx"
            />
            <text>{{ moduleResult.slotName }}</text>
          </view>
        </view>

        <!-- 风险等级展示 -->
        <template v-if="part.showTotalLevel">
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
        </template>

        <!-- 可视化组件 -->
        <template v-if="part.components && part.components.length > 0">
          <view v-if="!part.title && !part.showHeaderExtra" class="modult-result-title">
            总体情况
          </view>

          <DimensionGrid
            v-if="part.components.includes(COMPONENTS_TYPE.GRID)"
            v-model="activeDimension"
            :dimension-list="moduleResult.dimensionResults"
          />

          <DimensionTable
            v-if="part.components.includes(COMPONENTS_TYPE.TABLE)"
            :dimensions="moduleResult.dimensionResults"
            :columns="part.columns || []"
          />

          <DimensionStep
            v-if="part.components.includes(COMPONENTS_TYPE.STEP)"
            :steps="part.steps"
            :dimensions="moduleResult.dimensionResults"
          />
        </template>

        <!-- 评论内容 -->
        <template v-if="part.showComment">
          <view v-if="!part.title && !part.showHeaderExtra && !part.components" class="modult-result-title">
            主要结论
          </view>

          <!-- 单个评论模式 -->
          <template v-if="part.showCommentMode === SHOW_COMMENT_MODE.ONE">
            <CommentItem v-if="activeDimension && activeDimension.studentComment" :content="activeDimension.studentComment" />
          </template>

          <!-- 所有评论模式 -->
          <template v-else-if="part.showCommentMode === SHOW_COMMENT_MODE.ALL">
            <view class="space-y-4">
              <CommentItem v-for="dimension in moduleResult.dimensionResults" :key="dimension.dimensionId" :content="dimension.studentComment" />
            </view>
          </template>

          <!-- 分组评论模式 -->
          <template v-else-if="part.showCommentMode === SHOW_COMMENT_MODE.GROUP">
            <view class="space-y-4">
              <view v-for="group in part.groups" :key="group.groupId">
                <CommentItem :description="group.description" :content="groupContents.get(group.groupId) || ''" />
              </view>
            </view>
          </template>
        </template>

        <!-- 分隔线 -->
        <Divider v-if="index < current_result_page_config.parts.length - 1" />
      </template>
    </view>

    <!-- 空状态 -->
    <view v-else class="mx-30rpx my-5 flex flex-1 items-center justify-center rounded-2xl bg-#fff p-30rpx">
      <text class="desc-text text-sm">暂无数据</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.modult-result-title {
  @apply mb-5 text-32rpx font-medium;

  color: var(--title-text-color);
}
</style>
