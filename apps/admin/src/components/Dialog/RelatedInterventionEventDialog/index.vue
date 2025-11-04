<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Checkbox as ACheckbox,
  CheckboxGroup as ACheckboxGroup,
  TabPane as ATabPane,
  Tabs as ATabs,
} from 'ant-design-vue';

interface SelectedEvent {
  createTime: string;
  eventId: string;
  id: number;
  title: string;
}

const selectedEvents = ref([]);
const eventList = ref<SelectedEvent[]>([
  {
    id: 1,
    title: '心理测评',
    eventId: '1234567890',
    createTime: '2025-01-01 12:00:00',
  },
  {
    id: 2,
    title: '快速上报',
    eventId: '1234567890',
    createTime: '2025-01-01 12:00:00',
  },
  {
    id: 3,
    title: '独立评估',
    eventId: '1234567890',
    createTime: '2025-01-01 12:00:00',
  },
]);
const activeTab = ref('1');
const eventTabs = ref<{ key: string; title: string }[]>([
  {
    key: '1',
    title: '心理测评',
  },
  {
    key: '2',
    title: '快速上报',
  },
  {
    key: '3',
    title: '独立评估',
  },
]);

const [RelatedInterventionEventModal, relatedInterventionEventModalApi] =
  useVbenModal({
    fullscreenButton: false,
    destroyOnClose: true,
    class: 'w-[700px]',
    onOpenChange: async (open) => {
      if (open) {
        const data = await relatedInterventionEventModalApi.getData();
        console.log(data);
      }
    },
  });
</script>

<template>
  <RelatedInterventionEventModal title="关联干预事件">
    <div>
      <ATabs v-model:active-key="activeTab">
        <ATabPane v-for="tab in eventTabs" :key="tab.key" :tab="tab.title" />

        <!-- 列表 -->
        <div>
          <ACheckboxGroup v-model:value="selectedEvents">
            <div v-for="event in eventList" :key="event.id">
              <div class="rounded-lg bg-[#f6f8fa] p-3">
                <ACheckbox :value="event.eventId">
                  <div class="flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span class="font-bold">编号：</span>
                      <span>{{ event.eventId }}</span>
                    </div>
                    <div>
                      <span class="font-bold">编号：</span>
                      <span>{{ event.eventId }}</span>
                    </div>
                    <div>
                      <span class="font-bold">编号：</span>
                      <span>{{ event.eventId }}</span>
                    </div>

                    <div class="cursor-pointer text-[#1966FF]">查看详情</div>
                  </div>
                </ACheckbox>
              </div>
            </div>
          </ACheckboxGroup>
        </div>
      </ATabs>
    </div>
  </RelatedInterventionEventModal>
</template>
