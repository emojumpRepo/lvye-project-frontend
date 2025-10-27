<script lang="ts" setup>
import type { DictDataType } from '#/utils/dict';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Form as AFrom,
  Select as ASelect,
  Textarea as ATextarea,
} from 'ant-design-vue';

import LyTag from '#/components/LyTag/index.vue';
import { getDictOptions } from '#/utils/dict';

interface OptionItem {
  label: string;
  value: number | string;
}

interface Params {
  studentName: string;
  riskLevel: number;
  studentProfileId: number;
}

const params = ref<Params>();
const riskLevelOptions = ref<OptionItem[]>([]);
const form = ref<{
  reason: string | undefined;
  riskLevel: number | undefined;
}>({
  reason: undefined,
  riskLevel: undefined,
});
const rules = ref({
  riskLevel: [{ required: true, message: '请选择风险等级' }],
  reason: [{ required: true, message: '请输入调整原因' }],
});

const [AdjustStudentRiskLevelModal, adjustStudentRiskLevelModalApi] =
  useVbenModal({
    fullscreenButton: false,
    destroyOnClose: true,
    headerClass: 'px-5 py-3',
    onOpenChange: async (isOpen) => {
      if (isOpen) {
        adjustStudentRiskLevelModalApi.setState({ loading: true });
        const data = await adjustStudentRiskLevelModalApi.getData<Params>();

        if (data?.studentProfileId) {
          riskLevelOptions.value = await getDictOptions(
            'risk_level',
            'number',
          ).map((item: DictDataType) => ({
            label: item.label,
            value: item.value as number | string,
          }));
          params.value = data;
          form.value.riskLevel = data.riskLevel;
        }
        adjustStudentRiskLevelModalApi.setState({ loading: false });
      }
    },
  });
</script>

<template>
  <AdjustStudentRiskLevelModal title="调整学生风险等级">
    <template #title>
      <div class="flex items-center gap-2 text-lg font-semibold">
        <IconifyIcon icon="mdi:alert-circle" color="#FF9C05" class="size-6" />
        <span>调整学生风险等级</span>
      </div>
    </template>

    <div class="space-y-6 p-2">
      <!-- 学生信息展示区域 -->
      <div class="space-y-3 rounded-lg bg-gray-50 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">学生姓名</span>
          <span class="font-semibold text-gray-900">
            {{ params?.studentName }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">当前风险等级</span>
          <LyTag
            tag-category-key="risk_level"
            :dict-value="params?.riskLevel"
          />
        </div>
      </div>

      <!-- 表单区域 -->
      <AFrom :model="form" :rules="rules">
        <AFrom.Item name="riskLevel" label="目标状态" class="mb-4">
          <ASelect
            v-model:value="form.riskLevel"
            :options="riskLevelOptions"
            placeholder="请选择目标风险等级"
            class="w-full"
          />
        </AFrom.Item>
        <AFrom.Item name="reason" label="调整原因" class="mb-0">
          <ATextarea
            v-model:value="form.reason"
            placeholder="请详细说明调整原因，以便后续审核和记录"
            :rows="4"
            class="w-full resize-none"
            show-count
            :maxlength="200"
          />
        </AFrom.Item>
      </AFrom>
    </div>
  </AdjustStudentRiskLevelModal>
</template>
