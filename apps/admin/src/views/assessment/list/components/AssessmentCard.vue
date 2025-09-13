<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { Copy } from '@vben/icons';

import {
  Divider,
  DropdownButton,
  Menu,
  message,
  Progress,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { deleteAssessmentTask } from '#/api/psychology/assessment/index';
import EditAssessmentDialog from '#/components/Dialog/EditAssessmentDialog/index.vue';
import LyTag from '#/components/LyTag/index.vue';

const props = defineProps<{
  card: AssessmentTask;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const router = useRouter();

// 编辑任务
const [EditAssessmentModal, editAssessmentApi] = useVbenModal({
  connectedComponent: EditAssessmentDialog,
});

// 删除任务
const [DeleteAssessmentModal, deleteAssessmentApi] = useVbenModal({
  fullscreenButton: false,
  header: false,
  footerClass: '!border-t-0',
  contentClass: '!min-h-20',
  async onConfirm() {
    if (!props.card.taskNo) {
      message.error('任务编号不能为空');
      return;
    }
    try {
      const result = await deleteAssessmentTask(props.card.taskNo);
      if (result) {
        message.success('删除成功');
        emit('refresh');
        deleteAssessmentApi.close();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除任务失败', error);
    }
  },
});

const isButtonAvailable = computed(() => {
  return props.card.status === 1 && props.card.finishNum === 0;
});

// 计算实际完成度百分比
const completionPercentage = computed(() => {
  if (props.card.totalNum === 0) return 0;
  return (
    Math.round((props.card.finishNum ?? 0) / (props.card.totalNum ?? 0)) * 100
  );
});

async function handleCopyTaskNo() {
  try {
    await navigator.clipboard.writeText(props.card.taskNo ?? '');
    message.success('复制成功');
  } catch (error) {
    console.error(error);
    message.error('复制失败');
  }
}

// 处理查看详情点击事件
function handleViewDetail() {
  router.push(`/assessment/detail/${props.card.taskNo}`);
}

/**
 * 编辑任务
 */
function handleEditTask() {
  if (!isButtonAvailable.value) {
    message.error('任务进行中或已有学生完成，无法编辑');
    return;
  }
  editAssessmentApi
    .setData({
      id: props.card.id,
      targetAudience: props.card.targetAudience,
      startline: props.card.startline,
      taskNo: props.card.taskNo,
      taskName: props.card.taskName,
      deadline: props.card.deadline,
      description: props.card.description,
    })
    .open();
}

function handleDeleteTask() {
  if (!isButtonAvailable.value) {
    message.error('已有学生参与的任务不能删除，可选择关闭任务');
    return;
  }
  deleteAssessmentApi.open();
}
</script>

<template>
  <div
    class="assessment-card rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
  >
    <!-- 卡片标题 -->
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2 text-gray-800">
        <span class="text-lg font-semibold">
          {{ card.taskName ?? '' }}
        </span>
        <Copy
          class="size-3 cursor-pointer text-gray-300 transition-all duration-200 hover:text-gray-500"
          @click="handleCopyTaskNo"
        />
      </div>
      <LyTag
        tag-category-key="assessment_task_status"
        :dict-value="String(card.status)"
      />
    </div>

    <!-- 时间信息 -->
    <div class="mb-4 text-xs text-gray-500">
      <span>创建时间：{{ dayjs(card.createTime).format('YYYY-MM-DD') }}</span>
      <Divider type="vertical" class="mx-2 bg-gray-200" />
      <span>有效期至{{ dayjs(card.deadline).format('YYYY-MM-DD') }}</span>
    </div>

    <!-- 进度条 -->
    <div class="mb-3">
      <Progress
        :percent="completionPercentage"
        stroke-color="#04DC70"
        :show-info="false"
        :size="6"
        class="mb-2"
      />
    </div>

    <!-- 完成度信息 -->
    <div class="mb-4 text-sm text-gray-600">
      已完成 {{ card.finishNum }} / {{ card.totalNum }} ({{
        completionPercentage
      }}%)
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-xs text-gray-500">
        {{ card.taskNo }}
      </span>

      <!-- 操作按钮 -->
      <div class="flex justify-end">
        <DropdownButton @click="handleViewDetail" ghost>
          查看详情
          <template #overlay>
            <Menu>
              <Menu.Item key="1" @click="handleEditTask">
                <button>编辑任务</button>
              </Menu.Item>
              <Menu.Item key="2" @click="handleDeleteTask">
                <button class="text-[#FF0831]">删除任务</button>
              </Menu.Item>
              <!-- <Menu.Item key="3" @click="handleCloseTask"> 关闭任务 </Menu.Item> -->
            </Menu>
          </template>
        </DropdownButton>
      </div>
    </div>

    <EditAssessmentModal @refresh="emit('refresh')" />
    <DeleteAssessmentModal title="删除任务">
      <div class="mt-5 p-2 text-sm">
        关闭后学生将无法继续参与测评，已完成的数据保留。确定要关闭吗？
      </div>
    </DeleteAssessmentModal>
  </div>
</template>

<style scoped>
.assessment-card {
  user-select: none;
  border: 1px solid #f0f0f0;
}

.assessment-card:hover {
  border-color: #d9d9d9;
}
</style>
