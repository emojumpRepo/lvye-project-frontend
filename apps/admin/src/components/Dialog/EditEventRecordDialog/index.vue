<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form as AForm,
  Select as ASelect,
  Textarea as ATextarea,
  message,
} from 'ant-design-vue';

import { assignHandler, updateHandler } from '#/api/psychology/risk';
import { getTeacherUserList } from '#/api/system/user';
import LyLabel from '#/components/LyLabel/index.vue';

interface HandleUserOption {
  label: string;
  value: number;
  deptId: number;
  deptName: string;
}

interface Params {
  id: number;
  title: string;
  type: 'assign' | 'update';
}

const emits = defineEmits<{
  (e: 'loadCrisisEventDetail', id: number): void;
  (e: 'loadCrisisEventProcessHistory', id: number): void;
}>();

const params = ref<Params>();
const handleUserOptions = ref<HandleUserOption[]>([]);
const editForm = ref({
  handleUserId: undefined,
  content: '',
});

const rules: Record<string, Rule[]> = {
  handleUserId: [{ required: true, message: '请选择负责人', trigger: 'blur' }],
  content: [{ required: true, message: '请填写原因', trigger: 'blur' }],
};

const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  loading: true,
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = editEventRecordApi.getData() as Params;
    params.value = data;
    await loadHandleUserList();
    editEventRecordApi.setState({ loading: false });
  },
  async onConfirm() {
    if (!editForm.value.handleUserId) return message.error('未选择负责人');
    try {
      editEventRecordApi.lock();
      if (params.value?.type === 'assign') {
        const response = await assignHandler({
          id: params.value.id,
          handlerUserId: editForm.value.handleUserId,
        });
        if (!response) return message.error('分配负责人失败');
        if (params.value?.id) {
          emits('loadCrisisEventDetail', params.value.id);
          emits('loadCrisisEventProcessHistory', params.value.id);
        }
        message.success('分配负责人成功');
        editEventRecordApi.close();
      } else if (params.value?.type === 'update') {
        const response = await updateHandler({
          id: params.value.id,
          newHandlerUserId: editForm.value.handleUserId,
          reason: editForm.value.content,
        });
        if (!response) return message.error('更改负责人失败');
        if (params.value?.id) {
          emits('loadCrisisEventDetail', params.value.id);
          emits('loadCrisisEventProcessHistory', params.value.id);
        }
        message.success('更改负责人成功');
        editEventRecordApi.close();
      }
    } catch (error) {
      console.error('分配负责人失败', error);
    } finally {
      editEventRecordApi.unlock();
    }
  },
});

/** 获取负责人（心理老师和班主任）列表 */
async function loadHandleUserList() {
  try {
    const list = await getTeacherUserList();
    if (list.length === 0) return;
    handleUserOptions.value = list
      .filter((item) => item.id !== null)
      .map((item) => ({
        label: item.nickname ?? '',
        value: item.id,
        deptId: item.deptId,
        deptName: item.deptName,
      }));
  } catch (error) {
    console.error('获取负责人列表失败', error);
  }
}
</script>

<template>
  <EditEventRecordModal :title="params?.title">
    <div class="px-2">
      <div>
        <AForm :model="editForm" :rules="rules">
          <!-- 负责人选择 -->
          <AForm.Item name="handleUserId">
            <LyLabel title="负责人" custom-title-class="font-normal text-sm" />
            <ASelect
              v-model:value="editForm.handleUserId"
              class="w-full"
              placeholder="请选择负责人"
              :options="handleUserOptions"
            />
          </AForm.Item>

          <!-- 更新原因 -->
          <AForm.Item name="reason" v-if="params?.type === 'update'">
            <LyLabel title="原因" custom-title-class="font-normal text-sm" />
            <ATextarea
              v-model:value="editForm.content"
              :rows="4"
              :maxlength="100"
              show-count
              placeholder="请填写原因"
            />
          </AForm.Item>
        </AForm>
      </div>
    </div>
  </EditEventRecordModal>
</template>

<style lang="scss" scoped>
textarea {
  resize: none;
}
</style>
