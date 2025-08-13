import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'questionnaireName',
      component: 'Select',
      componentProps: {
        placeholder: '请选择量表',
        options: [
          { label: '我是量表名称1', value: '1' },
          { label: '我是量表名称2', value: '2' },
          { label: '我是量表名称3', value: '3' },
        ],
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
      fieldName: 'taskName',
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
