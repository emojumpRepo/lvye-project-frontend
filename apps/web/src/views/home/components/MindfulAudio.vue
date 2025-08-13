<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

interface AudioItem {
  id: string;
  title: string;
  duration: string;
}

const props = defineProps<{
  activeId: null | string;
  items: AudioItem[];
}>();

const emit = defineEmits<{
  (e: 'toggle', id: string): void;
}>();

function onToggle(id: string) {
  emit('toggle', id);
}
</script>

<template>
  <div
    class="flex flex-col rounded-3xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow"
  >
    <div class="p-4 lg:p-6">
      <div
        class="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-base font-bold text-transparent lg:text-lg"
      >
        正念音频
      </div>
    </div>
    <!-- 可滚动的音频列表容器 -->
    <div class="flex-1 overflow-hidden px-4 pb-4 lg:px-6 lg:pb-6">
      <div class="max-h-[180px] space-y-3 overflow-y-auto">
        <div
          v-for="a in props.items"
          :key="a.id"
          class="flex items-center justify-between rounded-2xl bg-white/70 p-3 transition-all duration-200 hover:bg-white/80"
        >
          <div class="flex items-center space-x-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg lg:h-11 lg:w-11"
            >
              🔊
            </div>
            <div>
              <div class="mb-0.5 font-bold text-emerald-900">
                {{ a.title }}
              </div>
              <span
                class="rounded-full border border-blue-200 bg-white/50 px-2 py-0.5 text-[10px] text-blue-700 lg:text-xs"
              >
                {{ a.duration }}
              </span>
            </div>
          </div>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-transparent shadow transition-all duration-300 hover:scale-105 lg:h-10 lg:w-10"
            :class="
              props.activeId === a.id
                ? 'border-indigo-600 text-indigo-600 hover:bg-indigo-50/30'
                : 'border-blue-500 text-blue-600 hover:bg-blue-50/30'
            "
            @click="onToggle(a.id)"
          >
            <IconifyIcon
              v-if="props.activeId === a.id"
              icon="lucide:pause"
              class="size-4"
            />
            <IconifyIcon v-else icon="lucide:play" class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
