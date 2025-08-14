<script lang="ts" setup>
import { ref } from 'vue';

import PsychologicalConsultDialog from '#/components/Dialog/PsychologicalConsultDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';

defineOptions({ name: 'CounselingCenter' });

const isOpenModal = ref(false);
</script>

<template>
  <div>
    <div class="p-4">
      <h2 class="text-lg font-semibold">心理咨询</h2>

      <LyButton type="success" @click="isOpenModal = true">
        创建心理咨询
      </LyButton>
    </div>
    <PsychologicalConsultDialog v-model:open="isOpenModal" />
  </div>
</template>

<style scoped></style>
