import type { VbenFormSchema } from '#/adapter/form';

import { QUESTIONNAIRE_CONFIG_CALCULATE_TYPE } from '#/api/constants';
import { getDictOptions } from '#/utils/dict';

// ============== 问卷配置 ======================

const targetAudienceOptions = getDictOptions('questionnaire_target_audience');
const questionnaireTypeOptions = getDictOptions('questionnaire_type');
const questionnaireStatusOptions = getDictOptions('questionnaire_status');

// 搜索表单配置
export function useQuestionGridFormSchema() {
  return [
    {
      component: 'Input',
      fieldName: 'title',
      label: '问卷标题',
      componentProps: {
        placeholder: '请输入问卷标题',
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'questionnaireType',
      label: '问卷类型',
      componentProps: {
        placeholder: '请选择问卷类型',
        allowClear: true,
        options: questionnaireTypeOptions,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        placeholder: '请选择状态',
        allowClear: true,
        options: questionnaireStatusOptions,
      },
    },
    {
      component: 'Select',
      fieldName: 'isOpen',
      label: '是否开放',
      componentProps: {
        placeholder: '请选择是否开放',
        allowClear: true,
        options: [
          {
            label: '是',
            value: 1,
          },
          {
            label: '否',
            value: 0,
          },
        ],
      },
    },
  ];
}

// 表格列配置
export function useQuestionGridColumns() {
  return [
    {
      field: 'id',
      width: 100,
      title: '编号',
    },
    { field: 'title', title: '问卷标题', width: 200, showOverflow: true },
    {
      field: 'surveyCode',
      title: '问卷编码',
      width: 150,
      showOverflow: true,
    },
    {
      field: 'description',
      title: '问卷描述',
      showOverflow: true,
      minWidth: 200,
      editRender: {
        name: 'VxeInput',
      },
    },
    {
      field: 'questionnaireType',
      title: '问卷类型',
      width: 150,
      slots: { default: 'type' },
      editRender: {
        name: 'VxeSelect',
        options: questionnaireTypeOptions,
      },
    },
    {
      field: 'questionCount',
      title: '问卷题数',
      width: 100,
    },
    {
      field: 'estimatedDuration',
      title: '预计用时',
      width: 100,
    },
    {
      field: 'syncStatus',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'isOpen',
      title: '是否启用',
      width: 100,
      slots: { default: 'isOpen' },
    },
    {
      field: 'targetAudience',
      title: '目标受众',
      width: 120,
      slots: { default: 'targetAudience' },
      editRender: {
        name: 'VxeSelect',
        options: targetAudienceOptions,
      },
    },
    { field: 'completionCount', title: '完成次数', width: 100 },
    {
      field: 'supportIndependentUse',
      title: '是否独立问卷',
      width: 100,
      slots: { default: 'supportIndependentUse' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 150,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      width: 180,
      fixed: 'right', // 固定在右侧
      showOverflow: false, // 不显示溢出内容的省略号
      resizable: false,
      slots: { default: 'operation' },
    },
  ];
}

// 问题配置表格列配置
export function useQuestionConfigGridColumns() {
  return [
    {
      title: '维度名称',
      field: 'dimensionName',
      width: 120,
    },
    {
      title: '配置描述',
      field: 'description',
      minWidth: 160,
      showOverflow: true,
    },
    {
      title: '题目索引',
      field: 'questionIndex',
      slots: { default: 'questionIndex' },
    },
    {
      title: '计算类型',
      field: 'calculateType',
      width: 120,
      formatter: ({ cellValue }: { cellValue: number }) => {
        const option = calculateTypeOptions.find(
          (opt) => opt.value === cellValue,
        );
        return option?.label || cellValue;
      },
    },
    {
      title: '计算公式',
      field: 'calculateFormula',
      width: 200,
      showOverflow: true,
    },
    {
      title: '老师评语',
      field: 'teacherComment',
      showOverflow: true,
    },
    {
      title: '学生评语',
      field: 'studentComment',
      showOverflow: true,
    },
    {
      title: '等级',
      field: 'level',
      width: 100,
    },
    {
      title: '是否异常配置',
      field: 'isAbnormal',
      width: 100,
      slots: { default: 'isAbnormal' },
    },
    {
      title: '操作',
      field: 'action',
      width: 180,
      fixed: 'right' as const,
      resizable: false,
      slots: { default: 'action' },
    },
  ];
}

// 计算类型选项
const calculateTypeOptions = [
  { label: '分数区间', value: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE },
  {
    label: '年龄性别与分数区间',
    value: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE,
  },
  { label: '最多选择', value: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE },
];

// ============== 维度配置 ======================

// 维度表格列配置
export function useDimensionGridColumns() {
  return [
    {
      title: '维度ID',
      field: 'id',
      width: 80,
    },
    {
      title: '维度名称',
      field: 'dimensionName',
      width: 150,
      showOverflow: true,
    },
    {
      title: '维度编码',
      field: 'dimensionCode',
      width: 120,
      showOverflow: true,
    },
    {
      title: '描述',
      field: 'description',
      minWidth: 200,
      showOverflow: true,
    },
    {
      title: '参与模块计算',
      field: 'participateModuleCalc',
      width: 120,
      slots: { default: 'participateModuleCalc' },
    },
    {
      title: '参与测评计算',
      field: 'participateAssessmentCalc',
      width: 120,
      slots: { default: 'participateAssessmentCalc' },
    },
    {
      title: '参与排行',
      field: 'participateRanking',
      width: 100,
      slots: { default: 'participateRanking' },
    },
    {
      title: '排序',
      field: 'sortOrder',
      width: 80,
    },
    {
      title: '状态',
      field: 'status',
      width: 80,
      slots: { default: 'status' },
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      field: 'action',
      width: 200,
      fixed: 'right' as const,
      resizable: false,
      slots: { default: 'action' },
    },
  ];
}

// 结果配置表格列配置
export function useResultConfigGridColumns() {
  return [
    {
      title: '配置ID',
      field: 'id',
      width: 80,
    },
    {
      title: '描述',
      field: 'description',
      minWidth: 160,
      showOverflow: true,
    },
    {
      title: '题目索引',
      field: 'questionIndex',
      slots: { default: 'questionIndex' },
      width: 150,
    },
    {
      title: '计算类型',
      field: 'calculateType',
      width: 120,
      slots: { default: 'calculateType' },
    },
    {
      title: '计算公式',
      field: 'calculateFormula',
      width: 200,
      showOverflow: true,
    },
    {
      title: '老师评语',
      field: 'teacherComment',
      showOverflow: true,
      width: 150,
    },
    {
      title: '学生评语',
      field: 'studentComment',
      showOverflow: true,
      width: 150,
    },
    {
      title: '等级',
      field: 'level',
      width: 100,
    },
    {
      title: '是否异常配置',
      field: 'isAbnormal',
      width: 120,
      slots: { default: 'isAbnormal' },
    },
    {
      title: '状态',
      field: 'status',
      width: 80,
      slots: { default: 'status' },
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      field: 'action',
      width: 150,
      fixed: 'right' as const,
      resizable: false,
      slots: { default: 'action' },
    },
  ];
}

// ============== 维度表单配置 ======================

// 维度表单 Schema
export function useDimensionFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'questionnaireId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'dimensionName',
      label: '维度名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入维度名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'dimensionCode',
      label: '维度编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入维度编码（唯一标识）',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入维度描述',
        rows: 2,
      },
    },
    {
      fieldName: 'calculateType',
      label: '计算类型',
      component: 'InputNumber',
      componentProps: {
        placeholder: '维度匹配规则的类型',
        class: 'w-full',
      },
    },
    {
      fieldName: 'participateModuleCalc',
      label: '参与模块计算',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ],
        buttonStyle: 'solid',
      },
      defaultValue: 1,
      rules: 'required',
    },
    {
      fieldName: 'participateAssessmentCalc',
      label: '参与测评计算',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ],
        buttonStyle: 'solid',
      },
      defaultValue: 1,
      rules: 'required',
    },
    {
      fieldName: 'participateRanking',
      label: '参与心理问题排行',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ],
        buttonStyle: 'solid',
      },
      defaultValue: 1,
      rules: 'required',
    },
    {
      fieldName: 'sortOrder',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入排序值',
        min: 1,
        class: 'w-full',
      },
      defaultValue: 1,
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
        buttonStyle: 'solid',
      },
      defaultValue: 1,
      rules: 'required',
    },
  ];
}
