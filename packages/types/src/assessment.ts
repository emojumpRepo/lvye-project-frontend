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

/** 测评问卷结果 */
export interface AssessmentQuestionnaireResultVO {
  rawScore: number;
  riskLevel: number;
  suggestions: string;
  reportContent: string;
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
