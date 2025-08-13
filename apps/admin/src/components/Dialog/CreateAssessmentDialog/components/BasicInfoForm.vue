<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { BasicInfo } from '#/api/assessment/task';

import { ref, watch } from 'vue';

import {
  DatePicker as ADatePicker,
  Form as AForm,
  Input as AInput,
} from 'ant-design-vue';
import dayjs from 'dayjs';

const props = withDefaults(defineProps<{ modelValue?: BasicInfo }>(), {
  modelValue: () => ({
    name: '',
    timeRange: [dayjs().startOf('day'), dayjs().startOf('day').add(7, 'day')],
    description: '',
  }),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: BasicInfo): void;
  (e: 'valid', value: boolean): void;
}>();

const formRef = ref<any>(null);
// 本地状态作为 AForm 的数据源
const formState = ref<BasicInfo>({ ...props.modelValue });

const descriptionMax = 500; // 任务描述最大字数

const checkReceiveType = async (_rule: Rule, value: string) => {
  if (!value) throw new Error('请输入测评批次名称');
  if (value.length < 2) throw new Error('测评批次名称至少2个字');
  if (value.length > 50) throw new Error('测评批次名称最多50个字');
  const ok = await checkNameUnique(value);
  if (!ok) throw new Error('该批次名称已存在，请换一个名称');
  // 成功时不返回值，保持 Promise<void>
};

const checkTimeRange = async (_rule: Rule, value: [any, any]) => {
  const [start, end] = value || [];
  if (!start || !end) throw new Error('请选择测评时间范围');
  if (dayjs(end).isBefore(dayjs(start)))
    throw new Error('结束时间不能早于开始时间');
  // 成功时不返回值，保持 Promise<void>
};

const formRules = ref<Record<string, any>>({
  name: [
    {
      validator: checkReceiveType,
      trigger: ['change', 'blur'],
      required: true,
    },
  ],
  timeRange: [
    {
      validator: checkTimeRange,
      trigger: ['change', 'blur'],
      required: true,
    },
  ],
  description: [
    {
      max: descriptionMax,
      message: `最多输入${descriptionMax}个字符`,
      trigger: 'change',
    },
  ],
});

function checkNameUnique(_name: string) {
  return Promise.resolve(true);
}

async function validate() {
  try {
    await (formRef.value as any)?.validate();
    emit('update:modelValue', { ...formState.value });
    emit('valid', true);
    return true;
  } catch {
    emit('valid', false);
    return false;
  }
}

defineExpose({ validate });

// 实时联动：值变更即同步到父级并进行一次校验，控制父级按钮禁用态
async function validateLive() {
  try {
    await (formRef.value as any)?.validate();
    emit('valid', true);
  } catch {
    emit('valid', false);
  }
}

watch(
  formState,
  async (v: BasicInfo) => {
    emit('update:modelValue', { ...(v as BasicInfo) });
    await validateLive();
  },
  { deep: true },
);
</script>

<template>
  <div class="basic-info mx-auto w-full max-w-[400px] space-y-6">
    <AForm
      ref="formRef"
      layout="vertical"
      :model="formState"
      :rules="formRules"
    >
      <div class="space-y-6">
        <div>
          <div class="mb-2 flex items-center gap-1 text-[14px]">
            <div class="font-medium text-black">批次名称</div>
            <div class="text-[#FF0831]">*</div>
          </div>
          <AForm.Item class="mb-2" name="name" has-feedback>
            <AInput
              v-model:value="formState.name"
              :maxlength="50"
              class="rounded-[4px]"
              placeholder="请输入测评批次名称，如：2024春季高一新生普查"
            />
          </AForm.Item>
          <div class="text-[12px] text-[#B0B1B2]">
            建议使用包含时间、年级、测评类型的描述性名称
          </div>
        </div>

        <div>
          <div class="mb-2 flex items-center gap-1 text-[14px]">
            <div class="font-medium text-black">测评时间范围</div>
            <div class="text-[#FF0831]">*</div>
          </div>
          <AForm.Item name="timeRange">
            <ADatePicker.RangePicker
              v-model:value="formState.timeRange as any"
              :allow-clear="true"
              show-time
              style="width: 400px"
              :placeholder="['开始时间', '结束时间']"
            />
          </AForm.Item>
        </div>

        <div>
          <div class="mb-2 text-[14px] font-medium text-black">任务描述</div>
          <div class="relative w-[400px]">
            <AForm.Item name="description">
              <AInput.TextArea
                v-model:value="formState.description"
                :maxlength="descriptionMax"
                show-count
                :auto-size="{ minRows: 3, maxRows: 6 }"
                placeholder="选填：为学生说明本次测评的目的和重要性"
              />
              <div class="mt-2 text-[12px] text-[#B0B1B2]">
                最多支持输入{{ descriptionMax }}个字符，会向用户进行展示
              </div>
            </AForm.Item>
          </div>
        </div>
      </div>
    </AForm>
  </div>
</template>

<style scoped lang="scss">
.basic-info {
  :deep(.ant-input),
  :deep(.ant-picker) {
    border-radius: 4px;
  }

  :deep(.ant-input-textarea-show-count::after) {
    position: absolute;
    right: 8px;
    bottom: 6px;
    font-size: 12px;
    color: #b0b1b2;
  }
}
</style>
