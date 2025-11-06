<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Empty, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getStudentCrisisEventsBySourceType,
  updateInterventionPlanRelativeEvents,
} from '#/api/psychology';
import { getDictLabel } from '#/utils/dict';

import HandleCrisisEventDialog from '../handleCrisisEventDialog/index.vue';

interface SelectedEvent {
  sourceType: number;
  createTime: number;
  eventId: string;
  id: number;
}

const emits = defineEmits<{
  (e: 'refresh'): void;
}>();

const interventionPlanId = ref<number>();
const activeTab = ref<number>(); // 当前选中标签
const eventTabs = ref<{ key: number; title: string }[]>([]); // 事件标签列表
const eventList = ref<SelectedEvent[]>([]); // 事件列表
const selectedEvents = ref<number[]>([]); // 已选中的事件列表

/** 预警流程弹窗 */
const [HandleCrisisEventModal, handleCrisisEventModalApi] = useVbenModal({
  connectedComponent: HandleCrisisEventDialog,
});

/** 打开关联事件弹窗 */
const [RelatedInterventionEventModal, relatedInterventionEventModalApi] =
  useVbenModal({
    fullscreenButton: false,
    destroyOnClose: true,
    class: 'w-[650px]',
    onOpenChange: async (open) => {
      if (open) {
        relatedInterventionEventModalApi.setState({ loading: true });
        const data = await relatedInterventionEventModalApi.getData();
        interventionPlanId.value = data.interventionPlanId;
        selectedEvents.value = data.relativeEventIds;
        try {
          const response = await getStudentCrisisEventsBySourceType(
            data.studentProfileId,
          );
          if (response && response.length > 0) {
            eventList.value = response.flatMap((type) => {
              return type.events.map((event) => {
                return {
                  sourceType: type.sourceType,
                  id: event.id,
                  eventId: event.eventId,
                  createTime: event.createTime,
                };
              });
            });

            eventTabs.value = [
              ...new Map(
                eventList.value.map((item) => [
                  item.sourceType,
                  {
                    key: item.sourceType,
                    title: getDictLabel(
                      'crisis_event_report_source',
                      item.sourceType,
                    ),
                  },
                ]),
              ).values(),
            ];

            if (eventTabs.value && eventTabs.value.length > 0) {
              activeTab.value = eventTabs.value[0]?.key;
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          relatedInterventionEventModalApi.setState({ loading: false });
        }
      }
    },
    onConfirm: async () => {
      if (!interventionPlanId.value) return message.error('干预计划ID不存在');

      try {
        relatedInterventionEventModalApi.lock();
        const response = await updateInterventionPlanRelativeEvents({
          id: interventionPlanId.value!,
          relativeEventIds: selectedEvents.value,
        });
        if (!response) return message.error('关联事件失败');
        emits('refresh');
        relatedInterventionEventModalApi.close();
        message.success('关联事件成功');
      } catch (error) {
        console.error(error);
        message.error('关联事件失败');
      } finally {
        relatedInterventionEventModalApi.unlock();
      }
    },
  });

/** 判断事件是否选中 */
const isSelected = (eventId: number) => {
  return selectedEvents.value.includes(eventId);
};

/** 过滤事件列表 */
const filteredEventList = computed(() => {
  if (!activeTab.value) return [];
  return eventList.value.filter((item) => item.sourceType === activeTab.value);
});

/** 切换事件选中状态 */
const toggleEvent = (eventId: number) => {
  const index = selectedEvents.value.indexOf(eventId);
  if (index === -1) {
    selectedEvents.value.push(eventId);
  } else {
    selectedEvents.value.splice(index, 1);
  }
};

/** 查看危机事件详情 */
const handleViewCrisisEvent = (eventId: number) => {
  if (!eventId) return message.error('事件ID不存在');
  handleCrisisEventModalApi.setData({ id: eventId }).open();
};
</script>

<template>
  <RelatedInterventionEventModal title="关联干预事件">
    <div class="flex h-[300px] flex-col gap-4 p-2">
      <div class="flex items-center gap-2">
        <span
          v-for="tab in eventTabs"
          :key="tab.key"
          class="cursor-pointer rounded-full px-3 py-1 text-xs"
          :class="
            activeTab === tab.key ? 'bg-[#04DC70] text-white' : 'text-[#979899]'
          "
          @click="activeTab = tab.key"
        >
          {{ tab.title }}
        </span>
      </div>

      <!-- 列表 -->
      <div>
        <div class="scroll-area w-full flex-1 space-y-4 overflow-y-auto">
          <div v-if="filteredEventList.length === 0" class="flex-center h-full">
            <Empty />
          </div>

          <template v-else>
            <div v-for="event in filteredEventList" :key="event.id">
              <div class="rounded-lg bg-[#f6f8fa] p-3">
                <div class="flex items-center gap-3">
                  <!-- Custom circular checkbox -->
                  <div
                    class="custom-checkbox"
                    :class="{ checked: isSelected(event.id) }"
                    @click="toggleEvent(event.id)"
                  >
                    <IconifyIcon icon="mdi:check" class="checkmark" />
                  </div>

                  <!-- Content -->
                  <div class="flex flex-1 items-center justify-between text-xs">
                    <div class="flex">
                      <span class="whitespace-nowrap font-bold">编号：</span>
                      <span class="text-[#979899]">{{ event.eventId }}</span>
                    </div>
                    <div class="flex">
                      <span class="whitespace-nowrap font-bold">
                        事件类型：
                      </span>
                      <span class="text-[#979899]">
                        {{
                          getDictLabel(
                            'crisis_event_report_source',
                            event.sourceType,
                          )
                        }}
                      </span>
                    </div>
                    <div class="flex">
                      <span class="whitespace-nowrap font-bold">
                        上报时间：
                      </span>
                      <span class="text-[#979899]">
                        {{
                          dayjs(event.createTime).format('YYYY-MM-DD HH:mm:ss')
                        }}
                      </span>
                    </div>

                    <div
                      class="cursor-pointer text-[#1966FF] hover:text-[#1966FF]/80"
                      @click="handleViewCrisisEvent(event.id)"
                    >
                      查看详情
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <HandleCrisisEventModal />
    </div>
  </RelatedInterventionEventModal>
</template>

<style scoped>
.custom-checkbox {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  min-width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-checkbox:hover {
  border-color: #04dc70;
  transform: scale(1.1);
}

.custom-checkbox.checked {
  background-color: #04dc70;
  border-color: #04dc70;
  animation: checkbox-pop 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.checkmark {
  font-size: 14px;
  color: white;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-checkbox.checked .checkmark {
  opacity: 1;
  transform: scale(1);
  animation: checkmark-draw 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
}

@keyframes checkbox-pop {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes checkmark-draw {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-45deg);
  }

  50% {
    opacity: 1;
    transform: scale(1.1) rotate(0deg);
  }

  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
</style>
