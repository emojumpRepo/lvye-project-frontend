<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

type StudentInfo = {
  className: string;
  name: string;
  sno: string;
};

type ConsultInfo = {
  counselor: string;
  time: Date | string;
  type: string;
};

const loading = ref(false);
const student = ref<StudentInfo>({ name: '', className: '', sno: '' });
const consult = ref<ConsultInfo>({
  time: dayjs().toDate(),
  counselor: '',
  type: '',
});

onMounted(() => {
  loading.value = true;
  // 模拟请求接口
  setTimeout(() => {
    student.value = {
      name: '小明',
      className: '高一（3）班',
      sno: '1524115252255',
    };
    consult.value = {
      time: dayjs('2025-01-01 12:00:10').toDate(),
      type: '学业压力咨询',
      counselor: '李老师',
    };
    loading.value = false;
  }, 200);
});

const consultTimeText = computed(() =>
  consult.value.time
    ? dayjs(consult.value.time).format('YYYY-MM-DD HH:mm:ss')
    : '—',
);
</script>

<template>
  <div class="space-y-4 pr-1">
    <!-- 顶部提示 -->
    <div class="rounded-xl border border-[#04DC70] bg-[#14E77E14] px-4 py-3">
      <div class="flex items-center gap-2">
        <IconifyIcon
          icon="carbon:warning-filled"
          class="size-4"
          color="#04DC70"
        />
        <div class="text-[14px] font-medium text-[#17191A]">请确认信息</div>
      </div>
      <div class="text-[12px] text-[#979899]">
        请仔细核对上述学生信息和咨询信息是否正确，确认无误后点击“确认”，下一步继续填写评估。
      </div>
    </div>

    <!-- 学生信息 -->
    <div>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-[16px] w-[3px] rounded-full bg-[#04DC70]"></span>
        <h3 class="text-[16px] font-bold">学生信息</h3>
      </div>
      <section class="section-container">
        <div>
          <span class="desc-title">学生姓名：</span>
          <span>{{ student.name || '—' }}</span>
        </div>
        <div>
          <span class="desc-title">所属班级：</span>
          <span>{{ student.className || '—' }}</span>
        </div>
        <div>
          <span class="desc-title">学号信息：</span>
          <span>{{ student.sno || '—' }}</span>
        </div>
      </section>
    </div>

    <!-- 咨询信息 -->
    <div>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-[16px] w-[3px] rounded-full bg-[#04DC70]"></span>
        <h3 class="text-[16px] font-bold">咨询信息</h3>
      </div>
      <section class="section-container">
        <div>
          <span class="desc-title">咨询时间：</span>
          <span>{{ consultTimeText }}</span>
        </div>
        <div>
          <span class="desc-title">咨询类型：</span>
          <span>{{ consult.type || '—' }}</span>
        </div>
        <div>
          <span class="desc-title">主咨询师：</span>
          <span>{{ consult.counselor || '—' }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.section-container {
  @apply grid grid-cols-1 gap-1 rounded-xl bg-[#F7F8FA] px-6 py-4 text-[14px] text-[#4B4B4D];

  .desc-title {
    @apply mr-2 font-medium text-[#000];
  }
}
</style>
