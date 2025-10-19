import type { DeptGradeClassOption } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** 搜索表单 */
export function useSearchFormSchema({
  deptOptions,
}: {
  deptOptions: DeptGradeClassOption[];
}): VbenFormSchema[] {
  return [
    {
      fieldName: 'classId',
      component: 'Cascader',
      componentProps: {
        options: [
          { label: '全部班级', value: '', isLeaf: true },
          ...deptOptions,
        ],
        defaultValue: [''],
        expandTrigger: 'hover',
        changeOnSelect: true,
        allowClear: false,
        showSearch: false,
        style: { cursor: 'pointer' },
      },
      defaultValue: [''],
    },
    {
      fieldName: 'counselorType',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部咨询师', value: 0 },
          { label: '我负责的学生', value: 1 },
        ],
      },
      defaultValue: 0,
    },
  ];
}

/** 事件列表 */
export function useEventGridSchema(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '事件优先级',
      slots: { default: 'id' },
      width: '15%',
    },
    {
      field: 'description',
      title: '事件描述',
      width: '15%',
      visible: false,
    },
    {
      field: 'studentName',
      title: '学生信息',
      slots: { default: 'studentName' },
      width: '15%',
    },
    {
      field: 'className',
      title: '班级',
      width: '10%',
      visible: false,
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
      field: 'handlerName',
      title: '负责人',
      slots: { default: 'handlerName' },
      width: '15%',
    },
    {
      field: 'progress',
      title: '处理进度',
      slots: { default: 'progress' },
      width: '15%',
    },
    {
      field: 'reportedAt',
      title: '上报时间',
      slots: { default: 'reportedAt' },
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
