<script lang="ts" setup>
import type { EvaluationScene } from '../data';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Check, X } from '@vben/icons';

import LyButton from '#/components/LyButton/index.vue';

import { EVALUATION_SCENES } from '../data';

const imgBaseUrl = '../../../../static/images/evaluation/questionnaire/';

const route = useRoute();
const router = useRouter();

const hasIntro = ref(true);
const showTips = ref(false);
const sceneData = ref<EvaluationScene | null>(null);

onMounted(() => {
  const scene = route.query.scene as string;
  sceneData.value = EVALUATION_SCENES.find((s) => s.id === scene) || null;
});

const bgUrl = computed(() =>
  hasIntro.value
    ? new URL(`${imgBaseUrl}${sceneData.value?.type}.png`, import.meta.url).href
    : new URL(`${imgBaseUrl}answer_page_bg.png`, import.meta.url).href,
);

// 对话任务图片（对话气泡阶段）
const koalaUrl = computed(
  () =>
    new URL(
      `${imgBaseUrl}${sceneData.value?.type}_teacher.png`,
      import.meta.url,
    ).href,
);

function handleIntroNext() {
  showTips.value = true;
}

function handleBack() {
  router.back();
}

function handleContinue() {
  // 如果当前是最后一个场景，则不进行跳转，直接提交回答
  if (sceneData.value?.order === EVALUATION_SCENES.length) {
    console.log('last scene');
    return;
  }
  const nextScene = EVALUATION_SCENES.find(
    (s) => s.order === (sceneData.value?.order ?? 0) + 1,
  );
  if (nextScene) {
    router.replace({
      path: '/evaluation/junior/questionnaire',
      query: {
        scene: nextScene.id,
      },
    });

    router.afterEach(() => {
      window.location.reload();
    });
  }
}

function handleIntroClose() {
  router.replace({
    path: '/evaluation/junior/map',
  });
}
</script>

<template>
  <div
    class="evaluation-questionnaire"
    :style="{
      backgroundImage: `url(${bgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }"
  >
    <!-- 引导弹窗 -->
    <Transition name="fade" appear>
      <template v-if="hasIntro">
        <div class="intro-overlay">
          <Transition name="phase-switch" mode="out-in">
            <!-- 第一阶段：弹窗提示 -->
            <div class="intro-dialog" v-if="!showTips">
              <button
                class="intro-close"
                aria-label="关闭"
                @click="handleIntroClose"
              >
                <X class="size-4" />
              </button>
              <!-- 背后的考拉医生 -->
              <div class="koala-figure">
                <img
                  src="../../../../static/images/evaluation/questionnaire/kaola_doctor.png"
                  alt="考拉医生"
                />
              </div>
              <!-- 内容卡片 -->
              <div class="intro-card">
                <div class="intro-badge">指引</div>
                <h3 class="intro-title">欢迎来到本模块</h3>
                <ul class="intro-points">
                  <li>{{ sceneData?.introDesc }}</li>
                  <li>预计用时约 {{ sceneData?.time }} 分钟</li>
                  <li>请在安静环境下作答，确保网络稳定</li>
                </ul>
                <p class="intro-text subtle">
                  接下来由考拉老师为你介绍答题注意事项。
                </p>
                <div class="intro-actions">
                  <button class="btn-primary" @click="handleIntroNext">
                    下一步
                  </button>
                </div>
              </div>
            </div>
            <!-- 第二阶段：考拉教练对话气泡 -->
            <div class="intro-tips" v-else>
              <div class="coach-wrap">
                <img class="coach-figure" :src="koalaUrl" alt="考拉老师" />
                <div class="coach-bubble">
                  <div class="bubble-header">
                    {{ sceneData?.teacherBubble.name }}
                  </div>
                  <div class="bubble-content">
                    {{ sceneData?.teacherBubble.description }}
                  </div>
                  <div class="bubble-actions">
                    <button class="btn-start" @click="hasIntro = false">
                      开始作答 →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </template>
      <template v-else>
        <div class="flex h-full w-full flex-col items-center justify-center">
          <div class="back-button" @click="handleBack">
            <div class="back-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </div>
            <span class="back-text">返回</span>
          </div>
          <iframe
            src="http://119.29.105.88:8080/render/xZlmykKI?t=1755503264810"
            frameborder="0"
            width="55%"
            height="90%"
          ></iframe>
          <template
            v-if="
              sceneData?.order && sceneData.order < EVALUATION_SCENES.length
            "
          >
            <LyButton
              type="success"
              size="middle"
              class="continue-button"
              @click="handleContinue"
            >
              继续答题
              <svg
                class="ml-2"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </LyButton>
          </template>
          <template v-else>
            <LyButton
              type="success"
              size="middle"
              class="continue-button"
              @click="handleContinue"
            >
              提交回答
              <Check class="ml-2 size-5" />
            </LyButton>
          </template>
        </div>
      </template>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@keyframes floaty {
  0%,
  100% {
    transform: translate(-50%, 0);
  }

  50% {
    transform: translate(-50%, -8px);
  }
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 第一阶段卡片的 pop-in 已存在，稍微柔化阴影已在卡片样式中体现 */

/* 第二阶段分离式动效：教练从右侧轻滑入，气泡自左侧上浮出现 */
@keyframes coach-slide-in {
  0% {
    opacity: 0;
    transform: translate(20px, 0);
  }

  100% {
    opacity: 1;
    transform: translate(0, 0);
  }
}

@keyframes bubble-rise-in {
  0% {
    opacity: 0;
    transform: translate(-24px, 8px);
  }

  100% {
    opacity: 1;
    transform: translate(0, 0);
  }
}

/* 响应式优化 */
@media (max-width: 600px) {
  .koala-figure {
    left: 50%;
    width: 120px;
    height: 140px;
  }

  .intro-card {
    padding: 18px 16px 14px;
  }

  .intro-actions {
    justify-content: center;
  }
}

@media (max-width: 900px) {
  .coach-bubble {
    bottom: 16px;
    width: 90%;
  }

  .coach-bubble::after {
    display: none;
  }

  .coach-figure {
    height: 70%;
  }
}

@media (max-width: 900px) {
  .answer-fab {
    right: auto;
    bottom: calc(12px + env(safe-area-inset-bottom));
    left: 50%;
    width: min(320px, 90vw);
    transform: translateX(-50%);
  }

  .fab-btn {
    justify-content: center;
    width: 100%;
  }
}

/* 阶段切换更顺滑的过渡 */
.phase-switch-enter-active,
.phase-switch-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.phase-switch-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.phase-switch-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.intro-tips .coach-figure {
  animation: coach-slide-in 0.32s ease both 0.05s;
}

.intro-tips .coach-bubble {
  animation: bubble-rise-in 0.32s ease both;
}

.evaluation-questionnaire {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/***** Intro Modal *****/
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
  width: min(50%, 560px);
  padding-top: 60px; /* 给考拉头部留空间 */
  animation: pop-in 0.25s ease both;
}

.koala-figure {
  position: absolute;
  top: -40px;
  left: 30%;
  width: 160px;
  height: 180px;
  pointer-events: none;
  transform: translateX(-50%);
}

.koala-figure img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgb(0 0 0 / 15%));
  animation: floaty 3s ease-in-out infinite;
}

.intro-card {
  position: relative;
  padding: 22px 24px 18px;
  background: #fff;
  border: 1px solid #e5e7eb; /* 中性边框 */
  border-radius: 12px;
  box-shadow: 0 6px 18px rgb(0 0 0 / 12%); /* 轻阴影 */
  backdrop-filter: blur(4px);
}

/* 去掉夸张的渐变描边 */
.intro-card::before {
  display: none;
}

.intro-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.intro-badge {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #065f46;
  background: #ecfdf5; /* 柔和绿色底 */
  border: 1px solid #d1fae5; /* 细边框 */
  border-radius: 9999px;
}

.intro-points {
  padding-left: 18px;
  margin: 10px 0 6px;
  color: #374151;
}

.intro-points > li {
  margin: 6px 0;
  font-size: 14px;
  line-height: 1.7;
  list-style: disc;
}

.intro-text {
  margin: 6px 0;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
}

.intro-text.subtle {
  color: #6b7280;
}

.intro-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.btn-primary {
  position: relative;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: #22c55e; /* 纯色主绿 */
  border: none;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgb(34 197 94 / 30%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.btn-primary:hover {
  background: #16a34a; /* 深一号 */
  box-shadow: 0 8px 20px rgb(22 163 74 / 36%);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* 取消按钮高光扫过效果 */
.btn-primary::after {
  display: none;
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
  color: #6b7280;
  cursor: pointer;
  background: rgb(255 255 255 / 90%);
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}

.intro-close:hover {
  color: #111827;
}

/* 简单淡入动画复用 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.intro-tips {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
}

.coach-wrap {
  position: relative;
  width: min(1100px, 92vw);
  height: min(520px, 70vh);
}

.coach-figure {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 80%;
  max-height: 420px;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgb(0 0 0 / 20%));
}

.coach-bubble {
  position: absolute;
  bottom: 24px;
  left: 20%;
  width: min(720px, 75%);
  padding: 18px 20px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgb(0 0 0 / 15%);
}

.bubble-header {
  position: absolute;
  top: -12%;
  left: 10%;
  display: inline-block;
  padding: 6px 12px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 9999px;
  transform: translateX(-50%);
}

.bubble-content {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
}

.bubble-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.btn-start {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  background: #f59e0b; /* 柔和橙色 */
  border: none;
  border-radius: 9999px;
  box-shadow: 0 10px 22px rgb(245 158 11 / 30%);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.btn-start:hover {
  background: #d97706;
  transform: translateY(-1px);
}

.btn-start:active {
  transform: translateY(0);
}

// 返回按钮 - 左上角
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: rgb(255 255 255 / 95%);
  border-radius: 25px;
  box-shadow: 0 4px 15px rgb(0 0 0 / 10%);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgb(255 255 255 / 100%);
    box-shadow: 0 6px 20px rgb(0 0 0 / 15%);
    transform: translateY(-2px);
  }

  .back-icon {
    width: 20px;
    height: 20px;
    color: #4caf50;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .back-text {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
}

.answer-fab {
  position: fixed;
  right: clamp(12px, 4vw, 24px);
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 1100;
}

.fab-btn {
  min-width: 120px;
  height: 44px;
  padding: 0 18px;
  font-weight: 800;
  border-radius: 9999px;
  box-shadow: 0 10px 22px rgb(22 163 74 / 32%);
}

.fab-btn:hover {
  box-shadow: 0 12px 26px rgb(21 128 61 / 40%);
}

.continue-button {
  @apply absolute bottom-10 right-12 flex h-12 w-[120px] items-center justify-center rounded-full text-[14px] font-bold hover:translate-y-[-2px];
}
</style>
