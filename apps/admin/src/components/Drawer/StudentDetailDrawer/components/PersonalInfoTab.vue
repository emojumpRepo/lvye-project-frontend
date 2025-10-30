<script setup lang="ts">
import type { StudentParentFormData } from '@vben/types';

import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { onMounted, ref } from 'vue';

import { getStudentParentProfile } from '#/api/psychology/student-parent-profile';

import InfoSectionForm from './InfoSectionForm.vue';

const props = defineProps<{
  studentInfo: PsychologyStudentProfileApi.StudentProfile | undefined;
}>();

const emit = defineEmits<{
  (e: 'updateLoading', value: boolean): void;
  (e: 'refresh'): void;
}>();

// 学生家长档案
const studentParentProfile = ref<StudentParentFormData>({
  fatherId: undefined,
  fatherName: undefined,
  fatherWork: undefined,
  fatherPhone: undefined,
  fatherRelation: undefined,
  motherId: undefined,
  motherName: undefined,
  motherWork: undefined,
  motherPhone: undefined,
  motherRelation: undefined,
  parentMaritalStatus: undefined,
  remark: undefined,
});

/** 加载学生家长档案 */
async function loadStudentParentProfile(id: number | undefined) {
  if (!id && !props.studentInfo?.id) return;

  const studentProfileId = id ?? props.studentInfo!.id;

  try {
    const studentParentProfileList =
      await getStudentParentProfile(studentProfileId);
    if (studentParentProfileList.length > 0) {
      const fatherInfo = studentParentProfileList.find(
        (item) => item.relation === 1 || item.relation === 3,
      );
      const motherInfo = studentParentProfileList.find(
        (item) => item.relation === 2 || item.relation === 4,
      );
      studentParentProfile.value = {
        studentProfileId:
          fatherInfo?.studentProfileId ||
          motherInfo?.studentProfileId ||
          undefined,
        fatherId: fatherInfo?.id,
        fatherName: fatherInfo?.name,
        fatherWork: fatherInfo?.work,
        fatherPhone: fatherInfo?.mobile,
        fatherRelation:
          fatherInfo?.relation || props.studentInfo?.sex === 1 ? 1 : 2,
        motherId: motherInfo?.id,
        motherName: motherInfo?.name,
        motherWork: motherInfo?.work,
        motherPhone: motherInfo?.mobile,
        motherRelation:
          motherInfo?.relation || props.studentInfo?.sex === 1 ? 2 : 4,
        parentMaritalStatus: fatherInfo?.maritalStatus,
        remark: fatherInfo?.remark,
      };
    }
  } catch (error) {
    console.error('加载学生家长档案失败', error);
  }
}

onMounted(async () => {
  if (props.studentInfo?.id) {
    await loadStudentParentProfile(props.studentInfo?.id);
  }
});
</script>

<template>
  <div class="flex h-full flex-col gap-6 overflow-y-auto px-4">
    <InfoSectionForm
      :student-info="props.studentInfo"
      title="学籍信息"
      schema-type="personalInfo"
      @update-loading="emit('updateLoading', $event)"
      @refresh="emit('refresh')"
    />
    <InfoSectionForm
      :parent-info="studentParentProfile"
      title="家庭情况"
      schema-type="familyBackground"
      :student-profile-id="props.studentInfo?.id"
      @update-loading="emit('updateLoading', $event)"
      @refresh="loadStudentParentProfile(props.studentInfo?.id ?? 0)"
    />
  </div>
</template>
