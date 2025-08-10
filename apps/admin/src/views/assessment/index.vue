<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import CreateAssessmentDialog from '#/components/Dialog/CreateAssessmentDialog/index.vue';

import AssessmentEmptyState from './components/AssessmentEmptyState.vue';
import AssessmentFilterBar from './components/AssessmentFilterBar.vue';
import AssessmentTaskCard from './components/AssessmentTaskCard.vue';

const filter = reactive({
  scaleName: '我是量表名称1',
  range: '最近20天',
  keyword: '',
  activeTab: '全部' as '全部' | '已完成' | '进行中',
});

type Task = {
  createdAt: string;
  expireAt: string;
  finished: number;
  id: string;
  progress: number; // 0-100
  status: '已完成' | '进行中';
  total: number;
  type: '初测问卷' | '复测问卷';
};

const isEmpty = ref(true);
const showCreateDialog = ref(false);

const list = ref<Task[]>([
  {
    id: '25211252',
    status: '进行中',
    createdAt: '2025-01-01',
    expireAt: '2025-01-05',
    type: '初测问卷',
    progress: 37,
    finished: 0,
    total: 1,
  },
  {
    id: '25211254',
    status: '已完成',
    createdAt: '2025-01-01',
    expireAt: '2025-01-05',
    type: '初测问卷',
    progress: 100,
    finished: 1,
    total: 1,
  },
]);

const filtered = computed(() =>
  list.value.filter((i: Task) =>
    filter.activeTab === '全部' ? true : i.status === filter.activeTab,
  ),
);

function reset() {
  filter.scaleName = '我是量表名称1';
  filter.range = '最近20天';
  filter.keyword = '';
}

function openCreateDialog() {
  showCreateDialog.value = true;
}
</script>

<template>
  <div class="flex flex-col gap-6 px-10 pb-8 pt-8">
    <!-- 页面标题 -->
    <h1 class="text-[24px] font-bold leading-[24px] text-[#000000]">
      测评任务管理
    </h1>

    <AssessmentFilterBar v-model="filter" @query="() => {}" @reset="reset" />
    <!-- 空状态 -->
    <AssessmentEmptyState v-if="isEmpty" @create="openCreateDialog" />

    <!-- Cards grid -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3" v-else>
      <AssessmentTaskCard
        v-for="item in filtered"
        :key="item.id"
        v-bind="item"
      />
    </div>

    <!-- 创建测评对话框 -->
    <CreateAssessmentDialog v-model:open="showCreateDialog" />
  </div>
</template>

<style scoped></style>
