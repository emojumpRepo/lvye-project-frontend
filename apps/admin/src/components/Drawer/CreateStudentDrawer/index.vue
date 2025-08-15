<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import { reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Checkbox as ACheckbox,
  DatePicker as ADatePicker,
  Form as AForm,
  Input as AInput,
  Radio as ARadio,
  Select as ASelect,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import LyFormLabel from '#/components/LyFormLabel/index.vue';

interface StudentForm {
  name: string;
  studentId: string;
  gender: string;
  grade: string;
  class: string;
  birthDate: string;
  phone: string;
  address: string;
  specialAttention: string[];
}

const validateName = ref(false);
const validateStudentId = ref(false);

const [Drawer] = useVbenDrawer({
  class: 'w-[800px]',
  confirmText: '创建',
  onConfirm: handleCreateStudent,
});

const studentForm = reactive<StudentForm>({
  name: '',
  studentId: '',
  gender: '',
  grade: '',
  class: '',
  birthDate: '',
  phone: '',
  address: '',
  specialAttention: [],
});

const specialAttentionOptions = [
  '家庭困难',
  '学习困难',
  '行为异常',
  '心理风险',
];

const rules: Record<string, Rule[]> = {
  name: [
    {
      validator: (_, value) => {
        validateName.value = false;
        if (!value) {
          return Promise.reject(new Error('请输入学生姓名'));
        }
        if (value.length < 2 || value.length > 10) {
          return Promise.reject(new Error('姓名格式不正确'));
        }
        if (!/^[\u4E00-\u9FA5]+$/.test(value)) {
          return Promise.reject(new Error('姓名格式不正确'));
        }
        validateName.value = true;
        return Promise.resolve();
      },
    },
  ],
  studentId: [
    {
      validator: (_, value) => {
        validateStudentId.value = false;
        if (!value) {
          return Promise.reject(new Error('请输入学号'));
        }
        if (!/^[a-z0-9]+$/i.test(value)) {
          return Promise.reject(new Error('学号格式不符合规范'));
        }
        // if (value && value.length > 0) {
        //   // TODO: 这里可以添加检查学号是否已存在的逻辑、根据学校规则验证学号格式
        //   return Promise.reject(new Error('学号已存在，请检查'));
        // }
        validateStudentId.value = true;
        return Promise.resolve();
      },
    },
  ],
  gender: [{ required: true, message: '请选择性别' }],
  grade: [{ required: true, message: '请选择年级' }],
  class: [{ required: true, message: '请选择班级' }],
  birthDate: [
    { required: true, message: '请选择出生日期' },
    {
      validator: (_, value) => {
        if (value) {
          const birthYear = new Date(value).getFullYear();
          const currentYear = new Date().getFullYear();
          const age = currentYear - birthYear;
          if (age < 12 || age > 20) {
            return Promise.reject(new Error('年龄应在12-20岁之间'));
          }
        }
        return Promise.resolve();
      },
    },
  ],
  phone: [
    {
      validator: (_, value) => {
        if (value && !/^1[3-9]\d{9}$/.test(value) && value.length !== 11) {
          return Promise.reject(new Error('手机号格式错误'));
        }
        // if (value && value.length === 11) {
        //   // TODO: 这里可以添加检查手机号是否重复的逻辑
        // }
        return Promise.resolve();
      },
      message: '该手机号已被其他学生使用',
    },
  ],
};

function handleCreateStudent() {
  const formatBirthDate = dayjs(studentForm.birthDate).format('YYYY-MM-DD');
  console.log('formatBirthDate', formatBirthDate);
  console.log('studentForm', studentForm);
}
</script>

<template>
  <Drawer title="创建学生">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/create_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">创建学生</span>
      </div>
    </template>
    <AForm :model="studentForm" :rules="rules">
      <div>
        <LyFormLabel label="学生姓名" required />
        <AForm.Item name="name">
          <div class="flex items-center gap-2">
            <AInput v-model:value="studentForm.name" :maxlength="10" />
            <IconifyIcon
              v-if="validateName"
              icon="lets-icons:check-fill"
              color="#04DC70"
            />
          </div>
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="学号" required />
        <AForm.Item name="studentId">
          <div class="flex items-center gap-2">
            <AInput v-model:value="studentForm.studentId" />
            <IconifyIcon
              v-if="validateStudentId"
              icon="lets-icons:check-fill"
              color="#04DC70"
            />
          </div>
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="性别" required />
        <AForm.Item name="gender">
          <ARadio.Group v-model:value="studentForm.gender">
            <ARadio value="1">男</ARadio>
            <ARadio value="2">女</ARadio>
          </ARadio.Group>
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="年级" required />
        <AForm.Item name="grade">
          <ASelect
            v-model:value="studentForm.grade"
            :options="[
              { value: '高一', label: '高一' },
              { value: '高二', label: '高二' },
              { value: '高三', label: '高三' },
            ]"
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="班级" required />
        <AForm.Item name="class">
          <ASelect
            v-model:value="studentForm.class"
            :options="[
              // TODO: 只显示当前用户有管理权限的班级
              // TODO: 选择班级后自动显示班主任姓名
              { value: '一班', label: '一班' },
              { value: '二班', label: '二班' },
              { value: '三班', label: '三班' },
            ]"
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="出生日期" required />
        <AForm.Item name="birthDate">
          <ADatePicker
            v-model:value="studentForm.birthDate"
            placeholder="请选择出生日期"
            style="width: 100%"
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="联系电话" />
        <AForm.Item name="phone">
          <AInput
            v-model:value="studentForm.phone"
            placeholder="请输入11位手机号码"
            :maxlength="11"
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="家庭住址" />
        <AForm.Item name="address">
          <AInput.TextArea
            v-model:value="studentForm.address"
            placeholder="请输入家庭住址"
            :rows="3"
            :maxlength="200"
            show-count
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="特殊关注标记" />
        <AForm.Item name="specialAttention">
          <ACheckbox.Group
            v-model:value="studentForm.specialAttention"
            :options="specialAttentionOptions"
          />
        </AForm.Item>
      </div>
    </AForm>
  </Drawer>
</template>
