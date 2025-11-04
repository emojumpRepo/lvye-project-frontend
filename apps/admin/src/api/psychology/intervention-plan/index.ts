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
