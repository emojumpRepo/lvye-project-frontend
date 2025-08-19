<script lang="ts" setup>
import { ref } from 'vue';

import AssessmentCards from './components/AssessmentCards.vue';
import DailyTip from './components/DailyTip.vue';
import KoalaMessage from './components/KoalaMessage.vue';
import MindfulAudio from './components/MindfulAudio.vue';
import WelcomeBanner from './components/WelcomeBanner.vue';

const activeAudioId = ref<null | string>(null);
const dailyTip = ref(
  '当你感到紧张或心情低落时，放慢脚步，做五次深呼吸，闭上眼睛专注在气息上，允许所有感受如云飘过，告诉自己：我正在照顾我的情绪，这一切都会慢慢好起来。',
);

interface AssessmentItem {
  id: string;
  title: string;
  description: string;
  gradient: string;
  iconImage: string;
  iconImageSize?: number;
  iconImageScaleSm?: number;
  iconOpacitySm?: number;
  imgOffsetX?: number;
  imgOffsetY?: number;
  imgOffsetXSm?: number;
  imgOffsetYSm?: number;
  link: string;
}

const assessments: AssessmentItem[] = [
  {
    id: 'initial',
    title: '初测之旅',
    description: '了解你的心理状态',
    gradient: 'from-emerald-400 to-teal-500',
    iconImage: 'https://i.111666.best/image/bsZhHgyxJzM0x62xetwj99.png',
    // 大屏（水平布局）
    iconImageSize: 320,
    imgOffsetX: 40,
    imgOffsetY: -2,
    // 小屏（垂直布局）
    iconImageScaleSm: 0.4,
    imgOffsetXSm: -10,
    imgOffsetYSm: 5,
    link: '/evaluation/junior/map',
  },
  {
    id: 'retest',
    title: '复测之旅',
    description: '追踪你的成长变化',
    gradient: 'from-emerald-400 to-green-500',
    iconImage: 'https://i.111666.best/image/DCr5ux57H7FukpWvpNXbpO.png',
    // 大屏（水平布局）
    iconImageSize: 300,
    imgOffsetX: -20,
    imgOffsetY: 0,
    // 小屏（垂直布局）
    iconImageScaleSm: 0.5,
    imgOffsetXSm: -15,
    imgOffsetYSm: 0,
    link: '',
  },
  {
    id: 'theme',
    title: '主题测评',
    description: '深入特定心理领域',
    gradient: 'from-teal-400 to-emerald-500',
    iconImage: 'https://i.111666.best/image/QJ8Lw0jcU3OIAlD63jBXMA.png',
    // 大屏（水平布局）
    iconImageSize: 100,
    imgOffsetX: 20,
    imgOffsetY: 6,
    // 小屏（垂直布局）
    iconImageScaleSm: 0.35,
    imgOffsetXSm: -8,
    imgOffsetYSm: 8,
    link: '',
  },
];

interface AudioItem {
  id: string;
  title: string;
  duration: string;
}

const audioItems: AudioItem[] = [
  { id: 'morning', title: '晨间冥想', duration: '10分钟' },
  { id: 'focus', title: '专注呼吸', duration: '8分钟' },
];

function toggleAudioBy(id: string) {
  activeAudioId.value = activeAudioId.value === id ? null : id;
}
</script>

<template>
  <div class="h-full overflow-hidden p-4 lg:p-6">
    <!-- 一屏布局：左8/右4 -->
    <div
      class="grid h-full grid-cols-1 gap-4 lg:grid-cols-12 lg:[grid-template-rows:auto_1fr]"
    >
      <!-- 欢迎横幅 -->
      <div class="lg:col-span-8">
        <WelcomeBanner />
      </div>

      <!-- 考拉老师寄语 -->
      <div class="lg:col-span-4">
        <KoalaMessage />
      </div>

      <!-- 测评快速入口（左下：标题 + 三卡并排，占据一格） -->
      <div class="lg:col-span-8">
        <AssessmentCards :items="assessments" />
      </div>

      <!-- 右下：小贴士 + 正念音频 二分栏堆叠，占据一格 -->
      <div class="grid h-full grid-rows-2 gap-4 lg:col-span-4">
        <!-- 小贴士 -->
        <DailyTip :tip="dailyTip" />

        <!-- 正念音频 -->
        <MindfulAudio
          :items="audioItems"
          :active-id="activeAudioId"
          @toggle="toggleAudioBy"
        />
      </div>
    </div>
  </div>
</template>
