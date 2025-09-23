import type { AssessmentScenario } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

// ==================== 表单配置 ====================

/** 场景搜索表单 */
export function useScenarioSearchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      component: 'Input',
      label: '场景编码',
      componentProps: {
        placeholder: '请输入场景编码',
      },
    },
    {
      fieldName: 'name',
      component: 'Input',
      label: '场景名称',
      componentProps: {
        placeholder: '请输入场景名称',
      },
    },
    {
      fieldName: 'isActive',
      component: 'Select',
      label: '启用状态',
      componentProps: {
        placeholder: '请选择启用状态',
        options: [
          { label: '全部', value: undefined },
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
      },
    },
  ];
}

/** 场景创建/编辑表单 */
export function useScenarioFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      component: 'Input',
      label: '场景编码',
      rules: 'required',
      componentProps: {
        placeholder: '请输入场景编码，如：CAMPUS_TRIP',
      },
      help: '场景的唯一标识符，创建后不可修改',
    },
    {
      fieldName: 'name',
      component: 'Input',
      label: '场景名称',
      rules: 'required',
      componentProps: {
        placeholder: '请输入场景名称，如：校园旅行',
      },
    },
    {
      fieldName: 'description',
      component: 'Textarea',
      label: '场景描述',
      componentProps: {
        placeholder: '请输入场景描述信息',
        rows: 3,
        maxlength: 500,
        showCount: true,
        class: 'w-full',
      },
      help: '场景的详细描述信息，最多500个字符',
    },
    {
      fieldName: 'maxQuestionnaireCount',
      component: 'InputNumber',
      label: '最大问卷数',
      componentProps: {
        placeholder: '请输入最大问卷数量',
        min: 1,
        max: 50,
      },
      help: '限制该场景下可选择的问卷数量，留空表示不限制',
    },
    {
      fieldName: 'frontendRoute',
      component: 'Input',
      label: '前端路由',
      rules: 'required',
      componentProps: {
        placeholder: '请输入前端路由，如：campusTrip',
      },
      help: '前端页面路由标识',
    },
    {
      fieldName: 'isActive',
      component: 'Switch',
      label: '是否启用',
      defaultValue: true,
      componentProps: {
        checkedChildren: '启用',
        unCheckedChildren: '禁用',
      },
    },
    {
      fieldName: 'metadataJson',
      component: 'Textarea',
      label: '扩展配置',
      componentProps: {
        placeholder: '请输入JSON格式的扩展配置（可选）',
        rows: 4,
      },
      help: '可选的JSON格式扩展配置信息',
    },
  ];
}

// ==================== 表格配置 ====================

/** 场景列表表格配置 */
export function useScenarioGridSchema(): VxeTableGridOptions<AssessmentScenario>['columns'] {
  return [
    { type: 'seq', width: '5%', title: '序号' },
    {
      field: 'code',
      title: '场景编码',
      width: '15%',
      showOverflow: 'tooltip',
    },
    {
      field: 'name',
      title: '场景名称',
      width: '15%',
      showOverflow: 'tooltip',
    },
    {
      field: 'description',
      title: '场景描述',
      width: '20%',
      showOverflow: 'tooltip',
    },
    {
      field: 'maxQuestionnaireCount',
      title: '最大问卷数',
      width: '10%',
      slots: { default: 'maxQuestionnaireCount' },
    },
    {
      field: 'frontendRoute',
      title: '前端路由',
      width: '12%',
      showOverflow: 'tooltip',
    },
    {
      field: 'isActive',
      title: '启用状态',
      width: '8%',
      slots: { default: 'isActive' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: '12%',
      formatter: ['formatDate', 'yyyy-MM-dd HH:mm:ss'],
    },
    {
      field: 'actions',
      title: '操作',
      width: '10%',
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}

export { type PsychologyScenarioApi } from '#/api/psychology/scenario';
