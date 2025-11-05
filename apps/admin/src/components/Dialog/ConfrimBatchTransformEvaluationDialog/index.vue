<script lang="ts" setup>
import type { InterventionAssessmentReqVO } from '#/api/psychology';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Avatar as AAvatar,
  List as AList,
  ListItem as AListItem,
  ListItemMeta as AListItemMeta,
  message,
} from 'ant-design-vue';

import { submitIndependentAssessment } from '#/api/psychology';
import CreateEvaluationDialog from '#/components/Dialog/CreateEvaluationDialog/index.vue';

const studentData = ref<
  {
    className: string;
    studentName: string;
    studentNo: string;
    studentProfileId: number;
  }[]
>([]);

// 评估弹窗
const [CreateEvaluationModal, createEvaluationModalApi] = useVbenModal({
  connectedComponent: CreateEvaluationDialog,
});

const [
  ConfrimBatchTransformEvaluationModal,
  confrimBatchTransformEvaluationModalApi,
] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  class: 'w-[500px]',
  onOpenChange: async (open) => {
    if (open) {
      const data = await confrimBatchTransformEvaluationModalApi.getData();
      studentData.value = data.studentData;
    }
  },
  onConfirm: async () => {
    createEvaluationModalApi
      .setData({
        confirmInfo: {
          studentInfo: studentData.value,
        },
      })
      .open();
  },
});

/**
 * 批量发布评估
 * @param params 评估表单数据
 */
async function publishAssessment(params: InterventionAssessmentReqVO) {
  // 1. 检查是否有批量学生数据
  if (studentData.value.length === 0) {
    message.warn('没有需要批量评估的学生，操作已取消');
    return false;
  }

  try {
    // 2. 提取通用载荷
    const commonPayload = {
      ...params,
      content: params.consultRecord,
      sourceType: 3,
    };

    // 3. 构建所有学生的提交请求
    const submissions = studentData.value.map((student) => {
      return submitIndependentAssessment({
        studentProfileId: student.studentProfileId,
        ...commonPayload,
      });
    });

    // 4. 并发执行所有提交
    const results = await Promise.allSettled(submissions);

    // 5. 统计成功和失败的数量
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;
    const failCount = studentData.value.length - successCount;

    // 6. 根据结果给出提示
    if (successCount === 0) {
      // 全部失败
      console.error('批量评估全部失败:', results);
      message.error(`批量创建评估全部失败，共${studentData.value.length}个。`);
      studentData.value = [];
      return false;
    } else if (failCount > 0) {
      console.warn(
        '部分评估提交失败:',
        results.filter(
          (r) =>
            r.status === 'rejected' ||
            (r.status === 'fulfilled' && r.value === false),
        ),
      );
      message.warning(
        `批量创建评估部分成功：成功${successCount}个，失败${failCount}个。`,
      );
    } else {
      message.success(`批量创建评估成功，共${successCount}个。`);
    }

    studentData.value = [];
    return true;
  } catch (error) {
    console.error('批量评估异常:', error);
    message.error('批量评估时发生意外错误');
    studentData.value = [];
    return false;
  }
}

/** 关闭 */
function handleClose() {
  confrimBatchTransformEvaluationModalApi.close();
}
</script>

<template>
  <ConfrimBatchTransformEvaluationModal title="确认学生转入评估">
    <div>
      <AList item-layout="horizontal" :data-source="studentData">
        <template #renderItem="{ item }">
          <AListItem>
            <AListItemMeta>
              <template #title>
                <div class="flex items-center gap-2 font-medium">
                  <span>{{ item.studentName }}（{{ item.studentNo }}）</span>
                  <span>{{ item.className }}</span>
                </div>
              </template>
              <template #avatar>
                <AAvatar
                  :style="{
                    backgroundColor: '#04DC70',
                    color: '#fff',
                    verticalAlign: 'middle',
                  }"
                >
                  {{ item.studentName.slice(0, 1) }}
                </AAvatar>
              </template>
            </AListItemMeta>
          </AListItem>
        </template>
      </AList>

      <CreateEvaluationModal
        :publish="publishAssessment"
        @close="handleClose"
      />
    </div>
  </ConfrimBatchTransformEvaluationModal>
</template>

<style lang="scss" scoped>
:deep(.ant-list-item-meta) {
  align-items: center !important;
}

:deep(.ant-list-item-meta-title) {
  margin-bottom: 0 !important;
}

:deep(.ant-list-item) {
  border-block-end: none !important;
}
</style>
