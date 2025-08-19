<script setup lang="ts">
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Drawer as ADrawer,
  Form as AForm,
  Input as AInput,
  Select as ASelect,
} from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

import { specialStudentColumns } from './data';

const open = defineModel<boolean>('open', { required: true });

const specialStudentDrawerOpen = ref<boolean>(false);

const graduationForm = ref({
  gradeId: '',
  graduationYear: '',
  session: '',
});

const gradeOptions = ref([
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' },
  { label: '三年级', value: '3' },
]);

const graduationYearOptions = ref([
  { label: '2025年', value: '2025' },
  { label: '2026年', value: '2026' },
  { label: '2027年', value: '2027' },
]);

const selectedSpecialStudents = ref([
  {
    name: '张三',
    studentId: '1234567890',
    class: '1班',
    status: '观察中',
  },
  {
    name: '王五',
    studentId: '1234567890',
    class: '1班',
    status: '严重',
  },
]);

const rules = ref({
  gradeId: [{ required: true, message: '请选择年级' }],
  graduationYear: [{ required: true, message: '请选择毕业年份' }],
  session: [{ required: true, message: '请输入届别' }],
});
</script>

<template>
  <ADrawer v-model:open="open" width="720" :closable="false">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/graduation_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">年级毕业</span>
      </div>
    </template>

    <div class="mx-2 mb-2">
      <AForm :model="graduationForm" :rules="rules">
        <AForm.Item name="gradeId">
          <div class="flex flex-col gap-1">
            <LyLabel title="年级" required custom-title-class="text-sm" />
            <ASelect
              v-model:value="graduationForm.gradeId"
              :options="gradeOptions"
              placeholder="请选择"
            />
          </div>
        </AForm.Item>

        <AForm.Item name="graduationYear">
          <div class="flex flex-col gap-1">
            <LyLabel title="毕业年份" required custom-title-class="text-sm" />
            <ASelect
              v-model:value="graduationForm.graduationYear"
              :options="graduationYearOptions"
              placeholder="请选择"
            />
          </div>
        </AForm.Item>

        <AForm.Item name="session">
          <div class="flex flex-col gap-1">
            <LyLabel title="届别" required custom-title-class="text-sm" />
            <AInput
              v-model:value="graduationForm.session"
              placeholder="如：2024届"
            />
          </div>
        </AForm.Item>
      </AForm>

      <!-- 毕业提示 -->
      <div
        class="mt-8 space-y-3 rounded-xl border border-solid border-[#FF9C05CC] bg-[#FF9C0514] p-3"
      >
        <div class="flex items-center gap-2">
          <IconifyIcon icon="mdi:alert-circle" color="#FF9C05" />
          <span class="text-xs font-medium text-[#FF9C05]">毕业提示</span>
        </div>
        <ul class="list-disc space-y-2 pl-5 text-xs text-[#979899]">
          <li>整个年级的学生将统一毕业归档</li>
          <li>心理状态为"严重"、"重大"、"一般"、"观察中"的学生需要特殊处理</li>
          <li>毕业后学生将转入已毕业档案管理</li>
        </ul>
      </div>

      <ADrawer
        v-model:open="specialStudentDrawerOpen"
        width="600"
        :closable="false"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <img
              src="../../../static/icons/student/special_student.png"
              class="w-5"
            />
            <span class="text-lg font-bold">特殊状态学生处理</span>
          </div>
        </template>

        <div
          class="overflow-hidden rounded-xl border border-solid border-[#EAEBED]"
        >
          <ATable
            :columns="specialStudentColumns"
            :data-source="selectedSpecialStudents"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <span
                  class="rounded bg-[#1966FF14] px-2 py-1 text-xs text-[#1966FF]"
                >
                  {{ record.status }}
                </span>
              </template>
              <template v-if="column.key === 'action'">
                <span class="cursor-pointer text-sm text-[#1966FF]">
                  由心理老师处理
                </span>
              </template>
            </template>
          </ATable>
        </div>

        <div
          class="mt-6 flex items-center gap-2 rounded-xl border border-solid border-[#FF9C05CC] bg-[#FF9C0514] p-3"
        >
          <IconifyIcon icon="mdi:alert-circle" color="#FF9C05" />
          <span class="text-xs font-medium text-[#FF9C05]">
            注意: 以上学生心理状态需要特殊处理后才能毕业
          </span>
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <LyButton size="middle" @click="specialStudentDrawerOpen = false">
              取消
            </LyButton>
            <LyButton
              type="success"
              size="middle"
              @click="specialStudentDrawerOpen = false"
            >
              确认处理
            </LyButton>
          </div>
        </template>
      </ADrawer>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <LyButton size="middle" @click="open = false">取消</LyButton>
        <LyButton
          type="success"
          size="middle"
          @click="specialStudentDrawerOpen = true"
        >
          确认毕业
        </LyButton>
      </div>
    </template>
  </ADrawer>
</template>

<style lang="scss" scoped>
:deep(.ant-table-cell::before) {
  display: none !important;
}

:deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none !important;
}
</style>
