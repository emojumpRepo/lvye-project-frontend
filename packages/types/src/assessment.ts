import type { QuestionnaireVO } from './questionnaire';
import type { AssessmentScenarioDetailed } from './scenario';

/** 测评任务信息 */
export interface AssessmentTask {
  id?: number;
  taskNo?: string;
  deadline?: Date | number | string;
  finishNum?: number; // 完成人数
  totalNum?: number; // 总人数
  taskName: string;
  description?: string;
  templateId: number;
  templateName?: string;
  status: number;
  startline?: Date | number | string;
  questionnaireIds?: number[];
  questionnaires: QuestionnaireVO[];
  endTime?: Date;
  targetType: number;
  targetAudience?: string;
  targetIds?: number[];
  allowParentParticipation?: boolean;
  creatorUserId?: number;
  creatorName?: string;
  createTime?: number;
  updateTime?: number;
  resultGenerating?: boolean; // 结果生成中标识
  // 测评场景信息
  scenarioId?: number; // 场景ID
  scenarioDetail?: AssessmentScenarioDetailed;
  // 任务参与信息
  progress: number; // 任务参与进度
  participantStatus: AssessmentTaskParticipantStatus; // 任务参与状态
  // 统计字段
  totalParticipants?: number;
  completedParticipants?: number;
  completionRate?: number;
}

/** 维度类型 */
export interface Dimension {
  dimensionId: number;
  name: string;
  score: number;
  isAbnormal: number;
  riskLevel: number;
  level: string;
  teacherComment: string;
  studentComment: string;
  description: string;
}

/** 测评问卷结果 */
export interface AssessmentQuestionnaireResultVO {
  rawScore: number;
  riskLevel: number;
  suggestions: string;
  reportContent: string;
  dimensions: Dimension[];
  standardScore: number;
  percentileRank: number;
  dimensionScores: Record<string, number>;
  questionnaireId: number;
  questionnaireName: string;
  levelDescription: string;
  answers: string;
}

/** 风险因子 */
export interface RiskFactorVO {
  riskLevel: number;
  factorCode: string;
  factorName: string;
  description: string;
  sourceDimension: string;
  sourceQuestionnaireId: number;
}

/** 干预建议 */
export interface InterventionSuggestionVO {
  suggestionType: string;
  title: string;
  content: string;
  priority: number;
  targetRiskFactor: string;
  timeframe: string;
}

export interface RiskLevelIntervention {
  criteria: string;
  evaluation: string;
  isCurrent: true;
  priority: number;
  riskLevel: number;
  riskLevelName: string;
  suggestion: string;
}

/** 测评结果 */
export interface AssessmentResultVO {
  id: number;
  participantId: number;
  dimensionCode: string;
  scenarioName: string;
  score: number;
  riskLevel: number;
  riskLevelIntervention: RiskLevelIntervention;
  riskLevelDescription: string;
  suggestion: string;
  questionnaireResults: AssessmentQuestionnaireResultVO[];
  combinedRiskLevel: number;
  riskFactor: RiskFactorVO[];
  interventionSuggestions: string;
  generationConfigVersion: string;
  createTime: number;
  updateTime: number;
}

/** 风险等级统计类型 */
export interface RiskLevel {
  riskLevel: number;
  count: number;
  color?: string;
}

export interface GradeRiskLevel {
  gradeDeptId: number;
  gradeName: string;
  total: number;
  riskLevelList: RiskLevel[];
  classList: ClassRiskLevel[];
}

export interface ClassRiskLevel {
  classDeptId: number;
  className: string;
  total: number;
  riskLevelList: RiskLevel[];
}

export interface AssessmentTaskRiskLevelStatistics {
  totalList: RiskLevel[];
  gradeList: GradeRiskLevel[];
}

/** 导出失败项 */
export interface ExportFailureItem {
  studentName: string; // 学生姓名
  studentNo: string; // 学号
  className: string; // 班级名称
  failedStep: 'fetching' | 'generating' | 'packaging'; // 失败步骤
  errorMessage: string; // 错误信息
}

/** 导出进度 */
export interface ExportProgress {
  currentStep:
    | 'cancelled'
    | 'completed'
    | 'error'
    | 'fetching'
    | 'generating'
    | 'packaging';
  fileType: 'pdf' | 'xlsx';
  exportFileName: string;
  // 准备工作（获取学生信息数据）
  studentInfoTotal: number; // 学生总数
  studentInfoFetched: number; // 已获取数据的学生数
  // 第一步（获取学生测评结果数据）
  totalCount: number; // 学生测评数据总数
  fetchedCount: number; // 已获取数据的学生测评数据数
  // 第二步：文件生成
  currentGenerateCount: number; // 当前正在生成的数据数量
  totalGenerateCount: number; // 总生成数据数量
  // 第三步：打包压缩
  packagingProgress: number; // 打包进度（0-100）
  // 完成统计信息
  failureList: ExportFailureItem[]; // 失败列表
  startTime: number; // 开始时间戳
  errorMessage: string; // 错误信息
  downloadUrl: string; // 下载链接
}

// 测评状态枚举
export const ASSESSMENT_STATUS = {
  DRAFT: 0, // 草稿
  PUBLISHED: 1, // 已发布
  COMPLETED: 2, // 已完成
  ENDED: 3, // 已截止
} as const;

/** 测评任务参与状态 */
export enum AssessmentTaskParticipantStatus {
  /** 已完成 */
  COMPLETED = 2,
  /** 进行中 */
  IN_PROGRESS = 1,
  /** 未开始 */
  NOT_STARTED = 0,
}

/** 测评目标类型 */
export enum ASSESSMENT_TARGET_TYPE {
  PARENT = 1,
  STUDENT = 0,
}
