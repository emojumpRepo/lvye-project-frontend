import type { InterventionPlan } from '@vben/types';

import { requestClient } from '#/api/request';

export interface InterventionPlanCreateReqVO {
  studentProfileId: number;
  templateId: number;
  title: string;
}

/** 创建干预计划 */
export function createInterventionPlan(params: InterventionPlanCreateReqVO) {
  return requestClient.post<number>(
    '/psychology/intervention-plan/create',
    params,
  );
}

/** 获取干预计划详情 */
export function getInterventionPlan(id: number) {
  return requestClient.get<InterventionPlan>(
    `/psychology/intervention-plan/get?id=${id}`,
  );
}
