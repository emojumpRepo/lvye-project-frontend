<script lang="ts" setup>
const testUniLayoutExposedData = ref('testUniLayoutExposedData')
defineExpose({
  testUniLayoutExposedData,
})
</script>

<template>
  <div class="default-bg-color min-h-screen">
    <slot />
  </div>
</template>
