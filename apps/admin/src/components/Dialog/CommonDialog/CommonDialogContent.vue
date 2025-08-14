<script lang="ts" setup>
import { computed } from 'vue';

import LyButton from '#/components/LyButton/index.vue';

const props = withDefaults(
  defineProps<{
    description?: string;
    loading?: boolean;
    nextDisabled?: boolean;
    nextText?: string;
    prevText?: string;
    saveDisabled?: boolean;
    saveText?: string;
    showNext?: boolean;
    showPrev?: boolean;
    showSave?: boolean;
    title?: string;
  }>(),
  {
    title: '',
    nextText: '下一步',
    prevText: '上一步',
    saveText: '保存',
    nextDisabled: false,
    saveDisabled: false,
    loading: false,
    showNext: true,
    showPrev: true,
    showSave: false,
    description: '',
  },
);

const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'save'): void;
}>();

const hasTitle = computed(() => !!props.title);
const hasDescription = computed(() => !!props.description);
</script>

<template>
  <div
    class="mx-auto box-border max-h-[608px] w-full max-w-[1049px] rounded-xl bg-white p-8"
  >
    <div
      v-if="hasTitle || hasDescription"
      class="mb-6 flex flex-col items-center justify-center gap-1"
    >
      <div v-if="hasTitle" class="text-center text-[20px] font-bold">
        {{ props.title }}
      </div>
      <div v-if="hasDescription" class="text-center text-[14px] text-[#979899]">
        {{ props.description }}
      </div>
    </div>

    <div
      class="box-border overflow-y-auto"
      :class="hasDescription ? 'max-h-[382px]' : 'max-h-[408px]'"
    >
      <slot></slot>
    </div>

    <div class="mt-8 flex justify-center gap-4">
      <slot name="footer">
        <LyButton
          v-if="showPrev"
          type="default"
          size="middle"
          class="h-12 w-[120px] justify-center"
          @click="emit('prev')"
        >
          {{ props.prevText }}
        </LyButton>
        <LyButton
          v-if="showSave"
          type="default"
          size="middle"
          class="h-12 w-[120px] justify-center"
          :disabled="props.saveDisabled"
          @click="emit('save')"
        >
          {{ props.saveText }}
        </LyButton>
        <LyButton
          v-if="showNext"
          :loading="props.loading"
          type="success"
          size="middle"
          class="h-12 justify-center"
          :class="{ 'w-[150px]': !showPrev, 'w-[120px]': showPrev }"
          :disabled="props.nextDisabled"
          @click="emit('next')"
        >
          {{ props.nextText }}
        </LyButton>
      </slot>
    </div>
  </div>
</template>
