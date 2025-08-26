import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'status',
      component: 'Select',
      componentProps: {
        placeholder: '全部状态',
        options: [
          { label: '全部状态', value: '' },
          { label: '未完成', value: 0 },
          { label: '已完成', value: 1 },
        ],
      },
      defaultValue: '',
      hideLabel: true,
    },
    {
      fieldName: 'className',
      component: 'Select',
      componentProps: {
        placeholder: '全部班级',
        options: [
          { label: '全部班级', value: '' },
        ],
      },
      defaultValue: '',
      hideLabel: true,
    },
    {
      fieldName: 'studentName',
      component: 'Input',
      componentProps: {
        placeholder: '搜索学生姓名或学号',
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

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<any>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'studentProfileId',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '学生名称',
      minWidth: 120,
    },
    {
      field: 'gradeName',
      title: '年级',
      minWidth: 100,
    },
    {
      field: 'className',
      title: '班级',
      minWidth: 120,
    },
    {
      field: 'studentNo',
      title: '学号',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '完成状态',
      minWidth: 120,
      formatter: ({ cellValue }) => {
        return cellValue === 1 ? '已完成' : '未完成';
      },
    },
    {
      field: 'finishTime',
      title: '完成时间',
      minWidth: 120,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        return new Date(cellValue).toLocaleString();
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}


