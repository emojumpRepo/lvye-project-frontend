<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Modal } from 'ant-design-vue';

// 消息类型
interface Message {
  id: string;
  content: string;
  type: 'ai' | 'user';
  timestamp: Date;
  isTyping?: boolean;
}

// 消息列表
const messages = ref<Message[]>([
  {
    id: '1',
    content:
      '你好！我是心之旅AI助手，很高兴见到你。我会倾听你的心声，陪伴你度过每一个情感时刻。有什么想聊的吗？',
    type: 'ai',
    timestamp: new Date(),
  },
]);

// 输入内容
const inputMessage = ref('');
// 是否正在输入
const isTyping = ref(false);
// 消息容器引用
const messagesContainer = ref<HTMLElement>();
// 弹窗显示状态
const showComingSoonModal = ref(false);
// 功能是否可用（用于控制输入框和按钮状态）
const isFeatureEnabled = ref(false);

// 预设的AI回复模板
const aiResponses = [
  '我能理解你的感受，这种情况确实不容易。你想详细说说吗？',
  '听起来你正在经历一些挑战。记住，每个人都有自己的节奏，不要太苛责自己。',
  '你的想法很有意思。有时候换个角度看问题会有不同的收获。',
  '感谢你与我分享这些。你的勇气让我很感动。',
  '这听起来确实让人困扰。你觉得什么样的方式能让你感觉好一些呢？',
  '我注意到你提到了这个感受。你能告诉我更多关于它的细节吗？',
  '你已经很棒了！每一步成长都值得被看见和肯定。',
  '有时候我们需要给自己一些时间来处理情绪。这是完全正常的。',
];

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

// 生成随机AI回复
function getRandomAIResponse(): string {
  const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
  return response || '我在这里陪伴你，请继续分享你的想法。';
}

// 发送消息
async function sendMessage() {
  if (!inputMessage.value.trim() || isTyping.value || !isFeatureEnabled.value)
    return;

  const userMessage: Message = {
    id: Date.now().toString(),
    content: inputMessage.value.trim(),
    type: 'user',
    timestamp: new Date(),
  };

  messages.value.push(userMessage);
  inputMessage.value = '';
  scrollToBottom();

  // 显示AI正在输入
  isTyping.value = true;
  const typingMessage: Message = {
    id: 'typing',
    content: '',
    type: 'ai',
    timestamp: new Date(),
    isTyping: true,
  };
  messages.value.push(typingMessage);
  scrollToBottom();

  // 模拟AI回复延迟
  setTimeout(
    () => {
      // 移除typing消息
      messages.value = messages.value.filter((m) => m.id !== 'typing');

      // 添加AI回复
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getRandomAIResponse(),
        type: 'ai',
        timestamp: new Date(),
      };
      messages.value.push(aiMessage);
      isTyping.value = false;
      scrollToBottom();
    },
    1500 + Math.random() * 1000,
  ); // 1.5-2.5秒随机延迟
}

// 按Enter发送消息
function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && isFeatureEnabled.value) {
    event.preventDefault();
    sendMessage();
  }
}

// 处理textarea输入，自适应高度
function handleTextareaInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  if (target) {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  }
}

// 格式化时间
function formatTime(date: Date) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 页面加载时显示弹窗
onMounted(() => {
  // 延迟一点显示弹窗，让页面先渲染
  setTimeout(() => {
    showComingSoonModal.value = true;
  }, 500);
});

// 关闭弹窗
function handleCloseModal() {
  showComingSoonModal.value = false;
}

// 体验演示版
function handleTryDemo() {
  showComingSoonModal.value = false;
  isFeatureEnabled.value = true;
}
</script>

<template>
  <div
    class="flex h-screen flex-col bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 lg:p-8"
  >
    <!-- 页面标题 -->
    <div class="mb-6 flex-shrink-0">
      <h1 class="text-3xl font-bold text-emerald-900 lg:text-4xl">
        心之旅疗愈室
      </h1>
      <p class="mt-2 text-emerald-700/80">
        倾听你的心声，陪伴你的每一个情感时刻
      </p>
    </div>

    <!-- 聊天容器 -->
    <div
      class="flex flex-1 flex-col overflow-hidden rounded-3xl bg-white/70 shadow backdrop-blur-sm"
    >
      <!-- 消息列表 -->
      <div
        ref="messagesContainer"
        class="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-emerald-300 flex-1 space-y-4 overflow-y-auto p-6"
      >
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.type === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="flex max-w-[80%] items-start space-x-3"
            :class="
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            "
          >
            <!-- 头像 -->
            <div
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-sm"
              :class="
                message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              "
            >
              <IconifyIcon
                :icon="message.type === 'user' ? 'lucide:user' : 'lucide:bot'"
                class="h-5 w-5 text-white"
              />
            </div>

            <!-- 消息内容 -->
            <div class="flex flex-col">
              <div
                class="rounded-2xl px-4 py-3 shadow-sm"
                :class="
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'border border-gray-100 bg-white'
                "
              >
                <!-- 正在输入动画 -->
                <div
                  v-if="message.isTyping"
                  class="flex items-center space-x-1"
                >
                  <div class="flex space-x-1">
                    <div
                      class="h-2 w-2 animate-bounce rounded-full bg-emerald-500"
                      style="animation-delay: 0ms"
                    ></div>
                    <div
                      class="h-2 w-2 animate-bounce rounded-full bg-emerald-500"
                      style="animation-delay: 150ms"
                    ></div>
                    <div
                      class="h-2 w-2 animate-bounce rounded-full bg-emerald-500"
                      style="animation-delay: 300ms"
                    ></div>
                  </div>
                  <span class="ml-2 text-sm text-emerald-600"
                    >AI正在思考...</span
                  >
                </div>
                <!-- 消息文本 -->
                <p
                  v-else
                  class="leading-relaxed"
                  :class="
                    message.type === 'user' ? 'text-white' : 'text-gray-800'
                  "
                >
                  {{ message.content }}
                </p>
              </div>
              <!-- 时间戳 -->
              <div
                class="mt-1 text-xs text-gray-500"
                :class="message.type === 'user' ? 'text-right' : 'text-left'"
              >
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="flex-shrink-0 border-t border-gray-100 p-4">
        <div class="flex items-end space-x-4">
          <!-- 输入框 -->
          <div class="flex-1">
            <textarea
              v-model="inputMessage"
              class="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              :placeholder="
                isFeatureEnabled
                  ? '输入你想说的话...'
                  : '功能暂未开放，敬请期待...'
              "
              rows="1"
              :disabled="isTyping || !isFeatureEnabled"
              @keypress="handleKeyPress"
              @input="handleTextareaInput"
            ></textarea>
          </div>

          <!-- 发送按钮 -->
          <button
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50"
            :disabled="!inputMessage.trim() || isTyping || !isFeatureEnabled"
            @click="sendMessage"
          >
            <IconifyIcon v-if="!isTyping" icon="lucide:send" class="h-5 w-5" />
            <div
              v-else
              class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
            ></div>
          </button>
        </div>

        <!-- 提示文本 -->
        <div class="mt-2 text-center text-xs text-gray-500">
          {{
            isFeatureEnabled
              ? '按 Enter 发送消息，Shift + Enter 换行'
              : '功能暂未开放，敬请期待正式版本上线'
          }}
        </div>
      </div>
    </div>

    <!-- 敬请期待弹窗 -->
    <Modal
      v-model:open="showComingSoonModal"
      :closable="false"
      :footer="null"
      :mask-closable="false"
      :width="600"
      centered
      wrap-class-name="coming-soon-modal"
    >
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <!-- 图标 -->
        <div
          class="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100"
        >
          <IconifyIcon
            icon="lucide:sparkles"
            class="h-12 w-12 text-emerald-600"
          />
        </div>

        <!-- 标题 -->
        <h2 class="mb-4 text-3xl font-bold text-gray-800">敬请期待</h2>

        <!-- 副标题 -->
        <p class="mb-2 text-lg text-gray-600">心之旅疗愈室即将上线</p>

        <!-- 描述 -->
        <p class="mb-8 max-w-md text-gray-500">
          我们正在为您打造更智能、更贴心的AI心理疗愈体验，敬请期待正式版本的发布！
        </p>

        <!-- 按钮组 -->
        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            class="transform rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl"
            @click="handleCloseModal"
          >
            我知道了
          </button>
          <button
            class="transform rounded-full border-2 border-emerald-500 bg-transparent px-8 py-3 font-medium text-emerald-600 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-emerald-50"
            @click="handleTryDemo"
          >
            体验演示版
          </button>
        </div>

        <!-- 装饰元素 -->
        <div
          class="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-emerald-200 opacity-60"
        ></div>
        <div
          class="absolute -bottom-2 -right-6 h-6 w-6 rounded-full bg-teal-200 opacity-40"
        ></div>
        <div
          class="absolute -right-2 top-8 h-4 w-4 rounded-full bg-emerald-300 opacity-50"
        ></div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>


@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

:deep(.coming-soon-modal .ant-modal-content) {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
}

:deep(.coming-soon-modal .ant-modal-body) {
  position: relative;
  padding: 0;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #f0f9ff 100%);
}

/* 装饰背景 */
:deep(.coming-soon-modal .ant-modal-body::before) {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  content: '';
  background: radial-gradient(
    circle,
    rgb(16 185 129 / 10%) 0%,
    transparent 70%
  );
  animation: rotate 20s linear infinite;
}

/* 按钮悬停效果 */
button:hover {
  transform: translateY(-2px) scale(1.05);
}

/* 图标动画 */
:deep(.lucide-sparkles) {
  animation: sparkle 2s ease-in-out infinite;
}

/* 弹窗自定义样式 */
</style>
