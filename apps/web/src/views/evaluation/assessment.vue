<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AlarmClockCheck, ArrowLeft, ClipboardList } from '@vben/icons';

import { Spin } from 'ant-design-vue';

import { getAssessmentTask } from '#/api/psychology/assessment';

const route = useRoute();
const router = useRouter();

const assessmentTaskNo = ref<string>('');
const assessmentData = ref<AssessmentTask | null>(null);
const loading = ref(false);

onMounted(() => {
  // 从路由参数获取测评ID，这里暂时使用所有场景作为示例
  assessmentTaskNo.value = (route.params.id as string) || 'default';
  loadAssessmentData();
});

function handleBack() {
  router.back();
}

const totalTime = computed(() => {
  return 0;
});

const completedCount = computed(() => {
  // 这里可以根据实际业务逻辑计算已完成数量
  return 0;
});

const progress = computed(() => {
  return 0;
});

async function loadAssessmentData() {
  try {
    loading.value = true;
    const res = await getAssessmentTask(assessmentTaskNo.value || '');
    console.log(res);
    assessmentData.value = res;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="flex h-screen flex-col bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
  >
    <!-- 顶部导航栏 -->
    <div
      class="sticky top-0 z-10 shrink-0 border-b border-emerald-100 bg-white/80 backdrop-blur-sm"
    >
      <div class="flex items-center justify-between px-4 py-3 lg:px-6">
        <button
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-emerald-700 transition-colors hover:bg-emerald-50"
          @click="handleBack"
        >
          <ArrowLeft class="h-5 w-5" />
          <span class="font-medium">返回</span>
        </button>

        <div class="text-center">
          <h1 class="text-lg font-bold text-emerald-900">
            {{ assessmentData?.taskName }}
          </h1>
          <p class="text-sm text-emerald-600">完成所有问卷获得完整评估</p>
        </div>

        <div class="w-20"></div>
        <!-- 占位，保持标题居中 -->
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="container mx-auto flex flex-1 flex-col px-4 py-6 lg:px-6">
      <!-- 测评概览卡片 -->
      <div
        class="mb-6 shrink-0 rounded-3xl bg-white/60 p-6 shadow backdrop-blur-sm"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <!-- 总问卷数 -->
          <div class="text-center">
            <div class="text-2xl font-bold text-emerald-700">
              {{ assessmentData?.questionnaireIds?.length }}
            </div>
            <div class="text-sm text-emerald-600">总问卷数</div>
          </div>

          <!-- 预计用时 -->
          <div class="text-center">
            <div
              class="flex items-center justify-center gap-2 text-2xl font-bold text-emerald-700"
            >
              <AlarmClockCheck class="h-6 w-6" />
              <span>{{ totalTime }}分钟</span>
            </div>
            <div class="text-sm text-emerald-600">预计用时</div>
          </div>

          <!-- 完成进度 -->
          <div class="text-center">
            <div class="text-2xl font-bold text-emerald-700">
              {{ progress }}%
            </div>
            <div class="text-sm text-emerald-600">完成进度</div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="mt-4">
          <div
            class="flex items-center justify-between text-sm text-emerald-600"
          >
            <span
              >已完成 {{ completedCount }}/{{
                assessmentData?.questionnaireIds?.length
              }}</span
            >
            <span>{{ progress }}%</span>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div
              class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 问卷列表 -->
      <div class="flex flex-1 flex-col space-y-4 overflow-hidden">
        <h2 class="shrink-0 text-xl font-bold text-emerald-900">问卷列表</h2>

        <div v-if="loading" class="flex flex-1 items-center justify-center">
          <Spin spinning />
        </div>

        <div
          v-else
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <!-- <QuestionnaireCard
            v-for="questionnaire in assessmentData?.questionnaireIds"
            :key="questionnaire.id"
            :questionnaire="questionnaire"
          /> -->
        </div>

        <!-- 空状态 -->
        <div
          v-if="!loading"
          class="flex flex-col items-center justify-center py-12 text-center text-emerald-600"
        >
          <ClipboardList class="mb-2 h-8 w-8" />
          <div class="text-lg font-medium">暂无问卷</div>
          <div class="text-sm">该测评暂未配置问卷</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 渐变背景动画 */
@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

.line-clamp-2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bg-gradient-to-br {
  background-size: 200% 200%;
  animation: gradient-shift 15s ease infinite;
}
</style>
