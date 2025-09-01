<script lang="ts" setup>
import type { PsychologyStudentParentProfileApi } from '#/api/psychology/student-parent-profile';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile/index';
import type { DictDataType } from '#/utils/dict';

import { onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Divider, Spin, Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getStudentPsychologicalStatusTag } from '#/api/constants';
import { getStudentParentProfile } from '#/api/psychology/student-parent-profile';
import { getStudentProfile } from '#/api/psychology/student-profile/index';
import AssessmentListTab from '#/components/Drawer/StudentDrawer/components/AssessmentListTab.vue';
import ConsultationListTab from '#/components/Drawer/StudentDrawer/components/ConsultationListTab.vue';
import PersonalInfoTab from '#/components/Drawer/StudentDrawer/components/PersonalInfoTab.vue';
import TimelineTab from '#/components/Drawer/StudentDrawer/components/TimelineTab.vue';
import LyButton from '#/components/LyButton/index.vue';
import { calculateAge } from '#/utils/calculateAge';
import { getDictObj, getDictOptions } from '#/utils/dict';

interface FooterButton {
  label: string;
  value: string;
  icon: string;
  type: 'dashed' | 'primary';
  color: string;
  class: string;
}

interface PsychologicalStatusTag {
  colorConfig: {
    color: string;
    style: {
      backgroundColor: string;
      borderColor: string;
    };
  };
  label: string;
  value: string;
}

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const studentProfile = ref<PsychologyStudentProfileApi.StudentProfile>();
const studentParentProfile =
  ref<PsychologyStudentParentProfileApi.StudentParentProfile[]>();

const baseInfo = ref([
  { label: '姓名', value: '', key: 'name' },
  { label: '性别', value: '', key: 'sex' },
  { label: '年龄', value: '', key: 'birthDate' },
  { label: '年级', value: '', key: 'className' },
  { label: '学号', value: '', key: 'studentNo' },
]);

const psychologicalStatusTag = ref<PsychologicalStatusTag>();
const coreProblemTags = ref<string[]>([]); // 核心问题标签
const studentSpecialMark = ref<DictDataType[]>([]);
const studentSexMap = ref<DictDataType[]>([]);
const loading = ref(false);

const footerButtons = ref<FooterButton[]>([
  {
    label: '评估',
    value: 'assessment',
    icon: 'solar:health-bold',
    type: 'dashed',
    color: '#578FFF',
    class: 'border-[#578FFF] text-[#578FFF] hover:bg-[#578FFF]/10',
  },
  {
    icon: 'ep:warn-triangle-filled',
    label: '上报异常',
    value: 'reportAbnormal',
    type: 'dashed',
    color: '#FF9C05',
    class: 'border-[#FF9C05] text-[#FF9C05] hover:bg-[#FF9C05]/10',
  },
  {
    icon: 'solar:chat-round-line-bold',
    label: '预约访谈',
    value: 'interview',
    type: 'primary',
    color: '#578FFF',
    class: 'border-[#578FFF] bg-[#578FFF] text-white hover:bg-[#578FFF]/80',
  },
  {
    icon: 'material-symbols:event-note',
    label: '发起测评',
    value: 'startAssessment',
    type: 'primary',
    color: '#04DC70',
    class: 'border-[#04DC70] bg-[#04DC70] text-white hover:bg-[#04DC70]/80',
  },
]);

/** 获取核心问题标签 */
const getSpecialMarkLabels = (specialMarks: string): string[] => {
  if (
    !specialMarks ||
    !studentSpecialMark.value ||
    studentSpecialMark.value.length === 0
  ) {
    return [];
  }

  const markValues = specialMarks.split(',').map((item) => item.trim());

  const labels = markValues.map((value) => {
    const found = studentSpecialMark.value.find((item) => item.value === value);
    return found?.label;
  });

  return labels.filter(Boolean) as string[];
};

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[800px]',
  contentClass: 'bg-gray-50 p-0',
  showCancelButton: false,
  showConfirmButton: false,
  loading: loading.value,
  onOpenChange: async (open) => {
    if (!open) return;
    const data = drawerApi.getData();
    if (!data.id) return;

    loading.value = true;
    if (data.id) {
      const studentProfileData = await getStudentProfile(data.id);
      studentProfile.value = studentProfileData;
      const studentParentProfileData = await getStudentParentProfile(data.id);
      studentParentProfile.value = studentParentProfileData;

      if (studentProfileData) {
        const fieldMappers: Record<
          string,
          (data: PsychologyStudentProfileApi.StudentProfile) => string
        > = {
          name: (data) => data.name || '未知',
          sex: (data) =>
            getDictObj('system_user_sex', data.sex)?.label || '未知',
          birthDate: (data) =>
            String(data.birthDate ? calculateAge(data.birthDate) : '未知'),
          className: (data) => data.className || '未知',
          studentNo: (data) => data.studentNo || '未知',
        };

        // 学生心理状态
        psychologicalStatusTag.value = (await getStudentPsychologicalStatusTag(
          'student_psychological_status',
          studentProfileData.psychologicalStatus || 1,
        )) as PsychologicalStatusTag;

        // 核心问题标签
        coreProblemTags.value = getSpecialMarkLabels(
          studentProfileData?.specialMarks || '',
        );

        // 基础信息
        baseInfo.value.forEach((item) => {
          const mapper = fieldMappers[item.key];
          if (mapper) {
            item.value = mapper(studentProfileData);
          }
        });
      }
    }

    loading.value = false;
  },
  onClosed: () => {
    studentProfile.value = undefined;
    studentParentProfile.value = undefined;
    psychologicalStatusTag.value = undefined;
    coreProblemTags.value = [];
    drawerApi.close();
  },
});

/** 更新加载状态 */
function updateLoading(value: boolean) {
  loading.value = value;
  if (!value) {
    // drawerApi.close();
    emit('refresh');
  }
}

onMounted(async () => {
  studentSpecialMark.value = await getDictOptions('student_special_mark');
  studentSexMap.value = await getDictOptions('system_user_sex');
});
</script>
<template>
  <Drawer title="学生360°档案">
    <template #title>
      <div class="flex items-center gap-2">
        <img src="../../../static/icons/student/360file_student.png" class="w-5" />
        <span class="text-lg font-bold">学生360°档案</span>
      </div>
    </template>

    <Spin :spinning="loading" wrapper-class-name="h-full">
      <!-- 基础信息 -->
      <div class="flex h-full flex-col gap-3">
        <div class="bg-white px-4 pb-3 pt-6">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2.5">
              <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
              <span class="font-bold">基础信息</span>
            </div>
            <div class="flex items-center justify-between">
              <div v-for="item in baseInfo" :key="item.label" class="text-xs">
                <span class="font-medium">{{ item.label }}：</span>
                <span class="text-[#4B4B4D]">{{ item.value }}</span>
              </div>
            </div>
          </div>
          <div class="my-7 flex items-center justify-between rounded-lg border border-solid px-4 py-3"
            :style="psychologicalStatusTag?.colorConfig.style">
            <div class="flex items-center gap-1 text-sm font-bold">
              <IconifyIcon icon="solar:health-bold" :color="psychologicalStatusTag?.colorConfig.color" class="size-5" />
              <span>心理状态：</span>
              <span :style="{ color: psychologicalStatusTag?.colorConfig.color }">
                {{ psychologicalStatusTag?.label }}
              </span>
            </div>
            <div class="text-xs text-[#979899]">
              <span>{{ studentProfile?.updater }}</span>
              <span>老师更新于</span>
              <span>{{
                dayjs(studentProfile?.updateTime).format('YYYY-MM-DD HH:mm:ss')
                }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
              <span class="text-sm font-bold">核心问题标签</span>
            </div>
            <div class="flex items-center gap-2.5">
              <template v-if="coreProblemTags.length > 0">
                <div v-for="tag in coreProblemTags" :key="tag">
                  <span class="inline-block rounded-md border border-solid border-gray-200 p-2 text-xs text-gray-700">
                    {{ tag }}
                  </span>
                </div>
              </template>
              <template v-else>
                <span class="text-xs">暂无</span>
              </template>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-x-hidden bg-white pb-5 pt-2">
          <div class="relative h-full w-full">
            <Tabs :tab-bar-gutter="24">
              <Tabs.TabPane tab="综合时间线" key="timeline">
                <TimelineTab />
              </Tabs.TabPane>
              <Tabs.TabPane tab="测评历史" key="history">
                <AssessmentListTab :student-profile-id="studentProfile?.id" />
              </Tabs.TabPane>
              <Tabs.TabPane tab="咨询与干预记录" key="consultation">
                <ConsultationListTab />
              </Tabs.TabPane>
              <Tabs.TabPane tab="完善个人信息" key="personalInfo">
                <PersonalInfoTab :student-info="studentProfile" :parent-info="studentParentProfile"
                  @update-loading="updateLoading" />
              </Tabs.TabPane>
            </Tabs>
            <LyButton type="success" size="middle" class="absolute right-7 top-1.5">
              导出信息
            </LyButton>
          </div>
        </div>
      </div>
    </Spin>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <button v-for="button in footerButtons" :key="button.value"
          class="flex items-center gap-1 rounded-md border border-solid px-7 py-2 text-sm" :class="button.class">
          <IconifyIcon :icon="button.icon" :color="button.type === 'dashed' ? button.color : '#fff'" class="size-4" />
          <span class="text-xs">{{ button.label }}</span>
        </button>
      </div>
    </template>
  </Drawer>
</template>

<style lang="scss" scoped>
:deep(.ant-tabs) {
  height: 100%;
}

:deep(.ant-tabs-nav) {
  padding: 0 16px;
}

:deep(.ant-tabs-content-top) {
  height: 100%;
}

:deep(.ant-tabs-tab-btn) {
  font-size: 14px;
  font-weight: 500 !important;
  color: #979899;
}

:deep(.ant-tabs-nav::before) {
  display: none !important;
}

:deep(.ant-tabs-ink-bar) {
  height: 4px !important;
  background: #04dc70 !important;
}

:deep(.ant-spin-nested-loading) {
  height: 100% !important;
}

:deep(.ant-spin-container) {
  height: 100% !important;
}
</style>
