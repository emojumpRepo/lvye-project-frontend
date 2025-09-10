import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { h, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

import { getDictOptions } from '#/utils/dict';

export interface CounselingRecordRow {
  id: number;
  studentName: string;
  studentClass: string;
  time: number; // timestamp
  duration: number; // minutes
  type: string; // 咨询类型
  teacher: string; // 咨询老师
  location: string; // 地点
  status: '已取消' | '已完成' | '已逾期' | '已预约';
  progress: number; // 0-100
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', width: 60 },
    {
      field: 'studentName',
      title: '学生信息',
      width: 160,
      slots: { default: 'student' },
    },
    {
      field: 'time',
      title: '时间',
      width: 220,
      formatter: ({ cellValue, row }) =>
        `${dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss')}\n${row.duration}分钟`,
    },
    { field: 'type', title: '咨询类型', width: 140 },
    { field: 'teacher', title: '咨询老师', width: 120 },
    { field: 'location', title: '地点', width: 140 },
    {
      field: 'status',
      title: '状态',
      width: 120,
      slots: { default: 'status' },
    },
    {
      field: 'progress',
      title: '进度',
      width: 160,
      slots: { default: 'progress' },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

// 临时模拟数据，后续可替换为真实接口
export function mockQuery({
  page,
}: {
  page: { currentPage: number; pageSize: number };
}) {
  const total = 200;
  const list: CounselingRecordRow[] = Array.from({ length: page.pageSize }).map(
    (_, idx) => {
      const id = (page.currentPage - 1) * page.pageSize + idx + 1;
      return {
        id,
        studentName: '张晓明',
        studentClass: '高一（3）班',
        time: dayjs('2024-01-01 12:00:00').valueOf(),
        duration: 60,
        type: '学生压力咨询',
        teacher: '李老师',
        location: '心理咨询室A',
        status: (['已取消', '已完成', '已预约', '已逾期'] as const)[id % 4],
        progress: [10, 30, 60, 90, 100][id % 5],
      };
    },
  );
  return Promise.resolve({ list, total });
}

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

  return [
    {
      fieldName: 'classDeptId',
      component: 'Select',
      componentProps: {
        options: [{ label: '全部班级', value: '' }, ...classList],
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
