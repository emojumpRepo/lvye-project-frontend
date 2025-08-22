<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { ArrowLeft } from '@vben/icons';

import ConfirmDialog from '#/components/ConfirmDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';

interface Props {
  src: string;
  width?: string;
  height?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

interface Emits {
  (e: 'complete', payload: null | Record<string, unknown>): void;
  (e: 'resize', height: number): void;
  (e: 'ready'): void;
}

const props = withDefaults(defineProps<Props>(), {
  width: '55%',
  height: '90%',
  showBackButton: true,
  onBack: undefined,
});

const emit = defineEmits<Emits>();

// iframe 通信相关
const iframeRef = ref<HTMLIFrameElement | null>(null);
const iframeHeight = ref<string>(props.height);
const showConfirmDialog = ref(false);

const allowedOrigin = computed(() => {
  try {
    return new URL(props.src).origin;
  } catch {
    return '*';
  }
});

function postToIframe(message: unknown) {
  const targetWindow = iframeRef.value?.contentWindow;
  if (!targetWindow) return;
  targetWindow.postMessage(
    message,
    allowedOrigin.value === '*' ? '*' : allowedOrigin.value,
  );
}

function handleIframeLoad() {
  // 握手，通知子页面父窗口已就绪
  postToIframe({ type: 'parentReady' });
  emit('ready');
}

function handleWindowMessage(event: MessageEvent) {
  // 仅接收来自允许源的消息
  if (allowedOrigin.value !== '*' && event.origin !== allowedOrigin.value) {
    return;
  }
  const data = event.data as null | Record<string, unknown>;
  if (!data || typeof data !== 'object') return;

  switch (data.type) {
    case 'childReady': {
      // 子页面就绪
      emit('ready');
      break;
    }
    case 'complete': {
      // 子页面完成作答
      const payload = (data as any).payload ?? null;
      emit('complete', payload);
      break;
    }
    case 'resize': {
      const newHeight = (data as any).height;
      if (typeof newHeight === 'number' && Number.isFinite(newHeight)) {
        iframeHeight.value = `${newHeight}px`;
        emit('resize', newHeight);
      }
      break;
    }
    default: {
      break;
    }
  }
}

function handleBack() {
  if (props.onBack) {
    props.onBack();
  } else {
    showConfirmDialog.value = true;
  }
}

function handleConfirm() {
  showConfirmDialog.value = false;
  // 这里可以添加返回逻辑，比如 router.back()
}

onMounted(() => {
  window.addEventListener('message', handleWindowMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleWindowMessage);
});

// 暴露方法给父组件
defineExpose({
  postMessage: postToIframe,
});
</script>

<template>
  <div class="questionnaire-iframe-container">
    <div v-if="showBackButton" class="back-button" @click="handleBack">
      <div class="back-icon">
        <ArrowLeft />
      </div>
      <span class="back-text">返回</span>
    </div>

    <iframe
      ref="iframeRef"
      :src="src"
      frameborder="0"
      :width="width"
      :style="{ height: iframeHeight }"
      @load="handleIframeLoad"
    ></iframe>

    <ConfirmDialog
      v-model:show="showConfirmDialog"
      title="确定要放弃完成本次测评任务吗？已填写的信息将丢失"
      @confirm="handleConfirm"
    >
      <template #footer>
        <div class="mt-4 flex items-center justify-end">
          <LyButton
            type="default"
            size="middle"
            @click="showConfirmDialog = false"
          >
            取消
          </LyButton>
          <LyButton type="success" size="middle" @click="handleConfirm">
            确定
          </LyButton>
        </div>
      </template>
    </ConfirmDialog>
  </div>
</template>

<style scoped lang="scss">
.questionnaire-iframe-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
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
</style>
