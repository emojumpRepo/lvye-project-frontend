<script lang="ts" setup>
import { computed } from 'vue';

import {
  Button as AButton,
  Form as AForm,
  Input as AInput,
  Select as ASelect,
  Space as ASpace,
  Tabs as ATabs,
} from 'ant-design-vue';

type Tabs = '全部' | '已完成' | '进行中';

type FilterModel = {
  activeTab: Tabs;
  keyword: string;
  range: string;
  scaleName: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: FilterModel;
  }>(),
  {
    modelValue: () => ({
      scaleName: '我是量表名称1',
      range: '最近20天',
      keyword: '',
      activeTab: '全部' as Tabs,
    }),
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: FilterModel): void;
  (e: 'query'): void;
  (e: 'reset'): void;
}>();

const tabs = [
  { key: '全部', tab: '全部' },
  { key: '进行中', tab: '进行中' },
  { key: '已完成', tab: '已完成' },
];

const filter = computed({
  get: () => props.modelValue!,
  set: (v: FilterModel) => emit('update:modelValue', v),
});

function onQuery() {
  emit('query');
}

function onReset() {
  emit('reset');
}
</script>

<template>
  <div class="rounded-xl bg-white px-6 pb-4">
    <ATabs v-model:active-key="filter.activeTab" size="large">
      <ATabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.tab" />
    </ATabs>

    <AForm layout="inline">
      <AForm.Item>
        <ASelect
          v-model:value="filter.scaleName"
          style="width: 150px"
          :options="[
            { value: '我是量表名称1', label: '我是量表名称1' },
            { value: '我是量表名称2', label: '我是量表名称2' },
          ]"
          allow-clear
        />
      </AForm.Item>

      <AForm.Item>
        <ASelect
          v-model:value="filter.range"
          style="width: 150px"
          :options="[
            { value: '最近7天', label: '最近7天' },
            { value: '最近20天', label: '最近20天' },
            { value: '最近30天', label: '最近30天' },
          ]"
        />
      </AForm.Item>

      <AForm.Item>
        <AInput
          v-model:value="filter.keyword"
          style="width: 150px"
          placeholder="请输入任务名称"
          allow-clear
        />
      </AForm.Item>

      <AForm.Item>
        <ASpace>
          <AButton type="primary" @click="onQuery">查询</AButton>
          <AButton @click="onReset">重置</AButton>
        </ASpace>
      </AForm.Item>
    </AForm>
  </div>
</template>

<style scoped>
/* 轻量化定制 Ant Tabs 样式，尽量沿用默认设计系统 */
:deep(.ant-tabs-nav::before) {
  display: none; /* 去除下边线 */
}

:deep(.ant-tabs-top > .ant-tabs-nav .ant-tabs-ink-bar) {
  height: 3px; /* 稍微加粗指示条 */
}
</style>
