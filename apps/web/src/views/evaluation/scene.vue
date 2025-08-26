<script setup lang="ts">
import type { EvaluationScene } from './data';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft } from '@vben/icons';

import { message } from 'ant-design-vue';

import { startAssessment } from '#/api/psychology/assessment';

import { EVALUATION_SCENES } from './data';

const router = useRouter();
const route = useRoute();

// 响应式数据
const SelectedScene = ref<any>(null);
const hasReport = ref(false);

// 方法
function handleBack() {
  router.back();
}

async function startEvaluation() {
  // 跳转到测评页面
  if (SelectedScene.value) {
    try {
      await startAssessment(route.query.taskNo as string);
      router.push({
        path: '/evaluation/questionnaire',
        query: {
          questionnaireId: SelectedScene.value.evaluation.id,
          sceneId: SelectedScene.value.id,
          assessmentTaskNo: route.query.taskNo,
          questionnaireLink:
            SelectedScene.value.evaluation.link.split('render/')[1],
        },
      });
    } catch {
      console.error(error);
    }
  }
}

function handleBuildingClick(scene: any) {
  if (scene.disabled) {
    // 禁用状态：仅返回，不弹窗
    return;
  }
  SelectedScene.value = scene;
  startEvaluation();
}

function showSummaryReport() {
  // 禁用状态时阻止跳转
  if (!hasReport.value) {
    message.warning('完成所有场景后才可以查看汇总报告');
    return;
  }
  router.push('/evaluation/summary');
}

// 获取下一个可点击的场景
function getNextAvailableScene() {
  return EVALUATION_SCENES.find((scene: EvaluationScene) => !scene.disabled);
}

onMounted(() => {
  console.log(route.query);
});
</script>

<template>
  <div class="evaluation-map">
    <!-- 地图主体 -->
    <div class="map-content">
      <!-- 背景地图 -->
      <div class="map-background"></div>

      <!-- 返回按钮 - 左上角 -->
      <div class="back-button" @click="handleBack">
        <div class="back-icon">
          <ArrowLeft />
        </div>
        <span class="back-text">返回</span>
      </div>

      <!-- 学校Logo - 右上角 -->
      <div class="school-logo">
        <div class="logo-content">
          <h2>曼朗小学</h2>
          <p>MindTrip 曼朗心之旅</p>
        </div>
      </div>

      <!-- 汇总报告 - 右下角 -->
      <div
        class="summary-report"
        @click="showSummaryReport"
        :class="{ disabled: !hasReport }"
      >
        <img
          src="../../static/icons/report.svg"
          alt=""
          width="64"
          class="report-icon"
        />
        <span class="report-text">汇总报告</span>
      </div>

      <!-- 可点击建筑 -->
      <div class="buildings">
        <div
          v-for="scene in EVALUATION_SCENES"
          :key="scene.id"
          class="building-button"
          :class="{ disabled: scene.disabled }"
          :style="scene.position"
          @click="handleBuildingClick(scene)"
        >
          <div class="building-glow"></div>

          <div class="relative">
            <!-- 引导动画 - 显示在下一个可点击的建筑上 -->
            <div
              v-if="
                !scene.disabled &&
                scene.order === getNextAvailableScene()?.order
              "
              class="guide-wave"
            >
              <img
                src="../../static/images/evaluation/questionnaire/wave.gif"
                alt="引导动画"
                class="wave-gif"
              />
              <div
                class="absolute right-[-30px] top-[-40px] rounded bg-[#4caf50] px-2 py-1 text-xs text-white"
              >
                点击这里哦
              </div>
            </div>
            <div class="building-icon">
              <span class="building-emoji">{{ scene.icon }}</span>
              <div v-if="scene.disabled" class="lock-icon">🔒</div>
            </div>
          </div>

          <div class="building-label">
            {{ scene.name }}
            <span v-if="scene.disabled" class="disabled-text">(未开放)</span>
          </div>
          <div class="building-pulse"></div>
        </div>
      </div>
    </div>
  </div>
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
  width: 100%;
  height: 100%;

  .map-content {
    position: relative;
    width: 100%;
    height: 100%;

    .map-background {
      width: 100%;
      height: 100%;
      background: url('../../static/images/evaluation/junior_evaluation_map.png');
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

    // 学校Logo - 右上角
    .school-logo {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 1000;

      .logo-content {
        padding: 15px 20px;
        text-align: center;
        background: rgb(255 255 255 / 95%);
        border: 2px solid rgb(76 175 80 / 20%);
        border-radius: 15px;
        box-shadow: 0 4px 15px rgb(0 0 0 / 10%);
        backdrop-filter: blur(10px);

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: bold;
          color: #4caf50;
          text-shadow: 0 1px 2px rgb(0 0 0 / 10%);
        }

        p {
          margin: 5px 0 0;
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
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;

      &.disabled {
        cursor: not-allowed;
        filter: grayscale(100%);

        &:hover {
          animation: shake 1s ease-in-out;
        }
      }

      &:hover:not(.disabled) {
        transform: translateY(-2px);
        scale: 1.1;
      }

      .report-icon {
        position: absolute;
        left: 52%;
        z-index: -1;
        transform: translate(-50%, -90%);
      }

      .report-text {
        padding: 5px 10px;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        background: #4caf50;
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
        cursor: pointer;
        transform: scale(1);
        transition: all 0.3s ease;

        &.disabled {
          cursor: not-allowed;

          .building-icon {
            background: linear-gradient(
              135deg,
              rgb(200 200 200 / 95%) 0%,
              rgb(180 180 180 / 85%) 100%
            );
            box-shadow:
              0 4px 15px rgb(0 0 0 / 15%),
              0 0 0 2px rgb(150 150 150 / 20%),
              inset 0 1px 0 rgb(220 220 220 / 80%);

            .building-emoji {
              filter: grayscale(100%);
            }

            .lock-icon {
              position: absolute;
              top: -5px;
              right: -5px;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              font-size: 12px;
              background: rgb(255 193 7 / 90%);
              border-radius: 50%;
              box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
              animation: shake 2s ease-in-out infinite;
            }
          }

          .building-label {
            color: #999;
            background: linear-gradient(
              135deg,
              rgb(200 200 200 / 95%) 0%,
              rgb(180 180 180 / 85%) 100%
            );

            .disabled-text {
              font-size: 10px;
              font-weight: normal;
              color: #ff9800;
            }
          }

          .building-glow {
            background: radial-gradient(
              circle,
              rgb(150 150 150 / 20%) 0%,
              transparent 70%
            );
          }

          .building-pulse {
            border-color: rgb(150 150 150 / 40%);
          }

          &:hover {
            transform: scale(1.05);

            .building-icon {
              transform: scale(1.05);
              animation: shake 1s ease-in-out;
            }
          }
        }

        .building-glow {
          position: absolute;
          z-index: -1;
          width: 80px;
          height: 80px;
          background: radial-gradient(
            circle,
            rgb(76 175 80 / 30%) 0%,
            transparent 70%
          );
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
          background: linear-gradient(
            135deg,
            rgb(255 255 255 / 95%) 0%,
            rgb(255 255 255 / 85%) 100%
          );
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
          background: linear-gradient(
            135deg,
            rgb(255 255 255 / 95%) 0%,
            rgb(255 255 255 / 85%) 100%
          );
          border-radius: 15px;
          box-shadow:
            0 2px 8px rgb(0 0 0 / 10%),
            0 0 0 1px rgb(76 175 80 / 10%);
          backdrop-filter: blur(5px);
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

      .building-button:hover:not(.disabled) {
        z-index: 100;
        transform: scale(1.15);

        .building-icon {
          box-shadow:
            0 8px 25px rgb(0 0 0 / 30%),
            0 0 0 3px rgb(76 175 80 / 20%),
            inset 0 1px 0 rgb(255 255 255 / 90%);
          transform: scale(1.1);
        }

        .building-label {
          background: linear-gradient(
            135deg,
            rgb(255 255 255 / 100%) 0%,
            rgb(255 255 255 / 95%) 100%
          );
          box-shadow:
            0 4px 12px rgb(0 0 0 / 15%),
            0 0 0 2px rgb(76 175 80 / 20%);
          transform: scale(1.05);
        }

        .building-glow {
          animation: glow 1.5s ease-in-out infinite;
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
