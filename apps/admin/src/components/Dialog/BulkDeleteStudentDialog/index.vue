<script lang="ts" setup>
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Table as ATable } from 'ant-design-vue';

const selectedStudents = ref<PsychologyStudentProfileApi.StudentProfile[]>([]);

const studentBulkImportColumns = ref([
  {
    title: '学号',
    dataIndex: 'studentNo',
    width: 100,
  },
  {
    title: '姓名',
    dataIndex: 'name',
    width: 100,
  },
  {
    title: '班级',
    dataIndex: 'className',
    width: 100,
  },
]);

const [BulkDeleteStudentModal, BulkDeleteStudentModalApi] = useVbenModal({
  title: '批量删除学生',
  fullscreenButton: false,
  onOpenChange: async (open) => {
    if (open) {
      selectedStudents.value = await BulkDeleteStudentModalApi.getData();
      console.log(selectedStudents.value);
    }
  },
});
</script>

<template>
  <BulkDeleteStudentModal title="批量删除确认">
    <div>
      <div>确定删除以下学生吗？</div>
      <div v-if="selectedStudents.length > 0">
        <ATable
          :columns="studentBulkImportColumns"
          :data-source="selectedStudents"
        />
      </div>
    </div>
  </BulkDeleteStudentModal>
</template>
