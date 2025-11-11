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
  const schoolTenantId = tenantStore.tenantId || ''
  const userId = userStore.userInfo?.id || ''

  if (!currentTaskNo.value) {
    console.log('缺少 currentTaskNo，返回空链接')
    return ''
  }

  // 优先使用明确设置的 questionnaireId 和 questionnaireLink
  if (questionnaireId.value && questionnaireLink.value) {
    console.log('使用传入参数 - questionnaireId:', questionnaireId.value, 'questionnaireLink:', questionnaireLink.value, 'tenantId:', schoolTenantId)
    // tenantId 需要以数组格式传递
    return `${surveyBaseUrl}${decodeURIComponent(questionnaireLink.value)}?t=${Date.now()}&userId=${userId}&assessmentNo=${currentTaskNo.value}&questionId=${questionnaireId.value}&tenantId=${schoolTenantId}`
  }

  // 有场景模式：从 selectedSlot.questionnaires 获取问卷信息
  if (hasScenario.value && selectedSlot.value?.questionnaires?.length) {
    const target
      = selectedSlot.value.questionnaires.find((q: any) => !q.completed)
        || selectedSlot.value.questionnaires[0]
    const link = target?.externalLink
    const id = target?.id

    console.log('从场景获取问卷 - link:', link, 'id:', id, 'tenantId:', schoolTenantId)
    // tenantId 需要以数组格式传递
    return `${surveyBaseUrl}${link}?t=${Date.now()}&userId=${userId}&assessmentNo=${currentTaskNo.value}&questionId=${id}&tenantId=${schoolTenantId}`
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

// 更新浏览器 URL（不刷新页面）
function updateBrowserUrl() {
  // #ifdef H5
  const params = new URLSearchParams()
  if (questionnaireId.value)
    params.set('questionnaireId', questionnaireId.value)
  if (sceneId.value)
    params.set('sceneId', sceneId.value)
  if (assessmentTaskNo.value)
    params.set('assessmentTaskNo', assessmentTaskNo.value)
  if (questionnaireLink.value)
    params.set('questionnaireLink', questionnaireLink.value)

  // uni-app 使用 hash 路由，需要从 hash 中提取路径
  const hash = window.location.hash
  const hashPath = hash.split('?')[0] // 获取 # 后面的路径部分（不包含参数）

  // 构造新的完整 URL（包含 hash）
  const newHash = `${hashPath}?${params.toString()}`
  const newUrl = `${window.location.pathname}${window.location.search}${newHash}`

  // 使用 replaceState 更新 URL，不会触发页面重新加载
  window.history.replaceState(null, '', newUrl)
  console.log('URL 已更新:', window.location.href)
  // #endif
}

// 页面刷新/离开前拦截
function handleBeforeUnload(e: BeforeUnloadEvent) {
  // #ifdef H5
  // 如果问卷未完成，拦截离开
  if (!isIframeCompleted.value) {
    e.preventDefault()
    return '测评尚未完成，确定要离开吗？'
  }
  // #endif
}

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
      const questionnaires = selectedSlot.value?.questionnaires || []
      const hasRemainingInCurrentSlot = questionnaires.some((q: any) => !q.completed)

      console.log('有场景模式 - 当前 sceneId:', sceneId.value, 'selectedSlot.id:', selectedSlot.value?.id)
      console.log('当前插槽问卷列表:', questionnaires.map((q: any) => ({ id: q.id, completed: q.completed })))
      console.log('当前插槽是否有剩余问卷:', hasRemainingInCurrentSlot)

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
          // 更新浏览器 URL
          updateBrowserUrl()
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

        // 更新问卷链接
        iframeSrc.value = generateIframeSrc()

        // 显示新场景的指引动画
        showIntro.value = true
        showTips.value = false

        // 更新浏览器 URL
        updateBrowserUrl()
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
        // 更新浏览器 URL
        updateBrowserUrl()
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
    // 注意：有场景模式下，问卷ID字段是 id，不是 questionnaireId
    const qid = Number(questionnaireId.value)
    if (qid) {
      const target = selectedSlot.value.questionnaires.find(
        (q: any) => q.id === qid,
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
    // 注意：无场景模式下，问卷ID字段是 questionnaireId
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
  // #ifdef H5
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
      break
  }
  // #endif
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

  // #ifdef H5
  // 监听 iframe 的 postMessage 消息
  window.addEventListener('message', handleMessage)

  // 监听页面刷新/离开事件
  window.addEventListener('beforeunload', handleBeforeUnload)
  // #endif
})

onUnload(() => {
  // #ifdef H5
  // 移除消息监听器
  window.removeEventListener('message', handleMessage)
  // 移除页面刷新/离开监听器
  window.removeEventListener('beforeunload', handleBeforeUnload)
  // #endif
  // 清理已处理的消息ID集合
  processedMessageIds.clear()
})
</script>

<template>
  <view class="questionnaire-container h5-pc-fullscreen">
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
    <view v-else class="questionnaire-content h5-pc-fullscreen-content h-screen flex flex-col">
      <!-- 返回按钮 - 左上角 -->
      <view class="back-button" @click="handleBack">
        <view class="back-button-icon">
          <wd-icon name="arrow-left" size="16" color="var(--primary-color)" />
        </view>
        <text class="back-button-text">返回</text>
      </view>

      <!-- 问卷链接为空时的提示 -->
      <view v-if="!iframeSrc" class="flex flex-1 items-center justify-center">
        <view class="text-center">
          <text class="desc-text-heavy">问卷链接加载失败</text>
        </view>
      </view>

      <!-- web-view问卷内容 -->
      <iframe v-else :src="iframeSrc" class="webview-content flex-1" />

      <!-- 继续/提交按钮 -->
      <view
        v-if="isIframeCompleted"
        class="continue-button"
        :class="{ loading: isContinueLoading }"
        @tap.stop="handleContinue"
        @click.stop="handleContinue"
      >
        <template v-if="isContinueLoading">
          <wd-loading size="16px" color="#fff" />
          <text class="loading-text">处理中...</text>
        </template>
        <template v-else>
          <text>{{ continueButtonText }}</text>
          <text class="ml-2">→</text>
        </template>
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
@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
  }

  50% {
    opacity: 0.6;
  }
}

.questionnaire-container {
  width: 100%;
  height: 100vh;
  background-color: #fff;
}

.questionnaire-content {
  position: relative; // 为按钮提供定位上下文
}

// web-view 内容区域（为返回按钮预留空间）
.webview-content {
  padding-top: 70px; // 为返回按钮预留空间
}

// 返回按钮
.back-button {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1000;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 14px 8px 10px;
  cursor: pointer;
  background: linear-gradient(135deg, rgb(255 255 255 / 80%) 0%, rgb(255 255 255 / 70%) 100%);
  backdrop-filter: blur(12px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  // PC 端：使用 absolute 定位，相对于 questionnaire-content
  @media (min-width: 481px) {
    position: absolute;
  }

  &:active {
    background: linear-gradient(135deg, rgb(255 255 255 / 90%) 0%, rgb(255 255 255 / 80%) 100%);
    box-shadow:
      0 1px 4px rgb(0 0 0 / 6%),
      0 0 0 1px rgb(255 255 255 / 50%) inset;
    transform: scale(0.96);
  }

  .back-button-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, rgb(16 185 129 / 10%) 0%, rgb(16 185 129 / 5%) 100%);
    border-radius: 50%;
    transition: all 0.25s ease;
  }

  .back-button-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-color);
    letter-spacing: 0.3px;
    transition: all 0.25s ease;
  }

  &:active .back-button-icon {
    background: linear-gradient(135deg, rgb(16 185 129 / 15%) 0%, rgb(16 185 129 / 8%) 100%);
  }
}

// 继续按钮
.continue-button {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 9999; // 提高 z-index 确保不被遮挡
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  pointer-events: auto; // 确保可以接收点击事件
  cursor: pointer;
  background: linear-gradient(135deg, var(--primary-color) 0%, #34d399 100%);
  border-radius: 9999px;
  box-shadow: 0 6px 20px rgb(16 185 129 / 40%);
  transition: all 0.3s ease;

  // PC 端：使用 absolute 定位，相对于 questionnaire-content
  @media (min-width: 481px) {
    position: absolute;
  }

  // 使用伪元素扩大点击区域
  &::before {
    position: absolute;
    inset: -10px; // 扩大 10px 的点击区域
    pointer-events: auto;
    content: '';
  }

  &:active:not(.loading) {
    background: linear-gradient(135deg, #059669 0%, var(--primary-color) 100%);
    box-shadow: 0 3px 12px rgb(16 185 129 / 45%);
    transform: scale(0.97);
  }

  &.loading {
    pointer-events: none;
    opacity: 0.85;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .loading-text {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.5px;
  }
}
</style>
