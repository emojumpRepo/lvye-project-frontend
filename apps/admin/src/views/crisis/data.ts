import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';

/** 搜索表单 */
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

/** 事件列表 */
export function useEventGridSchema(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'eventPriority',
      title: '事件优先级',
      slots: { default: 'eventPriority' },
      width: '15%',
    },
    {
      field: 'studentInfo',
      title: '学生信息',
      slots: { default: 'studentInfo' },
      width: '15%',
    },
    {
      field: 'priority',
      title: '优先级',
      slots: { default: 'priority' },
      width: '10%',
    },
    {
      field: 'status',
      title: '状态',
      slots: { default: 'status' },
      width: '10%',
    },
    {
      field: 'consultant',
      title: '负责人',
      slots: { default: 'consultant' },
      width: '15%',
    },
    {
      field: 'progress',
      title: '处理进度',
      slots: { default: 'progress' },
      width: '15%',
    },
    {
      field: 'createTime',
      title: '上报时间',
      slots: { default: 'createTime' },
      width: '12%',
    },
    {
      field: 'actions',
      fixed: 'right',
      title: '操作',
      width: '10%',
      slots: { default: 'actions' },
    },
  ];
}
