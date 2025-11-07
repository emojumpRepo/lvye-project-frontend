<script setup lang="ts">
import type { CategorizedDimensions } from '../../composables/useDimensionFormatter';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { MtuiUniversityResultRespVO } from '#/api/psychology/assessment/index';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { RiskLevelEnum, specialLevel } from '@vben/types';

import { Popover, Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getColorConfig } from '#/api/constants';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

import { useDimensionFormatter } from '../../composables/useDimensionFormatter';
import {
  ASSESSMENT_RESULT_DESCRIPTION,
  OTHER_DIMENSION_DESCRIPTION,
} from '../constants';

// 从 composable 中导入 DimensionResult 类型
type DimensionResult = CategorizedDimensions['extremeBehavior'][number];

// 扩展类型，支持分类标题行
type TableRow =
  | (DimensionResult & { isCategory?: boolean })
  | {
      [key: string]: any;
      categoryName: string;
      isCategory: boolean;
    };

const props = defineProps<{
  mtuiResult?: MtuiUniversityResultRespVO;
}>();

const tabs = ref<{ key: string; tab: string }[]>([
  { key: 'key_risk_dimensions', tab: '重点风险维度' },
  { key: 'all_dimensions', tab: '全维度' },
]);
const activeKey = ref('key_risk_dimensions');

// 将 props.mtuiResult?.questionnaireResults 转换为响应式 computed
const questionnaireResults = computed(
  () => props.mtuiResult?.questionnaireResults ?? [],
);

// 使用维度格式化 composable
const { getAllDimensionsByCategory, getHighRiskDimensionsByCategory } =
  useDimensionFormatter(questionnaireResults);

// 重点风险维度数据（riskLevel >= 3）
const highRiskData = computed(() => {
  const categorized = getHighRiskDimensionsByCategory();
  const rows: TableRow[] = [];

  // 包含所有三个分类
  if (categorized.extremeBehavior.length > 0) {
    rows.push(
      {
        isCategory: true,
        categoryName: '重点细分维度：极端行为',
      },
      ...categorized.extremeBehavior,
    );
  }

  if (categorized.participatingOther.length > 0) {
    rows.push(
      {
        isCategory: true,
        categoryName: '重点细分维度：其他维度',
      },
      ...categorized.participatingOther,
    );
  }

  if (categorized.nonParticipating.length > 0) {
    rows.push(
      {
        isCategory: true,
        categoryName: '其他可参考细分维度结果',
      },
      ...categorized.nonParticipating,
    );
  }

  return rows;
});

// 全维度数据
const allDimensionsData = computed(() => {
  const categorized = getAllDimensionsByCategory();
  const rows: TableRow[] = [];

  // 包含所有三个分类
  if (categorized.extremeBehavior.length > 0) {
    rows.push(
      {
        isCategory: true,
        categoryName: '重点细分维度：极端行为',
      },
      ...categorized.extremeBehavior,
    );
  }

  if (categorized.participatingOther.length > 0) {
    rows.push(
      {
        isCategory: true,
        categoryName: '重点细分维度：其他维度',
      },
      ...categorized.participatingOther,
    );
  }

  if (categorized.nonParticipating.length > 0) {
    rows.push(
      {
        isCategory: true,
        categoryName: '其他可参考细分维度结果',
      },
      ...categorized.nonParticipating,
    );
  }

  return rows;
});

// 表格数据（使用 ref 而不是 computed 来避免循环依赖）
const tableData = ref<TableRow[]>([]);

// 更新表格数据的函数
function updateTableData() {
  tableData.value =
    activeKey.value === 'key_risk_dimensions'
      ? highRiskData.value
      : allDimensionsData.value;
}

// 监听 activeKey 变化，更新表格数据
watch(activeKey, updateTableData, { immediate: true });

// 监听数据源变化，更新表格数据
watch([highRiskData, allDimensionsData], updateTableData);

// 表格列配置
const columns = computed<VxeGridPropTypes.Columns>(() => [
  {
    title: '编号',
    type: 'seq',
    width: 60,
    align: 'center',
    fixed: 'left',
    slots: { default: 'seq' },
    resizable: false,
  },
  {
    title: '大维度',
    field: 'questionnaireName',
    minWidth: 120,
    align: 'left',
    slots: { default: 'questionnaireName' },
    resizable: false,
  },
  {
    title: '身心问题（细分维度）',
    field: 'dimensionName',
    minWidth: 150,
    align: 'left',
    resizable: false,
  },
  {
    title: '维度解释',
    field: 'dimensionDescription',
    minWidth: 300,
    align: 'left',
    resizable: false,
  },
  {
    title: '测评得分',
    field: 'score',
    width: 100,
    align: 'center',
    slots: {
      default: 'score',
    },
    resizable: false,
  },
  {
    title: '测评结果',
    field: 'level',
    width: 250,
    align: 'left',
    slots: {
      default: 'level',
      header: 'levelHeader',
    },
    resizable: false,
  },
  {
    title: '结果解读',
    field: 'teacherComment',
    minWidth: 300,
    align: 'left',
    resizable: false,
    slots: {
      default: 'teacherComment',
    },
  },
]);

// 合并单元格方法
function spanMethod({ row, column }: any) {
  // 如果是分类标题行
  if (row.isCategory) {
    // 序号列（第一列）
    if (column.type === 'seq') {
      return { rowspan: 0, colspan: 0 };
    }
    // 大维度列（第二列）合并所有剩余列（包括序号列在内共7列，从第2列开始合并6列）
    if (column.field === 'questionnaireName') {
      return { rowspan: 1, colspan: 7 };
    }
    // 其他列不显示（因为被合并了）
    return { rowspan: 0, colspan: 0 };
  }
  // 数据行正常显示
  return { rowspan: 1, colspan: 1 };
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: columns.value,
    data: tableData.value,
    border: false,
    showOverflow: false, // 不显示省略号，完全展示文本
    stripe: false, // 移除斑马条纹
    highlightHoverRow: true,
    spanMethod, // 添加合并单元格方法
    // 禁用分页器
    pagerConfig: {
      enabled: false,
    },
    // 禁用 toolbar
    toolbarConfig: {
      enabled: false,
    },
    // 不设置固定高度，让表格根据数据自适应
    autoResize: false,
    scrollY: {
      enabled: false,
    },
  },
});

// 监听 tableData 变化，更新表格数据并重新计算高度
watch(
  tableData,
  async (newData) => {
    await gridApi.grid?.loadData(newData);
    // 重新计算表格高度
    gridApi.grid?.recalculate(true);
  },
  { deep: true },
);

// 监听 activeKey 变化，触发表格重新计算高度
watch(activeKey, async () => {
  // 等待下一个 tick 确保 DOM 已更新
  await new Promise((resolve) => setTimeout(resolve, 100));
  gridApi.grid?.recalculate(true);
});

function getResultColor(row: TableRow) {
  if (specialLevel.includes(row.level.split('，')[1])) {
    return '#ff0831';
  }
  if (
    row.dimensionCode.includes('NSSI_reason') ||
    row.riskLevel < RiskLevelEnum.MEDIUM
  ) {
    return 'black';
  }
  return getColorConfig({
    dictValue: row.riskLevel,
    target: 'color',
  }) as string;
}
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl bg-white p-4">
    <LyCardTitle
      title="细分维度总览"
      icon="material-symbols-light:list-alt"
      title-class="text-base font-bold text-[#000000D9] sm:text-lg"
      hide-line
      icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
    />

    <div class="horizontal-divider"></div>

    <Tabs v-model:active-key="activeKey" class="dimension-tabs">
      <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab" />
    </Tabs>

    <!-- 维度表格 -->
    <div class="dimension-table-wrapper">
      <Grid>
        <!-- 序号列：分类标题行不显示序号，数据行显示实际序号 -->
        <template #seq="{ row, $rowIndex }">
          <span v-if="!row.isCategory">
            {{
              tableData.slice(0, $rowIndex).filter((r) => !r.isCategory)
                .length + 1
            }}
          </span>
        </template>

        <!-- 大维度列：分类标题行显示分类名称，数据行显示问卷名称 -->
        <template #questionnaireName="{ row }">
          <div v-if="row.isCategory" class="category-title">
            {{ row.categoryName }}
            <template v-if="row.categoryName === '其他可参考细分维度结果'">
              <Popover
                :content="OTHER_DIMENSION_DESCRIPTION"
                placement="right"
                arrow-point-at-center
                :mouse-enter-delay="0.3"
                :mouse-leave-delay="0.1"
                :overlay-style="{
                  maxWidth: '400px',
                  wordWrap: 'break-word',
                }"
              >
                <IconifyIcon
                  icon="material-symbols:help"
                  class="cursor-pointer text-lg text-[#AEAEAEFF] transition-colors hover:text-[#AEAEAEFF]/80"
                />
              </Popover>
            </template>
          </div>
          <span v-else>{{ row.questionnaireName }}</span>
        </template>

        <!-- 测评结果列：自定义样式 -->
        <template #level="{ row }">
          <span
            v-if="!row.isCategory"
            class="risk-level-tag"
            :style="{
              color: getResultColor(row),
            }"
          >
            {{
              row.dimensionCode.includes('NSSI_reason')
                ? `${row.teacherComment}有${row.level}`
                : row.level
            }}
          </span>
        </template>

        <template #teacherComment="{ row }">
          <span v-if="row.dimensionCode.includes('NSSI_reason')"> -- </span>
          <span v-else>{{ row.teacherComment }}</span>
        </template>

        <!-- 测评得分列：自定义样式 -->
        <template #score="{ row }">
          <span v-if="!row.isCategory && row?.showScore">{{ row.score }}</span>
          <span v-else>--</span>
        </template>

        <!-- 测评结果表头：带帮助图标 -->
        <template #levelHeader>
          <div class="flex items-center gap-2">
            <span>测评结果</span>
            <Popover
              :content="ASSESSMENT_RESULT_DESCRIPTION"
              placement="top"
              arrow-point-at-center
              :mouse-enter-delay="0.3"
              :mouse-leave-delay="0.1"
              :overlay-style="{
                maxWidth: '400px',
                wordWrap: 'break-word',
              }"
            >
              <IconifyIcon
                icon="material-symbols:help"
                class="cursor-pointer text-base text-[#AEAEAEFF] transition-colors hover:text-[#AEAEAEFF]/80"
              />
            </Popover>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>

<style scoped lang="scss">
.horizontal-divider {
  display: inline-block;
  width: 100%;
  height: 0.5px;
  background: #f2f3f5ff;
}

.dimension-tabs {
  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }
}

.dimension-table-wrapper {
  width: 100%;

  // 表头样式
  :deep(.vxe-table--header-wrapper) {
    .vxe-header--column {
      font-weight: bold !important;
      color: #17191a99 !important;
      background: #f2f3f5ff !important;
    }

    .vxe-cell {
      font-weight: bold !important;
      color: #17191a99 !important;
    }
  }

  :deep(.vxe-table--header) {
    background: #f2f3f5ff !important;

    .vxe-header--row {
      background: #f2f3f5ff !important;
    }
  }

  // 确保表格文本完全显示，不省略
  :deep(.vxe-body--column) {
    word-break: break-all !important;
    word-wrap: break-word !important;
    white-space: normal !important;
  }

  :deep(.vxe-cell) {
    padding: 8px !important;
    line-height: 1.5 !important;
    word-wrap: break-word !important;
    white-space: normal !important;
  }

  // 分类标题行样式
  :deep(.vxe-body--row) {
    &:has(.category-title) {
      font-size: 14px;
      font-weight: bold;
      color: #17191aff;
      background-color: #e6e9eeff !important;

      .vxe-body--column {
        border-bottom: 1px solid #0000000f !important;
      }
    }
  }
}

.category-title {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.risk-level-tag {
  display: inline-block;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}
</style>
