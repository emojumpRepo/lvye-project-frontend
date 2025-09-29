import type {
  AssessmentTask,
  AssessmentTaskParticipantStatus,
} from '@vben/types';

import { appRequestClient } from '#/api/request';

// 测评结果
export interface AssessmentResult {
  id: number;
  questionnaireId: number;
  userId: number;
  assessmentTaskNo: string;
  score: number;
  resultDataParsed: AssessmentResultItem[];
}

// 测评结果数据
export interface AssessmentResultItem {
  dimensionName: string;
  isAbnormal: number;
  score: number;
  studentComment: string;
  dimensionCode: string;
}

// ==================== 测评任务管理 ====================

/** 查询我的测评任务列表 */
export function getMyAssessmentTask() {
  return appRequestClient.get<AssessmentTask>(
    '/psychology/assessment-task/my-tasks',
  );
}

/** 查询测评任务详情 */
export function getAssessmentTask(taskNo: string) {
  return appRequestClient.get<AssessmentTask>(
    `/psychology/assessment-task/get?taskNo=${taskNo}`,
  );
}

/** 开始测评 */
export function startAssessment(taskNo: string) {
  return appRequestClient.post<AssessmentTask>(
    `/psychology/assessment-participant/start?taskNo=${taskNo}`,
  );
}

/** 获取测评参与状态 */
export function getAssessmentParticipantStatus(taskNo: string) {
  return appRequestClient.get<AssessmentTaskParticipantStatus>(
    `/psychology/assessment-participant/status?taskNo=${taskNo}`,
  );
}

/** 获取测评结果 */
export function getAssessmentResult(taskNo: string) {
  return appRequestClient.get<AssessmentResult[]>(
    `/psychology/assessment-task/my-task-results?taskNo=${taskNo}`,
  );
}

/** 轮询获取结果正在生成中的测评任务列表 */
export function getGeneratingTasks() {
  return appRequestClient.get<AssessmentTask[]>(
    '/psychology/assessment-task/generating-tasks',
  );
}
