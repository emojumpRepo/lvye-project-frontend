<script setup lang="ts">
import type { PsychologyStudentParentProfileApi } from '#/api/psychology/student-parent-profile';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import InfoSectionForm from './InfoSectionForm.vue';

const props = defineProps<{
  parentInfo:
    | PsychologyStudentParentProfileApi.StudentParentProfile[]
    | undefined;
  studentInfo: PsychologyStudentProfileApi.StudentProfile | undefined;
}>();

const emit = defineEmits<{
  (e: 'updateLoading', value: boolean): void;
}>();
</script>

<template>
  <div class="flex h-full flex-col gap-6 overflow-y-auto px-4">
    <InfoSectionForm
      :student-info="props.studentInfo"
      title="学籍信息"
      schema-type="personalInfo"
      @update-loading="emit('updateLoading', $event)"
    />
    <InfoSectionForm
      :parent-info="props.parentInfo"
      title="家庭情况"
      schema-type="familyBackground"
    />
  </div>
</template>
