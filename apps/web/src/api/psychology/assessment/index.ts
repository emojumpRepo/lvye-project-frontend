import type {
  AssessmentTask,
  AssessmentTaskParticipantStatus,
} from '@vben/types';

import { appRequestClient } from '#/api/request';

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
