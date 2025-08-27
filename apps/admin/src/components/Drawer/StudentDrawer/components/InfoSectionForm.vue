<script setup lang="ts">
import type { ConfigOptions } from '../data';

import type { PsychologyStudentParentProfileApi } from '#/api/psychology/student-parent-profile';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { computed, onMounted, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Divider } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { updateStudentProfile } from '#/api/psychology/student-profile';
import { getDictObj, getDictOptions } from '#/utils/dict';
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

const edit = ref(false);
const configOptions = ref<ConfigOptions>({
  classList: [],
  graduationStatusMap: [],
  sexMap: [],
});
const studentFormInfo = ref<Record<string, any>>({});
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

// 监听编辑状态变化，重新设置表单schema
watch(edit, (newEdit) => {
  InfoFormApi.setState({
    schema: formSchema.value,
    commonConfig: { disabled: !newEdit },
  });
});

/** 开始编辑 */
function handleEdit() {
  edit.value = true;
  if (props.schemaType === 'personalInfo') {
    InfoFormApi.setFieldValue(
      'classDeptId',
      (
        props.studentInfo as
          | PsychologyStudentProfileApi.StudentProfile
          | undefined
      )?.classDeptId,
    );
    InfoFormApi.setFieldValue(
      'graduationStatus',
      String(
        (
          props.studentInfo as
            | PsychologyStudentProfileApi.StudentProfile
            | undefined
        )?.graduationStatus,
      ),
    );
    InfoFormApi.setFieldValue(
      'birthDate',
      dayjs(
        (
          props.studentInfo as
            | PsychologyStudentProfileApi.StudentProfile
            | undefined
        )?.birthDate,
      ),
    );
    InfoFormApi.setFieldValue(
      'sex',
      getDictObj(
        'system_user_sex',
        Number(
          (
            props.studentInfo as
              | PsychologyStudentProfileApi.StudentProfile
              | undefined
          )?.sex,
        ),
      )?.value,
    );
  }
}

/** 保存 */
async function handleSave() {
  emit('updateLoading', true);
  const values = await InfoFormApi.getValues();

  values.classDeptId = Number(values.classDeptId);
  values.graduationStatus = Number(values.graduationStatus);
  edit.value = false;
  if (props.schemaType === 'personalInfo') {
    InfoFormApi.setFieldValue(
      'classDeptId',
      configOptions.value?.classList.find(
        (item) => item.value === values.classDeptId,
      )?.label,
    );
    InfoFormApi.setFieldValue(
      'graduationStatus',
      getDictObj('student_graduation_status', Number(values.graduationStatus))
        ?.label,
    );

    values.birthDate = dayjs(values.birthDate).valueOf().toString();

    try {
      await updateStudentProfile({
        ...values,
        id: (
          props.studentInfo as
            | PsychologyStudentProfileApi.StudentProfile
            | undefined
        )?.id,
        gradeDeptId: (
          props.studentInfo as
            | PsychologyStudentProfileApi.StudentProfile
            | undefined
        )?.gradeDeptId,
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
  if (props.studentInfo && props.schemaType === 'personalInfo') {
    InfoFormApi.setValues(
      formatFormData(
        props.studentInfo as PsychologyStudentProfileApi.StudentProfile,
      ),
    );
  }
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
      return;
    }
  }

  const gradeDept = deptList.value.find((item) => {
    const base = props.studentInfo as
      | PsychologyStudentProfileApi.StudentProfile
      | undefined;
    return item.value === base?.gradeDeptId;
  });

  if (!gradeDept) return [];

  configOptions.value.classList = gradeDept.children ?? [];

  // 获取性别字典
  const sexMap = await getDictOptions('system_user_sex');
  configOptions.value.sexMap = sexMap.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  // 获取毕业状态字典
  const studentGraduationStatus = await getDictOptions(
    'student_graduation_status',
  );
  configOptions.value.graduationStatusMap =
    studentGraduationStatus.map((item) => ({
      label: item.label,
      value: item.value,
    })) ?? [];
}

// 格式化表单
function formatFormData(info: PsychologyStudentProfileApi.StudentProfile) {
  const studentFormInfo = {
    ...info,
    sex: getDictObj('system_user_sex', info.sex)?.label,
    birthDate: dayjs(info.birthDate).format('YYYY-MM-DD'),
    graduationStatus: getDictObj(
      'student_graduation_status',
      info.graduationStatus,
    )?.label,
    classDeptId: configOptions.value?.classList.find(
      (item) => item.value === info.classDeptId,
    )?.label,
  };
  return studentFormInfo;
}

onMounted(async () => {
  if (!props.studentInfo) return;
  if (props.schemaType === 'personalInfo') {
    await getDictTypeOptions();
    const info =
      props.studentInfo as PsychologyStudentProfileApi.StudentProfile;
    studentFormInfo.value = formatFormData(info);
    InfoFormApi.setValues(studentFormInfo.value as Record<string, any>);
  } else if (props.schemaType === 'familyBackground') {
    parentFormInfo.value = props.parentInfo as
      | PsychologyStudentParentProfileApi.StudentParentProfilePageReq
      | undefined;
    InfoFormApi.setValues(parentFormInfo.value as Record<string, any>);
  }
});
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
