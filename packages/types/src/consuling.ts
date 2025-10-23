import type { PsychologyConsultationApi } from '../../../apps/admin/src/api/psychology/consultation';

export interface StudentInfo {
  className: string;
  studentName: string;
  studentNo: string;
}

export interface ConsultInfo {
  consultant: string;
  consultTime: string;
  consultType: string;
}

/** 评估确认信息 */
export interface AssessmentComfirmInfo {
  studentInfo: StudentInfo;
  consultInfo: ConsultInfo;
}

/** 评估核心数据 */
export interface CoreAssessmentType {
  issues: string[];
  recommendation: number;
  riskLevel: number;
}

/** 评估报告数据 */
export interface DetailedAssessmentType {
  report?: string;
  fileId?: number;
  assessmentMode: number;
}

/** 统计咨询数量 */
export interface StatisticsConsultationCount {
  todayCount: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
}

/** 每日预约 */
export interface DailyAppointment {
  key: number;
  date: number[];
  appointments: PsychologyConsultationApi.ConsultationRecord[];
  count?: number;
}

/** 每周预约 */
export interface WeeklyAppointment {
  weekStart: number[];
  weekEnd: number[];
  dailyAppointments: DailyAppointment[];
}

export interface CounselorStats {
  counselorUserId: number;
  counselorName: string;
  totalCount: number;
  scheduledCount: number;
  completedCount: number;
  closedLoopCount: number;
  canceledCount: number;
  overdueCount: number;
  totalDurationMinutes: number;
}

/** 时间范围预约 */
export interface TimeRangeAppointment {
  timeGranularity: 'day' | 'month' | 'week';
  startDate: number[];
  endDate: number[];
  totalCount: number;
  counselorStats?: CounselorStats[];
  dailyData: DailyAppointment[];
  summary: {
    avgDurationMinutes: number;
    canceledCount: number;
    closedLoopCount: number;
    completedCount: number;
    overdueCount: number;
    scheduledCount: number;
    totalCount: number;
    totalDurationMinutes: number;
  };
}

/** 重构后的每日预约（用于日历数据） */
export interface RestructuredDailyAppointment {
  id: number;
  calendarId: string;
  title: string;
  category: string;
  start: string;
  end: string;
  body: string;
  location: string;
}

/** 根据日期查询咨询预约数据 */
export interface ConsultationAppointmentByDate {
  counselorUserId?: number;
  date: number[];
  appointments: PsychologyConsultationApi.ConsultationRecord[];
}
