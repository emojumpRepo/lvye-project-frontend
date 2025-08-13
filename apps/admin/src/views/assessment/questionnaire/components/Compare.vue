<script setup lang="ts">
import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Progress } from 'ant-design-vue';

import LyCardTitle from '#/components/LyCardTitle/index.vue';

interface ClassType {
  label: string;
  value: string;
}

const classType = ref<ClassType[]>([
  {
    label: '年级',
    value: 'grade',
  },
  {
    label: '班级',
    value: 'class',
  },
]);

const currentType = ref('grade');

// 获取按钮的样式类
function getButtonClasses(type: ClassType, index: number) {
  const isActive = currentType.value === type.value;
  const isFirst = index === 0;
  const isLast = index === classType.value.length - 1;

  return [
    // 边框和背景色
    isActive
      ? 'border-[#04DC70] bg-[#14E77E14] text-[#04DC70]'
      : 'border-[#EAEBED] bg-white text-[#979899] hover:bg-gray-50',
    // 圆角处理
    isFirst && 'rounded-l-md',
    isLast && 'rounded-r-md',
  ].filter(Boolean);
}

// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(5);
const totalItems = computed(() => allGradeComparison.value.length);

// 计算总页数
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 模拟更多数据
const allGradeComparison = ref([
  {
    grade: '高一年级',
    status: '持续监测',
    progress: 85,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高二年级',
    status: '持续监测',
    progress: 92,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高三年级',
    status: '持续监测',
    progress: 78,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高一(1)班',
    status: '持续监测',
    progress: 88,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高一(2)班',
    status: '持续监测',
    progress: 95,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高一(3)班',
    status: '持续监测',
    progress: 75,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高一(4)班',
    status: '持续监测',
    progress: 82,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高一(5)班',
    status: '持续监测',
    progress: 90,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高二(1)班',
    status: '持续监测',
    progress: 87,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
  {
    grade: '高二(2)班',
    status: '持续监测',
    progress: 93,
    date: '2024-12-31 16:48',
    trend: 'up',
  },
]);

// 计算当前页显示的数据
const gradeComparison = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return allGradeComparison.value.slice(start, end);
});

// 分页操作函数
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// 计算显示的页码
const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) {
    // 如果总页数不超过7页，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // 如果总页数超过7页，显示部分页码
    if (current <= 4) {
      // 当前页在前4页
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...', total);
    } else if (current >= total - 3) {
      // 当前页在后4页
      pages.push(1, '...');
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // 当前页在中间
      pages.push(1, '...');
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push('...', total);
    }
  }

  return pages;
});
</script>

<template>
  <div class="rounded-xl bg-white p-6">
    <!-- 标题和切换按钮 -->
    <div class="flex items-center justify-between">
      <LyCardTitle
        icon="foundation:results-demographics"
        title="年级班级对比"
        icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
        :pb="3"
      >
        <template #right>
          <div class="flex overflow-hidden">
            <button
              v-for="(type, index) in classType"
              class="border px-4 py-1 text-sm font-medium transition-all duration-200"
              :key="type.value"
              :class="getButtonClasses(type, index)"
              @click="currentType = type.value"
            >
              {{ type.label }}
            </button>
          </div>
        </template>
      </LyCardTitle>
    </div>

    <!-- 年级列表 -->
    <div class="space-y-4">
      <div
        v-for="(item, index) in gradeComparison"
        :key="index"
        class="flex flex-col justify-between gap-2 rounded-xl bg-[#F7F8FA] px-4 py-2"
      >
        <div class="flex items-center justify-between">
          <!-- 左侧年级信息 -->
          <div class="flex items-center space-x-2">
            <div class="text-sm font-medium">{{ item.grade }}</div>
            <span class="rounded bg-[#FF083114] p-1 text-xs text-[#FF0831]">
              {{ item.status }}
            </span>
          </div>

          <!-- 右侧统计信息 -->
          <div class="flex items-center text-xs">
            <IconifyIcon icon="lucide:user-round" color="#979899" :size="10" />
            <span class="ml-1 mr-3 text-[#979899]">324/343人完成</span>
            <span class="rounded-md bg-[#14E77E1F] p-1 text-[#04DC70]">
              {{ item.progress }}%
            </span>
          </div>
        </div>

        <!-- 进度条区域 -->
        <Progress
          :percent="item.progress"
          stroke-color="#04DC70"
          :show-info="false"
          :size="5"
        />
      </div>
    </div>

    <!-- 分页组件 -->
    <div class="mt-6 flex justify-end">
      <div class="flex items-center space-x-2">
        <!-- 上一页按钮 -->
        <button
          class="flex size-7 items-center justify-center rounded text-sm transition-all duration-200"
          :class="
            currentPage <= 1
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-600 hover:bg-gray-100'
          "
          :disabled="currentPage <= 1"
          @click="prevPage"
        >
          <IconifyIcon icon="lucide:chevron-left" :size="16" />
        </button>

        <!-- 页码按钮 -->
        <template v-for="(page, index) in visiblePages" :key="index">
          <!-- 省略号 -->
          <span
            v-if="page === '...'"
            class="flex size-7 items-center justify-center text-sm text-gray-400"
          >
            ...
          </span>
          <!-- 页码按钮 -->
          <button
            v-else
            class="flex size-7 items-center justify-center rounded text-sm transition-all duration-200"
            :class="
              page === currentPage
                ? 'rounded-md border border-[#0AD978] text-[#0AD978]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            "
            @click="goToPage(page as number)"
          >
            {{ page }}
          </button>
        </template>

        <!-- 下一页按钮 -->
        <button
          class="flex size-7 items-center justify-center rounded text-sm transition-all duration-200"
          :class="
            currentPage >= totalPages
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-600 hover:bg-gray-100'
          "
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        >
          <IconifyIcon icon="lucide:chevron-right" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.compare-icon-bg {
  background: linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%);
}

:deep(.ant-progress-line) {
  margin-bottom: 0 !important;
}
</style>
