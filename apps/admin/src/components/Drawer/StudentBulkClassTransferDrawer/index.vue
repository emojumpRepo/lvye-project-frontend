<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Form as AForm,
  Select as ASelect,
  Table as ATable,
  Textarea as ATextarea,
} from 'ant-design-vue';

import LyFormLabel from '#/components/LyFormLabel/index.vue';

const [Drawer] = useVbenDrawer({
  class: 'w-[720px]',
  confirmText: '确认换班',
});

const columns = [
  {
    title: '学生姓名',
    dataIndex: 'name',
    key: 'name',
    width: 120,
  },
  {
    title: '学号',
    dataIndex: 'studentId',
    key: 'studentId',
  },
  {
    title: '当前班级',
    dataIndex: 'currentClass',
    key: 'currentClass',
  },
  {
    title: '操作',
    key: 'action',
  },
];

// 模拟数据
const selectedStudents = ref([
  {
    name: '张三',
    studentId: '123456',
    currentClass: '1班',
  },
  {
    name: '张三',
    studentId: '123456',
    currentClass: '1班',
  },
  {
    name: '张三',
    studentId: '123456',
    currentClass: '1班',
  },
]);

const transferForm = ref({
  gradeId: '',
  classId: '',
  reason: '',
  remark: '',
});

const gradeOptions = ref([
  { label: '高一', value: '1' },
  { label: '高二', value: '2' },
  { label: '高三', value: '3' },
]);

const classOptions = ref([
  { label: '1班', value: '1' },
  { label: '2班', value: '2' },
]);

const reasonOptions = ref([
  { label: '转学', value: '1' },
  { label: '休学', value: '2' },
  { label: '退学', value: '3' },
]);
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
          <template #bodyCell="{ column }">
            <template v-if="column.key === 'action'">
              <span class="cursor-pointer text-sm text-[#1966FF]">移除</span>
            </template>
          </template>
        </ATable>
      </div>

      <!-- 换班表单 -->
      <div class="mt-6">
        <AForm>
          <div>
            <LyFormLabel label="目标年级" required />
            <AForm.Item name="grade">
              <ASelect
                v-model:value="transferForm.gradeId"
                :options="gradeOptions"
              />
            </AForm.Item>
          </div>

          <div>
            <LyFormLabel label="目标班级" required />
            <AForm.Item name="grade">
              <ASelect
                v-model:value="transferForm.classId"
                :options="classOptions"
              />
            </AForm.Item>
          </div>

          <div>
            <LyFormLabel label="换班理由" required />
            <AForm.Item name="grade">
              <ASelect
                v-model:value="transferForm.reason"
                :options="reasonOptions"
              />
            </AForm.Item>
          </div>

          <div>
            <LyFormLabel label="备注说明" required />
            <AForm.Item name="grade">
              <ATextarea v-model:value="transferForm.remark" disabled />
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
