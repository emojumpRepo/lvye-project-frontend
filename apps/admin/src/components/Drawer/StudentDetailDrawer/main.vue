<script lang="ts" setup>
import type { ExtendedDrawerApi } from '@vben/common-ui';

import type { InterventionAssessmentReqVO } from '#/api/psychology';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile/index';
import type { DictDataType } from '#/utils/dict';

import { onMounted, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Badge, Divider, message, Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getStudentPsychologicalStatusTag } from '#/api/constants';
import {
  getStudentProfile,
  getStudentProfileTimeline,
  submitIndependentAssessment,
} from '#/api/psychology';
import CreateEvaluationDialog from '#/components/Dialog/CreateEvaluationDialog/index.vue';
import CreateSimpleAssessmentDialog from '#/components/Dialog/CreateSimpleAssessmentDialog/index.vue';
import CreateStudentEventRecordDialog from '#/components/Dialog/CreateStudentEventRecordDialog/index.vue';
import ExportStudnetInfoDialog from '#/components/Dialog/ExportStudnetInfoDialog/index.vue';
import CreateConsultDrawer from '#/components/Drawer/CreateConsultDrawer/index.vue';
import ReportQuicklyDrawer from '#/components/Drawer/ReportQuicklyDrawer/index.vue';
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

interface CoreProblemTagStat {
  label: string;
  count: number;
}

const props = defineProps<{
  activeTimelineTab: string;
  studentDetailDrawerApi?: ExtendedDrawerApi;
  studentProfileId: number;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

// 学生档案
const studentProfile = ref<PsychologyStudentProfileApi.StudentProfile>();
// 学生时间线
const studentProfileTimeline = ref<
  PsychologyStudentProfileApi.StudentProfileTimeline[]
>([]);

const psychologicalStatusTag = ref<PsychologicalStatusTag>();

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
    label: '风险评估',
    value: 'evaluate',
    icon: 'solar:chat-round-line-bold',
    type: 'dashed',
    color: '#578FFF',
    class: 'border-[#578FFF] text-[#578FFF] hover:bg-[#578FFF]/10',
    onClick: handleEvaluate,
  },
  {
    icon: 'ep:warn-triangle-filled',
    label: '上报异常',
    value: 'reportAbnormal',
    type: 'dashed',
    color: '#FF9C05',
    class: 'border-[#FF9C05] text-[#FF9C05] hover:bg-[#FF9C05]/10',
    onClick: handleReportAbnormal,
  },
  {
    icon: 'solar:health-bold',
    label: '预约咨询',
    value: 'interview',
    type: 'primary',
    color: '#578FFF',
    class: 'border-[#578FFF] bg-[#578FFF] text-white hover:bg-[#578FFF]/80',
    onClick: handleInterview,
  },
  {
    icon: 'material-symbols:event-note',
    label: '发起测评',
    value: 'startAssessment',
    type: 'primary',
    color: '#04DC70',
    class: 'border-[#04DC70] bg-[#04DC70] text-white hover:bg-[#04DC70]/80',
    onClick: handleStartAssessmentTask,
  },
]);

/** 新增记录弹窗 */
const [CreateStudentEventRecordModal, createStudentEventRecordModalApi] =
  useVbenModal({
    connectedComponent: CreateStudentEventRecordDialog,
  });

/** 导出信息弹窗 */
const [ExportStudnetInfoModal, exportStudnetInfoModalApi] = useVbenModal({
  connectedComponent: ExportStudnetInfoDialog,
});

/** 创建风险评估弹窗 */
const [CreateEvaluationModal, createEvaluationModalApi] = useVbenModal({
  connectedComponent: CreateEvaluationDialog,
});

// 上报异常抽屉
const [ReportAbnormalDrawer, reportAbnormalDrawerApi] = useVbenDrawer({
  connectedComponent: ReportQuicklyDrawer,
});

// 预约访谈抽屉
const [AppointConsultDrawer, appointConsultDrawerApi] = useVbenDrawer({
  connectedComponent: CreateConsultDrawer,
});

// 创建测评弹窗
const [CreateSimpleAssessmentModal, createSimpleAssessmentModalApi] =
  useVbenModal({
    connectedComponent: CreateSimpleAssessmentDialog,
  });

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

/** 查看咨询报告 */
function viewConsultReport(recordId: number) {
  appointConsultDrawerApi
    .setData({
      id: recordId,
    })
    .open();
}

// ================== 底部操作按钮函数 =======================
/** 风险评估 */
function handleEvaluate() {
  if (!studentProfile.value?.id)
    return message.error('暂无学生信息，无法进行风险评估！');

  const confirmInfo = {
    studentInfo: [
      {
        studentName: studentProfile.value?.name || '',
        className: studentProfile.value?.className || '',
        studentNo: studentProfile.value?.studentNo || '',
        studentProfileId: studentProfile.value?.id || 0,
      },
    ],
    consultInfo: {
      consultant: studentProfile.value?.updater || '',
      consultType: '',
      consultTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  };
  createEvaluationModalApi.setData({ confirmInfo }).open();
}

/** 完成评估 */
async function publishAssessment(params: InterventionAssessmentReqVO) {
  if (!studentProfile.value?.id) return false;

  try {
    const response = await submitIndependentAssessment({
      studentProfileId: studentProfile.value.id,
      ...params,
      content: params.consultRecord,
      sourceType: 5,
    });
    if (response) {
      emit('refresh');
      await loadStudentProfileTimeline(studentProfile.value.id);
      return true;
    } else {
      message.error('评估失败');
      return false;
    }
  } catch (error) {
    console.error(error);
    message.error('评估失败');
    return false;
  }
}

/** 快速上报 */
async function handleReportAbnormal() {
  if (!studentProfile.value?.id)
    return message.error('暂无学生信息，无法上报异常！');

  const { id, name, className, studentNo } = studentProfile.value;
  reportAbnormalDrawerApi
    .setData({
      selectedStudent: {
        key: id,
        value: id,
        label: `${name}（${className}）学号：${studentNo}`,
        originLabel: `${name}（${className}）学号：${studentNo}`,
      },
    })
    .open();
}

/** 预约访谈 */
function handleInterview() {
  if (!studentProfile.value?.id)
    return message.error('暂无学生信息，无法预约访谈！');
  const { id, name, className, studentNo } = studentProfile.value;
  appointConsultDrawerApi
    .setData({
      studentProfile: {
        studentName: name,
        className,
        studentNumber: studentNo,
        studentProfileId: id,
      },
    })
    .open();
}

/** 发起测评任务 */
function handleStartAssessmentTask() {
  if (!studentProfile.value?.id)
    return message.error('暂无学生信息，无法发起测评任务！');
  const { id, className, name, studentNo, userId } = studentProfile.value;
  createSimpleAssessmentModalApi
    .setData({
      id,
      className,
      studentName: name,
      studentNo,
      studentUserId: userId,
    })
    .open();
}

// ================== 初始化数据 =======================
/**
 * 加载学生档案数据
 * @param id 学生id
 */
async function loadStudentProfile(id: number | undefined) {
  if (!id) return;

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

/** 切换干预Tab */
function toggleInterventionTab(key: number) {
  activeInterventionTabKey.value = key;
}

onMounted(async () => {
  studentSexMap.value = await getDictOptions('system_user_sex');
  if (props.studentProfileId) {
    props.studentDetailDrawerApi?.setState({ loading: true });
    await loadStudentProfile(props.studentProfileId);
    await loadStudentProfileTimeline(props.studentProfileId);
    if (props.activeTimelineTab) {
      activeTabKey.value = props.activeTimelineTab;
    }
    props.studentDetailDrawerApi?.setState({ loading: false });
  }
});
</script>

<template>
  <div class="h-full">
    <!-- <Spin :spinning="loading" wrapper-class-name="h-full"> -->
    <div class="flex h-full flex-col justify-between overflow-hidden">
      <!-- 内容区域 -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- 基础信息 -->
        <div class="flex flex-col gap-6 bg-white pb-3">
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
              <div class="flex items-center gap-1 text-sm">
                <span class="font-bold">最近1次测评结果：</span>
                <LyTag
                  v-if="studentProfile?.assessmentRiskLevel"
                  tag-category-key="questionnaire_result_risk_level"
                  :dict-value="studentProfile?.assessmentRiskLevel"
                />
                <div v-else>--</div>
              </div>
            </div>
          </div>

          <!-- 问题标签 -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
              <span class="text-sm font-bold">核心问题标签</span>
            </div>
            <div class="flex flex-wrap items-center gap-2.5">
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

        <Divider class="h-[8px] !border-none bg-gray-50" />

        <div class="flex-1 overflow-x-hidden bg-white pb-5">
          <div class="h-full w-full">
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
                <ConsultationListTab
                  :student-profile-id="studentProfile?.id"
                  @view-consult-report="viewConsultReport"
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="风险评估&危机干预" key="intervention">
                <div class="flex h-full flex-col overflow-hidden">
                  <div class="mb-4 flex items-center gap-2">
                    <span
                      v-for="tab in interventionTabs"
                      :key="tab.key"
                      class="cursor-pointer rounded-full px-3 py-1 text-xs"
                      :class="
                        activeInterventionTabKey === tab.key
                          ? 'bg-[#04DC70] text-white'
                          : 'text-[#979899]'
                      "
                      @click="toggleInterventionTab(tab.key)"
                    >
                      {{ tab.title }}
                    </span>
                  </div>
                  <InterventionTab
                    :student-profile-id="studentProfile?.id"
                    :active-intervention-tab-key="activeInterventionTabKey"
                    :student-profile="studentProfile"
                  />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="个人信息" key="personalInfo">
                <PersonalInfoTab
                  :student-info="studentProfile"
                  @update-loading="updateLoading"
                  @refresh="loadStudentProfile(studentProfile?.id ?? 0)"
                />
              </Tabs.TabPane>

              <template #rightExtra>
                <div class="flex items-center gap-2">
                  <LyButton
                    type="default"
                    size="small"
                    @click="handleExportInfo"
                    :disabled="loading"
                  >
                    导出信息
                  </LyButton>
                  <LyButton
                    type="success"
                    size="small"
                    :disabled="loading"
                    @click="handleCreateStudentEventRecord"
                  >
                    新增记录
                  </LyButton>
                </div>
              </template>
            </Tabs>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div
        class="flex items-center justify-end gap-2 bg-white py-3 pl-4"
        style="border-top: 1px solid #f0f0f0"
      >
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
    </div>
    <!-- </Spin> -->

    <!-- 新增时间线记录 -->
    <CreateStudentEventRecordModal />
    <!-- 导出信息 -->
    <ExportStudnetInfoModal />
    <!-- 风险评估弹窗 -->
    <CreateEvaluationModal :publish="publishAssessment" />
    <!-- 快速上报抽屉 -->
    <ReportAbnormalDrawer />
    <!-- 预约访谈抽屉 -->
    <AppointConsultDrawer />
    <!-- 创建测评任务弹窗 -->
    <CreateSimpleAssessmentModal />
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-tabs) {
  height: 100%;
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
  height: 3px !important;
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

:deep(.ant-divider-horizontal) {
  margin: 8px 0 !important;
}
</style>
