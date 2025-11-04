<script lang="ts" setup>
import type { CrisisBoardData, StudentInterventionItem } from '@vben/types';

import type { CrisisBoardDataPageReq } from '#/api/psychology/crisis';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Spin as ASpin, message } from 'ant-design-vue';

import { createInterventionPlan } from '#/api/psychology';
import { getCrisisBoardData } from '#/api/psychology/crisis';
import CrisisInterventionDialog from '#/components/Dialog/CrisisInterventionDialog/index.vue';
import SelectedInterventionTemplateDialog from '#/components/Dialog/SelectedInterventionTemplateDialog/index.vue';

import CrisisSearch from './components/CrisisSearch.vue';
import InterventionCard from './components/InterventionCard.vue';

defineOptions({ name: 'CrisisIntervention' });

const loading = ref(true);
const interventionList = ref<CrisisBoardData[]>([]);
const crisisSearchRef = ref<InstanceType<typeof CrisisSearch>>();
const currentStudentInfo = ref<StudentInterventionItem>();
const interventionPlanTitle = ref<string>();

// 危机干预弹窗
const [CrisisInterventionModal, crisisInterventionModalApi] = useVbenModal({
  connectedComponent: CrisisInterventionDialog,
});

// 选择干预模板弹窗
const [
  SelectedInterventionTemplateModal,
  selectedInterventionTemplateModalApi,
] = useVbenModal({
  connectedComponent: SelectedInterventionTemplateDialog,
  onConfirm: async () => {
    selectedInterventionTemplateModalApi.lock();
    const data = await selectedInterventionTemplateModalApi.getData();
    await handleCreateInterventionPlan({
      templateId: data.templateId,
    });
    selectedInterventionTemplateModalApi.unlock();
    selectedInterventionTemplateModalApi.close();
  },
});

/** 打开选择干预模板弹窗 */
async function handleOpenSelectedInterventionTemplateModal(
  board: StudentInterventionItem,
  title: string,
) {
  currentStudentInfo.value = board;
  if (board.interventionPlanId) {
    return crisisInterventionModalApi
      .setData({
        studentInfo: currentStudentInfo.value,
        interventionPlanId: board.interventionPlanId,
      })
      .open();
  }
  interventionPlanTitle.value = title;
  selectedInterventionTemplateModalApi.open();
}

/**
 * 加载五级看板数据
 * @param params 搜索参数
 */
async function loadCrisisBoardData(params?: CrisisBoardDataPageReq) {
  loading.value = true;
  try {
    const response = await getCrisisBoardData({
      pageNo: 1,
      pageSize: 5,
      ...params,
    });
    if (response.length > 0) {
      interventionList.value = response;
    }
  } catch (error) {
    console.error('获取五级看板数据失败:', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 更新指定干预卡片的学生列表数据
 * @param dictValue 风险等级字典值
 * @param studentPage 学生分页数据
 */
function handleUpdateStudentPage(
  dictValue: number,
  studentPage: CrisisBoardData['studentPage'],
) {
  const item = interventionList.value.find(
    (item) => item.dictValue === dictValue,
  );
  if (item) {
    item.studentPage = studentPage;
  }
}

/** 创建干预计划 */
async function handleCreateInterventionPlan({
  templateId,
}: {
  templateId: number;
}) {
  if (!currentStudentInfo.value?.studentProfileId) {
    return message.error('请选择学生');
  }
  if (!templateId) {
    return message.error('请选择模板');
  }

  try {
    const response = await createInterventionPlan({
      studentProfileId: currentStudentInfo.value?.studentProfileId || 0,
      templateId,
      title: interventionPlanTitle.value || '',
    });
    if (!response) {
      return message.error('创建干预计划失败');
    }
    message.success('创建干预计划成功');
    crisisInterventionModalApi
      .setData({
        studentInfo: currentStudentInfo.value,
        interventionPlanId: response,
      })
      .open();
  } catch (error) {
    console.error('创建干预计划失败', error);
    message.error('创建干预计划失败');
  }
}
onMounted(async () => {
  await loadCrisisBoardData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-4 p-2">
      <!-- 搜索表单 -->
      <CrisisSearch
        ref="crisisSearchRef"
        @search="loadCrisisBoardData"
        :loading="loading"
      />

      <!-- 列表 -->
      <ASpin :spinning="loading" class="flex-center flex-1">
        <div class="grid h-full grid-cols-5 gap-5 overflow-hidden">
          <template v-for="item in interventionList" :key="item.type">
            <InterventionCard
              :intervention-item="item"
              :search-params="crisisSearchRef?.crisisEventListReq"
              @update-student-page="
                (studentPage) =>
                  handleUpdateStudentPage(item.dictValue, studentPage)
              "
              @open-selected-intervention-template-modal="
                handleOpenSelectedInterventionTemplateModal
              "
            />
          </template>
        </div>
      </ASpin>

      <CrisisInterventionModal />
      <SelectedInterventionTemplateModal />
    </div>
  </Page>
</template>

<style lang="scss" scoped>
:deep(.vxe-pager--sizes) {
  margin-right: 0 !important;
}

:deep(.ant-progress-text) {
  color: #979899;
}

:deep(.ant-btn-link) {
  color: #2c68ff;
}

:deep(.ant-pagination-simple-pager) {
  margin-inline-end: 0 !important;
}

:deep(.ant-spin-nested-loading) {
  height: 100% !important;
  overflow: hidden !important;
}

:deep(.ant-spin-container) {
  height: 100% !important;
}
</style>
