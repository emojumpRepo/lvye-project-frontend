<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form as AForm,
  Select as ASelect,
  Textarea as ATextarea,
} from 'ant-design-vue';

import { getTeacherUserList } from '#/api/system/user';
import LyLabel from '#/components/LyLabel/index.vue';

interface HandleUserOption {
  label: string;
  value: number;
  deptId: number;
  deptName: string;
}

interface Params {
  title: string;
}

const params = ref<Params>();
const currentOperator = ref('');
const handleUserOptions = ref<HandleUserOption[]>([]);
const editForm = ref({
  handleUserId: '',
  content: '',
});

const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = editEventRecordApi.getData() as Params;
    params.value = data;
  },
});

onMounted(async () => {
  try {
    const list = await getTeacherUserList();
    if (list.length === 0) return;
    handleUserOptions.value = list
      .filter((item) => item.id !== null)
      .map((item) => ({
        label: item.nickname ?? '',
        value: item.id as number,
        deptId: item.deptId as number,
        deptName: item.deptName as string,
      }));
  } catch (error) {
    console.error('获取负责人列表失败', error);
  }
});
</script>

<template>
  <EditEventRecordModal :title="params?.title">
    <div class="px-2">
      <div>
        <AForm>
          <!-- 负责人选择 -->
          <AForm.Item
            v-if="
              params?.title === '更改负责人' || params?.title === '分配负责人'
            "
            name="handleUserId"
          >
            <LyLabel title="负责人" custom-title-class="font-normal text-sm" />
            <ASelect
              v-model:value="currentOperator"
              class="w-full"
              placeholder="请选择负责人"
              :options="handleUserOptions"
            />
          </AForm.Item>

          <!-- 更新原因 -->
          <AForm.Item name="reason">
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
