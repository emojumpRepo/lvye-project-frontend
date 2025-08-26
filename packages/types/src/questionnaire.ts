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
