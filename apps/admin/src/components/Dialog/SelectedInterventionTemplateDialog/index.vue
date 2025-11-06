<script lang="ts" setup>
import type { InterventionTemplateResVO } from '#/api/psychology/intervention-template';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Radio as ARadio, RadioGroup as ARadioGroup } from 'ant-design-vue';

import { getInterventionTemplateList } from '#/api/psychology';

const interventionTemplateList = ref<InterventionTemplateResVO[]>([]);
const selectedTemplateId = ref<number | undefined>(undefined);

const [
  SelectedInterventionTemplateModal,
  selectedInterventionTemplateModalApi,
] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  onOpenChange: async (open) => {
    if (open) {
      selectedInterventionTemplateModalApi.setState({ loading: true });
      await loadInterventionTemplateList();
      selectedInterventionTemplateModalApi.setState({ loading: false });
    }
  },
});

/** 获取模板列表 */
async function loadInterventionTemplateList() {
  try {
    const response = await getInterventionTemplateList();
    if (response.length > 0) {
      interventionTemplateList.value = response;
    }
  } catch (error) {
    console.error(error);
  }
}

/** 新建模板 */
function handleCreateTemplate() {
  window.open(`${window.location.origin}/system/config`, '_blank');
}

/** 选择模板 */
function handleSelectTemplate() {
  selectedInterventionTemplateModalApi.setData({
    templateId: selectedTemplateId.value,
  });
}
</script>

<template>
  <SelectedInterventionTemplateModal title="选择干预模板">
    <div class="flex flex-col gap-4 p-2">
      <ARadioGroup
        v-model:value="selectedTemplateId"
        @change="handleSelectTemplate"
      >
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="template in interventionTemplateList"
            :key="template.id"
            class="w-full rounded-2xl bg-[#f6f8fa] p-6"
          >
            <ARadio :value="template.id">
              <span class="font-bold">{{ template.title }}</span>
            </ARadio>
          </div>
        </div>
      </ARadioGroup>

      <div
        class="flex cursor-pointer items-center gap-2 text-[#1966FF] hover:!text-[#1966FF]/80"
        @click="handleCreateTemplate()"
      >
        <IconifyIcon icon="material-symbols:add-rounded" class="size-4" />
        <span class="text-xs">新建模板</span>
      </div>
    </div>
  </SelectedInterventionTemplateModal>
</template>
