import type { PageResult } from '@vben/request';
import type { DeptGradeClassOption } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

import { getConsultationPage } from '#/api/psychology/consultation';
import { getDictOptions } from '#/utils/dict';

export interface CounselingRecordRow {
  id: number;
  studentName: string;
  studentClass: string;
  time: number; // timestamp
  duration: number; // minutes
  type: string; // 访谈类型
  teacher: string; // 访谈老师
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
      width: '25%',
      slots: { default: 'consultTime' },
    },
    {
      field: 'durationMinutes',
      title: '时长',
      width: '10%',
      visible: false,
    },
    {
      field: 'consultationType',
      title: '咨询类型',
      width: '10%',
    },
    { field: 'counselorName', title: '咨询老师', width: '10%' },
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
      fixed: 'right',
      width: '16%',
      resizable: false,
      slots: { default: 'actions' },
    },
  ];
}

export async function queryConsultationPage(
  { page }: any,
  formValues: any,
): Promise<{ list: CounselingRecordRow[]; total: number }> {
  const { teacherId, status, consultTime, searchKeyword, studentNo } =
    formValues;

  const params: PsychologyConsultationApi.ConsultationRecordPageReq = {
    pageNo: page.currentPage,
    pageSize: page.pageSize,
    teacherId: teacherId || undefined,
    studentName: studentNo || searchKeyword || undefined,
    status: status !== undefined && status !== '' ? Number(status) : undefined,
    // 这里的日期控件是单值，后端入参是时间范围数组，按同一天处理
    startTime: consultTime ? [consultTime] : undefined,
    endTime: consultTime ? [consultTime] : undefined,
  } as any;

  const res: PageResult<PsychologyConsultationApi.ConsultationRecord> =
    await getConsultationPage(params);

  const list: CounselingRecordRow[] = (res.list || []).map((item) => {
    const start = item.appointmentStartTime
      ? new Date(item.appointmentStartTime).getTime()
      : 0;
    const end = item.appointmentEndTime
      ? new Date(item.appointmentEndTime).getTime()
      : 0;
    let duration = 0;
    if (item.durationMinutes !== undefined && item.durationMinutes !== null) {
      duration = item.durationMinutes;
    } else if (start && end) {
      duration = Math.max(0, Math.round((end - start) / 60_000));
    }

    return {
      id: item.id ?? 0,
      studentName: item.studentName || '-',
      className: item.className || '-',
      consultTime: `${dayjs(start).format('MM月DD日 HH:mm')} - ${dayjs(end).format('HH:mm')}（${dayjs(start).format('ddd')}）`,
      durationMinutes: duration,
      consultationType: String(item.consultationType ?? ''),
      counselorName: item.counselorName || '-',
      location: item.location || '-',
      status: (item.status as any) ?? '',
      progress: 0,
    } as any;
  });

  return { list, total: res.total || 0 };
}

/** 搜索表单 */
export function useSearchFormSchema({
  deptOptions = [],
}: { deptOptions?: DeptGradeClassOption[] } = {}): VbenFormSchema[] {
  /** 咨询状态 */
  const counselingStatusList = getDictOptions('counseling_status');

  return [
    {
      fieldName: 'teacherId',
      component: 'Cascader',
      componentProps: {
        options: [
          { label: '全部老师', value: '', isLeaf: true },
          ...deptOptions,
        ],
        defaultValue: [''],
        expandTrigger: 'hover',
        changeOnSelect: true,
        allowClear: false,
        showSearch: false,
        style: { cursor: 'pointer' },
      },
      defaultValue: [''],
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
