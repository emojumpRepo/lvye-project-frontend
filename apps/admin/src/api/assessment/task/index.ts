// 测评任务管理
export interface BasicInfo {
  description: string;
  name: string;
  timeRange: [any, any];
}

export interface AssessmentType {
  id: number;
  time: string;
  questionCount: [number, number] | number;
  name: string;
  description: string;
  dimension: string[];
}

export interface SelectedAssessmentTargetItem {
  classId: string;
  className: string;
  studentIds: string[];
}

export interface AssessmentTarget {
  type: 'parent' | 'student';
  selected: SelectedAssessmentTargetItem[];
}
