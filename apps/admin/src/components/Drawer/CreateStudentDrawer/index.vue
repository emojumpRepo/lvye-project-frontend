<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile/index';

import { computed, onMounted, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { GenderEnum } from '@vben/types';

import {
  DatePicker as ADatePicker,
  Form as AForm,
  Input as AInput,
  Radio as ARadio,
  Select as ASelect,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { createStudentProfile } from '#/api/psychology/student-profile/index';
import LyLabel from '#/components/LyLabel/index.vue';
import { getInfoFromIdCard } from '#/utils/calculateTool';
import { getDictOptions } from '#/utils/dict';
import { getDeptListCache } from '#/utils/transformDeptToTree';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const formRef = ref();
const loading = ref(false);
const graduationStatusOptions = ref<{ label: string; value: number }[]>([]);
const idCardReg =
  /^(?:[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[0-9X]|[1-9]\d{7}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3})$/i;

const deptList = ref<PsychologyStudentProfileApi.DeptTree[]>([]);

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[720px]',
  destroyOnClose: true,
  confirmText: '创建',
  closeOnClickModal: false,
  onConfirm: handleCreateStudent,
});

const studentForm = reactive<PsychologyStudentProfileApi.StudentProfileSaveReq>(
  {
    name: '',
    studentNo: '',
    sex: undefined,
    gradeDeptId: undefined,
    classDeptId: undefined,
    idCard: '',
    birthDate: '',
    enrollmentYear: undefined,
    mobile: '',
    homeAddress: '',
    graduationStatus: 0, // 在校
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

const enrollmentYearList = computed(() => {
  const startYear = 2015;
  const endYear = new Date().getFullYear();
  const options: { label: string; value: number }[] = [];
  for (let year = endYear; year >= startYear; year--) {
    options.push({ label: `${year}届`, value: year });
  }
  return options;
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
        if (!value) {
          return Promise.reject(new Error('请输入学生姓名'));
        }
        if (value.length < 2 || value.length > 30) {
          return Promise.reject(new Error('姓名格式不正确'));
        }
        // if (!/^[\u4E00-\u9FA5]+$/.test(value)) {
        //   return Promise.reject(new Error('姓名格式不正确'));
        // }

        return Promise.resolve();
      },
    },
  ],
  studentNo: [
    {
      validator: (_, value) => {
        if (!value) {
          return Promise.reject(new Error('请输入学号'));
        }
        if (!/^[a-z0-9]+$/i.test(value)) {
          return Promise.reject(new Error('学号格式不符合规范'));
        }
        return Promise.resolve();
      },
    },
  ],
  idCard: [
    { required: true, message: '请填写身份证' },
    {
      validator: (_, value) => {
        if (value && !idCardReg.test(value)) {
          return Promise.reject(new Error('身份证格式不符合规范'));
        }
        const data = getInfoFromIdCard(value);
        if (data) {
          studentForm.birthDate = dayjs(data.birthDate);
          studentForm.sex = data.gender === '男' ? 1 : 2;
        }
        return Promise.resolve();
      },
    },
  ],
  sex: [{ required: false, message: '请选择性别' }],
  gradeDeptId: [{ required: true, message: '请选择年级' }],
  classDeptId: [{ required: true, message: '请选择班级' }],
  birthDate: [
    { required: false, message: '请选择出生日期' },
    {
      validator: (_, value) => {
        if (value) {
          const birthYear = new Date(value).getFullYear();
          const currentYear = new Date().getFullYear();
          const age = currentYear - birthYear;
          if (age < 6) {
            return Promise.reject(new Error('年龄应在6岁以上'));
          }
        }
        return Promise.resolve();
      },
    },
  ],
  enrollmentYear: [{ required: true, message: '请选择届别' }],
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

/** 创建学生档案 */
async function handleCreateStudent() {
  formRef.value?.validate().then(async () => {
    drawerApi.lock();
    loading.value = true;
    const formatBirthDate = dayjs(studentForm.birthDate).valueOf();
    const params = {
      ...studentForm,
      birthDate: formatBirthDate.toString(),
    };

    try {
      const res = await createStudentProfile(params);
      if (res) {
        message.success('学生档案创建成功');
      } else {
        message.error('学生档案创建失败');
      }
    } catch (error) {
      console.error('学生档案创建失败', error);
      message.error('学生档案创建失败');
    }
    emit('refresh');
    formRef.value?.resetFields();
    drawerApi.unlock();
    loading.value = false;
  });
}

onMounted(async () => {
  deptList.value = await getDeptListCache();
  graduationStatusOptions.value = await getDictOptions(
    'student_graduation_status',
  ).map((item) => ({
    label: item.label,
    value: Number(item.value),
  }));
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
    <!-- <ASpin :spinning="loading" tip="正在保存..."> -->
    <AForm ref="formRef" :model="studentForm" :rules="rules">
      <div>
        <LyLabel title="学生姓名" required custom-title-class="font-normal" />
        <AForm.Item name="name" has-feedback>
          <AInput
            v-model:value="studentForm.name"
            placeholder="请填写"
            :maxlength="30"
          />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="学号" required custom-title-class="font-normal" />
        <AForm.Item name="studentNo" has-feedback>
          <AInput v-model:value="studentForm.studentNo" placeholder="请填写" />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="身份证" required custom-title-class="font-normal" />
        <AForm.Item name="idCard" has-feedback>
          <AInput
            v-model:value="studentForm.idCard"
            placeholder="请填写"
            style="width: 100%"
          />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="出生日期" custom-title-class="font-normal" />
        <AForm.Item name="birthDate">
          <ADatePicker
            v-model:value="studentForm.birthDate"
            placeholder="请选择日期"
            style="width: 100%"
          />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="性别" custom-title-class="font-normal" />
        <AForm.Item name="sex">
          <ARadio.Group v-model:value="studentForm.sex">
            <ARadio :value="GenderEnum.MALE">男</ARadio>
            <ARadio :value="GenderEnum.FEMALE">女</ARadio>
          </ARadio.Group>
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="年级" required custom-title-class="font-normal" />
        <AForm.Item name="gradeDeptId">
          <ASelect
            v-model:value="studentForm.gradeDeptId"
            placeholder="请选择年级"
            :options="deptList"
          />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="班级" required custom-title-class="font-normal" />
        <AForm.Item name="classDeptId">
          <ASelect
            v-model:value="studentForm.classDeptId"
            placeholder="请选择班级"
            :options="classList"
          />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="届别" required custom-title-class="font-normal" />
        <AForm.Item name="enrollmentYear">
          <ASelect
            v-model:value="studentForm.enrollmentYear"
            placeholder="请选择届别"
            :options="enrollmentYearList"
          />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="就读状态" required custom-title-class="font-normal" />
        <AForm.Item name="graduationStatus">
          <ASelect
            v-model:value="studentForm.graduationStatus"
            placeholder="请选择就读状态"
            :options="graduationStatusOptions"
          />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="联系电话" custom-title-class="font-normal" />
        <AForm.Item name="mobile">
          <AInput
            v-model:value="studentForm.mobile"
            placeholder="请填写"
            :maxlength="11"
          />
        </AForm.Item>
      </div>

      <div>
        <LyLabel title="家庭住址" custom-title-class="font-normal" />
        <AForm.Item name="homeAddress">
          <AInput.TextArea
            v-model:value="studentForm.homeAddress"
            placeholder="建议填写详细地址便于联系"
            :rows="3"
            :maxlength="200"
            :show-count="true"
          />
        </AForm.Item>
      </div>

      <!-- <div>
        <LyLabel label="特殊标记" />
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
        <LyLabel title="备注说明" custom-title-class="font-normal" />
        <AForm.Item name="remark">
          <AInput.TextArea
            v-model:value="studentForm.remark"
            placeholder="可填写具体情况说明"
          />
        </AForm.Item>
      </div>
    </AForm>
    <!-- </ASpin> -->
  </Drawer>
</template>

<style lang="scss" scoped>
textarea {
  resize: none;
}
</style>
