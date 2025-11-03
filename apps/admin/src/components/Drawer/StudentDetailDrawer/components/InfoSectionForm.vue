<script setup lang="ts">
import type { StudentParentFormData } from '@vben/types';

import type { ConfigOptions } from '../data';

import type { PsychologyStudentParentProfileApi } from '#/api/psychology/student-parent-profile';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { computed, ref, unref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Divider, message } from 'ant-design-vue';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useVbenForm } from '#/adapter/form';
import { updateStudentProfile } from '#/api/psychology';
import {
  createStudentParentProfile,
  updateStudentParentProfile,
} from '#/api/psychology/student-parent-profile';
import { getDictOptions } from '#/utils/dict';
import { getDeptListCache } from '#/utils/transformDeptToTree';

import {
  useFamilyBackgroundFormSchema,
  usePersonalInfoFormSchema,
} from '../data';

const props = defineProps<{
  parentInfo?: StudentParentFormData;
  schemaType: 'familyBackground' | 'personalInfo';
  studentInfo?: PsychologyStudentProfileApi.StudentProfile;
  studentProfileId?: number;
  title: string;
}>();

const emit = defineEmits<{
  (e: 'updateLoading', value: boolean): void;
  (e: 'refresh'): void;
}>();

dayjs.extend(customParseFormat);
const _timestampRegex = /^\d{10}$|^\d{13}$/;

const edit = ref(false);

const dictLoaded = ref({
  personal: false,
  family: false,
});

const configOptions = ref<ConfigOptions>({
  classList: [],
  graduationStatusMap: [],
  sexMap: [],
  parentMaritalStatusMap: [],
  parentRelationMap: [],
});
const studentFormInfo = ref();
const parentFormInfo = ref();

// 使用计算属性动态生成表单schema
const formSchema = computed(() =>
  props.schemaType === 'personalInfo'
    ? usePersonalInfoFormSchema(edit.value, configOptions.value)
    : useFamilyBackgroundFormSchema(edit.value),
);

const [InfoForm, InfoFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
      hideRequiredMark: true,
    },
    labelClass: 'justify-start pb-1.5 font-normal',
    disabled: true,
  },
  layout: 'horizontal',
  schema: formSchema.value, // 初始 schema
  wrapperClass: 'grid-cols-4 gap-4',
  showDefaultActions: false,
});

/** 监听学生信息 */
watch(
  () => props.studentInfo,
  async (newStudentInfo) => {
    if (props.schemaType !== 'personalInfo' || !newStudentInfo) return;

    if (!dictLoaded.value.personal) {
      await getDictTypeOptions();
      dictLoaded.value.personal = true;
    }
    formatFormData(props.studentInfo);
    InfoFormApi.setValues(studentFormInfo.value);
  },
  {
    immediate: true,
  },
);

/** 监听学生家长信息 */
watch(
  () => props.parentInfo,
  async (newParentInfo) => {
    if (props.schemaType !== 'familyBackground') return;

    if (!dictLoaded.value.family) {
      await getParentMaritalStatusOptions();
      dictLoaded.value.family = true;
    }
    if (newParentInfo) {
      formatParentFormData(newParentInfo);
      InfoFormApi.setValues(parentFormInfo.value);
    }
  },
  {
    immediate: true,
  },
);

/** 重新设置表单schema和禁用状态 */
function setFormValues() {
  InfoFormApi.setState({
    schema: formSchema.value, // 更新 schema
    commonConfig: { disabled: !edit.value }, // 更新禁用状态
  });
}

/** 开始编辑 */
function handleEdit() {
  edit.value = true;
  setFormValues();
  if (props.schemaType === 'personalInfo') {
    InfoFormApi.setValues({
      ...props.studentInfo,
      birthDate: dayjs(props.studentInfo?.birthDate).format('YYYY-MM-DD'),
    });
  }
  if (props.schemaType === 'familyBackground') {
    InfoFormApi.setValues({ ...props.parentInfo });
  }
}

/** 保存 */
async function handleSave() {
  emit('updateLoading', true);

  const { valid } = await InfoFormApi.validate();
  if (!valid) {
    // 验证未通过，不切换编辑状态
    // handleCancel(); // 不应调用 handleCancel，它会重置数据
    // InfoFormApi.resetValidate(); // validate 内部已处理
    message.error('请检查输入内容');
    emit('updateLoading', false);
    return;
  }

  edit.value = false;
  setFormValues();

  // 获取表单数据
  const values = await InfoFormApi.getValues();

  // 学生信息保存
  if (props.schemaType === 'personalInfo') {
    values.classDeptId = Number(values.classDeptId);
    values.graduationStatus = Number(values.graduationStatus);

    try {
      const formatBirthDate = validateTimeFormat(values.birthDate);
      await updateStudentProfile({
        id: props.studentInfo?.id,
        gradeDeptId: props.studentInfo?.gradeDeptId,
        ...values,
        birthDate: dayjs(formatBirthDate).valueOf().toString(),
        idCard: props.studentInfo?.idCard,
        enrollmentYear: props.studentInfo?.enrollmentYear,
      });
      // 成功后，重新格式化显示数据
      formatFormData(values as PsychologyStudentProfileApi.StudentProfile);
      InfoFormApi.setValues(studentFormInfo.value);
      emit('refresh');
      message.success('学生信息更新成功');
    } catch (error) {
      console.warn('updateStudentProfile failed', error);
      message.error('学生信息更新失败');
      // 失败了，恢复编辑状态，让用户可以重试
      edit.value = true;
      setFormValues();
    }
  }
  // 学生家长信息保存
  else {
    await handleSaveParentProfile(values);
  }
  emit('updateLoading', false);
}

/** 保存学生家长信息 */
async function handleSaveParentProfile(formValues: any) {
  if (!props.studentProfileId) {
    message.error('学生档案ID不能为空');
    return;
  }

  const parentList: PsychologyStudentParentProfileApi.StudentParentProfilePageReq['parentList'] =
    [
      {
        id: props.parentInfo?.fatherId,
        name: formValues.fatherName,
        mobile: formValues.fatherPhone,
        remark: formValues.remark,
        relation: props.parentInfo?.fatherRelation ?? 1,
        work: formValues.fatherWork,
        maritalStatus: formValues.parentMaritalStatus,
      },
      {
        id: props.parentInfo?.motherId,
        name: formValues.motherName,
        mobile: formValues.motherPhone,
        remark: formValues.remark,
        relation: props.parentInfo?.motherRelation ?? 2,
        work: formValues.motherWork,
        maritalStatus: formValues.parentMaritalStatus,
      },
    ];

  try {
    if (!props.parentInfo?.fatherId || !props.parentInfo?.motherId) {
      const response = await createStudentParentProfile({
        studentProfileId: props.studentProfileId,
        parentList,
      });
      if (response) {
        formatParentFormData(formValues);
        InfoFormApi.setValues(parentFormInfo.value);
        emit('refresh');
        message.success('学生家长档案创建成功');
      } else {
        message.error('学生家长档案创建失败');
        throw new Error('Create failed'); // 抛出错误以便 catch 块捕获
      }
    } else {
      const response = await updateStudentParentProfile({
        studentProfileId: props.studentProfileId,
        parentList,
      });
      if (response) {
        formatParentFormData(formValues);
        InfoFormApi.setValues(parentFormInfo.value);
        emit('refresh');
        message.success('学生家长档案更新成功');
      } else {
        message.error('学生家长档案更新失败');
        throw new Error('Update failed');
      }
    }
  } catch (error) {
    console.warn('handleSaveParentProfile failed', error);
    // 失败了，恢复编辑状态
    edit.value = true;
    setFormValues();
  }
}

/** 取消 */
function handleCancel() {
  edit.value = false;
  setFormValues();
  InfoFormApi.resetValidate();
  // 恢复为格式化后的只读数据
  if (props.schemaType === 'personalInfo') {
    InfoFormApi.setValues(studentFormInfo.value);
  }
  if (props.schemaType === 'familyBackground') {
    InfoFormApi.setValues(parentFormInfo.value);
  }
}

// 处理时间格式
function validateTimeFormat(val: any) {
  if (!val) return val;

  if (_timestampRegex.test(val as string)) {
    return dayjs(val).format('YYYY-MM-DD');
  }
  if (val instanceof Object) {
    return dayjs(unref(val)).format('YYYY-MM-DD');
  }
  return val;
}

// 格式化学生信息表单数据 (用于只读显示)
function formatFormData(
  info: PsychologyStudentProfileApi.StudentProfile | undefined,
) {
  if (!info) return {};
  const sex = configOptions.value?.sexMap.find(
    (item) => item.value === info.sex,
  )?.label;
  const graduationStatus = configOptions.value?.graduationStatusMap.find(
    (item) => item.value === info.graduationStatus,
  )?.label;
  const birthDate = validateTimeFormat(info.birthDate);
  const classDeptId = configOptions.value?.classList.find(
    (item) => item.value === info.classDeptId,
  )?.label;

  const formatFormInfo = {
    ...info,
    sex,
    birthDate,
    graduationStatus,
    classDeptId,
  };

  studentFormInfo.value = formatFormInfo;
  return studentFormInfo;
}

/**
 * 格式化家长信息表单数据 (用于只读显示)
 */
function formatParentFormData(info: StudentParentFormData) {
  if (!info) return {};

  const parentMaritalStatus = configOptions.value.parentMaritalStatusMap.find(
    (item) => item.value === info.parentMaritalStatus,
  )?.label;

  parentFormInfo.value = {
    ...info,
    fatherRelation: props.parentInfo?.fatherRelation ?? 1,
    motherRelation: props.parentInfo?.motherRelation ?? 2,
    parentMaritalStatus,
  };
  return parentFormInfo.value;
}

// 获取学生相关的类型字典
async function getDictTypeOptions() {
  const deptList = ref<PsychologyStudentProfileApi.DeptTree[]>([]);
  deptList.value = await getDeptListCache();

  const gradeDept = deptList.value.find((item) => {
    return item.value === props.studentInfo?.gradeDeptId;
  });

  if (!gradeDept) return [];

  configOptions.value.classList = gradeDept.children ?? [];

  try {
    const [sexMap, studentGraduationStatus] = await Promise.all([
      getDictOptions('system_user_sex', 'number'),
      getDictOptions('student_graduation_status', 'number'),
    ]);

    configOptions.value.sexMap = sexMap ?? [];
    configOptions.value.graduationStatusMap = studentGraduationStatus ?? [];
  } catch (error) {
    console.error('Failed to get personal dict options', error);
    message.error('获取个人信息字典失败');
  }
}

// 获取父母婚姻等字典
async function getParentMaritalStatusOptions() {
  try {
    const [parentMaritalStatus, parentRelation] = await Promise.all([
      getDictOptions('parent_marital_status', 'number'),
      getDictOptions('student_parent_relation', 'number'),
    ]);

    configOptions.value.parentMaritalStatusMap = parentMaritalStatus;
    configOptions.value.parentRelationMap = parentRelation;
  } catch (error) {
    console.error('Failed to get family dict options', error);
    message.error('获取家庭信息字典失败');
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 px-4">
    <div>
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <Divider type="vertical" class="bg-primary m-0 h-3 w-0.5" />
          <span class="font-bold">{{ title }}</span>
        </div>
        <div
          v-if="!edit"
          class="flex cursor-pointer items-center gap-1 text-sm"
          @click="handleEdit"
        >
          <IconifyIcon icon="icon-park:edit-one" />
          <span>编辑</span>
        </div>
        <div v-else class="flex items-center gap-3 text-sm">
          <div
            class="flex cursor-pointer items-center gap-1"
            @click="handleSave"
          >
            <IconifyIcon
              icon="material-symbols:check-rounded"
              color="#04DC70"
              class="size-5"
            />
            <span class="text-[#04DC70]">保存</span>
          </div>
          <div
            class="flex cursor-pointer items-center gap-1"
            @click="handleCancel"
          >
            <IconifyIcon
              icon="material-symbols:close-rounded"
              color="#979899"
              class="size-4"
            />
            <span class="text-[#979899]">取消</span>
          </div>
        </div>
      </div>

      <InfoForm />
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.form-item) {
  flex-direction: column !important;
  align-items: start !important;
  padding-bottom: 6px !important;
}

:deep(.custom-input-wrapper) {
  width: 100% !important;
}

:deep(.custom-error) {
  bottom: -15px !important;
}
</style>
