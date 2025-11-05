<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import Main from './main.vue';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

// 学生档案
const studentProfileId = ref<number>(0);
const activeTimelineTab = ref<string>('');

/** 学生详情抽屉 */
const [StudentDetailDrawer, studentDetailDrawerApi] = useVbenDrawer({
  class: 'w-2/5',
  footer: false,
  showCancelButton: false,
  showConfirmButton: false,
  destroyOnClose: true,
  onOpenChange: async (open) => {
    if (!open) return;
    const data = studentDetailDrawerApi.getData();
    data.id && (studentProfileId.value = data.id);
    data.activeTimelineTab &&
      (activeTimelineTab.value = data.activeTimelineTab);
  },
});
</script>
<template>
  <StudentDetailDrawer title="学生360°档案">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/360file_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">学生360°档案</span>
      </div>
    </template>

    <div class="h-full">
      <Main
        :student-detail-drawer-api="studentDetailDrawerApi"
        :student-profile-id="studentProfileId"
        :active-timeline-tab="activeTimelineTab"
        @refresh="emit('refresh')"
      />
    </div>
  </StudentDetailDrawer>
</template>
