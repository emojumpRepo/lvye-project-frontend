<script setup lang="ts">
import { onMounted } from 'vue';

import { Pagination as APagination, Spin as ASpin } from 'ant-design-vue';

import { useTask } from '../composables/useTask';
import AssessmentCard from './AssessmentCard.vue';

// 使用 hook 管理测评任务数据
const {
  loading,
  pageSize,
  current,
  total,
  cards,
  loadData,
  handlePageChange,
  search,
  filterByStatus,
  resetSearch,
} = useTask();

onMounted(async () => {
  await loadData();
});

// 暴露方法给父组件
defineExpose({
  search,
  filterByStatus,
  resetSearch,
});
</script>

<template>
  <div class="flex h-full w-full flex-1 flex-col gap-4">
    <Transition name="fade" mode="out-in">
      <div v-if="loading" class="flex flex-1 items-center justify-center">
        <ASpin spinning />
      </div>
      <div v-else class="flex flex-1 flex-col gap-4">
        <template v-if="cards.length > 0">
          <div
            class="grid flex-1 grid-cols-1 grid-rows-3 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
          >
            <AssessmentCard v-for="card in cards" :key="card.id" :card="card" />
          </div>
        </template>
        <template v-else>
          <div class="flex flex-1 items-center justify-center">
            暂无测评任务哦，快去创建一个吧~
          </div>
        </template>
      </div>
    </Transition>
    <div class="flex shrink-0 justify-end">
      <APagination
        v-model:current="current"
        :default-page-size="9"
        :show-size-changer="true"
        :show-total="(total) => `共 ${total} 个测评任务`"
        :show-quick-jumper="true"
        :page-size="pageSize"
        :total="total"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
:deep(.ant-pagination-item-active) {
  background-color: #0bd092 !important;

  &:hover {
    background-color: #6de3be !important;
  }

  a {
    color: #fff !important;
  }
}
</style>
