import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';

/** 表单 */
export function useSearchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'studentProfileId',
      component: 'Input',
      componentProps: {
        placeholder: '搜索学生姓名或学号',
      },
      defaultValue: '',
      hideLabel: true,
      renderComponentContent: () => ({
        prefix: () =>
          h(IconifyIcon, {
            class: 'size-4',
            icon: 'mingcute:search-line',
            color: '#ccc',
          }),
      }),
    },
    {
      fieldName: '事件发生时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '选择事件发生时间',
      },
      defaultValue: '',
      hideLabel: true,
    },
    {
      fieldName: 'location',
      component: 'Input',
      componentProps: {
        placeholder: '输入事件发生地点',
      },
      defaultValue: '',
      hideLabel: true,
    },
    {
      fieldName: 'description',
      component: 'Textarea',
      componentProps: {
        placeholder: '请详细描述事件发生情况、学生的异常行为、具体表现等...',
      },
      hideLabel: true,
    },
  ];
}
