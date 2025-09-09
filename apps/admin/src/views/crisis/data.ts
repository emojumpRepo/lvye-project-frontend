import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';

export function useSearchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'gradeDeptId',
      component: 'Select',
      componentProps: {
        options: [{ label: '全部年级', value: '' }],
      },
      defaultValue: '',
    },
    {
      fieldName: 'consultantId',
      component: 'Select',
      componentProps: {
        options: [{ label: '全部咨询师', value: '' }],
      },
      defaultValue: '',
    },
    {
      fieldName: 'searchKeyword',
      component: 'Input',
      componentProps: {
        placeholder: '搜索学生姓名或学号',
      },
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
