<script lang="ts" setup>
import type { CategoryCard } from '@vben/types';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Textarea as ATextarea, message } from 'ant-design-vue';

import { selectHandleMethod } from '#/api/psychology/risk';
import PsychologicalConsultDialog from '#/components/Dialog/PsychologicalConsultDialog/index.vue';
import LyCategoryCard from '#/components/LyCategoryCard/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

import CrisisAttentionIcon from '../../../static/icons/crisis/crisis_attention_icon.png';
import CrisisDirectSolveIcon from '../../../static/icons/crisis/crisis_direct_solve_icon.png';
import CrisisPsychologyIcon from '../../../static/icons/crisis/crisis_psychology_icon.png';
import CrisisQuestionnaireEvalute from '../../../static/icons/crisis/crisis_questionnaire_evalute_icon.png';

const reason = ref(''); // 处理原因
const currentMethodKey = ref<number>(0); // 当前处理方式
const psychologicalConsultDialogOpen = ref(false);

// 处理方法
const handleMethod = ref<CategoryCard[]>([
  {
    title: '访谈评估',
    description: '与学生进行进一步的访谈评估',
    text: '需要进行下一步处理',
    icon: CrisisPsychologyIcon,
    key: 1,
  },
  {
    title: '量表评估',
    description: '通过专业心理量表进行评估分析',
    text: '需要进行下一步处理',
    icon: CrisisQuestionnaireEvalute,
    key: 2,
  },
  {
    title: '持续关注',
    description: '情况较轻, 定期跟踪观察学生状态',
    icon: CrisisAttentionIcon,
    key: 3,
  },
  {
    title: '直接解决',
    description: '问题已得到妥善处理, 无需进一步干预',
    icon: CrisisDirectSolveIcon,
    key: 4,
  },
]);

const [SelectHandleMethodDrawer, selectedHandleMethodDrawerApi] = useVbenDrawer(
  {
    class: 'w-[720px]',
    destroyOnClose: true,
    onConfirm: async () => {
      if (reason.value.length < 10) {
        message.error('处理原因至少需要10个字符');
        return;
      }
      if (currentMethodKey.value === 0) {
        message.error('请选择处理方式');
        return;
      }
      // TODO 选择处理方式接口
      try {
        const response = await selectHandleMethod({
          id: crisisEventDetail.value?.id,
          processMethod: currentMethodKey.value,
          processReason: reason.value,
        });
        if (response) {
          message.success('选择处理方式成功');
        } else {
          message.error('选择处理方式失败');
        }
      } catch (error) {
        console.error('选择处理方式失败', error);
        message.error('选择处理方式失败');
      }

      selectedHandleMethodDrawerApi.close();
    },
  },
);
</script>

<template>
  <SelectHandleMethodDrawer title="选择处理方式">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/crisis/crisis_handle_method_icon.png"
          class="w-5"
        />
        <span class="text-lg font-bold">选择处理方式</span>
      </div>
    </template>

    <div class="p-2">
      <div class="mb-6 text-sm text-[#FF9C05]">
        温馨提示：请先填写处理原因 (至少10个字符) , 然后选择处理方式
      </div>

      <!-- 处理原因 -->
      <div class="relative">
        <LyLabel
          title="处理原因"
          required
          custom-title-class="font-normal text-sm"
        />
        <ATextarea
          v-model:value="reason"
          placeholder="请详细说明针对该事件的处理分析和判断依据..."
          :maxlength="200"
          show-count
        />
        <span class="absolute -bottom-5 left-0 text-xs text-[#B0B1B2]">
          至少需要 10 个字符
        </span>
      </div>

      <!-- 处理方式 -->
      <div class="mt-14 space-y-4">
        <LyLabel
          title="请根据学生情况选择合适的处理方式:"
          required
          custom-title-class="font-normal text-sm"
        />
        <div
          v-for="method in handleMethod"
          :key="method.title"
          class="space-y-6"
        >
          <LyCategoryCard
            :category="method"
            v-model:current-category-key="currentMethodKey"
          />
        </div>
      </div>
    </div>

    <PsychologicalConsultDialog v-model:open="psychologicalConsultDialogOpen" />
  </SelectHandleMethodDrawer>
</template>

<style lang="scss" scoped>
:deep(.ant-input-textarea-show-count::after) {
  margin-top: 3px;
}
</style>
