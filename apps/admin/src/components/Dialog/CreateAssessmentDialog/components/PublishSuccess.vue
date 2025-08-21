<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    finishDate: string;
    isPublish: boolean;
    notifyText: string;
    taskId: null | number;
  }>(),
  {},
);
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col items-center gap-4">
      <img
        src="../../../../static/icons/assessment/publish_success.svg"
        alt="发布成功"
        class="size-21"
      />
      <div class="text-[20px] font-bold text-black">
        {{ isPublish ? '测评任务发布成功' : '测评任务创建成功' }}
      </div>
    </div>

    <div class="mx-auto w-full max-w-[600px] rounded-xl bg-[#F7F8FB] p-6">
      <div class="flex flex-col space-y-3 text-[16px] text-[#959599]">
        <div>
          <span class="publish-success-detail-title">任务ID：</span>
          <span>{{ props.taskId }}</span>
        </div>
        <div>
          <span class="publish-success-detail-title">通知发送：</span>
          <span>{{ props.notifyText }}</span>
        </div>
        <div>
          <span class="publish-success-detail-title">预计完成时间：</span>
          <span>{{ props.finishDate }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.publish-success-detail-title {
  @apply mr-2 font-semibold text-black;
}
</style>
