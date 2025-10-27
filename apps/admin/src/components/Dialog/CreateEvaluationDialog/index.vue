<script lang="ts" setup>
import type { AssessmentComfirmInfo } from '@vben/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  CheckboxGroup as ACheckboxGroup,
  Switch as ASwitch,
  Textarea as ATextarea,
} from 'ant-design-vue';

import { CRISIS_LEVEL_MAP } from '#/api/constants';
import RichTextEditor from '#/components/Common/RichTextEditor.vue';
import LyButton from '#/components/LyButton/index.vue';
import FileUpload from '#/components/upload/file-upload.vue';
import { getDictLabel } from '#/utils/dict';

const params = ref<AssessmentComfirmInfo>();
const form = ref({
  id: undefined,
  problemTypes: [],
  consultRecord: undefined,
  assessmentIds: [],
  riskLevel: 0,
  hasMedicalVisit: false,
  medicalVisitRecord: undefined,
  observationRecord: undefined,
});
const fileList = ref<{ id: number; url: string }[]>([]);
const problemTypeList = ref([
  '各类精神疾病',
  '严重心理问题',
  '明显性格偏差',
  '严重网络成瘾',
  '严重亲子关系不良',
  '未按时到校',
  '自杀倾向父母离异',
  '留守儿童',
  '困难家庭',
  '重大变故家庭',
  '其他',
]);

const [CreateEvaluationModal, createEvaluationModalApi] = useVbenModal({
  closable: false,
  fullscreen: true,
  fullscreenButton: false,
  destroyOnClose: true,
  footer: false,
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      const data =
        await createEvaluationModalApi.getData<AssessmentComfirmInfo>();
      params.value = data;
    }
  },
});

/** 选择风险等级 */
function selectRisk(key: number) {
  form.value.riskLevel = key;
}
</script>

<template>
  <CreateEvaluationModal>
    <template #title>
      <!-- 顶部返回与标题 -->
      <div
        class="to-[rgba(255, 255, 255, 0.8) flex w-full items-center justify-between bg-gradient-to-r from-[#FFFFFF]"
      >
        <div class="flex items-center gap-4">
          <LyButton
            type="default"
            size="middle"
            class="rounded-[4px] px-[12px]"
            @click="createEvaluationModalApi.close()"
          >
            返回
          </LyButton>
          <div class="flex flex-col">
            <div class="text-lg font-bold">评估表单</div>
          </div>
        </div>
      </div>
    </template>

    <div class="flex-center flex-col gap-8">
      <div class="flex w-1/2 flex-col gap-10 py-3">
        <!-- 学生信息 -->
        <div
          class="mx-8 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="flex items-center gap-3">
            <IconifyIcon icon="ph:student" class="size-5" />
            <span class="text-base font-semibold text-gray-900">学生信息</span>
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="flex flex-col space-y-1">
              <span
                class="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                学生
              </span>
              <span class="text-sm font-medium text-gray-900">
                {{ params?.studentInfo?.studentName }}
              </span>
            </div>
            <div class="flex flex-col space-y-1">
              <span
                class="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                班级
              </span>
              <span class="text-sm font-medium text-gray-900">
                {{ params?.studentInfo?.className }}
              </span>
            </div>
            <div class="flex flex-col space-y-1">
              <span
                class="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                学号
              </span>
              <span class="text-sm font-medium text-gray-900">
                {{ params?.studentInfo?.studentNo }}
              </span>
            </div>
          </div>
        </div>

        <!-- 问题分类 -->
        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <div
              class="text-primary flex h-6 w-6 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
            >
              1
            </div>
            <span class="font-semibold text-gray-900">问题分类</span>
            <span class="font-medium text-red-500">*</span>
          </div>
          <div
            class="mx-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <ACheckboxGroup
                v-model:value="form.problemTypes"
                :options="problemTypeList"
                class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              />
            </div>
          </div>
        </div>

        <!-- 访谈记录 -->
        <div class="space-y-6">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="text-primary flex h-6 w-6 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
              >
                2
              </div>
              <span class="font-semibold text-gray-900"> 访谈记录 </span>
              <span class="font-medium text-red-500">*</span>
            </div>
            <button
              class="mr-8 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
            >
              <IconifyIcon icon="ph:download" class="size-4" />
              下载模板
            </button>
          </div>
          <div class="mx-8 mt-4 space-y-4">
            <RichTextEditor
              v-model="form.consultRecord"
              :height="280"
              placeholder="请输入本次详细评估的过程、观察、分析与结论要点…"
            />
            <FileUpload v-model:value="fileList" />
          </div>
        </div>

        <!-- 就诊用药情况 -->
        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <div
              class="text-primary flex h-6 w-6 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
            >
              3
            </div>
            <span class="font-semibold text-gray-900"> 就诊用药情况 </span>
            <span class="font-medium text-red-500">*</span>
          </div>
          <div class="mx-8 space-y-4">
            <div class="flex items-center gap-3">
              <ASwitch v-model:checked="form.hasMedicalVisit" />
              <span class="text-sm font-medium text-gray-700">
                学生是否有就诊/用药
              </span>
            </div>
            <Transition name="fade">
              <div
                v-if="form.hasMedicalVisit"
                class="transition-all duration-300 ease-in-out"
              >
                <ATextarea
                  v-model:value="form.medicalVisitRecord"
                  placeholder="请输入学生的就诊医院、诊断结果、用药情况等详细信息"
                  :rows="4"
                  class="mt-2 w-full p-3 text-sm"
                />
              </div>
            </Transition>
          </div>
        </div>

        <!-- 危机分类定级 -->
        <div class="space-y-6" style="margin-top: 15px">
          <div class="flex items-center gap-2">
            <div
              class="text-primary flex h-6 w-6 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
            >
              4
            </div>
            <span class="font-semibold text-gray-900"> 危机分类定级 </span>
            <span class="font-medium text-red-500">*</span>
          </div>
          <div class="mx-8 grid grid-cols-4 gap-3">
            <button
              v-for="opt in CRISIS_LEVEL_MAP"
              :key="opt.key"
              type="button"
              class="group flex w-full flex-col items-center rounded-xl border border-solid bg-white px-4 py-6 text-left transition-colors"
              :class="
                form.riskLevel === opt.key
                  ? 'border-2 border-[#04DC70] bg-[#14E77E0D]'
                  : '!border-[#F2F3F5] !bg-[#FFFFFF]'
              "
              @click="selectRisk(opt.key)"
            >
              <span
                class="mb-3 inline-block size-3 rounded-full"
                :style="{ backgroundColor: opt.color }"
              ></span>
              <span class="text-sm font-medium text-black">
                {{ getDictLabel('risk_level', opt.key) }}
              </span>
              <!-- <div class="mt-2 text-xs text-[#979899]">
                {{ opt.description }}
              </div> -->
            </button>
          </div>
          <Transition name="fade">
            <div
              v-if="form.riskLevel === 2"
              class="mx-8 transition-all duration-300 ease-in-out"
            >
              <ATextarea
                v-model:value="form.observationRecord"
                placeholder="请输入本次详细评估的过程、观察、分析与结论要点…"
                :autosize="{ minRows: 5 }"
                class="w-full rounded-lg border border-gray-200 p-3 text-sm transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </Transition>
        </div>
      </div>

      <div class="mb-8 grid grid-cols-2 gap-4">
        <LyButton type="default" size="middle"> 保存草稿 </LyButton>
        <LyButton type="success" size="middle"> 提交评估 </LyButton>
      </div>
    </div>
  </CreateEvaluationModal>
</template>

<style lang="scss" scoped>
textarea {
  resize: none;
}
</style>
