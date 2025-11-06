<script setup lang="ts">
defineOptions({
  name: 'Divider',
})
</script>

<template>
  <view class="custom-divider" />
</template>

<style lang="scss" scoped>
/* stylelint-disable declaration-property-value-no-unknown */
.custom-divider {
  width: 100%;
  height: 0;
  margin: 32rpx 0;
  border-top: 4rpx dashed var(--desc-text-color-light);
}
</style>
