<script lang="ts" setup>
import type { CategoryCard } from '@vben/types';

defineProps<{
  category: CategoryCard;
}>();

const currentCategoryKey = defineModel<number>('currentCategoryKey');
</script>

<template>
  <div
    class="solid flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-5"
    :class="
      currentCategoryKey === category.key
        ? 'border-[#04DC70] bg-[#04DC7014]'
        : 'border-[#D9D9D9] bg-white'
    "
    @click="currentCategoryKey = category.key"
  >
    <img v-if="category.icon" :src="category.icon" alt="" class="w-[50px]" />
    <div class="flex flex-col gap-2">
      <span class="font-bold">{{ category.title }}</span>
      <span class="text-sm text-[#979899]">
        {{ category.description }}
      </span>
      <span v-if="category.text" class="text-sm text-[#FF9C05]">
        {{ category.text }}
      </span>
    </div>
  </div>
</template>
