import type { VbenFormSchema } from '#/adapter/form';

import { computed, h, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { getQuestionnaireListSimple } from '#/api/psychology/questionnaire';

// 量表选项的响应式数据
const questionnaireOptions = ref<{ label: string; value: string }[]>([]);
const isLoading = ref(false);

// 异步加载量表数据
const _loadQuestionnaireOptions = async () => {
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

const questionnaireSelectOptions = computed(() => [
  {
    label: '全部量表',
    value: '',
  },
  ...questionnaireOptions.value,
]);

export const loadQuestionnaireOptions = _loadQuestionnaireOptions;

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'questionnaireId',
      component: 'Select',
      componentProps: {
        placeholder: '请选择量表',
        options: questionnaireSelectOptions,
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
          { label: '最近7天', value: '7' },
          { label: '最近30天', value: '30' },
          { label: '最近90天', value: '90' },
          {
            label: '自定义',
            value: 'custom',
          },
        ],
      },
      hideLabel: true,
    },
    {
      fieldName: 'customDateRange',
      component: 'RangePicker',
      componentProps: {
        placeholder: ['开始时间', '结束时间'],
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        allowClear: true,
      },
      hideLabel: true,
      formItemClass: 'col-span-2',
      dependencies: {
        show: (values) => values.date === 'custom',
        triggerFields: ['date'],
      },
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
