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
  <div class="statistic-card">
    <!-- 统计数值区域 -->
    <div class="flex flex-col">
      <Statistic
        :value="value"
        :value-style="{ color: '#000000', fontWeight: 600, fontSize: '1.5rem' }"
      />
      <div class="text-sm text-[#979899]">{{ title }}</div>
    </div>

    <!-- 统计图标区域 -->
    <div
      class="flex h-[60px] w-[60px] items-center justify-center rounded-full"
      :style="{ backgroundColor: iconBg }"
    >
      <IconifyIcon
        :icon="iconSrc"
        alt="icon"
        :color="iconColor"
        class="h-10 w-10"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.statistic-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background-image: linear-gradient(
    90deg,
    #fff 0%,
    rgb(255 255 255 / 40%) 100%
  );
  border: 1px solid #fff;
  border-radius: 0.75rem;
}
</style>
