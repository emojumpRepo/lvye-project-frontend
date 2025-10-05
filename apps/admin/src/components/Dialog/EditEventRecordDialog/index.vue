<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form as AForm,
  Select as ASelect,
  Textarea as ATextarea,
  message,
} from 'ant-design-vue';

import {
  assignHandler,
  updateEventRecord,
  updateHandler,
} from '#/api/psychology/risk';
import { getTeacherUserList } from '#/api/system/user';
import LyLabel from '#/components/LyLabel/index.vue';

interface HandleUserOption {
  label: string;
  value: number;
  deptId: number;
  deptName: string;
}

interface Params {
  recordId?: number;
  id?: number;
  content?: string;
  type:
    | 'ASSIGN_HANDLER'
    | 'CHOOSE_PROCESS'
    | 'CLOSE'
    | 'REASSIGN_HANDLER'
    | 'REOPEN'
    | 'REPORT'
    | 'STAGE_ASSESSMENT'
    | 'UPDATE_DESCRIPTION';
}

const emits = defineEmits<{
  (e: 'reloadCrisisEvent'): void;
}>();

const params = ref<Params>();
const handleUserOptions = ref<HandleUserOption[]>([]);
const formRef = ref();
const editForm = ref({
  handleUserId: undefined,
  content: '',
});

const title = computed(() => {
  if (params.value?.type === 'ASSIGN_HANDLER') {
    return '分配负责人';
  } else if (params.value?.id && params.value?.type === 'REASSIGN_HANDLER') {
    return '更改负责人';
  }

  return '更新事件记录';
});

const config = computed(() => {
  switch (params.value?.type) {
    case 'ASSIGN_HANDLER': {
      return {
        title: '分配负责人',
        label: '',
      };
    }
    case 'CHOOSE_PROCESS': {
      return {
        title: '更新处理方式',
        label: '原因',
      };
    }
    case 'REASSIGN_HANDLER': {
      return {
        title: '更改负责人',
        label: '原因',
      };
    }
    case 'REOPEN': {
      return {
        title: '更新上报事件',
        label: '上报内容',
      };
    }
    case 'STAGE_ASSESSMENT': {
      return {
        title: '更新阶段性评估',
        label: '原因',
      };
    }
    case 'UPDATE_DESCRIPTION': {
      return {
        title: '更新事件描述',
        label: '内容',
      };
    }
    default: {
      return {
        title: '更新事件',
        label: '原因',
      };
    }
  }
});

const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  loading: true,
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = editEventRecordApi.getData() as Params;
    params.value = data;
    editForm.value.content = data.content || '';
    if (
      params.value?.id &&
      (params.value?.type === 'ASSIGN_HANDLER' ||
        params.value?.type === 'REASSIGN_HANDLER')
    ) {
      await loadHandleUserList();
    }
    editEventRecordApi.setState({ loading: false });
  },
  async onConfirm() {
    try {
      editEventRecordApi.lock();
      if (params.value?.id && params.value?.type === 'ASSIGN_HANDLER') {
        handleAssignHandler();
      } else if (
        params.value?.id &&
        params.value?.type === 'REASSIGN_HANDLER'
      ) {
        handleReassignHandler();
      } else {
        updateProcessRecord();
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

/** 分配负责人 */
function handleAssignHandler() {
  try {
    formRef.value.validate().then(async () => {
      if (!params.value?.id) return message.error('缺少事件ID');
      if (!editForm.value.handleUserId) return message.error('未选择负责人');
      const response = await assignHandler({
        id: params.value.id,
        handlerUserId: editForm.value.handleUserId,
      });
      if (!response) return message.error('分配负责人失败');
      emits('reloadCrisisEvent');
      message.success('分配负责人成功');
      editEventRecordApi.close();
    });
  } catch (error) {
    console.error('分配负责人失败', error);
    message.error('分配负责人失败');
  }
}

/** 更改负责人 */
function handleReassignHandler() {
  try {
    formRef.value.validate().then(async () => {
      if (!params.value?.id) return message.error('缺少事件ID');
      if (!editForm.value.handleUserId) return message.error('未选择负责人');
      if (!editForm.value.content) return message.error('未填写原因');
      const response = await updateHandler({
        id: params.value.id,
        newHandlerUserId: editForm.value.handleUserId,
        reason: editForm.value.content,
      });
      if (!response) return message.error('更改负责人失败');
      emits('reloadCrisisEvent');
      message.success('更改负责人成功');
      editEventRecordApi.close();
    });
  } catch (error) {
    console.error('更改负责人失败', error);
    message.error('更改负责人失败');
  }
}

/** 更新事件记录 */
function updateProcessRecord() {
  try {
    formRef.value.validate().then(async () => {
      if (!params.value?.recordId) return message.error('缺少事件记录ID');
      const response = await updateEventRecord({
        id: params.value.recordId,
        content: editForm.value.content,
      });
      if (!response) return message.error('更新失败');
      emits('reloadCrisisEvent');
      message.success('更新成功');
      editEventRecordApi.close();
    });
  } catch (error) {
    console.error('更新失败', error);
    message.error('更新失败');
  }
}
</script>

<template>
  <EditEventRecordModal :title="title">
    <div class="px-2">
      <div>
        <AForm ref="formRef" :model="editForm">
          <!-- 负责人选择 -->
          <AForm.Item
            name="handleUserId"
            v-if="
              params?.type === 'ASSIGN_HANDLER' ||
              (params?.type === 'REASSIGN_HANDLER' && params.id)
            "
          >
            <LyLabel title="负责人" custom-title-class="font-normal text-sm" />
            <ASelect
              v-model:value="editForm.handleUserId"
              class="w-full"
              placeholder="请选择负责人"
              :options="handleUserOptions"
            />
          </AForm.Item>

          <!-- 更新原因 -->
          <AForm.Item name="reason" v-if="params?.type !== 'ASSIGN_HANDLER'">
            <div v-if="params?.recordId" class="mb-3 text-sm font-bold">
              {{ config.title }}：
            </div>
            <LyLabel
              :title="config.label"
              custom-title-class="font-normal text-sm"
            />
            <ATextarea
              v-model:value="editForm.content"
              :rows="4"
              :maxlength="100"
              show-count
              placeholder="请填写"
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
