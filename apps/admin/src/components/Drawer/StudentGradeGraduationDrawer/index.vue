<script setup lang="ts">
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Drawer as ADrawer,
  Form as AForm,
  Popover as APopover,
  Select as ASelect,
  Spin as ASpin,
  Table as ATable,
  message,
} from 'ant-design-vue';

import { batchGraduateStudents, checkGraduateStudents } from '#/api/psychology';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { generateYearOptions } from '#/utils/calculateTool';
import { getDictLabel } from '#/utils/dict';
import { getDeptListCache } from '#/utils/transformDeptToTree';

import { specialStudentColumns } from './data';

interface Option {
  label: string;
  value: number;
}

interface SpecialStudent extends PsychologyStudentProfileApi.StudentProfile {
  actionType?: number;
}

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const open = defineModel<boolean>('open', { required: true });
const formRef = ref();

const specialStudentDrawerOpen = ref<boolean>(false);

const graduationForm = ref<{
  enrollmentYear: number | undefined;
  gradeDeptId: number | undefined;
  graduationYear: number | undefined;
}>({
  gradeDeptId: undefined,
  graduationYear: undefined,
  enrollmentYear: undefined,
});

const gradeOptions = ref<Option[]>([]);
const graduationYearOptions = ref<Option[]>([]);
const gradeSessionOptions = ref<Option[]>([]);
const selectedSpecialStudents = ref<SpecialStudent[]>([]);
const extraIds = ref<number[]>([]);
const loading = ref(false);
const psychologicalStatusOptions = ref<Option[]>([
  {
    label: '心理老师处理',
    value: 1,
  },
  {
    label: '毕业不再跟进',
    value: 2,
  },
]);
const tips = [
  {
    title: '心理老师处理',
    text: '学生正常毕业，但标记为需要心理老师后续跟进',
  },
  {
    title: '毕业不再跟进',
    text: '学生正常毕业，不再进行心理状态跟进',
  },
];

const rules = ref({
  gradeDeptId: [{ required: true, message: '请选择年级' }],
  graduationYear: [{ required: true, message: '请选择毕业年份' }],
  enrollmentYear: [{ required: true, message: '请输入届别' }],
});

/** 处理毕业 */
async function handleGraduate() {
  if (loading.value) {
    return message.warning('请等待毕业处理完成');
  }

  formRef.value?.validate().then(async () => {
    if (
      !graduationForm.value.enrollmentYear ||
      !graduationForm.value.gradeDeptId ||
      !graduationForm.value.graduationYear
    ) {
      message.error('请选择届别、年级和毕业年份');
      return;
    }
    await check();
    if (selectedSpecialStudents.value.length === 0) {
      await batchGraduate();
    }
  });
}

/** 批量毕业 */
async function batchGraduate() {
  try {
    loading.value = true;
    specialStudentDrawerOpen.value = false;
    extraIds.value = selectedSpecialStudents.value
      .filter((item) => item.actionType === 1)
      .map((item) => item.id as number);

    const response = await batchGraduateStudents({
      enrollmentYear: graduationForm.value.enrollmentYear as number,
      gradeDeptId: graduationForm.value.gradeDeptId as number,
      graduationYear: graduationForm.value.graduationYear as number,
      extraIds: extraIds.value,
    });

    emit('refresh');
    message.success(`${response}名学生毕业处理成功`);
    open.value = false;
  } catch (error) {
    console.error('毕业处理失败', error);
    message.error('毕业处理失败，请重新操作');
  } finally {
    loading.value = false;
  }
}

/** 检查毕业年级中心理状态异常的学生 */
async function check() {
  try {
    const data = await checkGraduateStudents({
      enrollmentYear: graduationForm.value.enrollmentYear as number,
      gradeDeptId: graduationForm.value.gradeDeptId as number,
    });

    if (data && data.length > 0) {
      specialStudentDrawerOpen.value = true;
      selectedSpecialStudents.value = data.map((item) => ({
        ...item,
        actionType: 1,
      }));
      return data;
    }
  } catch (error) {
    console.error('毕业检查失败', error);
    message.error('毕业检查失败');
  }
}

/** 取消毕业 */
function cancelGraduation() {
  if (loading.value) {
    return message.warning('请等待毕业处理完成');
  }
  open.value = false;
}

onMounted(async () => {
  const deptList = await getDeptListCache();
  if (deptList && deptList.length > 0) {
    gradeOptions.value = deptList.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  }
  graduationYearOptions.value = generateYearOptions('年').map((item) => ({
    label: item.label,
    value: Number(item.value),
  }));
  graduationForm.value.graduationYear = graduationYearOptions.value[0]?.value;
  gradeSessionOptions.value = generateYearOptions('届').map((item) => ({
    label: item.label,
    value: Number(item.value),
  }));
});
</script>

<template>
  <ADrawer
    v-model:open="open"
    width="800"
    :mask-closable="false"
    :destroy-on-close="true"
    :closable="false"
    @closed="formRef?.resetFields()"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/graduation_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">年级毕业</span>
      </div>
    </template>

    <ASpin :spinning="loading" class="mt-30">
      <div class="mx-2 mb-2">
        <AForm ref="formRef" :model="graduationForm" :rules="rules">
          <AForm.Item name="gradeDeptId">
            <LyLabel title="年级" required custom-title-class="font-normal" />
            <ASelect
              v-model:value="graduationForm.gradeDeptId"
              placeholder="请选择需要毕业的年级"
              required
              :options="gradeOptions"
            />
          </AForm.Item>

          <AForm.Item name="enrollmentYear">
            <LyLabel title="届别" required custom-title-class="font-normal" />
            <ASelect
              v-model:value="graduationForm.enrollmentYear"
              placeholder="请选择届别"
              required
              :options="gradeSessionOptions"
            />
          </AForm.Item>

          <AForm.Item name="graduationYear">
            <LyLabel
              title="毕业年份"
              required
              custom-title-class="font-normal"
            />
            <ASelect
              v-model:value="graduationForm.graduationYear"
              placeholder="请选择毕业年份"
              required
              :options="graduationYearOptions"
            />
          </AForm.Item>
        </AForm>

        <!-- 毕业提示 -->
        <div
          class="mt-8 space-y-3 rounded-xl border border-solid border-[#FF9C05CC] bg-[#FF9C0514] p-3"
        >
          <div class="flex items-center gap-2">
            <IconifyIcon icon="mdi:alert-circle" color="#FF9C05" />
            <span class="text-xs font-medium text-[#FF9C05]">毕业提示</span>
          </div>
          <ul class="list-disc space-y-2 pl-5 text-xs text-[#979899]">
            <li>整个年级的学生将统一毕业归档</li>
            <li>
              心理状态为"严重"、"重大"、"一般"、"观察中"的学生需要特殊处理
            </li>
            <li>毕业后学生将转入已毕业档案管理</li>
          </ul>
        </div>

        <ADrawer
          v-model:open="specialStudentDrawerOpen"
          width="700"
          :destroy-on-close="true"
          :mask-closable="false"
          :closable="false"
        >
          <template #title>
            <div class="flex items-center gap-2">
              <img
                src="../../../static/icons/student/special_student.png"
                class="w-5"
              />
              <span class="text-lg font-bold">特殊状态学生处理</span>
            </div>
          </template>

          <div
            class="overflow-hidden rounded-xl border border-solid border-[#EAEBED]"
          >
            <ATable
              :columns="specialStudentColumns"
              :data-source="selectedSpecialStudents"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'psychologicalStatus'">
                  <span
                    class="rounded bg-[#1966FF14] px-2 py-1 text-xs text-[#1966FF]"
                  >
                    {{
                      getDictLabel(
                        'student_psychological_status',
                        record.psychologicalStatus,
                      )
                    }}
                  </span>
                </template>
                <template v-if="column.key === 'action'">
                  <div class="flex items-center gap-2">
                    <ASelect
                      v-model:value="record.actionType"
                      :options="psychologicalStatusOptions"
                    />
                    <APopover :overlay-style="{ width: '300px' }">
                      <template #content>
                        <div class="!ml-5">
                          <ul class="flex !list-disc flex-col gap-2 text-xs">
                            <li
                              v-for="(tipItem, k) in tips"
                              :key="k"
                              class="text-justify text-sm"
                            >
                              <span class="font-bold">
                                {{ tipItem.title }}：
                              </span>
                              <span>
                                {{ tipItem.text }}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </template>
                      <IconifyIcon icon="carbon:help" class="size-4" />
                    </APopover>
                  </div>
                </template>
              </template>
            </ATable>
          </div>

          <div
            class="mt-6 flex items-center gap-2 rounded-xl border border-solid border-[#FF9C05CC] bg-[#FF9C0514] p-3"
          >
            <IconifyIcon icon="mdi:alert-circle" color="#FF9C05" />
            <span class="text-xs font-medium text-[#FF9C05]">
              注意: 以上学生心理状态需要特殊处理后才能毕业
            </span>
          </div>

          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <LyButton size="middle" @click="specialStudentDrawerOpen = false">
                取消
              </LyButton>
              <LyButton type="success" size="middle" @click="batchGraduate">
                确认处理
              </LyButton>
            </div>
          </template>
        </ADrawer>
      </div>
    </ASpin>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <LyButton size="middle" @click="cancelGraduation">取消</LyButton>
        <LyButton type="success" size="middle" @click="handleGraduate">
          确认毕业
        </LyButton>
      </div>
    </template>
  </ADrawer>
</template>

<style lang="scss" scoped>
// :deep(.ant-table-cell::before) {
//   display: none !important;
// }

:deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none !important;
}
</style>
