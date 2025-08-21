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
      minWidth: 40,
      title: '编号',
    },
    { field: 'title', title: '问卷标题', width: 200, showOverflow: true },
    {
      field: 'description',
      title: '问卷描述',
      width: 250,
      showOverflow: true,
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
      field: 'isOpen',
      title: '是否开放',
      width: 100,
      slots: { default: 'isOpen' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 150,
      formatter: 'formatDateTime',
      resizable: false,
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 120,
      align: 'center',
      fixed: 'right', // 固定在右侧
      showOverflow: false, // 不显示溢出内容的省略号
      slots: { default: 'operation' },
    },
  ];
}
