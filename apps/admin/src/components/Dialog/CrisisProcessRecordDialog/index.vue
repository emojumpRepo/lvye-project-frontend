<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

const [CrisisProcessRecordModal, crisisProcessRecordModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  onOpenChange: async (open) => {
    if (open) {
      const data = crisisProcessRecordModalApi.getData();
      console.log(data);
    }
  },
});
</script>

<template>
  <CrisisProcessRecordModal title="危机处理记录">
    extra modal content
  </CrisisProcessRecordModal>
</template>
