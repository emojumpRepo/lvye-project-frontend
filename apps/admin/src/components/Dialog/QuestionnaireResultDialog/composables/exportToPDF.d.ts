export interface QuestionnaireResultItem {
  dimensionName?: string;
  score?: number;
  isAbnormal?: number;
  studentComment?: string;
  teacherComment?: string;
}

export interface QuestionnaireAnswerItem {
  index?: number;
  title?: string;
  answer?: string;
  score?: number;
}

export declare function exportQuestionnaireReportToPDF(params: {
  completedTime?: Date | number | string;
  questionnaireAnswer: any[] | QuestionnaireAnswerItem[];
  questionnaireName: string;
  questionnaireResult: any[] | QuestionnaireResultItem[];
  studentName: string;
}): Promise<void>;

export declare function formatAnswer(answer: string): string;
