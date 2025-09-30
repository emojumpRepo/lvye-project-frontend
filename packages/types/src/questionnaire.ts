export interface QuestionnaireVO {
  id?: number;
  questionnaireId?: number;
  externalId?: string;
  title?: string;
  questionnaireTitle?: string;
  surveyCode?: string;
  code?: string;
  status?: number;
  description?: string;
  isOpen?: number;
  externalLink: string;
  questionnaireType: number;
  syncStatus?: number;
  targetAudience?: number;
  estimatedDuration?: number;
  accessCount?: number;
  questionCount?: number;
  completionCount?: number;
  assessmentDimension?: string[];
  completed?: boolean;
  accessible?: boolean;
  generationStatus?: QuestionnaireGenerationStatus;
  assessmentDimensionLabels?: string[];
  validFrom?: number;
  validTo?: number;
  remark?: string;
  createTime?: string;
  creator?: string;
  supportIndependentUse?: number;
}

export interface QuestionnaireResultDataVO {
  dimensionName?: string;
  isAbnormal?: number;
  riskLevel?: number;
  score?: number;
  level?: string;
  studentComment?: string;
  teacherComment?: string;
}

export interface QuestionnaireResultVO {
  answers: string;
  assessmentTaskNo: string;
  createTime: number;
  dimensionScore: number;
  completedTime: number;
  evaluate: string;
  generationError: string;
  generationStatus: number;
  generationTime: number;
  id: number;
  questionnaireId: number;
  resultData: string;
  riskLevel: number;
  score: number;
  suggestions: string;
  updateTime: number;
  userId: number;
}

export interface QuestionnaireAnswerDataVO {
  answer: string;
  index: number;
  score: number;
  title: string;
}

// 输入框类型
export interface InputObject {
  required: boolean;
  placeholder: string;
  key: string;
}

// 复杂选项类型
export interface OptionObject {
  text: string;
  input: InputObject;
}

// 问题类型
export interface Question extends QuestionnaireAnswerDataVO {
  type: string;
  options: Array<OptionObject | string>;
}

// 每套问卷答案
export interface QuestionnaireAnswerItem {
  questionnaireName: string;
  questionnaireId: number | string;
  answers: Question[];
}

export enum QuestionnaireGenerationStatus {
  ERROR = 3,
  GENERATED = 2,
  GENERATING = 1,
  WAITING = 0,
}
