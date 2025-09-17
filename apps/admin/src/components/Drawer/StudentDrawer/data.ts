import type { VbenFormSchema } from '#/adapter/form';

import dayjs from 'dayjs';

import { z } from '#/adapter/form';
import { calculateAge } from '#/utils/calculateTool';

export interface SelectOptions {
  label: string;
  value: number | string;
}

export interface ConfigOptions {
  classList: SelectOptions[];
  graduationStatusMap: SelectOptions[];
  sexMap: SelectOptions[];
}

/** 学籍信息字段配置 */
const personalInfoFields = [
  {
    fieldName: 'name',
    label: '姓名',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入姓名',
    rules: 'required',
  },
  {
    fieldName: 'studentNo',
    label: '学号',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入学号',
    rules: 'required',
  },
  {
    fieldName: 'mobile',
    label: '联系电话',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入联系电话',
    rules: z
      .string()
      .optional()
      .refine((val) => !val || /^1[3-9]\d{9}$/.test(val), '请输入正确的手机号'),
  },
  {
    fieldName: 'classDeptId',
    label: '班级',
    viewComponent: 'Input',
    editComponent: 'Select',
    options: [],
    placeholder: '请选择班级',
    rules: 'selectRequired',
  },
  {
    fieldName: 'sex',
    label: '性别',
    viewComponent: 'Input',
    editComponent: 'Select',
    placeholder: '请选择性别',
    options: [],
    rules: 'selectRequired',
  },
  {
    fieldName: 'birthDate',
    label: '出生日期',
    viewComponent: 'Input',
    editComponent: 'DatePicker',
    placeholder: '请选择出生日期',
    rules: z.string().refine((val) => {
      if (!val) return false;
      const age = calculateAge(dayjs(val).valueOf());
      return age >= 1 && age <= 30;
    }, '年龄需在1-30岁之间'),
    componentProps: {
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      allowClear: false,
      inputReadOnly: true,
    },
  },
  {
    fieldName: 'graduationStatus',
    label: '就读状态',
    viewComponent: 'Input',
    editComponent: 'Select',
    placeholder: '请选择就读状态',
    options: [],
    rules: 'selectRequired',
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'homeAddress',
    label: '家庭住址',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入家庭住址',
    formItemClass: 'col-span-4',
    componentProps: {
      rows: 3,
    },
  },
];

/** 学籍信息 */
export function usePersonalInfoFormSchema(
  isEdit: boolean = false,
  configOption: ConfigOptions,
): VbenFormSchema[] {
  return personalInfoFields.map((field) => {
    const baseSchema: VbenFormSchema = {
      fieldName: field.fieldName,
      label: field.label,
      rules: field.rules,
      component: isEdit ? field.editComponent : field.viewComponent,
      formItemClass: field.formItemClass,
    };

    // 根据编辑状态和字段类型配置组件属性
    if (isEdit) {
      const componentProps: Record<string, any> = {
        placeholder: field.placeholder,
        ...field.componentProps,
      };

      // 特殊字段处理
      switch (field.fieldName) {
        case 'classDeptId': {
          componentProps.options = configOption.classList;

          break;
        }
        case 'graduationStatus': {
          componentProps.options = configOption.graduationStatusMap;

          break;
        }
        case 'sex': {
          componentProps.options = configOption.sexMap;

          break;
        }
        // No default
      }

      baseSchema.componentProps = componentProps;
    } else {
      // 查看状态下的配置
      baseSchema.componentProps = {
        readonly: true,
        placeholder: field.placeholder,
      };
    }

    return baseSchema;
  });
}

/** 家庭背景字段配置 */
const familyBackgroundFields = [
  {
    fieldName: 'fatherName',
    label: '父亲姓名',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入父亲姓名',
    rules: 'required',
  },
  {
    fieldName: 'fatherOccupation',
    label: '父亲职业',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入父亲职业',
    // rules: 'required',
  },
  {
    fieldName: 'fatherPhone',
    label: '父亲联系方式',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入父亲联系方式',
    rules: 'required',
  },
  {
    fieldName: 'motherName',
    label: '母亲姓名',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入母亲姓名',
    rules: 'required',
  },
  {
    fieldName: 'motherOccupation',
    label: '母亲职业',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入母亲职业',
    // rules: 'required',
  },
  {
    fieldName: 'motherPhone',
    label: '母亲联系方式',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入母亲联系方式',
    rules: 'required',
  },
  {
    fieldName: 'parentMaritalStatus',
    label: '父母婚姻情况',
    viewComponent: 'Input',
    editComponent: 'Select',
    options: [
      { label: '已婚', value: 'married' },
      { label: '离异', value: 'divorced' },
      { label: '丧偶', value: 'widowed' },
      { label: '其他', value: 'other' },
    ],
    placeholder: '请选择婚姻情况',
    rules: 'required',
    formItemClass: 'col-span-2',
  },
  {
    fieldName: 'familySpecialSituation',
    label: '备注',
    viewComponent: 'Input',
    editComponent: 'Input',
    placeholder: '请输入家庭特殊情况',
    formItemClass: 'col-span-4',
    componentProps: {
      rows: 3,
    },
  },
];

/** 家庭背景 */
export function useFamilyBackgroundFormSchema(
  isEdit: boolean = false,
): VbenFormSchema[] {
  return familyBackgroundFields.map((field) => {
    const baseSchema: VbenFormSchema = {
      fieldName: field.fieldName,
      label: field.label,
      component: isEdit ? field.editComponent : field.viewComponent,
      rules: field.rules as any,
      formItemClass: field.formItemClass,
    };

    // 根据编辑状态配置组件属性
    if (isEdit) {
      const componentProps: Record<string, any> = {
        placeholder: field.placeholder,
        ...field.componentProps,
      };

      // 为选择类型的字段添加选项
      if (field.options) {
        componentProps.options = field.options;
      }

      baseSchema.componentProps = componentProps;
    } else {
      // 查看状态下的配置
      baseSchema.componentProps = {
        readonly: true,
        placeholder: field.placeholder,
      };
    }

    return baseSchema;
  });
}
