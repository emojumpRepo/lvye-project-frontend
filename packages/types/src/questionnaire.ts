export interface QuestionnaireVO {
  id?: number;
  questionnaireId?: number;
  externalId?: string;
  title?: string;
  questionnaireTitle?: string;
  status?: number;
  description?: string;
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
  assessmentDimensionLabels?: string[];
  isOpen?: boolean;
  validFrom?: number;
  validTo?: number;
  remark?: string;
  createTime?: string;
  creator?: string;
}

export interface QuestionnaireResultDataVO {
  dimensionName?: string;
  isAbnormal?: number;
  score?: number;
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
