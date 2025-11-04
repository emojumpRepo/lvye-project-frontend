<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Form as AForm,
  Input as AInput,
  Select as ASelect,
  Tabs as ATabs,
} from 'ant-design-vue';

import StudentProfile from '#/components/Drawer/StudentDetailDrawer/main.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { FileUpload } from '#/components/upload';

const activeKey = ref('1');
const studentProfileId = ref<number>(0);
const stepForm = ref({
  title: '',
  status: undefined,
  notes: '',
  fileList: [],
});

const stepFormRules = ref({
  title: [{ required: true, message: '请填写步骤名称' }],
  status: [{ required: true, message: '请选择状态' }],
});

const statusOptions = ref([
  { label: '待处理', value: 1 },
  { label: '处理中', value: 2 },
  { label: '已完成', value: 3 },
]);

const [CreateInterventionStepDrawer, createInterventionStepDrawerApi] =
  useVbenDrawer({
    destroyOnClose: true,
    header: false,
    footer: false,
    modal: false,
    class: 'w-[800px]',
    onOpenChange: async (open) => {
      if (open) {
        const data = await createInterventionStepDrawerApi.getData();
        studentProfileId.value = data.studentProfileId;
      }
    },
  });
</script>

<template>
  <CreateInterventionStepDrawer title="添加新步骤">
    <div class="h-full">
      <ATabs v-model:active-key="activeKey">
        <ATabs.TabPane key="1" tab="步骤详情">
          <AForm :model="stepForm" :rules="stepFormRules">
            <AForm.Item name="title">
              <LyLabel title="步骤名称" custom-title-class="text-sm" />
              <AInput v-model:value="stepForm.title" />
            </AForm.Item>
            <AForm.Item name="status">
              <LyLabel title="状态" custom-title-class="text-sm" />
              <ASelect
                v-model:value="stepForm.status"
                :options="statusOptions"
              />
            </AForm.Item>
            <AForm.Item name="notes">
              <LyLabel title="教师笔记/详情方案" custom-title-class="text-sm" />
              <AInput.TextArea v-model:value="stepForm.notes" :rows="5" />
            </AForm.Item>
            <AForm.Item name="fileList">
              <LyLabel
                title="文件上传（报告/记录）"
                custom-title-class="text-sm"
              />
              <FileUpload v-model:value="stepForm.fileList" />
            </AForm.Item>
          </AForm>
        </ATabs.TabPane>

        <ATabs.TabPane key="2" tab="学生360°档案">
          <div class="h-full">
            <StudentProfile
              :student-detail-drawer-api="createInterventionStepDrawerApi"
              :student-profile-id="studentProfileId"
            />
          </div>
        </ATabs.TabPane>

        <template #rightExtra>
          <div
            class="mr-4 cursor-pointer"
            @click="createInterventionStepDrawerApi.close()"
          >
            <IconifyIcon icon="lucide:x" class="size-4 hover:!text-gray-500" />
          </div>
        </template>
      </ATabs>
    </div>
  </CreateInterventionStepDrawer>
</template>

<style lang="scss" scoped>
:deep(.ant-tabs) {
  height: 100%;
}

:deep(.ant-tabs-content) {
  height: 100%;
}
</style>
