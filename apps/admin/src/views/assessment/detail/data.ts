import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { QuestionnaireApi } from '#/api/assessment/questionnaire/index';

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
          { label: '未完成', value: '未完成' },
          { label: '已完成', value: '已完成' },
        ],
      },
      defaultValue: '',
      hideLabel: true,
    },
    {
      fieldName: 'riskLevel',
      component: 'Select',
      componentProps: {
        placeholder: '全部风险等级',
        options: [
          { label: '全部风险等级', value: '' },
          { label: '低风险', value: 'low' },
          { label: '中风险', value: 'medium' },
          { label: '高风险', value: 'high' },
        ],
      },
      defaultValue: '',
      hideLabel: true,
    },
    {
      fieldName: 'class',
      component: 'Select',
      componentProps: {
        placeholder: '全部班级',
        options: [
          { label: '全部班级', value: '' },
          { label: '1班', value: '1班' },
          { label: '2班', value: '2班' },
          { label: '3班', value: '3班' },
        ],
      },
      defaultValue: '',
      hideLabel: true,
    },
    {
      fieldName: 'searchKeyword',
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
export function useGridColumns(): VxeTableGridOptions<QuestionnaireApi.Questionnaire>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '学生名称',
      minWidth: 120,
    },
    {
      field: 'class',
      title: '班级',
      minWidth: 120,
    },
    {
      field: 'studentId',
      title: '学号',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '完成状态',
      minWidth: 120,
    },
    {
      field: 'completedTime',
      title: '完成时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'riskLevel',
      title: '风险等级',
      minWidth: 120,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}


