<script lang="ts" setup>
import { ref } from 'vue';
import { IconifyIcon } from '@vben/icons';

// 练习视频数据
interface PracticeVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
}

const practiceVideos = ref<PracticeVideo[]>([
  {
    id: '1',
    title: '基础呼吸练习',
    description: '学习基本的正念呼吸技巧',
    duration: '5分钟',
    thumbnail:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop&crop=center',
    videoUrl:
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    category: '呼吸练习',
  },
  {
    id: '2',
    title: '身体扫描冥想',
    description: '通过身体感知提升正念意识',
    duration: '10分钟',
    thumbnail:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&crop=center',
    videoUrl:
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    category: '身体觉知',
  },
  {
    id: '3',
    title: '情绪观察练习',
    description: '学会观察和接纳情绪变化',
    duration: '8分钟',
    thumbnail:
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=300&h=200&fit=crop&crop=center',
    videoUrl:
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_3mb.mp4',
    category: '情绪管理',
  },
  {
    id: '4',
    title: '行走冥想',
    description: '在行走中保持正念觉察',
    duration: '12分钟',
    thumbnail:
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=300&h=200&fit=crop&crop=center',
    videoUrl:
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_4mb.mp4',
    category: '日常练习',
  },
]);

// 当前播放的视频
const selectedVideo = ref<null | PracticeVideo>(null);

// 播放视频
function playVideo(video: PracticeVideo) {
  selectedVideo.value = video;
}

// 关闭视频
function closeVideo() {
  selectedVideo.value = null;
}
</script>

<template>
  <div class="w-full">
    <div class="rounded-3xl bg-white/70 p-6 shadow backdrop-blur-sm">
      <div class="mb-6 flex items-center">
        <div
          class="mr-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
        >
          🧘
        </div>
        <div>
          <h2 class="text-xl font-bold text-emerald-900">练习室</h2>
          <p class="text-sm text-emerald-700/70">跟随视频进行正念练习</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="video in practiceVideos"
          :key="video.id"
          class="group cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
          @click="playVideo(video)"
        >
          <div class="relative">
            <img
              :src="video.thumbnail"
              :alt="video.title"
              class="h-32 w-full object-cover"
            />
            <div
              class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow"
              >
                <IconifyIcon
                  icon="lucide:play"
                  class="h-6 w-6 text-emerald-600"
                />
              </div>
            </div>
            <div
              class="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white"
            >
              {{ video.duration }}
            </div>
          </div>
          <div class="p-4">
            <div
              class="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
            >
              {{ video.category }}
            </div>
            <h3 class="mb-2 font-semibold text-emerald-900">
              {{ video.title }}
            </h3>
            <p class="line-clamp-2 text-sm text-emerald-700/80">
              {{ video.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频播放弹窗 -->
    <div
      v-if="selectedVideo"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      @click="closeVideo"
    >
      <div
        class="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        @click.stop
      >
        <div class="flex flex-col">
          <div class="flex items-center justify-between border-b p-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ selectedVideo.title }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ selectedVideo.description }}
              </p>
            </div>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              @click="closeVideo"
            >
              <IconifyIcon icon="lucide:x" class="h-4 w-4" />
            </button>
          </div>
          <div class="aspect-video">
            <video
              :src="selectedVideo.videoUrl"
              class="h-full w-full"
              controls
              autoplay
            >
              您的浏览器不支持视频播放。
            </video>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
