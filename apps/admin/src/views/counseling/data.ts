import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { h, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { getDictOptions } from '#/utils/dict';

/** 搜索表单 */
export function useSearchFormSchema(): VbenFormSchema[] {
  /** 年级列表 */
  const deptList = ref<PsychologyStudentProfileApi.DeptTree[]>([]);
  const stored = sessionStorage.getItem('deptList');
  if (stored) {
    deptList.value = JSON.parse(stored);
  }

  /** 班级列表 */
  const classList = deptList.value.reduce(
    (acc, item) => {
      if (item.children) {
        acc.push(...item.children);
      }
      return acc;
    },
    [] as { label: string; value: number }[],
  );

  /** 心理状态 */
  const studentProfileStatusList = getDictOptions(
    'student_psychological_status',
  );

  /** 毕业状态 */
  const graduationStatusList = getDictOptions('student_graduation_status');

  return [
    {
      fieldName: 'gradeDeptId',
      component: 'Select',
      componentProps: {
        options: [{ label: '全部年级', value: '' }, ...deptList.value],
      },
      defaultValue: '',
    },
    {
      fieldName: 'classDeptId',
      component: 'Select',
      componentProps: {
        options: [{ label: '全部班级', value: '' }, ...classList],
      },
      defaultValue: '',
    },
    {
      fieldName: 'graduationStatus',
      component: 'Select',
      componentProps: {
        options: [{ label: '是否毕业', value: '' }, ...graduationStatusList],
      },
      defaultValue: '',
    },
    {
      fieldName: 'psychologicalStatus',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部心理状态', value: '' },
          ...studentProfileStatusList,
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

/** 学生档案列表（列表视图） */
export function useStudentProfileGridSchema(): VxeTableGridOptions<PsychologyStudentProfileApi.StudentProfile>['columns'] {
  return [
    { type: 'checkbox', width: '5%' },
    { field: 'name', title: '学生姓名', width: '10%', showOverflow: 'tooltip' },
    { field: 'studentNo', title: '学号', width: '10%' },
    { field: 'sex', title: '性别', width: '10%', slots: { default: 'sex' } },
    { field: 'gradeName', title: '年级', width: '10%' },
    {
      field: 'className',
      title: '班级',
      width: '10%',
      showOverflow: 'tooltip',
    },
    {
      field: 'psychologicalStatus',
      title: '心理状态',
      width: '10%',
      slots: { default: 'psychologicalStatus' },
    },
    {
      field: 'mobile',
      title: '联系电话',
      width: '10%',
      slots: { default: 'mobile' },
    },
    {
      field: 'graduationStatus',
      title: '毕业状态',
      width: '10%',
      slots: { default: 'graduationStatus' },
    },
    {
      field: 'actions',
      title: '操作',
      width: '15%',
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}

/** 学生档案列表（分组视图） */
export function useStudentProfileGroupGridSchema(): VxeTableGridOptions<PsychologyStudentProfileApi.StudentProfile>['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      align: 'left',
      fixed: 'left',
      showOverflow: 'tooltip',
      treeNode: true,
      slots: {
        default: 'name',
      },
      className: '!pl-5',
    },
    {
      field: 'count',
      title: '学生人数',
      width: '80',
      slots: { default: 'count' },
    },
    { type: 'checkbox', width: '80', align: 'center', fixed: 'right' },
  ];
}

export { type PsychologyStudentProfileApi } from '#/api/psychology/student-profile';
