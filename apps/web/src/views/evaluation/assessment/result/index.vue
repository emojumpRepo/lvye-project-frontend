<script setup lang="ts">
import type { AssessmentResult } from '#/api/psychology/assessment';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Tooltip } from 'ant-design-vue';

import { getAssessmentResult } from '#/api/psychology/assessment';
import resultLogoBg from '#/static/images/evaluation/result/logo_bg.png';
import resultHappyIcon from '#/static/images/evaluation/result/report_happy_icon.svg';
import resultLogo from '#/static/images/evaluation/result/report_logo.png';
import resultUpsetIcon from '#/static/images/evaluation/result/report_upset_icon.svg';
import resultBgImage from '#/static/images/evaluation/result/result_bg.png';
import resultHeaderImage from '#/static/images/evaluation/result/result_header.png';

const positions: Record<string, string> = {
  行为: 'top-[5%] left-[30%]',
  智力与学校情况: 'top-[5%] left-[65%]',
  合群: 'top-[50%] left-[10%]',
  躯体外貌属性: 'top-[50%] right-[10%]',
  幸福与满足: 'bottom-[5%] left-[30%]',
  焦虑: 'bottom-[5%] left-[65%]',
};

const router = useRouter();
const route = useRoute();
const taskNo = ref(route.params.taskNo as string);
const mentalHealthStatus = ref<AssessmentResult | null>(null);
const onlineGameUse = ref<AssessmentResult | null>(null);
const sleepQuality = ref<AssessmentResult | null>(null);

// 格式化心理健康状况
const formattedMentalHealthStatus = computed(() => {
  return mentalHealthStatus.value?.resultDataParsed.map((item) => {
    const cleanDimensionName = item.dimensionName.replace('自我评价', '');
    return {
      ...item,
      dimensionName: cleanDimensionName,
      position: positions[cleanDimensionName],
    };
  });
});

// 管理Tooltip状态
const tooltipStates = ref<Record<string, boolean>>({});

const toggleTooltip = (dimensionName: string, visible: boolean) => {
  tooltipStates.value[dimensionName] = visible;
};

function handleBack() {
  router.back();
}

// 获取测评结果数据
async function getAssessmentResultData() {
  try {
    const res = await getAssessmentResult(taskNo.value);
    res.forEach((item) => {
      if (
        item.resultDataParsed.some(
          (item) => item.dimensionName === '行为自我评价',
        )
      ) {
        mentalHealthStatus.value = item;
      }
      if (
        item.resultDataParsed.some(
          (item) => item.dimensionName === '网络游戏使用',
        )
      ) {
        onlineGameUse.value = item;
      }
      if (
        item.resultDataParsed.some(
          (item) => item.dimensionName === '睡眠质量/失眠症状严重程度',
        )
      ) {
        sleepQuality.value = item;
      }
    });
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  await getAssessmentResultData();
});
</script>

<template>
  <div
    class="box-border h-full bg-gray-50 bg-cover bg-center"
    :style="{
      backgroundImage: `url(${resultBgImage})`,
    }"
  >
    <!-- 主要内容卡片 -->
    <div class="mx-auto flex h-full px-6 py-8 md:px-12 lg:px-20 xl:px-28">
      <div
        class="mx-auto box-border flex flex-1 flex-col rounded-xl bg-white p-6 shadow-lg"
      >
        <!-- 标题区域 -->
        <div class="mb-4 shrink-0 text-center">
          <div class="section-title">
            <h1 class="text-2xl font-medium text-gray-800">总报告</h1>
            <div class="title-divider mx-auto h-1"></div>
          </div>
          <!-- 横幅图片 -->
          <div
            class="mt-6 h-32 w-full overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat"
            :style="{
              backgroundImage: `url(${resultHeaderImage})`,
            }"
          ></div>
        </div>

        <!-- 主要内容区域 -->
        <div
          class="grid flex-1 grid-cols-1 gap-8 overflow-y-auto lg:grid-cols-2"
        >
          <!-- 左侧：心理健康状况 -->
          <div
            class="flex flex-col lg:col-span-1"
            v-if="formattedMentalHealthStatus"
          >
            <div class="section-title">
              <span>心理健康状况</span>
              <div class="title-divider h-0.5"></div>
            </div>

            <p class="section-content">
              心理健康状况分为合群、行为、智力与学校情况、躯体外貌属性、焦虑、幸福与满足等6个维度进行自我评价。
            </p>

            <div
              class="relative flex flex-1 items-center justify-center bg-contain bg-center bg-top bg-no-repeat p-12"
              :style="{
                backgroundImage: `url(${resultLogoBg})`,
              }"
            >
              <img :src="resultLogo" class="h-50 w-40" />
              <!-- 心理健康结果评语 -->
              <div
                v-for="item in formattedMentalHealthStatus"
                :key="item.dimensionName"
                class="absolute z-10 cursor-pointer transition-all duration-300 hover:scale-105 hover:text-emerald-500 active:scale-95"
                :class="{
                  ...(item.position ? { [item.position]: true } : {}),
                  'text-emerald-500': tooltipStates[item.dimensionName],
                  'text-gray-700': !tooltipStates[item.dimensionName],
                }"
              >
                <Tooltip
                  trigger="click"
                  :open="tooltipStates[item.dimensionName]"
                  @open-change="
                    (visible) => toggleTooltip(item.dimensionName, visible)
                  "
                  color="#ecfdf5"
                  :overlay-inner-style="{
                    width: '400px',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow:
                      '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  }"
                >
                  <div class="flex items-center space-x-2">
                    <img
                      :src="item.isAbnormal ? resultUpsetIcon : resultHappyIcon"
                      class="h-9 w-9"
                      :alt="item.isAbnormal ? '异常状态' : '正常状态'"
                    />
                    <p class="text-xs font-medium sm:text-sm">
                      {{ item.dimensionName }}
                    </p>
                  </div>
                  <template #title>
                    <p class="indent-8 text-sm text-gray-600">
                      {{ item.studentComment }}
                    </p>
                  </template>
                </Tooltip>
              </div>
            </div>
          </div>

          <!-- 右侧：网络游戏使用 & 睡眠质量/失眠症状严重程度 -->
          <div class="space-y-6 lg:col-span-1">
            <!-- 网络游戏使用 -->
            <div>
              <div class="section-title">
                <div class="flex items-center gap-3">
                  <img
                    :src="
                      onlineGameUse?.resultDataParsed[0]?.isAbnormal
                        ? resultUpsetIcon
                        : resultHappyIcon
                    "
                    class="h-9 w-9"
                    :alt="
                      onlineGameUse?.resultDataParsed[0]?.isAbnormal
                        ? '异常状态'
                        : '正常状态'
                    "
                  />
                  网络游戏使用
                </div>
                <div class="title-divider h-0.5"></div>
              </div>
              <p class="section-content">
                {{ onlineGameUse?.resultDataParsed[0]?.studentComment }}
              </p>
            </div>

            <!-- 睡眠质量 -->
            <div>
              <div class="section-title">
                <div class="flex items-center gap-3">
                  <img
                    :src="
                      sleepQuality?.resultDataParsed[0]?.isAbnormal
                        ? resultUpsetIcon
                        : resultHappyIcon
                    "
                    class="h-9 w-9"
                    :alt="
                      sleepQuality?.resultDataParsed[0]?.isAbnormal
                        ? '异常状态'
                        : '正常状态'
                    "
                  />
                  睡眠质量 / 失眠症状严重程度
                </div>
                <div class="title-divider h-0.5"></div>
              </div>
              <p class="section-content">
                {{ sleepQuality?.resultDataParsed[0]?.studentComment }}
              </p>
            </div>
          </div>
        </div>

        <!-- 底部区域 -->
        <div class="mt-8 flex flex-col items-center space-y-6">
          <!-- 分割线 -->
          <div class="flex w-full items-center justify-center">
            <div class="flex items-center space-x-6">
              <div
                class="h-px w-64 bg-gradient-to-r from-transparent to-gray-300"
              ></div>
              <div class="flex items-center space-x-2">
                <div class="h-1 w-1 rounded-full bg-emerald-400"></div>
                <div class="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <div class="h-1 w-1 rounded-full bg-emerald-400"></div>
              </div>
              <div
                class="h-px w-64 bg-gradient-to-l from-transparent to-gray-300"
              ></div>
            </div>
          </div>

          <!-- 返回按钮 -->
          <button
            @click="handleBack"
            class="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
          >
            <span class="relative z-10 flex items-center space-x-2 text-sm">
              <span>返回</span>
            </span>
            <div
              class="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            ></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.section-title {
  @apply mb-2 flex flex-col items-center space-y-2 text-xl font-medium text-gray-800;

  .title-divider {
    @apply w-16 rounded-full bg-gradient-to-r from-emerald-400 to-green-400;
  }
}

.section-content {
  @apply indent-8 leading-relaxed text-gray-600;
}

:deep(.ant-popover) {
  :deep(.ant-popover-arrow) {
    background-color: #bdbdbd;
  }
}
</style>
