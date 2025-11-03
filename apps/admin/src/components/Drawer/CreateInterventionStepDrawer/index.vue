<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Tabs as ATabs } from 'ant-design-vue';

import StudentProfile from '#/components/Drawer/StudentDetailDrawer/main.vue';

const activeKey = ref('1');
const studentProfileId = ref<number>(0);

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
          <div>步骤详情</div>
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
