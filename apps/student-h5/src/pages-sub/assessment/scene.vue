<script setup lang="ts">
import type { AssessmentScenarioSlot } from '@vben/types'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { AssessmentTaskParticipantStatus, ResultGenerationStatus } from '@vben/types'
import { getBucketFileUrl } from '@vben/utils'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getAssessmentParticipantStatus } from '@/api/assessment'
import LyLoading from '@/components/LyLoading/index.vue'
import { useEvaluationStore } from '@/store/evaluation'
import { useGlobalPollerStore } from '@/store/globalPoller'

defineOptions({
  name: 'AssessmentScene',
})

definePage({
  // @ts-expect-error - 使用empty layout避免默认背景图覆盖
  layout: 'empty',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '测评场景',
    disableScroll: true, // 禁止页面滚动，保持沉浸式体验
  },
})

const evaluationStore = useEvaluationStore()
const globalPoller = useGlobalPollerStore()
const taskNo = ref('')

const {
  getSlotStatus,
  isSlotClickable,
  getNextAvailableSlot,
  loadTaskDetail,
  selectSlot,
  startEvaluation,
} = evaluationStore

const {
  loading,
  currentTaskNo,
  scenarioData,
  hasGeneratingQuestionnaire,
  isAllQuestionnairesCompleted,
} = storeToRefs(evaluationStore)

const hasReport = ref(false)

// 仅在所有问卷有问卷结果记录的前提下,才判定结果生成中的状态
const hasGeneratingAfterCompleted = computed(
  () => isAllQuestionnairesCompleted.value && hasGeneratingQuestionnaire.value,
)

// 方法
function handleBack() {
  uni.reLaunch({
    url: '/pages-sub/assessment/list',
  })
}

// 开始问卷测评
async function handleStartEvaluation() {
  try {
    const result = await startEvaluation(currentTaskNo.value || '')
    // 跳转到问卷页
    uni.redirectTo({
      url: `/pages-sub/assessment/questionnaire?questionnaireId=${result.questionnaireId}&sceneId=${result.sceneId}&assessmentTaskNo=${currentTaskNo.value}${result.questionnaireLink ? `&questionnaireLink=${encodeURIComponent(result.questionnaireLink)}` : ''}`,
    })
  }
  catch (error) {
    console.error('handleStartEvaluation error:', error)
    uni.showToast({
      title: error instanceof Error ? error.message : '开始测评失败',
      icon: 'none',
      duration: 2000,
    })
  }
}

function handleSlotClick(slot: AssessmentScenarioSlot) {
  // 检查场景是否可点击
  if (!isSlotClickable(slot.id)) {
    const status = getSlotStatus(slot.id)
    if (status === 'locked') {
      const previousSlot = scenarioData.value?.slots?.find(
        s => s.slotOrder === slot.slotOrder - 1,
      )
      uni.showToast({
        title: `${slot.slotName}未解锁，请先前往${previousSlot?.slotName || '前一个场景'}吧~`,
        icon: 'none',
        duration: 2000,
      })
      return
    }
    else if (status === 'completed') {
      // 已完成的场景，根据是否有模块结果配置决定提示内容
      if (slot.hasModuleResultConfig) {
        switch (slot.moduleResultGenerationStatus) {
          case ResultGenerationStatus.GENERATED:
            // 结果已生成，跳转到模块结果页
            uni.navigateTo({
              url: `/pages-sub/assessment/module?taskNo=${currentTaskNo.value}&slotId=${slot.id}`,
            })
            break
          case ResultGenerationStatus.GENERATING:
            // 结果生成中
            uni.showToast({
              title: '结果生成中，请稍后查看',
              icon: 'none',
              duration: 2000,
            })
            break
          case ResultGenerationStatus.WAITING:
            // 结果生成中
            uni.showToast({
              title: '该场景的问卷并没有完成哦，请继续完成',
              icon: 'none',
              duration: 2000,
            })
            break
        }
      }
      else {
        // 没有模块结果配置，显示默认提示
        const nextSlot = scenarioData.value?.slots?.find(
          s => s.slotOrder === slot.slotOrder + 1,
        )
        const tipText = nextSlot
          ? `${slot.slotName}已完成，前往${nextSlot.slotName}吧~`
          : '本次测试已结束，请前往汇总报告查看结果'
        uni.showToast({
          title: tipText,
          icon: 'success',
          duration: 2000,
        })
      }
      return
    }
  }

  // 插槽可点击，检查问卷完成状态
  const questionnaires = (slot as any).questionnaires || []
  const allQuestionnairesCompleted = questionnaires.length > 0 && questionnaires.every((q: any) => q.completed)

  if (allQuestionnairesCompleted) {
    // 所有问卷都已完成
    if (slot.hasModuleResultConfig) {
      switch (slot.moduleResultGenerationStatus) {
        case ResultGenerationStatus.GENERATED:
          // 结果已生成，跳转到模块结果页
          uni.navigateTo({
            url: `/pages-sub/assessment/module-result?taskNo=${currentTaskNo.value}&slotId=${slot.id}`,
          })
          break
        case ResultGenerationStatus.GENERATING:
          // 结果生成中
          uni.showToast({
            title: '结果生成中，请稍后查看',
            icon: 'none',
            duration: 2000,
          })
          break
        default:
          // 其他状态（WAITING 或 ERROR）
          uni.showToast({
            title: '问卷已完成，结果生成中',
            icon: 'none',
            duration: 2000,
          })
          break
      }
    }
    else {
      // 没有模块结果配置
      uni.showToast({
        title: `${slot.slotName}已完成`,
        icon: 'success',
        duration: 2000,
      })
    }
  }
  else {
    // 有未完成的问卷，开始测评
    selectSlot(slot.id)
    handleStartEvaluation()
  }
}

async function getParticipantStatus() {
  if (!currentTaskNo.value) {
    return
  }
  try {
    const res = await getAssessmentParticipantStatus(currentTaskNo.value)
    if (res === AssessmentTaskParticipantStatus.COMPLETED) {
      hasReport.value = true
    }
  }
  catch (error) {
    console.error('getParticipantStatus error:', error)
  }
}

function showSummaryReport() {
  // 禁用状态时阻止跳转
  if (!isAllQuestionnairesCompleted.value) {
    uni.showToast({
      title: '完成所有场景后才可以查看汇总报告',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  if (hasGeneratingAfterCompleted.value) {
    uni.showToast({
      title: '结果生成中，请稍后再试',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  uni.navigateTo({
    url: `/pages-sub/assessment/result?taskNo=${currentTaskNo.value}`,
  })
}

function getSlotClass(slot: any) {
  const status = getSlotStatus(slot.id || 0)
  return {
    disabled: status === 'locked',
    completed: status === 'completed',
  } as const
}

function isSlotLocked(slot: any) {
  return getSlotStatus(slot.id || 0) === 'locked'
}

function isSlotCompleted(slot: any) {
  return getSlotStatus(slot.id || 0) === 'completed'
}

watch(
  () => hasGeneratingQuestionnaire.value,
  (val) => {
    if (val) {
      globalPoller.setTasks([
        () => loadTaskDetail(taskNo.value, true, true),
        () => getParticipantStatus(),
      ])
      if (!globalPoller.isRunning) {
        globalPoller.start(undefined, 5000)
      }
    }
    else if (globalPoller.isRunning) {
      globalPoller.stop()
    }
  },
  { immediate: false },
)

onLoad(async (options) => {
  taskNo.value = (options?.taskNo as string) || ''
  if (taskNo.value) {
    await loadTaskDetail(taskNo.value, true)
    await getParticipantStatus()
  }
  console.log('scenarioData', scenarioData.value)
})

onUnload(() => {
  globalPoller.stop()
})
</script>

<template>
  <view class="evaluation-map h5-pc-fullscreen">
    <view v-if="loading" class="h-screen flex items-center justify-center">
      <LyLoading />
    </view>
    <view v-else>
      <!-- 场景主体 -->
      <view class="map-content h5-pc-fullscreen-content">
        <!-- 场景背景 -->
        <view
          class="map-background"
          :style="{
            backgroundImage: scenarioData?.metadata?.sceneImageUrl_h5
              ? `url('${encodeURI(scenarioData.metadata.sceneImageUrl_h5)}')`
              : '',
          }"
        />

        <!-- 返回按钮 - 左上角 -->
        <view class="back-button" @click="handleBack">
          <wd-icon name="arrow-left" size="20" />
        </view>

        <!-- 汇总报告 - 右下角 -->
        <view
          class="summary-report"
          :class="{
            disabled: !isAllQuestionnairesCompleted,
            generating: hasGeneratingAfterCompleted,
          }"
          @click="showSummaryReport"
        >
          <image
            :src="getBucketFileUrl('report.svg')"
            mode="widthFix"
            class="report-icon"
            style="width: 55px;"
          />
          <view
            class="report-text"
            :class="{
              disabled:
                !isAllQuestionnairesCompleted || hasGeneratingAfterCompleted,
            }"
          >
            <text v-if="!hasGeneratingQuestionnaire">汇总报告</text>
            <view v-else class="flex items-center gap-2">
              <text>结果生成中</text>
            </view>
          </view>
        </view>

        <!-- 可点击插槽 -->
        <view class="buildings">
          <view
            v-for="slot in evaluationStore.scenarioData?.slots"
            :key="slot.id"
            class="building-button"
            :class="getSlotClass(slot)"
            :style="slot.metadata?.position_h5 as any"
            @click="handleSlotClick(slot)"
          >
            <view class="building-glow" />

            <view class="relative">
              <!-- 引导动画 - 显示在下一个可点击的建筑上 -->
              <view
                v-if="
                  isSlotClickable(slot.id || 0)
                    && slot.id === getNextAvailableSlot()?.id
                "
                class="guide-wave"
              >
                <image
                  :src="getBucketFileUrl('wave.gif')"
                  mode="widthFix"
                  class="wave-gif"
                  style="width: 80px;"
                />
                <view
                  class="absolute right-[-30px] top-[-40px] rounded bg-[var(--primary-color)] px-2 py-1 text-xs text-white"
                >
                  <text>点击这里哦</text>
                </view>
              </view>
              <view class="building-icon">
                <text class="building-emoji">
                  {{
                    slot.metadata?.icon || '🏢'
                  }}
                </text>
                <view v-if="isSlotLocked(slot)" class="lock-icon">
                  <text class="text-xs text-white">🔒</text>
                </view>
                <view v-if="isSlotCompleted(slot)" class="completed-icon">
                  <text class="text-xs text-white">✓</text>
                </view>
              </view>
            </view>

            <view class="building-label">
              <text>{{ slot.slotName }}</text>
              <text v-if="isSlotLocked(slot)" class="locked-text">
                (未解锁)
              </text>
              <text v-if="isSlotCompleted(slot)" class="completed-text">
                (已完成)
              </text>
            </view>
            <view class="building-pulse" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

@keyframes glow {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

@keyframes pulse-ring {
  0% {
    opacity: 1;
    transform: scale(0.8);
  }

  100% {
    opacity: 0;
    transform: scale(2);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-3px);
  }

  75% {
    transform: translateX(3px);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 200% 50%;
  }
}

@keyframes progress-indeterminate {
  0% {
    left: 10%;
    width: 10%;
  }

  50% {
    left: 40%;
    width: 30%;
  }

  100% {
    left: 70%;
    width: 10%;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .building-icon {
    width: 40px;
    height: 40px;
  }

  .building-emoji {
    font-size: 20px;
  }

  .building-label {
    padding: 2px 6px;
    font-size: 10px;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }
}

.evaluation-map {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;

  .map-content {
    position: relative;
    width: 100vw;
    height: 100vh;

    .map-background {
      position: absolute;
      inset: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
    }

    // 返回按钮 - 左上角
    .back-button {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 1000;
      display: flex;
      align-items: center;
      padding: 20rpx;
      color: var(--primary-color);
      background: rgb(255 255 255 / 95%);
      border-radius: 9999px;
      box-shadow: 0 4px 15px rgb(0 0 0 / 10%);
    }

    // 学校Logo - 右上角
    .school-logo {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 1000;

      .logo-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px 20px;
        text-align: center;
        background: rgb(255 255 255 / 95%);
        border: 2px solid rgb(76 175 80 / 20%);
        border-radius: 15px;
        box-shadow: 0 4px 15px rgb(0 0 0 / 10%);

        .logo-title {
          font-size: 20px;
          font-weight: bold;
          color: var(--primary-color);
        }

        .logo-subtitle {
          margin-top: 5px;
          font-size: 12px;
          font-weight: 500;
          color: #666;
        }
      }
    }

    // 汇总报告 - 右下角
    .summary-report {
      position: absolute;
      right: 30px;
      bottom: 30px;
      z-index: 1000;
      border-radius: 9999px;
      transition: all 0.3s ease;

      &.disabled {
        filter: grayscale(100%);
      }

      .report-icon {
        position: absolute;
        left: 52%;
        z-index: -1;
        transform: translate(-50%, -90%);
      }

      .report-text {
        position: relative;
        padding: 5px 10px;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        background: var(--primary-color);
        border: 1px solid rgb(255 255 255 / 80%);
        border-radius: 9999px;
        box-shadow: 0 4px 10px rgb(76 175 80 / 35%);
      }
    }

    .buildings {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;

      .building-button {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: auto;
        transform: scale(1);
        transition: all 0.3s ease;

        &.disabled {
          .building-icon {
            background: linear-gradient(135deg, rgb(245 245 245 / 95%) 0%, rgb(235 235 235 / 85%) 100%);
            box-shadow:
              0 4px 15px rgb(0 0 0 / 8%),
              0 0 0 2px rgb(200 200 200 / 30%),
              inset 0 1px 0 rgb(255 255 255 / 80%);

            .building-emoji {
              opacity: 0.7;
              filter: grayscale(60%);
            }

            .lock-icon {
              position: absolute;
              top: -5px;
              right: -5px;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              font-size: 16px;
              background-color: #ffc107;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
              animation: shake 2s ease-in-out infinite;
            }
          }

          .building-label {
            color: #888;
            background: linear-gradient(135deg, rgb(245 245 245 / 95%) 0%, rgb(235 235 235 / 85%) 100%);

            .locked-text {
              font-size: 10px;
              font-weight: normal;
              color: #ff9800;
            }
          }

          .building-glow {
            display: none;
          }

          .building-pulse {
            display: none;
          }
        }

        &.completed {
          .building-icon {
            background: linear-gradient(135deg, rgb(255 255 255 / 95%) 0%, rgb(255 255 255 / 85%) 100%);
            box-shadow:
              0 4px 15px rgb(0 0 0 / 10%),
              0 0 0 2px rgb(76 175 80 / 30%),
              inset 0 1px 0 rgb(255 255 255 / 80%);

            .building-emoji {
              opacity: 0.8;
              filter: grayscale(30%);
            }

            .completed-icon {
              position: absolute;
              top: -3px;
              right: -3px;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              font-size: 16px;
              background: var(--primary-color);
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 1px 3px rgb(0 0 0 / 20%);
            }
          }

          .building-label {
            color: #666;
            background: linear-gradient(135deg, rgb(255 255 255 / 95%) 0%, rgb(255 255 255 / 85%) 100%);

            .completed-text {
              font-size: 10px;
              font-weight: normal;
              color: var(--primary-color);
            }
          }

          .building-glow {
            display: none;
          }

          .building-pulse {
            display: none;
          }
        }

        .building-glow {
          position: absolute;
          z-index: -1;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgb(76 175 80 / 30%) 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: glow 3s ease-in-out infinite;
        }

        .building-icon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 65px;
          height: 65px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, rgb(255 255 255 / 95%) 0%, rgb(255 255 255 / 85%) 100%);
          border-radius: 50%;
          box-shadow:
            0 4px 15px rgb(0 0 0 / 20%),
            0 0 0 2px rgb(76 175 80 / 10%),
            inset 0 1px 0 rgb(255 255 255 / 80%);
          transition: all 0.3s ease;
          animation: float 3s ease-in-out infinite 0s;

          .building-emoji {
            font-size: 28px;
            filter: drop-shadow(0 2px 4px rgb(0 0 0 / 10%));
          }
        }

        .building-label {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: bold;
          color: #333;
          text-align: center;
          white-space: nowrap;
          background: linear-gradient(135deg, rgb(255 255 255 / 95%) 0%, rgb(255 255 255 / 85%) 100%);
          border-radius: 15px;
          box-shadow:
            0 2px 8px rgb(0 0 0 / 10%),
            0 0 0 1px rgb(76 175 80 / 10%);
          transition: all 0.3s ease;
        }

        .building-pulse {
          position: absolute;
          z-index: -2;
          width: 60px;
          height: 60px;
          border: 2px solid rgb(76 175 80 / 60%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-ring 2s ease-out infinite;
        }
      }
    }

    .guide-wave {
      position: absolute;
      top: -40px;
      z-index: 200;
      width: 80px;
      height: 50px;
      pointer-events: none;
      animation: float 3s ease-in-out infinite 0s;

      .wave-gif {
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
