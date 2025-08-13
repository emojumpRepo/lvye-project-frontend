<script setup lang="ts">
import { ref } from 'vue';

import {
  useFamilyBackgroundFormSchema,
  usePersonalInfoFormSchema,
} from '../data';
import Form from './Form.vue';

const personalInfo = ref({
  name: '张三',
  studentId: '1234567890',
  class: '1班',
  phone: '1234567890',
  gender: '男',
  status: '在读',
  address: '北京市海淀区',
});

const familyBackground = ref({
  fatherName: '张三',
  fatherOccupation: '工程师',
  fatherPhone: '1234567890',
  motherName: '李四',
  motherPhone: '1234567890',
  parentMaritalStatus: '离异',
  familySpecialSituation:
    '单亲家庭,与母亲生活。父母离异对学生心理造成一定影响, 需要要特别关注',
});
</script>

<template>
  <div class="flex h-full flex-col gap-6 overflow-y-auto px-4">
    <Form
      :form-info="personalInfo"
      title="学籍信息"
      :schema="usePersonalInfoFormSchema()"
    />
    <Form
      :form-info="familyBackground"
      title="家庭情况"
      :schema="useFamilyBackgroundFormSchema()"
    />
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
</style>
