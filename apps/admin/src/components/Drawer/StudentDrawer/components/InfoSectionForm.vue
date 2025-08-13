<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Divider } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

interface PersonalInfo {
  address: string;
  class: string;
  gender: string;
  name: string;
  phone: string;
  status: string;
  studentId: string;
}

interface FamilyBackground {
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  parentMaritalStatus: string;
  familySpecialSituation: string;
}

const props = defineProps<{
  formInfo: FamilyBackground | PersonalInfo;
  schema: any;
  title: string;
}>();

const edit = ref(false);

const [InfoForm, InfoFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelClass: 'justify-start pb-1.5 font-normal',
    disabled: true,
  },
  layout: 'horizontal',
  schema: props.schema,
  wrapperClass: 'grid-cols-3 gap-5',
  showDefaultActions: false,
});

function handleEdit() {
  edit.value = true;
  InfoFormApi.setState({
    commonConfig: { disabled: false },
  });
}

function handleSave() {
  edit.value = false;
  InfoFormApi.setState({
    commonConfig: { disabled: true },
  });
}

function handleCancel() {
  edit.value = false;
  InfoFormApi.setState({
    commonConfig: { disabled: true },
  });
}

onMounted(() => {
  InfoFormApi.setValues(props.formInfo);
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
</style>



