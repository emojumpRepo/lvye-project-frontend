<script setup lang="ts">
import type { ConfigOptions } from '../data';

import type { PsychologyStudentParentProfileApi } from '#/api/psychology/student-parent-profile';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { computed, ref, unref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Divider, message } from 'ant-design-vue';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useVbenForm } from '#/adapter/form';
import { updateStudentProfile } from '#/api/psychology/student-profile';
import { getDictOptions } from '#/utils/dict';
import { loadDeptList } from '#/utils/transformDeptToTree';

import {
  useFamilyBackgroundFormSchema,
  usePersonalInfoFormSchema,
} from '../data';

const props = defineProps<{
  parentInfo?: PsychologyStudentParentProfileApi.StudentParentProfile[];
  schemaType: 'familyBackground' | 'personalInfo';
  studentInfo?: PsychologyStudentProfileApi.StudentProfile;
  title: string;
}>();

const emit = defineEmits<{
  (e: 'updateLoading', value: boolean): void;
}>();

dayjs.extend(customParseFormat);
const _timestampRegex = /^\d{10}$|^\d{13}$/;

const edit = ref(false);
const dictLoaded = ref(false);
const configOptions = ref<ConfigOptions>({
  classList: [],
  graduationStatusMap: [],
  sexMap: [],
});
const studentFormInfo = ref({});
const parentFormInfo =
  ref<PsychologyStudentParentProfileApi.StudentParentProfilePageReq>();

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
  schema: formSchema.value,
  wrapperClass: 'grid-cols-4 gap-4',
  showDefaultActions: false,
});

watch(
  () => props.studentInfo,
  async (newStudentInfo) => {
    if (!newStudentInfo) return;
    if (!dictLoaded.value) {
      await getDictTypeOptions();
    }
    if (props.schemaType === 'personalInfo') {
      formatFormData(props.studentInfo);
      InfoFormApi.setValues(studentFormInfo.value);
    } else if (props.schemaType === 'familyBackground') {
      parentFormInfo.value = props.parentInfo as
        | PsychologyStudentParentProfileApi.StudentParentProfilePageReq
        | undefined;
      InfoFormApi.setValues(parentFormInfo.value as Record<string, any>);
    }
  },
  {
    immediate: true,
  },
);

/** 重新设置表单schema */
function setFormValues() {
  InfoFormApi.setState({
    schema: formSchema.value,
    commonConfig: { disabled: !edit.value },
  });
}

/** 开始编辑 */
function handleEdit() {
  edit.value = true;
  setFormValues();
  if (props.studentInfo) {
    InfoFormApi.setValues({
      ...props.studentInfo,
      birthDate: dayjs(props.studentInfo?.birthDate).format('YYYY-MM-DD'),
    });
  }
}

/** 保存 */
async function handleSave() {
  emit('updateLoading', true);
  edit.value = false;
  setFormValues();
  const { valid } = await InfoFormApi.validate();
  if (!valid) {
    handleCancel();
    InfoFormApi.resetValidate();
    message.error('请检查输入内容');
    emit('updateLoading', false);
    return;
  }

  const values = await InfoFormApi.getValues();

  values.classDeptId = Number(values.classDeptId);
  values.graduationStatus = Number(values.graduationStatus);

  if (props.schemaType === 'personalInfo') {
    formatFormData(values as PsychologyStudentProfileApi.StudentProfile);
    InfoFormApi.setValues(studentFormInfo.value);

    try {
      const formatBirthDate = validateTimeFormat(values.birthDate);
      await updateStudentProfile({
        id: props.studentInfo?.id,
        gradeDeptId: props.studentInfo?.gradeDeptId,
        ...values,
        birthDate: dayjs(formatBirthDate).valueOf().toString(),
      });
    } catch (error) {
      console.warn('updateStudentProfile failed', error);
    }
  }
  emit('updateLoading', false);
}

/** 取消 */
function handleCancel() {
  edit.value = false;
  setFormValues();
  if (props.studentInfo) {
    InfoFormApi.setValues(studentFormInfo.value);
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

// 格式化表单
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

// 获取类型字典
async function getDictTypeOptions() {
  const deptList = ref<PsychologyStudentProfileApi.DeptTree[]>([]);
  const stored = sessionStorage.getItem('deptList');

  // 获取班级选项
  if (stored) {
    deptList.value = JSON.parse(stored);
  } else {
    try {
      const treeData = await loadDeptList();
      deptList.value = treeData;
    } catch (error) {
      console.error('加载部门列表失败:', error);
      return [];
    }
  }

  const gradeDept = deptList.value.find((item) => {
    return item.value === props.studentInfo?.gradeDeptId;
  });

  if (!gradeDept) return [];

  configOptions.value.classList = gradeDept.children ?? [];

  // 获取性别字典
  const sexMap = await getDictOptions('system_user_sex');
  configOptions.value.sexMap = sexMap.map((item) => ({
    label: item.label,
    value: Number(item.value),
  }));

  // 获取毕业状态字典
  const studentGraduationStatus = await getDictOptions(
    'student_graduation_status',
  );
  configOptions.value.graduationStatusMap =
    studentGraduationStatus.map((item) => ({
      label: item.label,
      value: Number(item.value),
    })) ?? [];

  dictLoaded.value = true;
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

      <!-- 信息表单 -->
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
