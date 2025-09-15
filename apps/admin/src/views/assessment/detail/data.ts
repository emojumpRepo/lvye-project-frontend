import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { h, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { getDictOptions } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  /** 年级列表 */
  const deptList = ref<PsychologyStudentProfileApi.DeptTree[]>([]);
  const stored = localStorage.getItem('deptList');
  deptList.value = stored ? JSON.parse(stored) : [];
  const deptOptions = deptList.value?.map((dept) => ({
    label: dept.label,
    value: dept.value,
    children:
      dept.children?.map((cls) => ({
        label: cls.label,
        value: cls.value,
        isLeaf: true,
      })) || [],
  }));

  // 获取风险等级字典
  const riskLevelOptions = getDictOptions('questionnaire_result_risk_level');

  return [
    {
      fieldName: 'status',
      component: 'Select',
      componentProps: {
        placeholder: '全部状态',
        options: [
          { label: '全部状态', value: '' },
          { label: '未完成', value: 0 },
          { label: '已完成', value: 1 },
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
        options: [{ label: '全部风险等级', value: '' }, ...riskLevelOptions],
      },
      defaultValue: '',
      hideLabel: true,
    },
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
export function useGridColumns(): VxeTableGridOptions<PsychologyAssessmentApi.ParticipantsQuestionnairePageRes>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'name',
      title: '学生名称',
      minWidth: 120,
    },
    {
      type: 'seq',
      title: '序号',
      minWidth: 40,
      visible: false,
    },
    {
      field: 'className',
      title: '班级',
      minWidth: 120,
    },
    {
      field: 'studentNo',
      title: '学号',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '完成状态',
      minWidth: 120,
      slots: { default: 'status' },
    },
    {
      field: 'score',
      title: '得分',
      minWidth: 120,
      slots: { default: 'score' },
    },
    {
      field: 'finishTime',
      title: '完成时间',
      minWidth: 120,
      formatter: 'formatDateTime',
      slots: { default: 'finishTime' },
    },
    {
      field: 'riskLevel',
      title: '风险等级',
      minWidth: 120,
      slots: { default: 'riskLevel' },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
