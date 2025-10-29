<script lang="ts" setup>
import type { AssessmentComfirmInfo, ReportAbnormalParams } from '@vben/types';

import type { PsychologyStudentParentProfileApi } from '#/api/psychology/student-parent-profile';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile/index';
import type { DictDataType } from '#/utils/dict';

import { onMounted, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Badge, Divider, message, Spin, Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getStudentPsychologicalStatusTag } from '#/api/constants';
import { getStudentParentProfile } from '#/api/psychology/student-parent-profile';
import {
  getStudentProfile,
  getStudentProfileTimeline,
} from '#/api/psychology/student-profile/index';
import CreateEvaluationDialog from '#/components/Dialog/CreateEvaluationDialog/index.vue';
import CreateStudentEventRecordDialog from '#/components/Dialog/CreateStudentEventRecordDialog/index.vue';
import ExportStudnetInfoDialog from '#/components/Dialog/ExportStudnetInfoDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyTag from '#/components/LyTag/index.vue';
import { calculateAge } from '#/utils/calculateTool';
import { getDictObj, getDictOptions } from '#/utils/dict';

import AssessmentListTab from './components/AssessmentListTab.vue';
import ConsultationListTab from './components/ConsultationListTab.vue';
import InterventionTab from './components/InterventionTab.vue';
import PersonalInfoTab from './components/PersonalInfoTab.vue';
import TimelineTab from './components/TimelineTab.vue';

interface FooterButton {
  label: string;
  value: string;
  icon: string;
  type: 'dashed' | 'primary';
  color: string;
  class: string;
  onClick: () => void;
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
  (e: 'evaluate', data: AssessmentComfirmInfo): void;
  (e: 'reportAbnormal', data: ReportAbnormalParams): void;
  (
    e: 'interview',
    studentProfile: PsychologyStudentProfileApi.StudentProfile,
  ): void;
  (
    e: 'startAssessment',
    studentProfile: PsychologyStudentProfileApi.StudentProfile,
  ): void;
}>();

// 学生档案
const studentProfile = ref<PsychologyStudentProfileApi.StudentProfile>();
// 学生家长档案
const studentParentProfile =
  ref<PsychologyStudentParentProfileApi.StudentParentProfile[]>();
// 学生时间线
const studentProfileTimeline = ref<
  PsychologyStudentProfileApi.StudentProfileTimeline[]
>([]);

const psychologicalStatusTag = ref<PsychologicalStatusTag>();
interface CoreProblemTagStat {
  label: string;
  count: number;
}
const coreProblemTags = ref<CoreProblemTagStat[]>([]); // 核心问题标签（带数量）
const studentSexMap = ref<DictDataType[]>([]);
const loading = ref(false);
const timelineTabs = ref<{ key: number; title: string }[]>([]);
const activeTimelineKey = ref(0);
const activeTabKey = ref('timeline');
const interventionTabs = ref<{ key: number; title: string }[]>([
  {
    key: 1,
    title: '风险评估',
  },
  {
    key: 2,
    title: '危机干预',
  },
]);
const activeInterventionTabKey = ref(1);
const baseInfo = ref([
  { label: '姓名', value: '', key: 'name' },
  { label: '性别', value: '', key: 'sex' },
  { label: '年龄', value: '', key: 'birthDate' },
  { label: '年级', value: '', key: 'className' },
  { label: '学号', value: '', key: 'studentNo' },
]);

const footerButtons = ref<FooterButton[]>([
  {
    label: '评估',
    value: 'evaluate',
    icon: 'solar:health-bold',
    type: 'dashed',
    color: '#578FFF',
    class: 'border-[#578FFF] text-[#578FFF] hover:bg-[#578FFF]/10',
    onClick: () => {
      if (!studentProfile.value?.id) return message.error('评估失败！');
      studentDetailDrawerApi.close();
      createEvaluationModalApi
        .setData({
          confirmInfo: {
            studentInfo: {
              studentName: studentProfile.value?.name || '',
              className: studentProfile.value?.className || '',
              studentNo: studentProfile.value?.studentNo || '',
            },
            consultInfo: {
              consultant: studentProfile.value?.updater || '',
              consultType: '',
              consultTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            },
          },
        })
        .open();
    },
  },
  {
    icon: 'ep:warn-triangle-filled',
    label: '上报异常',
    value: 'reportAbnormal',
    type: 'dashed',
    color: '#FF9C05',
    class: 'border-[#FF9C05] text-[#FF9C05] hover:bg-[#FF9C05]/10',
    onClick: () => {
      if (!studentProfile.value?.id) return message.error('上报异常失败！');
      studentDetailDrawerApi.close();
      emit('reportAbnormal', {
        className: studentProfile.value?.className || '',
        id: studentProfile.value?.id || 0,
        name: studentProfile.value?.name || '',
        studentNo: studentProfile.value?.studentNo || '',
      });
    },
  },
  {
    icon: 'solar:chat-round-line-bold',
    label: '预约访谈',
    value: 'interview',
    type: 'primary',
    color: '#578FFF',
    class: 'border-[#578FFF] bg-[#578FFF] text-white hover:bg-[#578FFF]/80',
    onClick: () => {
      if (!studentProfile.value?.id) return message.error('预约访谈失败！');
      studentDetailDrawerApi.close();
      emit('interview', studentProfile.value);
    },
  },
  {
    icon: 'material-symbols:event-note',
    label: '发起测评',
    value: 'startAssessment',
    type: 'primary',
    color: '#04DC70',
    class: 'border-[#04DC70] bg-[#04DC70] text-white hover:bg-[#04DC70]/80',
    onClick: () => {
      if (!studentProfile.value) return message.error('发起测评失败！');
      studentDetailDrawerApi.close();
      emit('startAssessment', studentProfile.value);
    },
  },
]);

/** 获取核心问题标签统计 */
const getSpecialMarkStats = (specialMarks: string): CoreProblemTagStat[] => {
  if (!specialMarks) {
    return [];
  }
  const items = specialMarks
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const counter = new Map<string, number>();
  for (const item of items) {
    counter.set(item, (counter.get(item) || 0) + 1);
  }
  return [...counter.entries()].map(([label, count]) => ({
    label,
    count,
  }));
};

/** 新增记录弹窗 */
const [CreateStudentEventRecordModal, createStudentEventRecordModalApi] =
  useVbenModal({
    connectedComponent: CreateStudentEventRecordDialog,
  });

/** 导出信息弹窗 */
const [ExportStudnetInfoModal, exportStudnetInfoModalApi] = useVbenModal({
  connectedComponent: ExportStudnetInfoDialog,
});

/** 新增测评弹窗 */
const [CreateEvaluationModal, createEvaluationModalApi] = useVbenModal({
  connectedComponent: CreateEvaluationDialog,
});

/** 学生详情抽屉 */
const [StudentDetailDrawer, studentDetailDrawerApi] = useVbenDrawer({
  class: 'w-[800px]',
  contentClass: 'bg-gray-50 p-0',
  showCancelButton: false,
  showConfirmButton: false,
  loading: loading.value,
  destroyOnClose: true,
  onOpenChange: async (open) => {
    if (!open) return;
    const data = studentDetailDrawerApi.getData();
    if (!data.id) return;

    loading.value = true;
    if (data.id) {
      await loadStudentProfile(data.id);
      const studentParentProfileData = await getStudentParentProfile(data.id);
      studentParentProfile.value = studentParentProfileData;
      await loadStudentProfileTimeline(data.id);
    }
    loading.value = false;
  },
});

/**
 * 加载学生档案数据
 * @param id 学生id
 */
async function loadStudentProfile(id: number) {
  try {
    const studentProfileData = await getStudentProfile(id);
    if (!studentProfileData) return;

    studentProfile.value = studentProfileData;

    const fieldMappers: Record<
      string,
      (data: PsychologyStudentProfileApi.StudentProfile) => string
    > = {
      name: (data) => data.name || '未知',
      sex: (data) => getDictObj('system_user_sex', data.sex)?.label || '未知',
      birthDate: (data) =>
        String(data.birthDate ? calculateAge(data.birthDate) : '未知'),
      className: (data) => data.className || '未知',
      studentNo: (data) => data.studentNo || '未知',
    };

    // 学生心理状态
    psychologicalStatusTag.value = (await getStudentPsychologicalStatusTag(
      'student_psychological_status',
      studentProfileData.psychologicalStatus || 0,
    )) as PsychologicalStatusTag;

    // 核心问题标签
    coreProblemTags.value = getSpecialMarkStats(
      studentProfileData?.specialMarks || '',
    );

    // 基础信息
    baseInfo.value.forEach((item) => {
      const mapper = fieldMappers[item.key];
      if (mapper) {
        item.value = mapper(studentProfileData);
      }
    });
  } catch (error) {
    console.error('加载学生档案数据失败', error);
  }
}

/**
 * 加载学生时间线数据
 * @param id 学生id
 */
async function loadStudentProfileTimeline(id: number) {
  try {
    const timeline = await getStudentProfileTimeline(id);
    if (timeline.length === 0) return;

    studentProfileTimeline.value = timeline.sort(
      (a, b) => b.createTime - a.createTime,
    );
    timelineTabs.value = timeline.map((item) => {
      return {
        title: item.eventType === 2 ? '心理测评' : item.title,
        key: item.eventType,
      };
    });

    // 根据key去重
    timelineTabs.value = timelineTabs.value.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.key === item.key),
    );

    timelineTabs.value.unshift({
      title: '全部',
      key: 0,
    });

    activeTimelineKey.value = timelineTabs.value[0]?.key || 0;
  } catch (error) {
    console.error('加载学生时间线数据失败', error);
  }
}

/** 更新加载状态 */
function updateLoading(value: boolean) {
  loading.value = value;
  if (!value) {
    // studentDetailDrawerApi.close();
    emit('refresh');
  }
}

/**
 * 新增记录
 */
function handleCreateStudentEventRecord() {
  message.warning('即将上线');
  // createStudentEventRecordModalApi.open();
}

/**
 * 导出信息
 */
function handleExportInfo() {
  message.warning('即将上线');
  // exportStudnetInfoModalApi.open();
}

/** 完成评估 */
function handleCompleteEvaluation() {
  createEvaluationModalApi.close();
}

onMounted(async () => {
  studentSexMap.value = await getDictOptions('system_user_sex');
});
</script>
<template>
  <StudentDetailDrawer title="学生360°档案">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/360file_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">学生360°档案</span>
      </div>
    </template>

    <Spin :spinning="loading" wrapper-class-name="h-full">
      <!-- 基础信息 -->
      <div class="flex h-full flex-col gap-3">
        <div class="flex flex-col gap-6 bg-white px-4 pb-3 pt-6">
          <!-- 学生信息 -->
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

          <!-- 风险评估定级/最近测评结果 -->
          <div class="flex items-center gap-3">
            <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-1 text-sm">
                <span class="font-bold">最近1次风险评估定级：</span>
                <LyTag
                  tag-category-key="risk_level"
                  :dict-value="studentProfile?.riskLevel"
                />
              </div>
              <div>
                <span class="font-bold">最近1次测评结果：</span>
                <LyTag
                  tag-category-key="questionnaire_result_risk_level"
                  :dict-value="studentProfile?.riskLevel"
                />
              </div>
            </div>
          </div>

          <!-- 问题标签 -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
              <span class="text-sm font-bold">核心问题标签</span>
            </div>
            <div class="flex items-center gap-2.5">
              <template v-if="coreProblemTags.length > 0">
                <div v-for="(tag, index) in coreProblemTags" :key="index">
                  <Badge :count="tag.count >= 2 ? tag.count : 0">
                    <span
                      class="inline-block rounded-md border border-solid border-gray-200 px-2 py-1.5 text-xs text-gray-700"
                    >
                      {{ tag.label }}
                    </span>
                  </Badge>
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
            <Tabs :tab-bar-gutter="24" v-model:active-key="activeTabKey">
              <Tabs.TabPane tab="综合时间线" key="timeline">
                <TimelineTab
                  v-model:active-timeline-key="activeTimelineKey"
                  :timeline-tabs="timelineTabs"
                  :student-profile-timeline="studentProfileTimeline"
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="测评历史" key="history">
                <AssessmentListTab
                  :student-profile-id="studentProfile?.id"
                  :student-name="studentProfile?.name"
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="咨询记录" key="consultation">
                <ConsultationListTab :student-profile-id="studentProfile?.id" />
              </Tabs.TabPane>
              <Tabs.TabPane tab="风险评估&危机干预" key="intervention">
                <div class="mx-4 mb-4 flex items-center gap-2">
                  <span
                    v-for="tab in interventionTabs"
                    :key="tab.key"
                    class="cursor-pointer rounded-full px-3 py-1 text-xs"
                    :class="
                      activeInterventionTabKey === tab.key
                        ? 'bg-[#04DC70] text-white'
                        : 'text-[#979899]'
                    "
                    @click="activeInterventionTabKey = tab.key"
                  >
                    {{ tab.title }}
                  </span>
                </div>
                <InterventionTab
                  :student-profile-id="studentProfile?.id"
                  :active-intervention-tab-key="activeInterventionTabKey"
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="个人信息" key="personalInfo">
                <PersonalInfoTab
                  :student-info="studentProfile"
                  :parent-info="studentParentProfile"
                  @update-loading="updateLoading"
                />
              </Tabs.TabPane>
            </Tabs>
            <div class="absolute right-7 top-1.5 flex items-center gap-2">
              <LyButton
                type="default"
                size="middle"
                @click="handleExportInfo"
                :disabled="loading"
              >
                导出信息
              </LyButton>
              <LyButton
                type="success"
                size="middle"
                :disabled="loading"
                @click="handleCreateStudentEventRecord"
              >
                新增记录
              </LyButton>
            </div>
          </div>
        </div>
      </div>
    </Spin>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <button
          v-for="button in footerButtons"
          :disabled="loading"
          :key="button.value"
          class="flex items-center gap-1 rounded-md border border-solid px-7 py-2 text-sm"
          :class="button.class"
          @click="button.onClick"
        >
          <IconifyIcon
            :icon="button.icon"
            :color="button.type === 'dashed' ? button.color : '#fff'"
            class="size-4"
          />
          <span class="text-xs">{{ button.label }}</span>
        </button>
      </div>
    </template>

    <CreateStudentEventRecordModal />
    <ExportStudnetInfoModal />
    <!-- 评估弹窗 -->
    <CreateEvaluationModal :publish="handleCompleteEvaluation" />
  </StudentDetailDrawer>
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

:deep(.ant-badge-count) {
  min-width: 16px !important;
  height: 16px !important;
  font-size: 10px !important;
  line-height: 16px !important;
}
</style>
