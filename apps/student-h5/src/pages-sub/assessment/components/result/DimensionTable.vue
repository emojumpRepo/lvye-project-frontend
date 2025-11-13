<script lang="ts" setup>
import type { Dimension, RiskLevelEnum } from '@vben/types'
import type { columnConfig } from '../../data'

interface Props {
  // 维度列表
  dimensions: Dimension[]
  columns: columnConfig[]
}

defineOptions({
  name: 'DimensionTable',
})

const props = defineProps<Props>()

const filteredDimensions = computed(() => {
  return props.dimensions.filter((dimension) => {
    return dimension.colloquialAlias
  }) ?? []
})

// 判断是否显示勾选标记
function showCheck(dimension: Dimension, column: columnConfig): boolean {
  switch (column.compareType) {
    case '<=':
      return dimension.riskLevel <= column.threshold
    case '>=':
      return dimension.riskLevel >= column.threshold
    case '=':
      return dimension.riskLevel === column.threshold
  }
}
</script>

<template>
  <view class="dimension-table">
    <wd-table :data="filteredDimensions" :border="false">
      <wd-table-col label="" align="center" width="35%" prop="colloquialAlias">
        <template #header>
          <view class="table-header-cell" />
        </template>
        <template #value="{ row }">
          <view class="text-[var(--primary-color)]">
            {{ row.colloquialAlias }}
          </view>
        </template>
      </wd-table-col>

      <template v-for="column in columns" :key="column.prop">
        <wd-table-col :label="column.label" align="center" :prop="column.prop" :width="`${65 / (columns.length || 1)}%`">
          <template #header>
            <view class="table-header-cell">
              {{ column.label }}
            </view>
          </template>
          <template #value="{ row }">
            <view class="text-base">
              <text v-if="showCheck(row, column)" class="text-[var(--primary-color)]">
                ✓
              </text>
              <text v-else class="desc-text">
                --
              </text>
            </view>
          </template>
        </wd-table-col>
      </template>
    </wd-table>
  </view>
</template>

<style lang="scss" scoped>
.dimension-table {
  width: 100%;
  margin-bottom: 42rpx;

  :deep(.wd-table) {
    // 自定义表头样式
    .wd-table__header {
      border-radius: 16rpx 16rpx 0 0;

      .wd-table__content--header {
        gap: 1px;

        .wd-table__cell {
          font-size: 24rpx;
          color: white !important;
          text-align: center !important;
          background-color: var(--primary-color) !important;
        }
      }
    }

    // 自定义表体样式
    .wd-table__body {
      .wd-table__content {
        gap: 1px;

        .wd-table__cell {
          font-size: 24rpx;
          background-color: #fafdffff;

          &.is-stripe {
            background-color: #f2f3f5ff;
          }
        }
      }
    }
  }
}
</style>
