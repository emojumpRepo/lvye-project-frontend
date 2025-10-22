<script setup lang="ts">
import { IconifyIcon } from '@vben/icons';

import { Statistic } from 'ant-design-vue';

defineOptions({ name: 'StatisticCard' });

defineProps<{
  iconBg: string;
  iconColor: string;
  iconSrc: string;
  title: string;
  value: number;
}>();
</script>

<template>
  <div class="statistic-card p-4">
    <!-- 统计数值区域 -->
    <div class="flex flex-col">
      <Statistic
        :value="value"
        :value-style="{ color: '#000000', fontWeight: 600, fontSize: '1.2rem' }"
      />
      <div class="text-sm text-[#979899]">{{ title }}</div>
    </div>

    <!-- 统计图标区域 -->
    <div
      class="flex items-center justify-center rounded-full"
      :style="{ backgroundColor: iconBg }"
    >
      <IconifyIcon
        :icon="iconSrc"
        alt="icon"
        :color="iconColor"
        class="h-8 w-8"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.statistic-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-image: linear-gradient(
    90deg,
    #fff 0%,
    rgb(255 255 255 / 40%) 100%
  );
  border: 1px solid #fff;
  border-radius: 0.75rem;
}
</style>
