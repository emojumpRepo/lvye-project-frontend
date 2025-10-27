<script setup lang="ts">
import type { DeptGradeClassOption } from '@vben/types';

import type { CrisisEventListReq } from '#/api/psychology/crisis';

import { onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getTeacherUserList } from '#/api/system/user';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { parseSearchKeyword } from '#/utils/calculateTool';
import { getDictOptions } from '#/utils/dict';
import { getDeptGradeClassDictOptions } from '#/utils/transformDeptToTree';

import { useSearchFormSchema } from '../data';

const emit = defineEmits<{
  search: [params: CrisisEventListReq];
}>();

const deptOptions = ref<DeptGradeClassOption[]>([]);

// 搜索参数
const crisisEventListReq = ref<CrisisEventListReq>();

const [Form, formApi] = useVbenForm({
  schema: useSearchFormSchema({
    deptOptions: deptOptions.value,
    counselorOptions: [],
    priorityOptions: [],
    sourceTypeOptions: [],
  }),
  submitOnChange: true,
  wrapperClass: 'grid-cols-12 md:grid-cols-9',
  submitButtonOptions: {
    show: false,
  },
  commonConfig: {
    componentProps: {
      class: 'w-full mr-2',
    },
    hideLabel: true,
  },
  handleValuesChange: async (values: any) => {
    try {
      formApi.setLoading(true);
      // 智能识别搜索关键词是学号还是姓名
      const { studentNo, name } = parseSearchKeyword(
        values?.searchKeyword ?? '',
      );

      // 构建搜索参数
      const params: CrisisEventListReq = {
        studentNo: studentNo || undefined,
        studentName: name || undefined,
        classId:
          (Array.isArray(values?.classId)
            ? values.classId[values.classId.length - 1]
            : undefined) || undefined,
        counselorUserId: values.counselorUserId || undefined,
        priority: values.priority || undefined,
        sourceType: values.sourceType || undefined,
      };

      crisisEventListReq.value = params;
      emit('search', params);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请重试');
    } finally {
      formApi.setLoading(false);
    }
  },
});

/** 获取心理老师列表 */
async function loadTeacherUserList() {
  const response = await getTeacherUserList('psychology_teacher');
  if (response) {
    return response.map((item) => ({
      label: item.nickname as string,
      value: item.id,
    }));
  }

  return [];
}

onMounted(async () => {
  try {
    deptOptions.value = (await getDeptGradeClassDictOptions()) || [];
    const counselorOptions = (await loadTeacherUserList()) || [];
    const priorityOptions =
      (await getDictOptions('crisis_event_priority', 'number')) || [];
    const sourceTypeOptions =
      (await getDictOptions('crisis_event_report_source', 'number')) || [];
    formApi.updateSchema(
      useSearchFormSchema({
        deptOptions: deptOptions.value,
        counselorOptions,
        priorityOptions,
        sourceTypeOptions,
      }),
    );
  } catch (error) {
    console.error('初始化搜索表单失败', error);
    message.error('初始化失败，请刷新重试');
  }
});

defineExpose({
  crisisEventListReq,
});
</script>

<template>
  <div class="box-border rounded-xl bg-white px-6 pb-6 pt-4">
    <LyCardTitle
      icon="carbon:tree-fall-risk"
      title="风险评估管理"
      :pb="4"
      icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
    >
      <template #right>
        <slot name="actions"></slot>
      </template>
    </LyCardTitle>

    <Form />
  </div>
</template>

<style lang="scss" scoped>
:deep(.form-item) {
  padding-bottom: 0 !important;
}

:deep(.form-actions) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 0 !important;
}

:deep(.ant-tabs-tab-btn) {
  color: #979899;
}
</style>
