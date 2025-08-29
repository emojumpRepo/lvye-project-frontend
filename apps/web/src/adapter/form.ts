import type {
  VbenFormSchema as FormSchema,
  VbenFormProps,
} from '@vben/common-ui';

import type { ComponentType } from './component';

import { setupVbenForm, useVbenForm as useForm, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

/** 手机号正则表达式（中国） */
const MOBILE_REGEX = /(?:0|86|\+86)?1[3-9]\d{9}/;

async function initSetupVbenForm() {
  setupVbenForm<ComponentType>({
    config: {
      // ant design vue组件库默认都是 v-model:value
      baseModelPropName: 'value',

      // 一些组件是 v-model:checked 或者 v-model:fileList
      modelPropNameMap: {
        Checkbox: 'checked',
        Radio: 'checked',
        Switch: 'checked',
        Upload: 'fileList',
      },
    },
    defineRules: {
      // 输入项目必填国际化适配
      required: (value: any, _params: any, ctx: any) => {
        if (value === undefined || value === null || value.length === 0) {
          return $t('ui.formRules.required', [ctx.label]);
        }
        return true;
      },
      // 选择项目必填国际化适配
      selectRequired: (value: any, _params: any, ctx: any) => {
        if (value === undefined || value === null) {
          return $t('ui.formRules.selectRequired', [ctx.label]);
        }
        return true;
      },
      // 手机号非必填
      mobile: (value: any, _params: any, ctx: any) => {
        if (value === undefined || value === null || value.length === 0) {
          return true;
        } else if (!MOBILE_REGEX.test(value)) {
          return $t('ui.formRules.mobile', [ctx.label]);
        }
        return true;
      },
      // 手机号必填
      mobileRequired: (value: any, _params: any, ctx: any) => {
        if (value === undefined || value === null || value.length === 0) {
          return $t('ui.formRules.required', [ctx.label]);
        }
        if (!MOBILE_REGEX.test(value)) {
          return $t('ui.formRules.mobile', [ctx.label]);
        }
        return true;
      },
      // 小学生年龄验证（6-16岁）
      studentAge: (value: any, _params: any, ctx: any) => {
        if (value === undefined || value === null || value === '') {
          return $t('ui.formRules.required', [ctx.label]);
        }
        const age = Number(value);
        if (Number.isNaN(age) || age < 6 || age > 16) {
          return `${ctx.label}必须是6-16岁之间的有效年龄`;
        }
        return true;
      },
      // 小学生身高验证（80-200cm）
      studentHeight: (value: any, _params: any, ctx: any) => {
        if (value === undefined || value === null || value === '') {
          return $t('ui.formRules.required', [ctx.label]);
        }
        const height = Number(value);
        if (Number.isNaN(height) || height < 80 || height > 200) {
          return `${ctx.label}必须是80-200cm之间的有效身高`;
        }
        return true;
      },
      // 小学生体重验证（20-100kg）
      studentWeight: (value: any, _params: any, ctx: any) => {
        if (value === undefined || value === null || value === '') {
          return $t('ui.formRules.required', [ctx.label]);
        }
        const weight = Number(value);
        if (Number.isNaN(weight) || weight < 20 || weight > 100) {
          return `${ctx.label}必须是20-100kg之间的有效体重`;
        }
        return true;
      },
    } as any,
  });
}

const useVbenForm = useForm<ComponentType>;

export { initSetupVbenForm, useVbenForm, z };

export type VbenFormSchema = FormSchema<ComponentType>;
export type { VbenFormProps };
