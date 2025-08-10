<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  DatePicker as ADatePicker,
  Form as AForm,
  Input as AInput,
} from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

type Model = {
  description: string;
  receiveType: string;
  timeRange: [null | string, null | string];
};

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    modelValue?: Model;
  }>(),
  {
    modelValue: () => ({
      receiveType: '',
      timeRange: [null, null],
      description: '',
    }),
    loading: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: Model): void;
  (e: 'next'): void;
  (e: 'prev'): void;
}>();

const formState = ref<Model>({ ...props.modelValue });

watch(
  () => props.modelValue,
  (v) => {
    formState.value = { ...v };
  },
  { deep: true },
);

watch(formState, (v) => emit('update:modelValue', { ...v }), { deep: true });

const descriptionLen = computed(() => formState.value.description.length);
const descriptionMax = 100;

function handleNext() {
  // basic required checks to match figma required marks
  if (!formState.value.receiveType) return;
  if (!formState.value.timeRange?.[0] || !formState.value.timeRange?.[1])
    return;
  emit('next');
}

function handlePrev() {
  emit('prev');
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1049px] rounded-xl bg-white p-8">
    <div class="mx-auto w-full max-w-[400px] space-y-9">
      <div>
        <div class="mb-3 flex items-center gap-1 text-[14px]">
          <div class="font-medium text-black">收件类型</div>
          <div class="text-[#FA4B4B]">*</div>
        </div>
        <AForm layout="vertical">
          <AForm.Item class="mb-2">
            <AInput
              v-model:value="formState.receiveType"
              :maxlength="50"
              placeholder="请输入收件类型"
            />
          </AForm.Item>
          <div class="text-[12px] text-[#B0B1B2]">
            建议使用包含时间、年级、测评类型的描述性名称
          </div>
        </AForm>
      </div>

      <div>
        <div class="mb-3 flex items-center gap-1 text-[14px]">
          <div class="font-medium text-black">测试事件范围</div>
          <div class="text-[#FA4B4B]">*</div>
        </div>
        <AForm layout="vertical">
          <AForm.Item>
            <ADatePicker.RangePicker
              v-model:value="formState.timeRange as any"
              :allow-clear="true"
              show-time
              style="width: 400px"
              :placeholder="['开始时间', '结束时间']"
            />
          </AForm.Item>
        </AForm>
      </div>

      <div>
        <div class="mb-3 text-[14px] font-medium text-black">任务描述</div>
        <div class="relative w-[400px]">
          <AInput.TextArea
            v-model:value="formState.description"
            :maxlength="descriptionMax"
            :rows="4"
            placeholder="请输入任务描述"
          />
          <div class="mt-1 flex items-center justify-between text-[12px]">
            <div class="text-[#B0B1B2]">
              最多支持输入{{ descriptionMax }}个字，会向用户进行展示
            </div>
            <div class="text-[#979899]">
              {{ descriptionLen }}/{{ descriptionMax }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-[19px] pt-1">
        <LyButton
          type="default"
          size="middle"
          class="h-12 w-[120px] justify-center"
          @click="handlePrev"
        >
          上一步
        </LyButton>
        <LyButton
          :loading="loading"
          type="success"
          size="middle"
          class="h-12 w-[120px] justify-center"
          @click="handleNext"
        >
          下一步
        </LyButton>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
