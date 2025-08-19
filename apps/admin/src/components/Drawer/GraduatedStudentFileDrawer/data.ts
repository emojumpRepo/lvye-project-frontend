import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { StudentApi } from '#/api/student';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';

/** 搜索表单 */
export function useSearchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'year',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部年份', value: '' },
          { label: '2024年', value: '2024' },
          { label: '2023年', value: '2023' },
          { label: '2022年', value: '2022' },
        ],
      },
      formItemClass: 'w-[120px]',
      defaultValue: '',
    },
    {
      fieldName: 'session',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部届别', value: '' },
          { label: '2024届', value: '2024' },
          { label: '2023届', value: '2023' },
          { label: '2022届', value: '2022' },
        ],
      },
      formItemClass: 'w-[120px]',
      defaultValue: '',
    },
    {
      fieldName: 'grade',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部年级', value: '' },
          { label: '高一', value: '1' },
          { label: '高二', value: '2' },
          { label: '高三', value: '3' },
        ],
      },
      formItemClass: 'w-[120px]',
      defaultValue: '',
    },
    {
      fieldName: 'status',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部心理状态', value: '' },
          { label: '一般', value: '0' },
          { label: '观察中', value: '1' },
          { label: '严重', value: '2' },
          { label: '重大', value: '3' },
        ],
      },
      formItemClass: 'w-[140px]',
      defaultValue: '',
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
    },
  ];
}

/** 已毕业学生档案表格 */
export function useGraduatedStudentFileGridSchema(): VxeTableGridOptions<StudentApi.GraduatedStudentFile>['columns'] {
  return [
    // 序号
    { title: '序号', type: 'seq', width: 50 },
    // 姓名
    {
      title: '姓名',
      field: 'name',
    },
    {
      title: '学号',
      field: 'studentNo',
    },
    {
      title: '性别',
      field: 'gender',
    },
    {
      title: '毕业年级',
      field: 'grade',
    },
    {
      title: '毕业班级',
      field: 'class',
    },
    {
      title: '心理状态',
      field: 'status',
      slots: {
        default: 'status',
      },
    },
    {
      title: '毕业年份',
      field: 'graduatedYear',
    },
    {
      title: '届别',
      field: 'session',
    },
    {
      title: '联系电话',
      field: 'phone',
    },
    {
      title: '操作',
      field: 'action',
      width: 100,
      slots: {
        default: 'action',
      },
    },
  ];
}
