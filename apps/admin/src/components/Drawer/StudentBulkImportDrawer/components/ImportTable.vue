<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Table } from 'ant-design-vue';
import dayjs from 'dayjs';

const props = defineProps<{
  columns: any[];
  dataSource: any[];
}>();

const currentPagination = ref({
  total: 0,
  current: 1,
  pageSize: 5,
});

function handleChange(pagination: any) {
  const { current, pageSize } = pagination;
  currentPagination.value.current = current;
  currentPagination.value.pageSize = pageSize;
}

onMounted(() => {
  if (props.dataSource && props.dataSource.length > 0) {
    currentPagination.value.total = props.dataSource.length;
  }
});
</script>

<template>
  <Table
    :data-source="dataSource"
    :columns="columns"
    bordered
    :pagination="currentPagination"
    @change="handleChange"
  >
    <template #bodyCell="{ column, text }">
      <template v-if="column.dataIndex === 'birthDate'">
        {{ dayjs(text).format('YYYY-MM-DD') }}
      </template>
      <template v-else-if="column.dataIndex === 'errorMessage'">
        {{ text }}
      </template>
    </template>
  </Table>
</template>
