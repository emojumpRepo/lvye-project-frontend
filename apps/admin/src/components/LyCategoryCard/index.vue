<script lang="ts" setup>
import type { CategoryCard } from '@vben/types';

defineProps<{
  category: CategoryCard;
}>();

const currentCategoryKey = defineModel<number | string>('currentCategoryKey');
</script>

<template>
  <div
    class="solid flex cursor-pointer gap-4 rounded-xl border border-[#D9D9D9] bg-white p-4"
    :class="{
      '! !border-[#04DC70] !bg-[#04DC7014]':
        currentCategoryKey === category.key,
      '!items-center': category.icon,
      '!flex-col !gap-2 !px-6': category.color,
    }"
    @click="currentCategoryKey = category.key"
  >
    <template v-if="category.icon">
      <img
        v-if="category.icon"
        :src="category.icon"
        alt=""
        class="w-[50px] object-contain"
      />
      <div class="flex flex-col gap-2">
        <span class="font-bold">{{ category.title }}</span>
        <span class="text-sm text-[#979899]">
          {{ category.description }}
        </span>
        <span v-if="category.text" class="text-sm text-[#FF9C05]">
          {{ category.text }}
        </span>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-2">
        <span
          class="size-3 rounded-full"
          :style="{ backgroundColor: category.color }"
        >
        </span>
        <span class="font-bold">
          {{ category.title }}
        </span>
      </div>
      <div class="text-sm text-[#979899]">
        {{ category.description }}
      </div>
    </template>
  </div>
</template>
