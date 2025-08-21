<script lang="ts" setup>
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { computed, onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Form as AForm,
  Select as ASelect,
  Table as ATable,
  Textarea as ATextarea,
} from 'ant-design-vue';

import LyLabel from '#/components/LyLabel/index.vue';

interface DeptOption {
  value: number;
  label: string;
  children?: { label: string; value: number }[];
}

// ============= 数据 =============
const selectedStudents = ref<PsychologyStudentProfileApi.StudentProfile[]>([]);
const formRef = ref();

const columns = [
  {
    title: '学生姓名',
    dataIndex: 'name',
    key: 'name',
    width: 120,
  },
  {
    title: '学号',
    dataIndex: 'studentNo',
    key: 'studentNo',
  },
  {
    title: '当前班级',
    dataIndex: 'className',
    key: 'className',
  },
  {
    title: '操作',
    key: 'action',
  },
];

const transferForm = ref({
  gradeId: undefined,
  classId: undefined,
  reason: '',
  remark: '',
});

const deptList = ref<DeptOption[]>([]);

const classList = computed(() => {
  return (
    deptList.value.find((dept) => dept.value === transferForm.value.gradeId)
      ?.children || []
  );
});

const reasonOptions = ref([
  { label: '转学', value: '1' },
  { label: '休学', value: '2' },
  { label: '退学', value: '3' },
]);

// =================== 事件 ===================
const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[720px]',
  confirmText: '确认换班',
  onOpenChange: async () => {
    const data = drawerApi.getData();
    if (data.selectedStudents.length > 0) {
      selectedStudents.value = data.selectedStudents;
    }
  },
  onClosed: () => {
    formRef.value?.resetFields();
    drawerApi.close();
  },
});

function handleRemoveStudent(
  record: PsychologyStudentProfileApi.StudentProfile,
) {
  selectedStudents.value = selectedStudents.value.filter(
    (student) => student.studentNo !== record.studentNo,
  );
}

onMounted(() => {
  const stored = sessionStorage.getItem('deptList');
  if (stored) {
    deptList.value = JSON.parse(stored);
  }
});
</script>

<template>
  <Drawer title="批量换班学生">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/transfer_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">批量换班学生</span>
      </div>
    </template>

    <div class="mx-1">
      <!-- 已选择学生标题 -->
      <div class="mt-2 font-bold">
        <span>已选择学生</span>
        <span>（{{ selectedStudents.length }}名）</span>
      </div>

      <!-- 已选择学生表格 -->
      <div
        class="mt-4 overflow-hidden rounded-xl border border-solid border-[#EAEBED]"
      >
        <ATable
          :columns="columns"
          :data-source="selectedStudents"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <span
                class="cursor-pointer text-sm text-[#1966FF]"
                @click="
                  handleRemoveStudent(
                    record as PsychologyStudentProfileApi.StudentProfile,
                  )
                "
              >
                移除
              </span>
            </template>
          </template>
        </ATable>
      </div>

      <!-- 换班表单 -->
      <div class="mt-6">
        <AForm ref="formRef">
          <div>
            <LyLabel
              title="目标年级"
              required
              custom-title-class="font-normal"
            />
            <AForm.Item name="grade">
              <ASelect
                v-model:value="transferForm.gradeId"
                :options="deptList"
              />
            </AForm.Item>
          </div>

          <div>
            <LyLabel
              title="目标班级"
              required
              custom-title-class="font-normal"
            />
            <AForm.Item name="grade">
              <ASelect
                v-model:value="transferForm.classId"
                :options="classList"
              />
            </AForm.Item>
          </div>

          <div>
            <LyLabel
              title="换班理由"
              required
              custom-title-class="font-normal"
            />
            <AForm.Item name="grade">
              <ASelect
                v-model:value="transferForm.reason"
                :options="reasonOptions"
              />
            </AForm.Item>
          </div>

          <div>
            <LyLabel
              title="备注说明"
              required
              custom-title-class="font-normal"
            />
            <AForm.Item name="grade">
              <ATextarea v-model:value="transferForm.remark" />
            </AForm.Item>
          </div>
        </AForm>
      </div>
    </div>
  </Drawer>
</template>

<style lang="scss" scoped>
:deep(.ant-table-cell::before) {
  display: none !important;
}

:deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none !important;
}
</style>
