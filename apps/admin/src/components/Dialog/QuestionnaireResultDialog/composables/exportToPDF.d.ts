import type {
  AssessmentQuestionnaireResultVO,
  QuestionnaireAnswerItem,
  RiskLevelIntervention,
} from '@vben/types';

export declare function exportQuestionnaireReportToPDF(params: {
  assessmentSummary?: RiskLevelIntervention;
  completedTime?: Date | number | string;
  questionnaireAnswer: QuestionnaireAnswerItem[];
  questionnaireResult: AssessmentQuestionnaireResultVO[];
  scenarioName?: string;
  studentName: string;
}): Promise<void>;

export declare function formatAnswer(answer: string): string;
