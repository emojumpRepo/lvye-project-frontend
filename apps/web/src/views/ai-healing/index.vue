<script lang="ts" setup>
import { nextTick, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

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
  if (!inputMessage.value.trim() || isTyping.value) return;

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
  if (event.key === 'Enter' && !event.shiftKey) {
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
                  <span class="ml-2 text-sm text-emerald-600">AI正在思考...</span>
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
              class="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="输入你想说的话..."
              rows="1"
              :disabled="isTyping"
              @keypress="handleKeyPress"
              @input="handleTextareaInput"
            ></textarea>
          </div>

          <!-- 发送按钮 -->
          <button
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!inputMessage.trim() || isTyping"
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
          按 Enter 发送消息，Shift + Enter 换行
        </div>
      </div>
    </div>
  </div>
</template>
