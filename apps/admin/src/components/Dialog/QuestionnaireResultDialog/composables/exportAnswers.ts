import 'xlsx' from 'xlsx'
import dayjs from 'dayjs'

interface Answer {
  answer: string;
  index: number;
  score: number;
  title: string;
}

interface QuestionnaireResult {
  questionnaireId: number;
  questionnaireName: string;
  completedTime: number;
  totalScore: number;
  answers: Answer[];
}

interface QuestionnaireAnswers {
  studentName: string;
  studentNo: string;
  className: string;
  questionnaireResults:QuestionnaireResult[]
}
