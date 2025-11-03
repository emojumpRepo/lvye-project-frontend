<script setup lang="ts">
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Divider, Input, Tree } from 'ant-design-vue';

import LyLabel from '#/components/LyLabel/index.vue';

interface Step {
  key: number;
  name: string;
  sort: number;
}

const draggable = ref(false);

const templateConfig = ref<{
  steps: Step[];
  title: string;
}>({
  title: '干预模板',
  steps: [
    {
      key: 1,
      name: '步骤1',
      sort: 1,
    },
    {
      key: 2,
      name: '步骤2',
      sort: 2,
    },
  ],
});

/** 修改步骤名称 */
function handleChangeStepName(step: Step) {
  const index = templateConfig.value.steps.findIndex((s) => s.key === step.key);
  if (index !== -1) {
    templateConfig.value.steps[index]!.name = step.name;
  }
}

/** 删除步骤 */
function handleDeleteStep(step: Step) {
  const index = templateConfig.value.steps.findIndex((s) => s.key === step.key);
  if (index !== -1) {
    templateConfig.value.steps.splice(index, 1);
  }
}

/** 添加步骤 */
function handleAddStep() {
  const lastStep =
    templateConfig.value.steps[templateConfig.value.steps.length - 1]!;
  templateConfig.value.steps.push({
    key: lastStep.key + 1,
    name: '',
    sort: lastStep.sort + 1,
  });
  // 自动聚焦输入框
}

/** 开始拖拽 */
function handleUnDrag() {
  draggable.value = true;
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div>
      <LyLabel title="模板名称" required custom-title-class="text-sm" />
      <Input v-model="templateConfig.title" class="w-[500px]" />
    </div>

    <Divider />

    <div>
      <LyLabel title="预设步骤" required custom-title-class="text-sm" />
      <div class="flex flex-col gap-2">
        <template v-if="templateConfig.steps.length > 0">
          <div class="flex w-[500px] flex-col gap-3">
            <Tree
              :tree-data="templateConfig.steps"
              :draggable="true"
              block-node
            >
              <template #title="step">
                <Input
                  v-model:value="step.name"
                  :maxlength="50"
                  class="w-full"
                  @change="handleChangeStepName(step)"
                >
                  <template #prefix>
                    <IconifyIcon
                      icon="ic:outline-drag-indicator"
                      color="rgb(0 0 0 / 45%)"
                      class="hover:!text-primary drag-icon size-4 cursor-pointer"
                    />
                  </template>
                  <template #suffix>
                    <IconifyIcon
                      icon="mingcute:delete-2-line"
                      color="rgb(0 0 0 / 45%)"
                      class="hover:!text-primary cursor-pointer"
                      @click="handleDeleteStep(step)"
                    />
                  </template>
                </Input>
              </template>
            </Tree>

            <!-- 添加新步骤 -->
            <div
              class="flex cursor-pointer items-center gap-2 text-[#1966FF] hover:!text-[#1966FF]/80"
              @click="handleAddStep()"
            >
              <IconifyIcon icon="material-symbols:add-rounded" class="size-4" />
              <span class="text-xs">添加新步骤</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-tree-switcher) {
  display: none !important;
}

:deep(.ant-tree-list-holder-inner) {
  gap: 6px !important;
}

:deep(.ant-tree-node-content-wrapper) {
  padding: 0 !important;
}
</style>
