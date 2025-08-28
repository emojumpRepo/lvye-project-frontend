<script lang="ts" setup>
import { computed, nextTick, onMounted, provide, ref } from 'vue';

import { Spin as ASpin } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

const props = withDefaults(
  defineProps<{
    /**
     * 自动结束 loading（仅在未受控时生效）
     * - true：组件 mounted 后自动结束
     * - false：需要使用提供的 API 手动结束
     */
    autoFinishLoading?: boolean;
    /**
     * 内容区域 loading（受控）。
     * - 不传时由组件内部管理
     * - 传入时完全受控，由外部决定开始/结束
     */
    contentLoading?: boolean;
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
    autoFinishLoading: true,
  },
);

const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'save'): void;
}>();

const hasTitle = computed(() => !!props.title);
const hasDescription = computed(() => !!props.description);

// 内容区域 loading：支持受控与非受控两种方式
const innerLoading = ref(true);
const spinning = computed(() => {
  return props.contentLoading ? !!props.contentLoading : innerLoading.value;
});

function startContentLoading() {
  if (!props.contentLoading) innerLoading.value = true;
}

function stopContentLoading() {
  if (!props.contentLoading) innerLoading.value = false;
}

// 默认结束 loading：组件首次挂载完成后自动结束（避免闪烁增加最小展示时长）
onMounted(async () => {
  if (!props.contentLoading && props.autoFinishLoading) {
    await nextTick();
    setTimeout(() => stopContentLoading(), 200);
  }
});

// 向子内容组件暴露控制 API（自定义结束 loading）
provide('CommonDialogContentLoading', {
  start: startContentLoading,
  stop: stopContentLoading,
  set: (v: boolean) => {
    if (!props.contentLoading) innerLoading.value = v;
  },
});

defineExpose({
  startContentLoading,
  stopContentLoading,
});
</script>

<template>
  <div class="mx-auto box-border w-full max-w-[1049px] rounded-xl bg-white p-8">
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
      :class="hasDescription ? 'max-h-[408px]' : 'max-h-[435px]'"
    >
      <ASpin :spinning="spinning" tip="加载中...">
        <KeepAlive>
          <Transition name="fade" mode="out-in">
            <slot></slot>
          </Transition>
        </KeepAlive>
      </ASpin>
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
          :loading="props.loading"
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
