// 评测详情页面的共享类型定义

export type ActiveType = 'all' | 'class' | 'grade';

export interface TabItem {
  key: string;
  label: string;
}

export interface TaskInfo {
  taskNo: string;
  taskName: string;
  status: number;
  startline: number;
  deadline: number;
  questionnairesTabs: TabItem[];
}

export interface RiskLevelConfig {
  level: number;
  color: string;
}