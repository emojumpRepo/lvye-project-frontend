<script setup lang="ts">
import type { AssessmentScenarioSlotVO } from '@vben/types'
import { getBucketFileUrl } from '@vben/utils'
import { computed } from 'vue'
import { MAP_MODULE_MAP } from '@/api/types/constants'

export interface ModuleItem {
  // 模块名称
  name: string
  // 模块图标
  icon: string
  // 模块 ID
  id?: string | number
  // 其他数据
  [key: string]: any
}

interface Props {
  // 标题文本
  title?: string
  // 模块数据列表
  modules?: AssessmentScenarioSlotVO[]
  // 每行显示数量，可以是数字（所有行相同）或数组（每行不同）
  // 例如：3 表示每行3个，[3, 3, 2] 表示第一行3个，第二行3个，第三行2个
  itemsPerRow?: number | number[]
  // 最多显示多少行，不传则显示全部
  maxRows?: number
  // 任务编号
  currentTaskNo: string | undefined
}

const props = withDefaults(defineProps<Props>(), {
  title: '点击场馆查看模块评估报告详情',
  modules: () => [],
  itemsPerRow: () => {
    return [2, 3]
  },
})

const emit = defineEmits<{
  // 点击模块项时触发
  click: [item: AssessmentScenarioSlotVO, index: number]
}>()

// 将模块按行分组（同时记录每个模块的原始索引）
const moduleRows = computed(() => {
  const rows: Array<Array<{ item: AssessmentScenarioSlotVO, originalIndex: number }>> = []
  const modules = props.modules
  let globalIndex = 0

  // 如果 itemsPerRow 是数组，按照数组配置分组
  if (Array.isArray(props.itemsPerRow)) {
    let startIndex = 0
    const rowConfig = props.maxRows
      ? props.itemsPerRow.slice(0, props.maxRows)
      : props.itemsPerRow

    for (const count of rowConfig) {
      if (startIndex >= modules.length)
        break
      const rowItems = modules.slice(startIndex, startIndex + count).map((item) => {
        return {
          item,
          originalIndex: globalIndex++,
        }
      })
      rows.push(rowItems)
      startIndex += count
    }
  }
  else {
    // itemsPerRow 是数字，固定每行数量
    const perRow = props.itemsPerRow
    for (let i = 0; i < modules.length; i += perRow) {
      // 如果设置了 maxRows，限制行数
      if (props.maxRows && rows.length >= props.maxRows)
        break
      const rowItems = modules.slice(i, i + perRow).map((item) => {
        return {
          item,
          originalIndex: globalIndex++,
        }
      })
      rows.push(rowItems)
    }
  }

  return rows
})

// 获取模块图标
function getModuleIcon(slotKey: string): string {
  return MAP_MODULE_MAP[slotKey.split('_')[1]].icon
}

// 处理模块点击
function handleClick(item: AssessmentScenarioSlotVO) {
  uni.navigateTo({
    url: `/pages-sub/assessment/module?taskNo=${props.currentTaskNo}&slotId=${item.id}`,
  })
}
</script>

<template>
  <view class="w-full pb-2 pt-3">
    <!-- 标题 -->
    <view v-if="title" class="mb-32rpx text-center">
      <text class="desc-text text-26rpx">{{ title }}</text>
    </view>

    <!-- 模块列表 -->
    <view class="flex flex-col gap-2">
      <view
        v-for="(row, rowIndex) in moduleRows"
        :key="rowIndex"
        class="flex justify-center gap-4"
      >
        <view
          v-for="(moduleData, colIndex) in row"
          :key="moduleData.item.id ?? colIndex"
          class="title-text flex items-center gap-1"
          :hover-stay-time="100"
          @click="handleClick(moduleData.item)"
        >
          <image
            :src="getBucketFileUrl(getModuleIcon(moduleData.item.slotKey))"
            class="size-32rpx"
          />

          <!-- 名称 -->
          <text class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-500">
            {{ moduleData.item.slotName }}
          </text>

          <!-- 箭头 -->
          <wd-icon name="arrow-right" size="28rpx" />
        </view>
      </view>
    </view>
  </view>
</template>
