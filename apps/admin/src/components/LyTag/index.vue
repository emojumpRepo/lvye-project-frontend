<script setup lang="ts">
import type { TagType } from '#/api/constants';

import { computed } from 'vue';

import { getTagByCategory, TAG_TYPE } from '#/api/constants';

/**
 * 标签属性
 * @param colorPair 颜色对（第一个值为背景颜色，第二个值为文字颜色）
 * @param colorType 颜色类型
 * @param dictValue 字典值
 * @param tagCategoryKey 标签类别
 * @param tagLabel 标签标签
 * 有两种方式决定标签样式：
 * 1. 标签类别和标签值
 * tagCategoryKey 和 dictValue 必须同时存在
 * 2. 颜色对和颜色类型
 * tagLabel 可与 colorType 和 colorPair 任意组合
 */
const props = withDefaults(
  defineProps<{
    colorPair?: string[];
    colorType?: TagType;
    dictValue?: number | string;
    size?: 'middle' | 'small';
    tagCategoryKey?: string;
    tagLabel?: string;
  }>(),
  {
    colorPair: () => [],
    colorType: 'default',
    dictValue: undefined,
    size: 'small',
    tagCategoryKey: undefined,
    tagLabel: '未知',
  },
);

/**
 * 根据标签类别和值获取标签
 */
const tag = computed(() => {
  if (props.tagCategoryKey && props.dictValue) {
    const tag = getTagByCategory(props.tagCategoryKey, props.dictValue);
    return tag;
  }
  return null;
});

/**
 * 根据颜色对获取标签样式
 */
const computedColorPair = computed(() => {
  if (props.colorPair && props.colorPair.length > 0) {
    return {
      backgroundColor: props.colorPair[0],
      color: props.colorPair[1],
    };
  }
  return null;
});

/**
 * 根据颜色类型获取标签类型
 */
const computedTagType = computed(() => {
  if (props.colorType) {
    return TAG_TYPE[props.colorType];
  }
  return null;
});

/**
 * 集合标签样式
 */
const computedTagStyle = computed(() => {
  if (tag.value) {
    return tag.value.tagStyle;
  }
  if (computedColorPair.value) {
    return computedColorPair.value;
  }
  if (computedTagType.value) {
    return computedTagType.value;
  }
  // 当没有传递颜色对、颜色类型时，使用默认的 default 颜色类型
  return TAG_TYPE.default;
});
</script>

<template>
  <span
    class="box-border whitespace-nowrap rounded-md py-1"
    :class="[size === 'middle' ? 'px-3 text-sm' : 'px-2 text-xs']"
    :style="computedTagStyle"
  >
    {{ tag?.label || tagLabel || '未知' }}
  </span>
</template>
