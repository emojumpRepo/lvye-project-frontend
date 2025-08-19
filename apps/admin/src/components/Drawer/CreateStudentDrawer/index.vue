<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile/index';

import { computed, onMounted, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  DatePicker as ADatePicker,
  Form as AForm,
  Input as AInput,
  Radio as ARadio,
  Select as ASelect,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createStudentProfile,
  getDeptSimpleList,
} from '#/api/psychology/student-profile/index';
import LyFormLabel from '#/components/LyFormLabel/index.vue';

interface DeptOption {
  value: number;
  label: string;
  children?: { label: string; value: number }[];
}

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const validateName = ref(false);
const validateStudentId = ref(false);

const deptList = ref<DeptOption[]>([]);

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[720px]',
  confirmText: '创建',
  onConfirm: handleCreateStudent,
});

const studentForm = reactive<PsychologyStudentProfileApi.StudentProfileSaveReq>(
  {
    name: '',
    studentNo: '',
    sex: undefined,
    gradeDeptId: undefined,
    classDeptId: undefined,
    birthDate: '',
    mobile: '',
    homeAddress: '',
    isMark: undefined,
    specialMarks: '',
    remark: '',
  },
);

const classList = computed(() => {
  return (
    deptList.value.find((dept) => dept.value === studentForm.gradeDeptId)
      ?.children || []
  );
});

// const specialRemarkOptions = [
//   { label: '家庭困难', value: '1' },
//   { label: '行为异常', value: '2' },
//   { label: '心理风险', value: '3' },
//   { label: '学习困难', value: '4' },
//   { label: '身体残疾', value: '5' },
// ];

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
  studentNo: [
    {
      validator: (_, value) => {
        validateStudentId.value = false;
        if (!value) {
          return Promise.reject(new Error('请输入学号'));
        }
        if (!/^[a-z0-9]+$/i.test(value)) {
          return Promise.reject(new Error('学号格式不符合规范'));
        }
        validateStudentId.value = true;
        return Promise.resolve();
      },
    },
  ],
  sex: [{ required: true, message: '请选择性别' }],
  gradeDeptId: [{ required: true, message: '请选择年级' }],
  classDeptId: [{ required: true, message: '请选择班级' }],
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
  mobile: [
    {
      validator: (_, value) => {
        if (value && !/^1[3-9]\d{9}$/.test(value) && value.length !== 11) {
          return Promise.reject(new Error('手机号格式错误'));
        }
        return Promise.resolve();
      },
    },
  ],
};

async function handleCreateStudent() {
  const formatBirthDate = dayjs(studentForm.birthDate).format('YYYY-MM-DD');
  const params = {
    ...studentForm,
    birthDate: formatBirthDate,
  };
  try {
    await createStudentProfile(params);
    message.success('学生档案创建成功');
  } catch {
    message.error('学生档案创建失败');
  }
  emit('refresh');
  drawerApi.close();
}

async function loadDeptList() {
  const data = await getDeptSimpleList();
  if (data.length > 0) {
    const filteredData = data.filter((dept) => dept.parentId !== 110);

    const childIds = new Set(filteredData.map((dept) => dept.id));

    const rootDepts = filteredData.filter(
      (dept) =>
        !childIds.has(dept.parentId) ||
        dept.parentId === 0 ||
        dept.parentId === null,
    );

    // 构建树形结构
    const buildTree = (
      parentId: number,
    ): undefined | { label: string; value: number }[] => {
      const children = filteredData
        .filter((dept) => dept.parentId === parentId)
        .map((dept) => ({
          value: dept.id,
          label: dept.name,
        }));

      return children.length > 0 ? children : undefined;
    };

    // 构建最终的树形数据
    const treeData = rootDepts.map((dept) => ({
      value: dept.id,
      label: dept.name,
      children: buildTree(dept.id),
    }));

    sessionStorage.setItem('deptList', JSON.stringify(treeData));
    return treeData;
  }

  return [];
}

onMounted(async () => {
  const stored = sessionStorage.getItem('deptList');
  deptList.value = stored
    ? (JSON.parse(stored) as DeptOption[])
    : await loadDeptList();
});
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
            <AInput
              v-model:value="studentForm.name"
              placeholder="请填写"
              :maxlength="10"
            />
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
        <AForm.Item name="studentNo">
          <div class="flex items-center gap-2">
            <AInput
              v-model:value="studentForm.studentNo"
              placeholder="请填写"
            />
            <IconifyIcon
              v-if="validateStudentId"
              icon="lets-icons:check-fill"
              color="#04DC70"
            />
          </div>
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="出生日期" required />
        <AForm.Item name="birthDate">
          <ADatePicker
            v-model:value="studentForm.birthDate"
            placeholder="请选择日期"
            style="width: 100%"
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="性别" required />
        <AForm.Item name="sex">
          <ARadio.Group v-model:value="studentForm.sex">
            <ARadio value="1">男</ARadio>
            <ARadio value="2">女</ARadio>
          </ARadio.Group>
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="年级" required />
        <AForm.Item name="gradeDeptId">
          <ASelect
            v-model:value="studentForm.gradeDeptId"
            placeholder="请选择年级"
            :options="deptList"
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="班级" required />
        <AForm.Item name="classDeptId">
          <ASelect
            v-model:value="studentForm.classDeptId"
            placeholder="请选择班级"
            :options="classList"
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="联系电话" />
        <AForm.Item name="mobile">
          <AInput
            v-model:value="studentForm.mobile"
            placeholder="请填写"
            :maxlength="11"
          />
        </AForm.Item>
      </div>

      <div>
        <LyFormLabel label="家庭住址" />
        <AForm.Item name="homeAddress">
          <AInput.TextArea
            v-model:value="studentForm.homeAddress"
            placeholder="请填写"
            :rows="3"
            :maxlength="200"
            show-count
          />
        </AForm.Item>
      </div>

      <!-- <div>
        <LyFormLabel label="特殊标记" />
        <AForm.Item name="isMark">
          <ARadioGroup v-model:value="studentForm.isMark">
            <ARadio value="1">标记</ARadio>
            <ARadio value="0">不标记</ARadio>
          </ARadioGroup>
        </AForm.Item>

        <AForm.Item name="specialMarks">
          <ASelect
            v-model:value="studentForm.specialMarks"
            placeholder="请选择"
            :options="specialRemarkOptions"
          />
        </AForm.Item>
      </div> -->

      <div>
        <LyFormLabel label="备注说明" />
        <AForm.Item name="remark">
          <AInput v-model:value="studentForm.remark" placeholder="请填写" />
        </AForm.Item>
      </div>
    </AForm>
  </Drawer>
</template>
