import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';

// 导出学生档案相关类型

/** 学籍信息 */
export function usePersonalInfoFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      component: 'Input',
      label: '姓名',
    },
    {
      fieldName: 'studentId',
      component: 'Input',
      label: '学号',
    },
    {
      fieldName: 'class',
      component: 'Input',
      label: '班级',
    },
    {
      fieldName: 'phone',
      component: 'Input',
      label: '联系电话',
    },
    {
      fieldName: 'gender',
      component: 'Input',
      label: '性别/年龄',
    },
    {
      fieldName: 'status',
      component: 'Input',
      label: '就读状态',
    },
    {
      fieldName: 'address',
      component: 'Input',
      label: '家庭住址',
      formItemClass: 'col-span-3',
    },
  ];
}

/** 家庭背景 */
export function useFamilyBackgroundFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'fatherName',
      component: 'Input',
      label: '父亲姓名',
    },
    {
      fieldName: 'fatherOccupation',
      component: 'Input',
      label: '父亲职业',
    },
    {
      fieldName: 'fatherPhone',
      component: 'Input',
      label: '父亲联系方式',
    },
    {
      fieldName: 'motherName',
      component: 'Input',
      label: '母亲姓名',
    },
    {
      fieldName: 'motherPhone',
      component: 'Input',
      label: '母亲联系方式',
    },
    {
      fieldName: 'parentMaritalStatus',
      component: 'Input',
      label: '父母婚姻情况',
    },
    {
      fieldName: 'familySpecialSituation',
      component: 'Input',
      label: '家庭特殊情况',
      formItemClass: 'col-span-3',
    },
  ];
}

/** 搜索表单 */
export function useSearchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'grade',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部年级', value: '' },
          { label: '一年级', value: '1' },
          { label: '二年级', value: '2' },
          { label: '三年级', value: '3' },
          { label: '四年级', value: '4' },
          { label: '五年级', value: '5' },
          { label: '六年级', value: '6' },
        ],
      },
      defaultValue: '',
    },
    {
      fieldName: 'class',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部班级', value: '' },
          { label: '1班', value: '1' },
          { label: '2班', value: '2' },
          { label: '3班', value: '3' },
          { label: '4班', value: '4' },
          { label: '5班', value: '5' },
          { label: '6班', value: '6' },
        ],
      },
      defaultValue: '',
    },
    {
      fieldName: 'isGraduated',
      component: 'Select',
      componentProps: {
        options: [
          { label: '是否毕业', value: '' },
          { label: '已毕业', value: '1' },
          { label: '未毕业', value: '0' },
        ],
      },
      defaultValue: '',
    },
    {
      fieldName: 'status',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部心理状态', value: '' },
          { label: '良好', value: '1' },
          { label: '一般', value: '0' },
          { label: '较差', value: '2' },
        ],
      },
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
      formItemClass: 'col-span-2',
    },
  ];
}

export { type PsychologyStudentProfileApi } from '#/api/psychology/student-profile';
