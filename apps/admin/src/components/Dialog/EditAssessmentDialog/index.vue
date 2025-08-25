<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { DatePicker, Input, message, Textarea } from 'ant-design-vue';
import dayjs from 'dayjs';

import { updateAssessmentTask } from '#/api/psychology/assessment';
import LyLabel from '#/components/LyLabel/index.vue';
import { useTask } from '#/views/assessment/list/composables/useTask';

const { refresh } = useTask();

// 表单数据
const formData = ref({
  taskName: '',
  deadline: dayjs(),
  description: '',
  taskNo: '',
});

const [EditAssessmentModal, editAssessmentApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = editAssessmentApi.getData();
      formData.value = {
        taskName: data.taskName,
        deadline: dayjs(data.deadline),
        description: data.description,
        taskNo: data.taskNo,
      };
    }
  },
  async onConfirm() {
    console.log('表单信息', formData.value);
    if (!formData.value.taskNo) {
      message.error('任务编号不能为空');
      return;
    }
    if (!formData.value.taskName.trim()) {
      message.error('任务名称不能为空');
      return;
    }
    if (!formData.value.deadline) {
      message.error('结束时间不能为空');
      return;
    }

    loading.value = true;
    try {
      await updateAssessmentTask({
        taskNo: formData.value.taskNo,
        taskName: formData.value.taskName,
        deadline: formData.value.deadline.toISOString(),
        description: formData.value.description,
      });
      message.success('编辑成功');
      await refresh();
      editAssessmentApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  },
  onClosed() {
    formData.value = {
      taskName: '',
      deadline: dayjs(),
      description: '',
      taskNo: '',
    };
    editAssessmentApi.close();
  },
});

// 加载状态
const loading = ref(false);
</script>

<template>
  <EditAssessmentModal title="编辑测评任务" :fullscreen-button="false">
    <div class="space-y-6 p-2">
      <!-- 任务名称 -->
      <div>
        <LyLabel
          title="任务名称"
          required
          size="small"
          custom-title-class="font-normal"
        />
        <Input
          v-model:value="formData.taskName"
          :disabled="loading"
          placeholder="请填写任务名称"
        />
      </div>

      <!-- 结束时间 -->
      <div>
        <LyLabel
          title="结束时间"
          required
          size="small"
          custom-title-class="font-normal"
        />
        <DatePicker
          v-model:value="formData.deadline"
          show-time
          :disabled="loading"
          placeholder="请选择结束时间"
        />
      </div>

      <!-- 任务描述 -->
      <div>
        <LyLabel
          title="任务描述"
          size="small"
          custom-title-class="font-normal"
        />
        <Textarea
          v-model:value="formData.description"
          :rows="3"
          :disabled="loading"
          placeholder="请填写任务描述"
        />
      </div>
    </div>
  </EditAssessmentModal>
</template>
