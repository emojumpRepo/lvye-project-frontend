import type { VbenFormSchema } from '#/adapter/form';

import { GenderEnum } from '@vben/types';

export enum IS_ONLY_CHILD {
  NO = 0,
  YES = 1,
}

// 个人基本信息 - 民族枚举
export enum ETHNICITY {
  HAN = 1, // 汉族
  MINORITY = 2, // 少数民族
}

export function useBasicInfoFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'RadioGroup',
      fieldName: 'gender',
      label: '性别',
      rules: 'selectRequired',
      componentProps: {
        options: [
          { label: '男', value: GenderEnum.MALE },
          { label: '女', value: GenderEnum.FEMALE },
        ],
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'ethnicity',
      label: '民族',
      rules: 'selectRequired',
      componentProps: {
        options: [
          { label: '汉族', value: ETHNICITY.HAN },
          { label: '少数民族', value: ETHNICITY.MINORITY },
        ],
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'realAge',
      label: '实际年龄',
      rules: 'studentAge',
      componentProps: {
        precision: 0,
        placeholder: '请输入年龄（6-16岁）',
        class: 'w-full',
      },
      help: '请输入6-16岁之间的年龄',
    },
    {
      component: 'DatePicker',
      fieldName: 'birthDate',
      label: '实际出生日期',
      help: '除非不知道阳历，请尽量填写阳历',
      rules: 'required',
      componentProps: {
        placeholder: '请选择出生日期',
        class: 'w-full',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'height',
      label: '身高(cm)',
      rules: 'studentHeight',
      componentProps: {
        precision: 1,
        placeholder: '请输入身高',
      },
      help: '请输入准确的身高（cm）',
    },
    {
      component: 'InputNumber',
      fieldName: 'weight',
      label: '体重(kg)',
      rules: 'studentWeight',
      componentProps: {
        precision: 1,
        placeholder: '请输入体重',
      },
      help: '请输入20-100kg之间的体重',
    },
    {
      component: 'RadioGroup',
      fieldName: 'isOnlyChild',
      label: '您是家里唯一的孩子吗',
      rules: 'selectRequired',
      componentProps: {
        options: [
          { label: '是', value: IS_ONLY_CHILD.YES },
          { label: '否', value: IS_ONLY_CHILD.NO },
        ],
      },
      formItemClass: 'col-span-2',
    },
    {
      component: 'InputNumber',
      fieldName: 'childrenCount',
      label: '加上您自己，家里一共有几个孩子呢？',
      rules: 'required',
      dependencies: {
        triggerFields: ['isOnlyChild'],
        if(values: Record<string, any>) {
          return values.isOnlyChild === IS_ONLY_CHILD.NO;
        },
      },
      componentProps: {
        min: 2,
        max: 20,
        precision: 0,
        placeholder: '请输入孩子数量',
        class: 'w-1/3',
      },
      suffix: '个',
      formItemClass: 'col-span-2',
    },
    {
      component: 'InputNumber',
      fieldName: 'birthOrder',
      label:
        '您是家里第几个出生的孩子？（或：按照年龄从大到小排序，您在家里的孩子中年龄排第几？）',
      rules: 'required',
      dependencies: {
        triggerFields: ['isOnlyChild'],
        if(values: Record<string, any>) {
          return values.isOnlyChild === IS_ONLY_CHILD.NO;
        },
      },
      renderComponentContent: () => ({
        prefix: () => '第',
      }),
      componentProps: {
        min: 1,
        max: 20,
        precision: 0,
        placeholder: '请输入出生顺序',
        class: 'w-1/3',
      },
      formItemClass: 'col-span-2',
    },
    {
      component: 'InputNumber',
      fieldName: 'ageGapToSecond',
      label: '您与家里第二个孩子（与您年龄最接近的弟弟/妹妹）相差几岁？',
      rules: 'required',
      dependencies: {
        triggerFields: ['isOnlyChild', 'birthOrder'],
        if(values: Record<string, any>) {
          return (
            values.isOnlyChild === IS_ONLY_CHILD.NO &&
            Number(values.birthOrder) === 1
          );
        },
      },
      componentProps: {
        min: 0,
        max: 100,
        precision: 0,
        placeholder: '请输入年龄差',
        class: 'w-1/3',
      },
      suffix: '岁',
      formItemClass: 'col-span-2',
    },
  ];
}
