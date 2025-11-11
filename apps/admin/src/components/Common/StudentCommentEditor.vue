<script lang="ts" setup>
import { ref, watch } from 'vue';

import { CircleMinus, CirclePlus } from '@vben/icons';

import { Button, Card, Space } from 'ant-design-vue';

import RichTextEditor from './RichTextEditor.vue';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    minHeight?: number;
    modelValue?: string[];
  }>(),
  {
    modelValue: () => [],
    disabled: false,
    minHeight: 200,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string[]): void;
  (e: 'change', v: string[]): void;
}>();

const comments = ref<string[]>([...(props.modelValue || [])]);

// 如果没有评语，默认添加一条
if (comments.value.length === 0) {
  comments.value.push('');
}

watch(
  () => props.modelValue,
  (v) => {
    if (JSON.stringify(v) !== JSON.stringify(comments.value)) {
      comments.value = [...(v || [])];
      if (comments.value.length === 0) {
        comments.value.push('');
      }
    }
  },
  { deep: true },
);

function handleCommentChange(index: number, value: string) {
  comments.value[index] = value;
  emitUpdate();
}

function handleAddComment() {
  comments.value.push('');
  emitUpdate();
}

function handleDeleteComment(index: number) {
  comments.value.splice(index, 1);
  // 至少保留一条评语
  if (comments.value.length === 0) {
    comments.value.push('');
  }
  emitUpdate();
}

function emitUpdate() {
  const filteredComments = comments.value.filter((c) => c && c.trim());
  emit('update:modelValue', filteredComments);
  emit('change', filteredComments);
}
</script>

<template>
  <div class="student-comment-editor">
    <Space direction="vertical" :size="16" class="w-full">
      <Card
        v-for="(comment, index) in comments"
        :key="index"
        size="small"
        :title="`评语 ${index + 1}`"
        class="comment-card"
      >
        <template #extra>
          <Button
            v-if="comments.length > 1"
            type="text"
            danger
            size="small"
            :disabled="props.disabled"
            @click="handleDeleteComment(index)"
          >
            <CircleMinus />
            删除
          </Button>
        </template>
        <RichTextEditor
          :model-value="comment"
          :disabled="props.disabled"
          :height="minHeight"
          placeholder="请输入学生端评语，支持富文本格式"
          @update:model-value="(v) => handleCommentChange(index, v)"
        />
      </Card>
    </Space>

    <div class="mt-4">
      <Button
        type="dashed"
        block
        :disabled="props.disabled"
        @click="handleAddComment"
      >
        <CirclePlus />
        添加评语
      </Button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.student-comment-editor {
  .comment-card {
    :deep(.ant-card-head) {
      min-height: auto;
      padding: 8px 16px;
    }

    :deep(.ant-card-body) {
      padding: 16px;
    }
  }
}
</style>
