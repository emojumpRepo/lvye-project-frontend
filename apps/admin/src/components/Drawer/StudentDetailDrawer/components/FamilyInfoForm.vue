<script setup lang="ts">
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Divider } from 'ant-design-vue';

const emit = defineEmits<{
  (e: 'updateLoading', value: boolean): void;
}>();

const edit = ref(false);

function handleEdit() {
  edit.value = true;
}

function handleSave() {
  edit.value = false;
}

function handleCancel() {
  edit.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-6 px-4">
    <div>
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <Divider type="vertical" class="bg-primary m-0 h-3 w-0.5" />
          <span class="font-bold">家庭情况</span>
        </div>
        <div
          v-if="!edit"
          class="flex cursor-pointer items-center gap-1 text-sm"
          @click="handleEdit"
        >
          <IconifyIcon icon="icon-park:edit-one" />
          <span>编辑</span>
        </div>
        <div v-else class="flex items-center gap-3 text-sm">
          <div
            class="flex cursor-pointer items-center gap-1"
            @click="handleSave"
          >
            <IconifyIcon
              icon="material-symbols:check-rounded"
              color="#04DC70"
              class="size-5"
            />
            <span class="text-[#04DC70]">保存</span>
          </div>
          <div
            class="flex cursor-pointer items-center gap-1"
            @click="handleCancel"
          >
            <IconifyIcon
              icon="material-symbols:close-rounded"
              color="#979899"
              class="size-4"
            />
            <span class="text-[#979899]">取消</span>
          </div>
        </div>
      </div>

      <!-- 信息表单 -->
      <InfoForm />
    </div>
  </div>
</template>
