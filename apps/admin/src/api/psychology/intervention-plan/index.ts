import type { InterventionPlan } from '@vben/types';

import { requestClient } from '#/api/request';

export interface InterventionPlanCreateReqVO {
  studentProfileId: number;
  templateId: number;
  title: string;
}

export interface InterventionPlanStepUpdateReqVO {
  id: number;
  title?: string;
  status?: number;
  notes?: string;
  attachmentIds?: number[];
}

export interface InterventionPlanStepSortUpdateReqVO {
  interventionId: number;
  steps: {
    id: number;
    sort: number;
  }[];
}

export interface InterventionPlanRelativeEventsUpdateReqVO {
  id: number;
  relativeEventIds: number[];
}

export interface InterventionPlanStepCreateReqVO {
  interventionId: number;
  title: string;
  notes?: string;
  status?: number;
  attachmentIds?: number[];
}

/** 创建干预计划 */
export function createInterventionPlan(params: InterventionPlanCreateReqVO) {
  return requestClient.post<number>(
    '/psychology/intervention-plan/create',
    params,
  );
}

/** 更新干预事件标题 */
export function updateInterventionPlanTitle(id: number, title: string) {
  return requestClient.put<boolean>(
    `/psychology/intervention-plan/update-title`,
    { id, title },
  );
}

/** 获取干预计划详情 */
export function getInterventionPlan(id: number) {
  return requestClient.get<InterventionPlan>(
    `/psychology/intervention-plan/get?id=${id}`,
  );
}

/** 更新干预计划步骤详情 */
export function updateInterventionPlanStep(
  params: InterventionPlanStepUpdateReqVO,
) {
  return requestClient.put<boolean>(
    '/psychology/intervention-plan/update-step',
    params,
  );
}

/** 批量更新步骤 */
export function updateInterventionPlanSteps(
  params: InterventionPlanStepSortUpdateReqVO,
) {
  return requestClient.put<boolean>(
    '/psychology/intervention-plan/batch-update-step-sort',
    params,
  );
}

/** 更新干预计划的关联事件列表 */
export function updateInterventionPlanRelativeEvents(
  params: InterventionPlanRelativeEventsUpdateReqVO[],
) {
  return requestClient.put<boolean>(
    '/psychology/intervention-plan/update-relative-events',
    params,
  );
}

/** 移除干预计划的关联事件 */
export function removeInterventionPlanRelativeEvent(
  id: number,
  relativeEventId: number,
) {
  return requestClient.put<boolean>(
    `/psychology/intervention-plan/remove-relative-event`,
    { id, relativeEventId },
  );
}

/** 完成干预事件 */
export function completeInterventionEvent(id: number) {
  return requestClient.put<boolean>(
    `/psychology/intervention-plan/complete?id=${id}`,
  );
}

/** 新增干预事件步骤 */
export function addInterventionPlanStep(
  params: InterventionPlanStepCreateReqVO,
) {
  return requestClient.post<boolean>(
    '/psychology/intervention-plan/create-step',
    params,
  );
}
