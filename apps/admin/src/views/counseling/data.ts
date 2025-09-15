import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { h, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

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
    {
      field: 'studentName',
      title: '学生信息',
      width: '15%',
      slots: { default: 'studentName' },
    },
    {
      field: 'className',
      title: '班级',
      width: '10%',
      visible: false,
    },
    {
      field: 'consultTime',
      title: '时间',
      width: '15%',
      slots: { default: 'consultTime' },
    },
    {
      field: 'consultDuration',
      title: '时长',
      width: '10%',
      visible: false,
    },
    {
      field: 'consultType',
      title: '咨询类型',
      width: '10%',
    },
    { field: 'consultant', title: '咨询老师', width: '10%' },
    { field: 'location', title: '地点', width: '13%' },
    {
      field: 'stauts',
      title: '状态',
      width: '15%',
      slots: { default: 'stauts' },
    },
    {
      field: 'progress',
      title: '进度',
      width: '15%',
      slots: { default: 'progress' },
    },
    {
      title: '操作',
      width: '13%',
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
        className: '高一（3）班',
        consultTime: 1_757_492_748_000,
        consultDuration: 60,
        consultType: '初次咨询',
        consultant: '李老师',
        location: '心理咨询室A',
        status: ([1, 2, 3, 4] as const)[id % 4],
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

  /** 咨询状态 */
  const counselingStatusList = getDictOptions('counseling_status');

  return [
    {
      fieldName: 'classDeptId',
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
    },
    {
      fieldName: 'status',
      component: 'Select',
      componentProps: {
        options: [{ label: '全部状态', value: '' }, ...counselingStatusList],
      },
      defaultValue: '',
    },
    {
      fieldName: 'consultTime',
      component: 'DatePicker',
      componentProps: {
        placeholder: '咨询时间',
        valueFormat: 'YYYY-MM-DD',
      },
      defaultValue: '',
    },
    {
      fieldName: 'searchKeyword',
      component: 'Input',
      componentProps: {
        placeholder: '搜索学生',
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

/** 事件样式选项 */
export const eventStyleOptions = [
  {
    backgroundColor: '#04DC7014',
    dotColor: '#04DC70',
  },
  {
    backgroundColor: '#1966FF14',
    dotColor: '#1966FF',
  },
  {
    backgroundColor: '#FF9C0514',
    dotColor: '#FF9C05',
  },
];

/** 根据索引获取事件样式选项 */
export function getEventStyleOptions(index: number) {
  return eventStyleOptions[index % eventStyleOptions.length];
}
export { type PsychologyStudentProfileApi } from '#/api/psychology/student-profile';
