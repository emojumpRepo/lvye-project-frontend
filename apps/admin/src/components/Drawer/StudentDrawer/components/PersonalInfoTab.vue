<script setup lang="ts">
import { ref } from 'vue';
import { useFamilyBackgroundFormSchema, usePersonalInfoFormSchema } from '#/views/students/data';
import InfoSectionForm from '#/components/Drawer/StudentDrawer/components/InfoSectionForm.vue';

const personalInfo = ref({ name: '张三', studentId: '1234567890', class: '1班', phone: '1234567890', gender: '男', status: '在读', address: '北京市海淀区' });
const familyBackground = ref({ fatherName: '张三', fatherOccupation: '工程师', fatherPhone: '1234567890', motherName: '李四', motherPhone: '1234567890', parentMaritalStatus: '离异', familySpecialSituation: '单亲家庭...需要关注' });
</script>

<template>
  <div class="flex h-full flex-col gap-6 overflow-y-auto px-4">
    <InfoSectionForm :form-info="personalInfo" title="学籍信息" :schema="usePersonalInfoFormSchema()" />
    <InfoSectionForm :form-info="familyBackground" title="家庭情况" :schema="useFamilyBackgroundFormSchema()" />
  </div>
  </template>



