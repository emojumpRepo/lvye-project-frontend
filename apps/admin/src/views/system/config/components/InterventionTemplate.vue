<script setup lang="ts">
import type { AntTreeNodeDropEvent } from 'ant-design-vue/es/tree';

import { onMounted, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Divider, Input, message, Spin, Tree } from 'ant-design-vue';

import {
  createInterventionTemplate,
  deleteInterventionTemplate,
  getInterventionTemplate,
  updateInterventionTemplate,
} from '#/api/psychology';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

interface Step {
  id?: number;
  key: number;
  name: string;
  sort: number;
}

const props = defineProps<{
  templateId?: number;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const selectedKeys = defineModel<string[]>('selectedKeys');

const loading = ref(false);

const templateConfig = ref<{
  isOfficial: boolean;
  steps: Step[];
  title: string;
}>({
  title: '',
  isOfficial: false,
  steps: [
    {
      id: undefined,
      key: 1,
      name: '',
      sort: 1,
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
  if (templateConfig.value.steps.length >= 20) {
    return message.info('最多只能添加20个步骤');
  }

  const lastStep =
    templateConfig.value.steps[templateConfig.value.steps.length - 1]!;
  templateConfig.value.steps.push({
    key: lastStep.key + 1,
    name: '',
    sort: lastStep.sort + 1,
  });
}

/** 拖拽开始 - 检查是否点击在拖拽图标上 */
function onDragStart(info: any) {
  // 获取原始的 DOM 事件
  const originalEvent = info.event as DragEvent;

  // 获取实际点击的元素（MouseEvent 中的坐标信息）
  const clickedElement = document.elementFromPoint(
    originalEvent.clientX,
    originalEvent.clientY,
  ) as HTMLElement;

  // 检查实际点击的元素是否在 drag-icon 或 prefix 内
  const isDragIcon = clickedElement?.closest('.drag-icon') !== null;
  const isInPrefix = clickedElement?.closest('.ant-input-prefix') !== null;

  // 如果不是拖拽图标区域，阻止拖拽
  const shouldAllowDrag = isDragIcon || isInPrefix;
  if (!shouldAllowDrag) {
    originalEvent.preventDefault();
  }
}

/** 拖拽结束 */
function onDrop(info: AntTreeNodeDropEvent) {
  const dragKey = info.dragNode.key as number;
  const dropKey = info.node.key as number;

  // 找到拖拽项和目标项的索引
  const dragIndex = templateConfig.value.steps.findIndex(
    (s) => s.key === dragKey,
  );
  const dropIndex = templateConfig.value.steps.findIndex(
    (s) => s.key === dropKey,
  );

  if (dragIndex === -1 || dropIndex === -1) return;

  // 从原位置移除被拖拽项
  const [draggedItem] = templateConfig.value.steps.splice(dragIndex, 1);

  // 计算最终插入位置
  // 如果从前往后拖，dropIndex 需要调整；如果从后往前拖，保持不变
  const finalDropIndex = dragIndex < dropIndex ? dropIndex : dropIndex;

  // 插入到新位置
  templateConfig.value.steps.splice(finalDropIndex, 0, draggedItem!);

  // 更新所有步骤的 sort 值
  templateConfig.value.steps.forEach((step, index) => {
    step.sort = index + 1;
  });
}

/** 删除模板 */
async function handleDeleteTemplate() {
  if (!props.templateId) return;

  confirm({
    icon: 'warning',
    title: '删除模板',
    content: '删除后无法选择该模板作为干预模板，确定删除该模板吗？',
  }).then(async () => {
    loading.value = true;
    try {
      const response = await deleteInterventionTemplate(
        props.templateId as number,
      );
      if (response) {
        message.success('删除模板成功');
      } else {
        message.error('删除模板失败');
      }
    } catch (error) {
      console.error(error);
      message.error('删除模板失败');
    } finally {
      emit('refresh');
      loading.value = false;
    }
  });
}

/** 保存模板 */
async function handleSaveTemplate() {
  if (templateConfig.value.title.trim() === '') {
    message.error('请输入模板名称');
    return;
  }
  if (templateConfig.value.steps.length === 0) {
    message.error('请添加预设步骤');
  }
  const hasEmptyStep = templateConfig.value.steps.some((step) => {
    if (step.name.trim() === '') {
      message.error(`请输入步骤${step.sort}的内容`);
      return true;
    }
    return false;
  });
  if (hasEmptyStep) return;

  loading.value = true;
  await (props.templateId ? handleUpdateTemplate() : handleCreateTemplate());
}

/** 创建模板 */
async function handleCreateTemplate() {
  try {
    const id = await createInterventionTemplate({
      title: templateConfig.value.title,
      isOfficial: false,
      steps: templateConfig.value.steps.map((step) => ({
        title: step.name,
        sort: step.sort,
      })),
    });
    if (id) {
      emit('refresh');
      selectedKeys.value = [String(id)];
      message.success('创建模板成功');
    } else {
      message.error('创建模板失败');
    }
  } catch (error) {
    console.error(error);
    message.error('创建模板失败');
  } finally {
    loading.value = false;
  }
}

/** 更新模板 */
async function handleUpdateTemplate() {
  try {
    const response = await updateInterventionTemplate({
      id: props.templateId,
      title: templateConfig.value.title,
      isOfficial: templateConfig.value.isOfficial,
      steps: templateConfig.value.steps.map((step) => ({
        id: step.id,
        title: step.name,
        sort: step.sort,
      })),
    });
    if (response) {
      emit('refresh');
      message.success('更新模板成功');
    } else {
      message.error('更新模板失败');
    }
  } catch (error) {
    console.error(error);
    message.error('更新模板失败');
  } finally {
    loading.value = false;
  }
}

/** 加载模板 */
async function loadTemplate() {
  if (!props.templateId) return;

  try {
    const response = await getInterventionTemplate(props.templateId);
    if (response) {
      templateConfig.value.title = response.title;
      templateConfig.value.isOfficial = response.isOfficial;
      templateConfig.value.steps = response.steps.map((step) => ({
        id: step.id,
        key: step.id ?? 0,
        name: step.title,
        sort: step.sort,
      }));
    }
  } catch (error) {
    console.error(error);
    message.error('加载模板失败');
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (props.templateId) {
    await loadTemplate();
  }
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <Spin :spinning="loading">
      <div>
        <LyLabel title="模板名称" required custom-title-class="text-sm" />
        <Input v-model:value="templateConfig.title" class="w-[500px]" />
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
                @dragstart="onDragStart"
                @drop="onDrop"
              >
                <template #title="step">
                  <Input
                    v-model:value="step.name"
                    :maxlength="50"
                    class="w-full"
                    @change="handleChangeStepName(step)"
                  >
                    <template #prefix>
                      <div class="drag-icon">
                        <IconifyIcon
                          icon="ic:outline-drag-indicator"
                          color="rgb(0 0 0 / 45%)"
                          class="hover:!text-primary size-4 cursor-pointer"
                        />
                      </div>
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
                <IconifyIcon
                  icon="material-symbols:add-rounded"
                  class="size-4"
                />
                <span class="text-xs">添加新步骤</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-7 flex items-center gap-3">
        <LyButton
          type="error"
          ghost
          size="small"
          @click="handleDeleteTemplate()"
        >
          删除模板
        </LyButton>
        <LyButton type="success" size="small" @click="handleSaveTemplate">
          保存模板
        </LyButton>
      </div>
    </Spin>
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
