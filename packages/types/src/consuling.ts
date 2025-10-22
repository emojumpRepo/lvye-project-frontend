/** 评估确认信息 */
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

export interface AssessmentComfirmInfo {
  studentInfo: StudentInfo;
  consultInfo: ConsultInfo;
}

export interface CoreAssessmentType {
  issues: string[];
  recommendation: number;
  riskLevel: number;
}

export interface DetailedAssessmentType {
  report?: string;
  fileId?: number;
  assessmentMode: number;
}

export interface StatisticsConsultationCount {
  todayCount: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
}
