<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getConfigKey } from '#/api/infra/config';
import {
  getOngoingRiskEvent,
  getOngoingTasks,
  getTodayConsultationTask,
} from '#/api/psychology';
import HandleCrisisEventDetail from '#/components/Dialog/handleCrisisEventDialog/index.vue';
import CreateConsultDrawer from '#/components/Drawer/CreateConsultDrawer/index.vue';
import ReportQuicklyDrawer from '#/components/Drawer/ReportQuicklyDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import PageTitle from '#/components/PageTitle/index.vue';
import { getDictObj } from '#/utils/dict';
import WorkSpaceCard from '#/views/dashboard/workspace/components/WorkSpaceCard.vue';
import { useLoadingState } from '#/views/dashboard/workspace/composables/useLoadingState';

// 快速上报抽屉
const [ReportFastDrawer, reportFastDrawerApi] = useVbenDrawer({
  connectedComponent: ReportQuicklyDrawer,
});

// 预约抽屉
const [ConsultationDrawer, consultationDrawerApi] = useVbenDrawer({
  connectedComponent: CreateConsultDrawer,
});

// 预警事件详情弹窗
const [CrisisEventDetailModal, crisisEventDetailModalApi] = useVbenModal({
  connectedComponent: HandleCrisisEventDetail,
});

const systemWelcome = ref(''); // 系统欢迎语
const router = useRouter();

/** 打开快速上报抽屉 */
function handleQuickReport() {
  reportFastDrawerApi.open();
}

/** 获取系统欢迎语 */
async function loadSystemWelcome() {
  try {
    const response = await getConfigKey('system.welcome');
    if (!response) return;
    systemWelcome.value = response || '欢迎使用心理健康管理系统';
  } catch (error) {
    console.error('获取系统欢迎语失败', error);
    message.error('获取系统欢迎语失败, 请稍后重试');
  }
}

// --- 1. 心理测评相关任务 ---
const {
  data: assessmentTasksList,
  total: tasksTotal,
  loading: tasksLoading,
  load: loadOngoingTasks,
} = useLoadingState(
  // 这个函数现在必须返回 PaginatedData<ViewData>
  async ({ pageNo, pageSize }: { pageNo: number; pageSize: number }) => {
    const response = await getOngoingTasks({ pageNo, pageSize });

    if (!response || !response.list || response.list.length === 0) {
      return { list: [], total: 0 }; // 返回空的分页结构
    }

    const mappedList = response.list.map((item) => {
      const statusDict = getDictObj('assessment_task_status', item.status);
      return {
        id: item.taskNo,
        studentName: item.taskName,
        rightTopContent: `已完成（${item.completedCount}/${item.totalCount}）`,
        tags: [
          {
            label: statusDict?.label,
            colorType: statusDict?.colorType,
          },
        ],
        content: [
          {
            label: '关联问卷',
            value: item.questionnaires
              .map((questionnaire) => questionnaire.title)
              .join('|'),
          },
          {
            label: '发布人',
            value: item.publishUser,
          },
        ],
        completionRate: item.completionRate,
      };
    });

    // 返回 { list, total } 结构
    return {
      list: mappedList,
      total: response.total || 0, // 假设 API 响应中有 'total' 字段
    };
  },
  {
    // 更新 initialData 结构
    initialData: { list: [], total: 0 },
    errorMessage: '获取正在进行的任务失败',
  },
);

// --- 2. 待处理预警事件 ---
const {
  data: alertsList,
  total: alertsTotal,
  loading: alertsLoading,
  load: loadOngoingRiskEvent,
} = useLoadingState(
  async ({ pageNo, pageSize }: { pageNo: number; pageSize: number }) => {
    const response = await getOngoingRiskEvent({ pageNo, pageSize });
    if (!response || !response.list || response.list.length === 0) {
      return { list: [], total: 0 };
    }
    const mappedList = response.list.map((item) => {
      const statusDict = getDictObj('crisis_event_status', item.status);
      const sourceTypeDict = getDictObj(
        'crisis_event_report_source',
        item.sourceType,
      );
      return {
        id: item.id,
        studentName: item.studentName,
        className: item.className,
        tags: [
          {
            label: statusDict?.label,
            colorType: statusDict?.colorType,
          },
          {
            label: sourceTypeDict?.label,
            colorType: sourceTypeDict?.colorType,
          },
        ],
        content: [
          {
            value: item.description,
          },
          {
            label: '上报人',
            value: item.reporterName,
          },
          {
            label: '上报时间',
            value: dayjs(item.reportedAt).format('YYYY-MM-DD HH:mm:ss'),
          },
        ],
      };
    });
    return {
      list: mappedList,
      total: response.total || 0, // 假设 API 响应中有 'total' 字段
    };
  },
  {
    initialData: { list: [], total: 0 },
    errorMessage: '获取正在进行的风险预警流程失败',
  },
);

// --- 3. 今日心理咨询任务 ---
const {
  data: consultationsList,
  total: consultationsTotal,
  loading: consultationsLoading,
  load: loadTodayConsultationTask,
} = useLoadingState(
  async ({ pageNo, pageSize }: { pageNo: number; pageSize: number }) => {
    const response = await getTodayConsultationTask({ pageNo, pageSize });
    if (!response || !response.list || response.list.length === 0) {
      return { list: [], total: 0 };
    }
    const mappedList = response.list.map((item) => {
      const statusDict = getDictObj('counseling_status', item.status);
      return {
        id: item.id,
        studentName: item.studentName,
        className: item.className,
        rightTopContent: dayjs(item.appointmentStartTime).format(
          'YYYY-MM-DD HH:mm:ss',
        ),
        tags: [
          {
            label: statusDict?.label,
            colorType: statusDict?.colorType,
          },
        ],
        content: [
          {
            label: '咨询师',
            value: item.counselorName,
          },
          {
            label: '咨询地点',
            value: item.location,
          },
        ],
      };
    });
    return {
      list: mappedList,
      total: response.total || 0, // 假设 API 响应中有 'total' 字段
    };
  },
  {
    initialData: { list: [], total: 0 },
    errorMessage: '获取今日咨询任务失败, 请稍后重试',
  },
);

/** 打开心理测评任务详情页面 */
function handleAssessmentDetail(taskNo: number | string) {
  router.push(`/assessment/detail/${taskNo}`);
}

/** 打开危机事件详情页面 */
function handleCrisisEventDetail(id: number | string) {
  crisisEventDetailModalApi.setData({ id }).open();
}

/** 打开预约页面 */
function handleConsultationDetail(id: number | string) {
  consultationDrawerApi.setData({ id }).open();
}

onMounted(async () => {
  await loadSystemWelcome();
});
</script>

<template>
  <div
    class="flex h-full flex-col px-4 pb-6 pt-4 sm:px-6 md:px-8 md:pb-8 md:pt-5 lg:pb-10"
  >
    <PageTitle :title="systemWelcome">
      <template #action>
        <LyButton size="middle" type="success" @click="handleQuickReport">
          快速上报
        </LyButton>
      </template>
    </PageTitle>

    <div class="grid flex-1 grid-cols-3 gap-4">
      <!-- 正在进行的心理测评任务 -->
      <WorkSpaceCard
        :with-gradient="true"
        icon-src="ix:user-filled"
        icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
        title="心理测评相关任务"
        class="min-h-[400px] md:col-span-1"
        :items="assessmentTasksList"
        :loading="tasksLoading"
        :total="tasksTotal"
        @load="loadOngoingTasks"
        @detail="handleAssessmentDetail"
      />

      <!-- 待处理预警事件 -->
      <WorkSpaceCard
        :with-gradient="true"
        icon-src="octicon:bell-fill-24"
        icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
        title="待处理预警事件"
        class="min-h-[400px] md:col-span-2 xl:col-span-1"
        :items="alertsList"
        :loading="alertsLoading"
        :total="alertsTotal"
        @load="loadOngoingRiskEvent"
        @detail="handleCrisisEventDetail"
      />

      <!-- 今日心理咨询任务 -->
      <WorkSpaceCard
        :with-gradient="true"
        icon-src="mingcute:task-2-fill"
        icon-bg="linear-gradient(143.39deg, #FFB6D9 11.39%, #FF1271 89.3%)"
        title="今日心理咨询任务"
        class="min-h-[400px] md:col-span-1"
        :items="consultationsList"
        :loading="consultationsLoading"
        :total="consultationsTotal"
        @load="loadTodayConsultationTask"
        @detail="handleConsultationDetail"
      />
    </div>

    <ReportFastDrawer />
    <ConsultationDrawer />
    <CrisisEventDetailModal />
  </div>
</template>
