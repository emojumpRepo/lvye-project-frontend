<script setup lang="ts">
import type { AssessmentScenarioSlotVO } from '@vben/types'
import { getBucketFileUrl } from '@vben/utils'
import { computed, ref } from 'vue'

defineOptions({
  name: 'GuideAnimation',
})

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  stage: 'intro',
  sceneData: null,
  koalaUrl: '',
  showKoalaInIntro: true,
})

const emit = defineEmits<Emits>()

interface Props {
  /** 是否显示引导 */
  visible?: boolean
  /** 当前阶段：intro-弹窗提示, tips-对话气泡 */
  stage?: 'intro' | 'tips'
  /** 场景数据 */
  sceneData?: AssessmentScenarioSlotVO | null
  /** 考拉图片URL */
  koalaUrl?: string
  /** 第一阶段是否显示考拉医生图片 */
  showKoalaInIntro?: boolean
}

interface Emits {
  /** 关闭引导 */
  (e: 'close'): void
  /** 进入下一步（第二阶段） */
  (e: 'next'): void
  /** 开始作答 */
  (e: 'start'): void
}

// 当前对话索引（内部管理）
const currentDialogIndex = ref(0)

// 是否显示第一阶段
const showIntroStage = computed(() => props.visible && props.stage === 'intro')

// 是否显示第二阶段
const showTipsStage = computed(() => props.visible && props.stage === 'tips')

const bgUrl = computed(() => {
  return props.sceneData?.metadata?.introConfig?.backgroundImageUrl_h5 || ''
})

// 对话列表
const descriptionList = computed(() => {
  const desc = props.sceneData?.metadata?.introConfig?.characterConfig?.description
  if (Array.isArray(desc)) {
    return desc
  }
  return desc ? [desc] : []
})

// 当前显示的对话内容
const currentDescription = computed(() => {
  return descriptionList.value[currentDialogIndex.value] || ''
})

// 是否还有下一条对话
const hasNextDialog = computed(() => {
  return currentDialogIndex.value < descriptionList.value.length - 1
})

// 是否有上一条对话
const hasPrevDialog = computed(() => currentDialogIndex.value > 0)

// 处理关闭
function handleClose() {
  emit('close')
}

// 处理下一步（进入第二阶段）
function handleNext() {
  currentDialogIndex.value = 0 // 重置对话索引
  emit('next')
}

// 处理继续对话
function handleContinue() {
  if (hasNextDialog.value) {
    currentDialogIndex.value++
  }
}

// 处理上一条对话
function handlePrev() {
  if (hasPrevDialog.value) {
    currentDialogIndex.value--
  }
}

// 处理开始作答
function handleStart() {
  emit('start')
}
</script>

<template>
  <view
    class="guide-animation-page" :style="{
      backgroundImage: `url(${bgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }"
  >
    <!-- 第一阶段：弹窗提示 -->
    <view v-if="showIntroStage" class="intro-overlay">
      <view class="intro-dialog" :class="{ 'no-koala': !showKoalaInIntro }">
        <!-- 关闭按钮 -->
        <view class="intro-close" @click="handleClose">
          <wd-icon name="close" size="12" />
        </view>

        <!-- 考拉医生背景 -->
        <view v-if="showKoalaInIntro" class="koala-figure">
          <image
            :src="getBucketFileUrl('primary/kaola_doctor.png')"
            mode="aspectFit"
            class="h-full w-full"
          />
        </view>

        <!-- 内容卡片 -->
        <view class="intro-card">
          <view class="intro-badge">
            <text>指引</text>
          </view>
          <text class="intro-title">欢迎来到本模块</text>
          <view class="intro-points">
            <text class="point-item">• {{ sceneData?.metadata?.introConfig?.description }}</text>
            <text class="point-item">
              • 预计用时约 {{ sceneData?.questionnaires?.[0]?.estimatedDuration }} 分钟
            </text>
            <text class="point-item">• 请在安静环境下作答，确保网络稳定</text>
          </view>
          <text class="intro-text subtle">
            接下来由考拉老师为你介绍答题注意事项。
          </text>
          <view class="intro-actions">
            <view class="intro-btn" @click="handleNext">
              <text class="intro-btn__text">下一步</text>
              <text class="intro-btn__icon">→</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 第二阶段：考拉教练对话气泡 -->
    <view v-else-if="showTipsStage" class="intro-tips">
      <view class="coach-wrap">
        <image :src="koalaUrl" mode="aspectFit" class="coach-figure" />
        <view class="coach-bubble">
          <view class="bubble-header">
            <text>{{ sceneData?.metadata?.introConfig?.characterConfig?.name }}</text>
          </view>
          <view class="bubble-content">
            <text>{{ currentDescription }}</text>
          </view>
          <view class="bubble-actions">
            <!-- 上一句按钮 -->
            <view
              v-if="hasPrevDialog"
              class="action-btn action-btn--secondary"
              @click="handlePrev"
            >
              <text class="action-btn__icon">←</text>
              <text class="action-btn__text">返回</text>
            </view>

            <view class="flex-1" />

            <!-- 如果还有下一条对话，显示继续按钮 -->
            <view
              v-if="hasNextDialog"
              class="action-btn action-btn--primary"
              @click="handleContinue"
            >
              <text class="action-btn__text">继续</text>
              <text class="action-btn__icon">→</text>
            </view>
            <!-- 对话展示完毕，显示开始作答按钮 -->
            <view
              v-else
              class="action-btn action-btn--primary action-btn--highlight"
              @click="handleStart"
            >
              <text class="action-btn__text">开始作答</text>
              <text class="action-btn__icon">✓</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
// ============================================
// 主题颜色变量
// ============================================
$primary-green: #10b981;
$primary-green-light: #34d399;
$primary-green-lighter: #6ee7b7;
$primary-green-dark: #059669;
$green-bg: #ecfdf5;
$green-bg-light: #d1fae5;
$green-border: #a7f3d0;
$green-text: #065f46;

$gray-50: #f9fafb;
$gray-100: #fafafa;
$gray-200: #e5e7eb;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-700: #374151;
$gray-900: #1f2937;

// ============================================
// 动画定义
// ============================================
@keyframes fade-in-down-centered {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up-fade-in {
  from {
    opacity: 0;
    transform: translateY(40px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zoom-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

// ============================================
// 通用样式 Mixins
// ============================================

// 卡片容器样式
@mixin card-container {
  background: linear-gradient(135deg, #fff 0%, $gray-100 100%);
  border: 2px solid rgb(167 243 208 / 40%);
  border-radius: 16px;
  box-shadow:
    0 10px 30px rgb(0 0 0 / 10%),
    0 4px 12px rgb(0 0 0 / 6%);
}

// 绿色标签徽章样式
@mixin green-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-weight: 700;
  color: $green-text;
  background: linear-gradient(135deg, $green-bg 0%, $green-bg-light 100%);
  border: 1px solid $green-border;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgb(6 95 70 / 10%);
}

// 按钮基础样式
@mixin button-base {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  border-radius: 24px;
  transition: all 0.2s ease;
}

// 主要按钮（绿色渐变）
@mixin button-primary {
  color: #fff;
  background: linear-gradient(135deg, $primary-green 0%, $primary-green-light 100%);
  border: 1px solid rgb(16 185 129 / 30%);
  box-shadow: 0 2px 8px rgb(16 185 129 / 20%);

  &:active {
    background: linear-gradient(135deg, $primary-green-dark 0%, $primary-green 100%);
    box-shadow: 0 1px 4px rgb(16 185 129 / 25%);
    transform: scale(0.97);
  }
}

// 次要按钮（白色边框）
@mixin button-secondary {
  color: $gray-500;
  background: #fff;
  border: 1px solid $gray-200;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);

  &:active {
    background: $gray-50;
    transform: scale(0.97);
  }
}

// 高亮按钮（亮绿色）
@mixin button-highlight {
  background: linear-gradient(135deg, $primary-green-light 0%, $primary-green-lighter 100%);
  border: 1px solid rgb(52 211 153 / 40%);
  box-shadow:
    0 2px 12px rgb(16 185 129 / 25%),
    0 0 0 3px rgb(16 185 129 / 10%);

  &:active {
    background: linear-gradient(135deg, $primary-green 0%, $primary-green-light 100%);
    box-shadow:
      0 1px 6px rgb(16 185 129 / 30%),
      0 0 0 3px rgb(16 185 129 / 8%);
    transform: scale(0.97);
  }
}

// ============================================
// 页面主容器
// ============================================
.guide-animation-page {
  width: 100%;
  height: 100%;

  // ============================================
  // 第一阶段：引导弹窗
  // ============================================
  .intro-overlay {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .intro-dialog {
    position: relative;
    width: 90%;
    max-width: 520px;
    padding-top: 60px;

    &.no-koala {
      padding-top: 0;
    }
  }

  .koala-figure {
    position: absolute;
    top: -40px;
    left: 50%;
    width: 160px;
    height: 180px;
    pointer-events: none;
    animation: fade-in-down-centered 0.6s ease-out both;
  }

  .intro-card {
    position: relative;
    padding: 24px 26px 20px;
    animation: zoom-in 0.5s ease-out 0.2s both;

    @include card-container;
  }

  .intro-close {
    position: absolute;
    top: 45px;
    right: -12px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: $gray-500;
    background: rgb(255 255 255 / 90%);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
    animation: fade-in 0.3s ease-out 0.5s both;

    .no-koala & {
      top: -14px;
    }
  }

  .intro-badge {
    margin-bottom: 10px;
    font-size: 13px;

    @include green-badge;
  }

  .intro-title {
    display: block;
    margin-bottom: 10px;
    font-size: 19px;
    font-weight: 700;
    color: $gray-900;
  }

  .intro-points {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 12px 0;
    color: $gray-700;

    .point-item {
      font-size: 15px;
      line-height: 1.7;
    }
  }

  .intro-text {
    display: block;
    margin: 8px 0;
    font-size: 15px;
    line-height: 1.7;
    color: $gray-700;

    &.subtle {
      color: $gray-500;
    }
  }

  .intro-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;

    .intro-btn {
      justify-content: center;
      width: 100%;
      padding: 12px 24px;

      @include button-base;
      @include button-primary;

      &__text {
        line-height: 1;
      }

      &__icon {
        font-size: 16px;
        line-height: 1;
        transition: transform 0.2s ease;
      }

      &:active &__icon {
        transform: translateX(2px);
      }
    }
  }

  // ============================================
  // 第二阶段：考拉对话气泡
  // ============================================
  .intro-tips {
    position: fixed;
    inset: 0;
    z-index: 1200;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;

    .coach-wrap {
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      width: 100%;
      height: 100%;
      padding: 0 30rpx 240rpx;

      .coach-figure {
        height: 420px;
        object-fit: contain;
        animation: fade-in-down 0.6s ease-out both;
      }

      .coach-bubble {
        position: absolute;
        bottom: 0;
        z-index: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: 90%;
        max-height: 280px;
        margin-bottom: 50px;
        overflow: hidden;
        border-color: rgb(167 243 208 / 40%);
        animation: slide-up-fade-in 0.5s ease-out 0.3s both;

        @include card-container;

        .bubble-header {
          flex-shrink: 0;
          width: fit-content;
          margin: 15px 15px 10px;
          font-size: 14px;

          @include green-badge;
        }

        .bubble-content {
          position: relative;
          flex: 1;
          min-height: 0;
          padding: 0 15px 16px;
          overflow-y: auto;
          font-size: 15px;
          line-height: 1.8;
          color: $gray-700;
          overflow-wrap: break-word;

          /* 优化滚动条样式 */
          &::-webkit-scrollbar {
            width: 2px;
          }

          &::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 2px;
          }

          &::-webkit-scrollbar-track {
            background: transparent;
          }
        }

        .bubble-actions {
          position: relative;
          z-index: 3;
          display: flex;
          flex-shrink: 0;
          gap: 12px;
          align-items: center;
          justify-content: flex-end;
          padding: 0 15px 16px;
          background-color: #fff;

          /* 固定在底部的渐变遮罩，不随内容滚动 */
          &::before {
            position: absolute;
            right: 0;
            bottom: 100%;
            left: 0;
            z-index: -1;
            height: 20px;
            pointer-events: none;
            content: '';
            background: linear-gradient(
              180deg,
              rgb(255 255 255 / 0%) 0%,
              rgb(255 255 255 / 50%) 20%,
              rgb(255 255 255 / 90%) 50%,
              rgb(255 255 255 / 100%) 100%
            );
          }

          .action-btn {
            @include button-base;

            &__icon {
              font-size: 16px;
              line-height: 1;
              transition: transform 0.2s ease;
            }

            &__text {
              line-height: 1;
              white-space: nowrap;
            }

            /* 次要按钮（返回） */
            &--secondary {
              @include button-secondary;

              .action-btn__icon {
                color: $gray-400;
              }

              &:active .action-btn__icon {
                transform: translateX(-2px);
              }
            }

            /* 主要按钮（继续） */
            &--primary {
              @include button-primary;

              &:active .action-btn__icon {
                transform: translateX(2px);
              }
            }

            /* 高亮按钮（开始作答） */
            &--highlight {
              @include button-highlight;

              &:active .action-btn__icon {
                transform: scale(1.15);
              }
            }
          }
        }
      }
    }
  }
}
</style>
