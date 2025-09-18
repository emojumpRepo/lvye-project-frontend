<script lang="ts" setup>
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Spin as ASpin, message } from 'ant-design-vue';

import { deleteStudentProfile } from '#/api/psychology/student-profile';
import ImportTable from '#/components/Drawer/StudentBulkImportDrawer/components/ImportTable.vue';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const selectedStudents = ref<PsychologyStudentProfileApi.StudentProfile[]>([]);
const loading = ref(true);

const studentBulkImportColumns = ref([
  {
    title: '学号',
    dataIndex: 'studentNo',
  },
  {
    title: '姓名',
    dataIndex: 'name',
  },
  {
    title: '班级',
    dataIndex: 'className',
  },
]);

const [BulkDeleteStudentModal, bulkDeleteStudentModalApi] = useVbenModal({
  title: '批量删除学生',
  class: 'w-[650px] !h-full',
  fullscreenButton: false,
  destroyOnClose: true,
  onOpenChange: async (open) => {
    if (open) {
      const data = await bulkDeleteStudentModalApi.getData();
      selectedStudents.value = data.selectedStudents;
      loading.value = false;
    }
  },
  onConfirm: async () => {
    loading.value = true;
    const selectedRowKeys = selectedStudents.value.map((student) => student.id);
    try {
      await Promise.all(
        selectedRowKeys.map(
          async (id) => id && (await deleteStudentProfile(id)),
        ),
      );
      message.success('批量删除成功');
    } catch (error) {
      console.error('批量删除失败:', error);
    } finally {
      emit('refresh');
      bulkDeleteStudentModalApi.close();
      loading.value = false;
    }
  },
});
</script>

<template>
  <BulkDeleteStudentModal title="批量删除">
    <ASpin :spinning="loading">
      <div class="space-y-3 px-2">
        <div class="font-bold">确定删除以下学生吗？</div>
        <div
          class="mt-4 space-y-3 rounded-xl border border-solid border-[#FF9C05CC] bg-[#FF9C0514] p-3"
        >
          <div class="flex items-center gap-2">
            <IconifyIcon icon="mdi:alert-circle" color="#FF9C05" />
            <span class="text-xs font-medium text-[#FF9C05]">删除提示</span>
          </div>
          <ul class="list-disc space-y-2 pl-5 text-xs text-[#979899]">
            <li>删除后该学生将无法登录系统</li>
            <li>相关测评数据将被隐藏</li>
            <li>30天内可以恢复删除的数据</li>
          </ul>
        </div>
        <div>
          <ImportTable
            :columns="studentBulkImportColumns"
            :data-source="selectedStudents"
          />
        </div>
      </div>
    </ASpin>
  </BulkDeleteStudentModal>
</template>
