<script setup lang="ts">
import type { AssessmentScenarioSlotVO } from '@vben/types'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import ConfirmDialog from '@/components/Dialog/ConfirmDialog/index.vue'
import LyLoading from '@/components/LyLoading/index.vue'
import { useEvaluationStore, useTenantStore, useUserStore } from '@/store'

defineOptions({
  name: 'AssessmentQuestionnaire',
})

definePage({
  layout: 'empty',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '问卷答题',
    disableScroll: true,
  },
})

const evaluationStore = useEvaluationStore()
const userStore = useUserStore()
const tenantStore = useTenantStore()

const {
  loading,
  isLastScene,
  selectedSlot,
  currentTaskNo,
  hasScenario,
  getNextIncompleteQuestionnaire,
} = storeToRefs(evaluationStore)

const {
  selectSlot,
  getNextSlot,
  startEvaluation,
  startEvaluationWithoutScenario,
  loadTaskDetail,
} = evaluationStore

const questionnaireId = ref('')
const questionnaireLink = ref('')
const assessmentTaskNo = ref('')
const sceneId = ref('')
const iframeSrc = ref('')
const isIframeCompleted = ref(false)
const isContinueLoading = ref(false) // 继续按钮的loading状态

// 消息去重：记录已处理的消息ID
const processedMessageIds = new Set<string>()

// 引导相关状态
const showIntro = ref(false) // 是否显示引导
const showTips = ref(false) // 是否显示第二阶段（考拉对话）

// 确认对话框状态
const showConfirmDialog = ref(false)

// 当前场景数据
const sceneData = computed<AssessmentScenarioSlotVO | null>(() => {
  if (hasScenario.value && selectedSlot.value) {
    return selectedSlot.value
  }
  return null
})

// 考拉教练图片
const koalaUrl = computed(() => {
  return sceneData.value?.metadata?.introConfig?.characterConfig?.imageUrl || ''
})

// 生成问卷链接
function generateIframeSrc() {
  const surveyBaseUrl = import.meta.env.VITE_SURVEY_URL || ''
  const schoolTenantId = tenantStore.getTenantId || ''
  const userId = userStore.userInfo?.id || ''

  if (!currentTaskNo.value) {
    console.log('缺少 currentTaskNo，返回空链接')
    return ''
  }

  // 有场景模式：从 selectedSlot.questionnaires 获取问卷信息
  if (hasScenario.value && selectedSlot.value?.questionnaires?.length) {
    const target
      = selectedSlot.value.questionnaires.find((q: any) => !q.completed)
        || selectedSlot.value.questionnaires[0]
    const link = target?.externalLink
    const id = target?.id

    console.log('有场景模式 - link:', link, 'id:', id)
    return `${surveyBaseUrl}${link}?t=${Date.now()}&userId=${userId}&assessmentNo=${currentTaskNo.value}&questionId=${id}&tenantId=${schoolTenantId}`
  }

  // 无场景模式：从传入的参数获取问卷信息
  if (questionnaireId.value && questionnaireLink.value) {
    console.log('无场景模式 - questionnaireId:', questionnaireId.value, 'questionnaireLink:', questionnaireLink.value)
    return `${surveyBaseUrl}${decodeURIComponent(questionnaireLink.value)}?t=${Date.now()}&userId=${userId}&assessmentNo=${currentTaskNo.value}&questionId=${questionnaireId.value}&tenantId=${schoolTenantId}`
  }

  console.log('没有匹配的模式，返回空链接')
  return ''
}

// 初始化页面
async function initializePage() {
  if (assessmentTaskNo.value) {
    await loadTaskDetail(assessmentTaskNo.value)
  }

  if (sceneId.value) {
    showIntro.value = true
    showTips.value = false
    selectSlot(sceneId.value)
  }
  else {
    showIntro.value = false
    showTips.value = false
  }

  iframeSrc.value = generateIframeSrc()
  console.log('问卷链接:', iframeSrc.value)
}

// 引导-关闭
function handleIntroClose() {
  doBack()
}

// 引导-下一步（进入第二阶段）
function handleIntroNext() {
  showTips.value = true
}

// 考拉对话-开始作答
function handleStart() {
  showIntro.value = false
  showTips.value = false
}

// 计算引导动画的阶段
const guideStage = computed<'intro' | 'tips'>(() => {
  return showTips.value ? 'tips' : 'intro'
})

// 返回
function handleBack() {
  if (isIframeCompleted.value) {
    doBack()
  }
  else {
    showConfirmDialog.value = true
  }
}

// 确认放弃
function handleConfirmAbandon() {
  showConfirmDialog.value = false
  doBack()
}

function doBack() {
  if (hasScenario.value) {
    uni.redirectTo({
      url: `/pages-sub/assessment/scene?taskNo=${currentTaskNo.value}`,
    })
  }
  else {
    uni.redirectTo({
      url: `/pages-sub/assessment/list`,
    })
  }
}

// 继续/提交
async function handleContinue() {
  if (isContinueLoading.value) {
    console.log('handleContinue 正在执行中，跳过')
    return
  }

  console.log('handleContinue 开始执行')
  isContinueLoading.value = true

  try {
    // 有测试场景的模式
    if (hasScenario.value) {
      // 若当前插槽内仍有未完成问卷，则继续当前插槽内的下一份问卷
      const hasRemainingInCurrentSlot = (
        selectedSlot.value?.questionnaires || []
      ).some((q: any) => !q.completed)

      console.log('有场景模式 - 当前插槽是否有剩余问卷:', hasRemainingInCurrentSlot)

      if (hasRemainingInCurrentSlot) {
        // 同一场景内的下一个问卷
        const result = await startEvaluation(currentTaskNo.value || '', sceneId.value)
        console.log('startEvaluation 返回结果:', result)

        if (result.isSameScene) {
          // 同一场景，直接更新 iframe，不显示指引
          console.log('同一场景，直接更新问卷')
          questionnaireId.value = String(result.questionnaireId || '')
          questionnaireLink.value = result.questionnaireLink || ''
          isIframeCompleted.value = false
          iframeSrc.value = generateIframeSrc()
        }
        else {
          // 理论上不会走到这里，因为是同一场景内的问卷
          console.warn('场景ID不匹配，这不应该发生')
        }
        return
      }

      // 当前插槽全部完成后：若为最后场景则返回场景页，否则进入下一场景
      if (isLastScene.value) {
        console.log('最后场景，返回场景页')
        uni.redirectTo({
          url: `/pages-sub/assessment/scene?taskNo=${currentTaskNo.value}`,
        })
        return
      }

      // 切换到下一个场景
      const nextScene = getNextSlot()
      console.log('获取下一个场景:', nextScene)
      if (nextScene) {
        console.log('切换到新场景')
        // 先切换到下一个插槽
        selectSlot(nextScene.id || 0)
        // 调用 startEvaluation
        const result = await startEvaluation(currentTaskNo.value || '', sceneId.value)
        console.log('startEvaluation 返回结果:', result)

        // 更新场景和问卷信息
        sceneId.value = String(result.sceneId || '')
        questionnaireId.value = String(result.questionnaireId || '')
        questionnaireLink.value = result.questionnaireLink || ''
        isIframeCompleted.value = false

        // 显示新场景的指引动画
        showIntro.value = true
        showTips.value = false
      }
    }
    else {
      // 无测试场景的模式
      const nextQuestionnaire = getNextIncompleteQuestionnaire.value
      console.log('无场景模式 - 下一个问卷:', nextQuestionnaire)
      if (nextQuestionnaire) {
        const result = await startEvaluationWithoutScenario(
          currentTaskNo.value || '',
          nextQuestionnaire,
        )
        console.log('startEvaluationWithoutScenario 返回结果:', result)

        // 直接切换问卷
        questionnaireId.value = String(result.questionnaireId || '')
        questionnaireLink.value = result.questionnaireLink || ''
        isIframeCompleted.value = false
        iframeSrc.value = generateIframeSrc()
      }
      else {
        // 所有问卷都已完成，跳转到测评详情页面
        console.log('所有问卷已完成，跳转到列表页')
        uni.redirectTo({
          url: `/pages-sub/assessment/list`,
        })
      }
    }
  }
  catch (error) {
    console.error('handleContinue 执行出错:', error)
    uni.showToast({
      title: error instanceof Error ? error.message : '操作失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    isContinueLoading.value = false
  }
}

// 问卷完成
function handleComplete() {
  isIframeCompleted.value = true

  // 更新当前问卷的完成状态
  if (hasScenario.value && selectedSlot.value?.questionnaires?.length) {
    // 有场景模式：根据 questionnaireId 精确标记完成
    const qid = Number(questionnaireId.value)
    if (qid) {
      const target = selectedSlot.value.questionnaires.find(
        (q: any) => q.questionnaireId === qid,
      )
      if (target)
        target.completed = true
    }
    else {
      // 兜底：找首个未完成标记
      const fallback = selectedSlot.value.questionnaires.find(
        (q: any) => !q.completed,
      )
      if (fallback)
        fallback.completed = true
    }
  }
  else {
    // 无场景模式：更新当前问卷的完成状态
    if (questionnaireId.value && evaluationStore.taskDetailInfo?.questionnaires) {
      const currentQuestionnaire
        = evaluationStore.taskDetailInfo.questionnaires.find(
          q => q.questionnaireId === Number(questionnaireId.value),
        )
      if (currentQuestionnaire) {
        currentQuestionnaire.completed = true
      }
    }
  }

  uni.showToast({
    title: '问卷已完成',
    icon: 'success',
    duration: 2000,
  })
}

// 接收 iframe 的 postMessage 消息
function handleMessage(e: MessageEvent) {
  // 验证消息来源
  const surveyBaseUrl = import.meta.env.VITE_SURVEY_URL || ''
  if (surveyBaseUrl) {
    try {
      const allowedOrigin = new URL(surveyBaseUrl).origin
      if (e.origin !== allowedOrigin) {
        return
      }
    }
    catch (error) {
      console.error('解析 VITE_SURVEY_URL 失败:', error)
      return
    }
  }

  const data = e.data
  if (!data || typeof data !== 'object')
    return

  // 消息去重：如果消息带有 ID，检查是否已处理过
  if (data.id) {
    if (processedMessageIds.has(data.id)) {
      console.log('消息已处理，跳过:', data.id)
      return
    }
    processedMessageIds.add(data.id)
  }

  console.log('处理消息数据:', data)

  switch (data.type) {
    case 'complete':
      // complete 消息只处理一次
      if (!isIframeCompleted.value) {
        handleComplete()
      }
      break
    case 'childReady':
      console.log('问卷页面已就绪')
      break
    default:
      console.log('未知消息类型:', data.type)
      break
  }
}

// 是否有剩余问卷
const hasRemainingInCurrentSlot = computed(() => {
  const list = (selectedSlot.value?.questionnaires as any[]) || []
  return list.some(q => !q.completed)
})

// 继续按钮文本
const continueButtonText = computed(() => {
  if (hasScenario.value) {
    return isLastScene.value && !hasRemainingInCurrentSlot.value
      ? '提交回答'
      : '继续答题'
  }
  return getNextIncompleteQuestionnaire.value ? '继续答题' : '提交回答'
})

onLoad(async (options) => {
  questionnaireId.value = (options?.questionnaireId as string) || ''
  questionnaireLink.value = (options?.questionnaireLink as string) || ''
  assessmentTaskNo.value = (options?.assessmentTaskNo as string) || ''
  sceneId.value = (options?.sceneId as string) || ''

  await initializePage()

  // 监听 iframe 的 postMessage 消息
  window.addEventListener('message', handleMessage)
})

onUnload(() => {
  // 移除消息监听器
  window.removeEventListener('message', handleMessage)
  // 清理已处理的消息ID集合
  processedMessageIds.clear()
})
</script>

<template>
  <view
    class="questionnaire-container"
  >
    <!-- 加载状态 -->
    <view v-if="loading" class="h-screen flex items-center justify-center">
      <LyLoading />
    </view>

    <!-- 引导动画组件 -->
    <GuideAnimation
      v-else-if="showIntro"
      :visible="showIntro"
      :stage="guideStage"
      :scene-data="sceneData"
      :koala-url="koalaUrl"
      @close="handleIntroClose"
      @next="handleIntroNext"
      @start="handleStart"
    />

    <!-- 问卷内容 -->
    <view v-else class="h-screen flex flex-col">
      <!-- 返回按钮 - 左上角 -->
      <view class="back-button" @click="handleBack">
        <wd-icon name="arrow-left" size="20" />
      </view>

      <!-- 问卷链接为空时的提示 -->
      <view v-if="!iframeSrc" class="h-screen flex items-center justify-center">
        <view class="text-center">
          <text class="desc-text-heavy">问卷链接加载失败</text>
        </view>
      </view>

      <!-- web-view问卷内容 -->
      <iframe v-else :src="iframeSrc" class="webview-content flex-1" />

      <!-- 继续/提交按钮 -->
      <view v-if="isIframeCompleted" class="continue-button" @click="handleContinue">
        <text>{{ continueButtonText }}</text>
        <text class="ml-2">→</text>
      </view>
    </view>

    <!-- 确认放弃对话框 -->
    <ConfirmDialog
      v-model="showConfirmDialog"
      title="提示"
      content="确定要放弃完成本次测评任务吗？"
      tip="已填写的信息将丢失"
      confirm-text="确定放弃"
      confirm-type="error"
      @confirm="handleConfirmAbandon"
    />
  </view>
</template>

<style scoped lang="scss">
.questionnaire-container {
  width: 100%;
  height: 100vh;
}

// web-view 内容区域（为返回按钮预留空间）
.webview-content {
  padding-top: 70px; // 为返回按钮预留空间
}

// 返回按钮
.back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 20rpx;
  color: var(--primary-color);
  background: rgb(255 255 255 / 95%);
  border-radius: 9999px;
  box-shadow: 0 4px 15px rgb(0 0 0 / 10%);
}

// 继续按钮
.continue-button {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--primary-color);
  border-radius: 9999px;
  box-shadow: 0 4px 15px rgb(76 175 80 / 35%);
}
</style>
