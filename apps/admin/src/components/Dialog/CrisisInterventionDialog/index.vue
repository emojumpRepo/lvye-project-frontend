<script lang="ts" setup>
import type { StudentInterventionItem } from '@vben/types';

import { provide, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Empty as AEmpty } from 'ant-design-vue';

import InterventionStepDetail from './components/InterventionStepDetail.vue';
import ViewInterventionPlan from './components/ViewInterventionPlan.vue';

const studentInfo = ref<StudentInterventionItem>();
const interventionPlanId = ref<number>();
const viewInterventionPlanRef =
  ref<InstanceType<typeof ViewInterventionPlan>>();

const bgImage =
  'https://6d65-mentor-3gyob3y3bdbc2bdb-1305613707.tcb.qcloud.la/lvye/bg.jpg';

/** 打开返回确认弹窗 */
function handleOpenCancelConfirmModal() {
  crisisInterventionModalApi.close();
}

// 危机干预弹窗
const [CrisisInterventionModal, crisisInterventionModalApi] = useVbenModal({
  fullscreen: true,
  fullscreenButton: false,
  destroyOnClose: true,
  closable: false,
  headerClass: '!hidden',
  footer: false,
  contentClass: '!p-0 !overflow-hidden',
  appendToMain: true,
  onOpenChange: async (open) => {
    if (open) {
      const data = await crisisInterventionModalApi.getData();
      studentInfo.value = data.studentInfo;
      interventionPlanId.value = data.interventionPlanId;
      if (data.fullScreen) {
        crisisInterventionModalApi.setState({
          appendToMain: false,
        });
      }
    }
  },
});

/** 查看干预计划 */
function viewInterventionPlan(
  student: StudentInterventionItem,
  interventionId: number,
) {
  studentInfo.value = student;
  interventionPlanId.value = interventionId;
}

// 注入函数到后代组件
provide('viewEvent', viewInterventionPlan);
</script>

<template>
  <CrisisInterventionModal>
    <div
      class="bg-background-deep relative box-border flex h-full w-full !bg-[#f7f8fa]"
    >
      <img :src="bgImage" width="100%" class="absolute left-0 top-0" />

      <div class="z-10 grid h-full w-full grid-cols-2 gap-8">
        <!-- 干预计划看板 -->
        <template v-if="studentInfo && interventionPlanId">
          <ViewInterventionPlan
            ref="viewInterventionPlanRef"
            :student-info="studentInfo"
            :intervention-plan-id="interventionPlanId"
            @close="handleOpenCancelConfirmModal"
          />

          <!-- 干预计划详情 -->
          <InterventionStepDetail
            :intervention-id="interventionPlanId"
            :status="viewInterventionPlanRef?.interventionPlan?.status || 1"
            :student-profile-id="studentInfo?.studentProfileId"
            :step="viewInterventionPlanRef?.currentStep"
            :current-action="viewInterventionPlanRef?.currentAction || 'init'"
            @refresh="viewInterventionPlanRef?.loadInterventionPlan"
          />
        </template>

        <template v-else>
          <div class="flex-center h-full">
            <AEmpty description="暂无干预计划" />
          </div>
        </template>
      </div>
    </div>
  </CrisisInterventionModal>
</template>
