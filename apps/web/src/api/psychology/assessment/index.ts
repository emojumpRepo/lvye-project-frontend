import type { AssessmentTask } from '@vben/types';

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
