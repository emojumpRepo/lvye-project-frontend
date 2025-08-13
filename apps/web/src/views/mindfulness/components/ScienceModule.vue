<script lang="ts" setup>
import { ref } from 'vue';
import { IconifyIcon } from '@vben/icons';

// 科普绘本数据
interface StoryBook {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  iframeUrl: string;
}

const storyBooks = ref<StoryBook[]>([
  {
    id: '1',
    title: '正念呼吸小故事',
    description: '通过有趣的故事学习正念呼吸的基本方法',
    coverImage:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&crop=center',
    iframeUrl: 'https://gemini.google.com/share/d055718779d0',
  },
]);

// 当前选中的绘本
const selectedStoryBook = ref<null | StoryBook>(null);

// 打开绘本
function openStoryBook(book: StoryBook) {
  selectedStoryBook.value = book;
}

// 关闭绘本
function closeStoryBook() {
  selectedStoryBook.value = null;
}
</script>

<template>
  <div class="w-full">
    <div class="rounded-3xl bg-white/70 p-6 shadow backdrop-blur-sm">
      <div class="mb-6 flex items-center">
        <div
          class="mr-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
        >
          📚
        </div>
        <div>
          <h2 class="text-xl font-bold text-emerald-900">科普绘本</h2>
          <p class="text-sm text-emerald-700/70">
            通过生动有趣的绘本了解正念
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div
          v-for="book in storyBooks"
          :key="book.id"
          class="group cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
          @click="openStoryBook(book)"
        >
          <div class="flex items-center space-x-4">
            <img
              :src="book.coverImage"
              :alt="book.title"
              class="h-20 w-20 rounded-xl object-cover shadow-sm"
            />
            <div class="flex-1">
              <h3 class="mb-2 font-semibold text-emerald-900">
                {{ book.title }}
              </h3>
              <p class="text-sm text-emerald-700/80">
                {{ book.description }}
              </p>
              <div class="mt-3 flex items-center text-blue-600">
                <span class="text-sm font-medium">点击阅读</span>
                <IconifyIcon
                  icon="lucide:arrow-right"
                  class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 绘本弹窗 -->
    <div
      v-if="selectedStoryBook"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click="closeStoryBook"
    >
      <div
        class="relative h-full max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        @click.stop
      >
        <div class="flex h-full flex-col">
          <div class="flex items-center justify-between border-b p-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ selectedStoryBook.title }}
            </h3>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              @click="closeStoryBook"
            >
              <IconifyIcon icon="lucide:x" class="h-4 w-4" />
            </button>
          </div>
          <div class="flex-1">
            <iframe
              :src="selectedStoryBook.iframeUrl"
              class="h-full w-full border-0"
              frameborder="0"
              scrolling="auto"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
