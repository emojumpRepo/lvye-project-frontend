<script lang="ts" setup>
import type { AssessmentComfirmInfo } from '@vben/types';

import type { InterventionAssessmentReqVO } from '#/api/psychology';

import { h, ref } from 'vue';

import { alert, confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  CheckboxGroup as ACheckboxGroup,
  Input as AInput,
  Result as AResult,
  Spin as ASpin,
  Switch as ASwitch,
  Textarea as ATextarea,
  message,
} from 'ant-design-vue';

import { CRISIS_LEVEL_MAP } from '#/api/constants';
import RichTextEditor from '#/components/Common/RichTextEditor.vue';
import LyButton from '#/components/LyButton/index.vue';
import FileUpload from '#/components/upload/file-upload.vue';
import { getDictLabel } from '#/utils/dict';
import { downloadPsychologicalReportTemplate } from '#/utils/export';

const props = defineProps<{
  publish: (params: InterventionAssessmentReqVO) => Promise<boolean>;
}>();

interface FormState {
  problemTypes: string[];
  consultRecord?: string;
  attachmentIds: number[];
  riskLevel: number;
  hasMedicalVisit: boolean;
  medicalVisitRecord?: string;
  observationRecord?: string;
}

const form = ref<FormState>({
  problemTypes: [],
  consultRecord: undefined,
  attachmentIds: [],
  riskLevel: 0,
  hasMedicalVisit: false,
  medicalVisitRecord: undefined,
  observationRecord: undefined,
});
const params = ref<AssessmentComfirmInfo>();
const fileList = ref<{ id: number; url: string }[]>([]);
const customProblemTypeInput = ref('');
const loading = ref(false);
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
      loading.value = true;
      const data = await createEvaluationModalApi.getData<{
        confirmInfo: AssessmentComfirmInfo;
      }>();
      params.value = data.confirmInfo;
      const draft = localStorage.getItem('evaluation_draft');
      if (draft) {
        confirm({
          content: '检测到草稿，是否恢复？（确认后将清除草稿）',
          title: '恢复草稿',
          icon: 'success',
        })
          .then(() => {
            const draftData = JSON.parse(draft);
            form.value = draftData.form;
            fileList.value = draftData.fileList;
            customProblemTypeInput.value = draftData.customProblemTypeInput;
            problemTypeList.value = draftData.problemTypeList;
            params.value = draftData.params;
            localStorage.removeItem('evaluation_draft');
          })
          .catch(() => {
            return true;
          });
      }
      loading.value = false;
    }
  },
});

/** 选择风险等级 */
function selectRisk(key: number) {
  form.value.riskLevel = key;
}

/** 就诊用药情况切换 */
function handleMedicalVisitChange(checked: any) {
  form.value.hasMedicalVisit = checked;
  if (!checked) {
    form.value.medicalVisitRecord = undefined;
  }
}

/** 添加自定义问题类型（当选择“其他”时） */
function addProblemType() {
  const inputValue = customProblemTypeInput.value.trim();
  if (!inputValue) return message.error('请输入问题类型');
  if (inputValue.includes('其他')) return message.error('请输入其他问题类型');

  // 如果选项列表中不存在，则插入到“其他”之前
  if (!problemTypeList.value.includes(inputValue)) {
    const otherIndex = problemTypeList.value.indexOf('其他');
    const insertIndex =
      otherIndex === -1 ? problemTypeList.value.length : otherIndex;
    problemTypeList.value.splice(insertIndex, 0, inputValue);
  }

  // 更新选中项：移除“其他”，选中新添加/已有项
  const selectedSet = new Set<string>(form.value.problemTypes || []);
  selectedSet.delete('其他');
  selectedSet.add(inputValue);
  form.value.problemTypes = [...selectedSet];

  // 清空输入框
  customProblemTypeInput.value = '';
}

/** 提交评估 */
async function handleSubmit() {
  if (fileList.value.length > 0) {
    form.value.attachmentIds = fileList.value.map((item) => item.id);
  }
  const problemTypesTemplate = form.value.problemTypes.filter(
    (item) => item !== '其他',
  );
  if (
    form.value.problemTypes.length === 0 ||
    problemTypesTemplate.length === 0
  ) {
    return message.error('请选择问题类型');
  }
  if (!form.value.consultRecord) {
    return message.error('请输入访谈记录');
  }
  if (!form.value.riskLevel) {
    return message.error('请选择危机分类定级');
  }
  if (form.value.riskLevel === 2 && !form.value.observationRecord) {
    return message.error('请输入危机观察记录');
  }

  try {
    loading.value = true;
    createEvaluationModalApi.lock();
    const response = await props.publish({
      ...form.value,
      problemTypes: problemTypesTemplate,
    });

    if (response) {
      alert({
        title: '',
        content: h(AResult, {
          status: 'success',
          subTitle: '',
          title: '评估已完成！',
        }),
      }).then(() => {
        createEvaluationModalApi.close();
      });
    } else {
      alert({
        content: '评估失败，请重试',
        title: '评估失败',
        icon: 'error',
      });
    }
  } catch {
    alert({
      content: '评估失败，请重试',
      title: '评估失败',
      icon: 'error',
    });
  } finally {
    createEvaluationModalApi.unlock();
    loading.value = false;
  }
}

/** 保存草稿 */
function handleSaveDraft() {
  localStorage.setItem(
    'evaluation_draft',
    JSON.stringify({
      form: { ...form.value },
      fileList: fileList.value,
      customProblemTypeInput: customProblemTypeInput.value,
      problemTypeList: problemTypeList.value,
      params: params.value,
    }),
  );
  message.success('草稿已保存');
}

/** 打开返回确认弹窗 */
function handleOpenCancelConfirmModal() {
  confirm({
    content: '确定要放弃填写评估表单吗？',
    title: '放弃填写',
    icon: 'warning',
  })
    .then(() => {
      createEvaluationModalApi.close();
    })
    .catch(() => {
      return true;
    });
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
            @click="handleOpenCancelConfirmModal"
          >
            返回
          </LyButton>
          <div class="flex flex-col">
            <div class="text-lg font-bold">评估表单</div>
          </div>
        </div>
      </div>
    </template>

    <ASpin :spinning="loading" class="mt-30">
      <div class="flex-center flex-col gap-10">
        <div class="flex w-2/3 flex-col gap-10 py-3">
          <!-- 学生信息 -->
          <div
            class="mx-8 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div class="flex items-center gap-3">
              <IconifyIcon icon="ph:student" class="size-5" />
              <span class="text-base font-semibold text-gray-900">
                学生信息
              </span>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="flex flex-col space-y-1">
                <span
                  class="text-sm font-medium uppercase tracking-wide text-gray-500"
                >
                  学生：{{ params?.studentInfo?.studentName || '--' }}
                </span>
              </div>
              <div class="flex flex-col space-y-1">
                <span
                  class="text-sm font-medium uppercase tracking-wide text-gray-500"
                >
                  班级：{{ params?.studentInfo?.className || '--' }}
                </span>
              </div>
              <div class="flex flex-col space-y-1">
                <span
                  class="text-sm font-medium uppercase tracking-wide text-gray-500"
                >
                  学号：{{ params?.studentInfo?.studentNo || '--' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 问题分类 -->
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <div
                class="text-primary flex h-7 w-7 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
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
                <div
                  v-if="form.problemTypes.includes('其他')"
                  class="mt-4 flex items-center gap-2"
                >
                  <AInput
                    v-model:value="customProblemTypeInput"
                    placeholder="请输入问题类型"
                    required
                    class="border px-2 py-1.5 text-sm transition-colors"
                    @keyup.enter="addProblemType"
                  />
                  <button
                    type="button"
                    class="ml-2 shrink-0 text-sm text-[#04DC70] hover:text-[#04DC70]/70"
                    @click="addProblemType"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 访谈记录 -->
          <div class="space-y-6">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="text-primary flex h-7 w-7 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
                >
                  2
                </div>
                <span class="font-semibold text-gray-900"> 访谈记录 </span>
                <span class="font-medium text-red-500">*</span>
              </div>
              <button
                class="mr-8 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                @click="downloadPsychologicalReportTemplate"
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
              <FileUpload v-model:value="fileList" :max-number="10">
                <template #upload-text-desc>
                  <span>最多上传10个文件, 最大10MB</span>
                </template>
              </FileUpload>
            </div>
          </div>

          <!-- 就诊用药情况 -->
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <div
                class="text-primary flex h-7 w-7 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
              >
                3
              </div>
              <span class="font-semibold text-gray-900"> 就诊用药情况 </span>
            </div>
            <div class="mx-8 space-y-4">
              <div class="flex items-center gap-3">
                <ASwitch
                  v-model:checked="form.hasMedicalVisit"
                  @change="handleMedicalVisitChange"
                />
                <span class="text-sm font-medium text-gray-700">
                  学生是否有就诊/用药
                </span>
              </div>
              <Transition name="fade">
                <div
                  v-if="form.hasMedicalVisit"
                  class="flex pt-4 transition-all duration-300 ease-in-out"
                >
                  <span
                    class="whitespace-nowrap text-sm font-medium text-gray-700"
                  >
                    就医记录：
                  </span>
                  <ATextarea
                    v-model:value="form.medicalVisitRecord"
                    placeholder="请输入学生的就诊医院、诊断结果、用药情况等详细信息"
                    :rows="4"
                    class="w-full p-3 text-sm"
                  />
                </div>
              </Transition>
            </div>
          </div>

          <!-- 危机分类定级 -->
          <div class="space-y-6" style="margin-top: 15px">
            <div class="flex items-center gap-2">
              <div
                class="text-primary flex h-7 w-7 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
              >
                4
              </div>
              <span class="font-semibold text-gray-900"> 危机分类定级 </span>
              <span class="font-medium text-red-500">*</span>
            </div>
            <div class="mx-8 grid grid-cols-4 gap-3">
              <div
                v-for="opt in CRISIS_LEVEL_MAP"
                :key="opt.key"
                type="button"
                class="group box-border flex w-full cursor-pointer flex-col items-center rounded-xl border-2 border-solid bg-white px-4 py-6 text-left transition-colors"
                :class="
                  form.riskLevel === opt.key
                    ? 'border-[#04DC70] !bg-[#14E77E0D]'
                    : '!border-[#F2F3F5] !bg-[#FFFFFF] hover:!bg-gray-50'
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
                <div class="mt-2 text-xs text-[#979899]">
                  {{ opt.description }}
                </div>
              </div>
            </div>
            <Transition name="fade">
              <div
                v-if="form.riskLevel === 2"
                class="mx-8 flex transition-all duration-300 ease-in-out"
              >
                <span
                  class="whitespace-nowrap text-sm font-medium text-gray-700"
                >
                  观察记录：
                </span>
                <ATextarea
                  v-model:value="form.observationRecord"
                  placeholder="请输入观察记录"
                  :autosize="{ minRows: 5 }"
                  class="w-full rounded-lg border border-gray-200 p-3 text-sm transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </Transition>
          </div>
        </div>

        <div class="mb-10 grid grid-cols-2 gap-5">
          <LyButton type="default" size="large" @click="handleSaveDraft">
            保存草稿
          </LyButton>
          <LyButton type="success" size="large" @click="handleSubmit">
            提交评估
          </LyButton>
        </div>
      </div>
    </ASpin>
  </CreateEvaluationModal>
</template>

<style lang="scss" scoped>
textarea {
  resize: none;
}

:deep(.ant-result-title) {
  font-size: 20px !important;
}

:deep(.ant-result) {
  padding: 32px !important;
}
</style>
