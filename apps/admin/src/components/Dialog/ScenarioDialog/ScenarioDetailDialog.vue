<script setup lang="ts">
import type { AssessmentScenario, AssessmentScenarioSlot } from '@vben/types';

import { onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Descriptions, DescriptionsItem, Table, Tag } from 'ant-design-vue';

import { getAssessmentScenarioSlots } from '#/api/psychology/scenario';

interface Props {
  record?: AssessmentScenario;
}

const props = withDefaults(defineProps<Props>(), {
  record: undefined,
});

// ============== 数据状态 ==============
const loading = ref(false);
const slots = ref<AssessmentScenarioSlot[]>([]);

// ============== 槽位表格配置 ==============
const slotColumns = [
  {
    title: '槽位编码',
    dataIndex: 'slotKey',
    key: 'slotKey',
    width: 160,
  },
  {
    title: '槽位名称',
    dataIndex: 'slotName',
    key: 'slotName',
  },
  {
    title: '顺序',
    dataIndex: 'slotOrder',
    key: 'slotOrder',
    width: 100,
  },
  {
    title: '允许类型',
    dataIndex: 'allowedQuestionnaireTypes',
    key: 'allowedQuestionnaireTypes',
  },
  {
    title: '前端组件',
    dataIndex: 'frontendComponent',
    key: 'frontendComponent',
  },
];

// ============== 数据加载 ==============
async function loadSlots() {
  if (!props.record?.id) return;

  try {
    loading.value = true;
    const result = await getAssessmentScenarioSlots(props.record.id);
    slots.value = result || [];
  } catch (error) {
    console.error('加载槽位失败:', error);
    slots.value = [];
  } finally {
    loading.value = false;
  }
}

// 监听记录变化，重新加载槽位数据
watch(
  () => props.record,
  () => {
    loadSlots();
  },
  { immediate: true },
);

onMounted(() => {
  loadSlots();
});

// ============== Dialog ==============
const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  centered: true,
  contentClass: ' max-w-[95vw]',
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取最新数据并刷新
      loadSlots();
      modalApi.setState({ title: '场景详情' });
    }
  },
});
</script>

<template>
  <Modal>
    <div class="p-4">
      <!-- 基本信息 -->
      <div class="mb-4">
        <Descriptions :column="2" bordered>
          <DescriptionsItem label="场景编码">
            {{ record?.code || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="场景名称">
            {{ record?.name || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="最大问卷数">
            {{ record?.maxQuestionnaireCount || '不限' }}
          </DescriptionsItem>
          <DescriptionsItem label="前端路由">
            {{ record?.frontendRoute || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="启用状态">
            <Tag :color="record?.isActive ? 'success' : 'default'">
              {{ record?.isActive ? '启用' : '禁用' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="创建时间">
            {{
              record?.createTime
                ? new Date(record.createTime).toLocaleString()
                : '-'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="扩展配置" :span="2">
            <pre class="whitespace-pre-wrap text-sm">{{
              record?.metadataJson || '无'
            }}</pre>
          </DescriptionsItem>
        </Descriptions>
      </div>

      <!-- 槽位定义 -->
      <div class="mb-2">
        <div class="mb-1 font-semibold">槽位定义</div>
        <Table
          :columns="slotColumns"
          :data-source="slots"
          :loading="loading"
          :pagination="false"
          size="small"
          bordered
        >
          <template #emptyText>
            <div class="py-4 text-center text-gray-500">该场景暂无槽位定义</div>
          </template>
        </Table>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
pre {
  max-height: 200px;
  padding: 8px;
  overflow-y: auto;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
