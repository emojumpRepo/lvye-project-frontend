<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

const studentInfo = ref<{ name: string; studentNo: string }>({
  studentNo: '',
  name: '',
});

const [DeleteStudentModal, DeleteStudentModalApi] = useVbenModal({
  title: '确定删除学生',
  fullscreenButton: false,
  confirmText: '确定删除',
  onOpenChange: (open) => {
    if (open) {
      studentInfo.value = DeleteStudentModalApi.getData();
    }
  },
});
</script>
<template>
  <DeleteStudentModal>
    <div class="mx-2">
      <span class="text-sm">
        确定要删除学生{{ studentInfo.name }}（学号：{{
          studentInfo.studentNo
        }}）吗？
      </span>
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
    </div>
  </DeleteStudentModal>
</template>
