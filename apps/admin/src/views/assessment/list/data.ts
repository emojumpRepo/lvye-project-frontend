import type { VbenFormSchema } from '#/adapter/form';

import { h, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { getQuestionnaireListSimple } from '#/api/questionnaire';

// 量表选项的响应式数据
const questionnaireOptions = ref<{ label: string; value: string }[]>([]);
const isLoading = ref(false);

// 异步加载量表数据
const loadQuestionnaireOptions = async () => {
  if (questionnaireOptions.value.length > 0) {
    return; // 如果已有数据，不再重复加载
  }

  isLoading.value = true;
  try {
    const response = await getQuestionnaireListSimple();
    questionnaireOptions.value = response.map((item) => ({
      label: item.title,
      value: item.id.toString(),
    }));
  } catch (error) {
    console.error('加载量表数据失败:', error);
    questionnaireOptions.value = [];
  } finally {
    isLoading.value = false;
  }
};

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  // 组件挂载时加载数据
  loadQuestionnaireOptions();

  return [
    {
      fieldName: 'questionnaireId',
      component: 'Select',
      componentProps: {
        placeholder: '请选择量表',
        options: questionnaireOptions,
        loading: isLoading,
      },
      hideLabel: true,
    },
    {
      fieldName: 'date',
      component: 'Select',
      componentProps: {
        placeholder: '请选择时间',
        options: [
          { label: '最近一周', value: 'week' },
          { label: '最近一月', value: 'month' },
          { label: '最近一年', value: 'year' },
        ],
      },
      hideLabel: true,
    },
    {
      fieldName: 'name',
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务名称',
      },
      hideLabel: true,
      renderComponentContent: () => ({
        prefix: () =>
          h(IconifyIcon, {
            class: 'size-4',
            icon: 'mingcute:search-line',
            color: '#ccc',
          }),
      }),
      formItemClass: 'col-span-2',
    },
  ];
}
