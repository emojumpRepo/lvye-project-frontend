import type { PageResult } from '@vben/request';
import type { AssessmentRecord, CrisisEvent } from '@vben/types';

import { requestClient } from '#/api/request';

// 上报危机事件请求参数
export interface ReportCrisisEventReqVO {
  studentProfileId: number;
  title: string;
  description: string;
  eventTime: any;
  location: string;
  riskLevel: number;
  priority: number;
  attachments?: string[];
  sourceType: number;
}

// 创建干预评估请求参数
export interface InterventionAssessmentReqVO {
  id?: number;
  studentProfileId?: number;
  problemTypes?: string[];
  consultRecord?: string;
  attachmentIds?: number[];
  riskLevel?: number;
  hasMedicalVisit?: boolean;
  medicalVisitRecord?: string;
  observationRecord?: string;
  summary?: string;
}

// 创建干预评估请求参数
export interface AssessmentSaveReqVO {
  studentProfileId: number;
  problemTypes?: string[];
  attachmentIds?: number[];
  content?: string;
  riskLevel?: number;
  hasMedicalVisit?: boolean;
  medicalVisitRecord?: string;
  observationRecord?: string;
}

/** 上报危机事件 */
export function reportCrisisEvent(data: ReportCrisisEventReqVO) {
  return requestClient.post<{
    eventId: string;
    id: number;
    title: string;
  }>('/psychology/intervention/event/create', data);
}

/** 检测重复上报事件 */
export function checkDuplicateReportEvent(studentProfileId: number) {
  return requestClient.get<boolean>(
    '/psychology/intervention/event/check-duplicate',
    { params: { studentProfileId } },
  );
}

/** 获取事件状态统计 */
export function getEventProcessStatistics() {
  return requestClient.get<{ count: number; type: number }[]>(
    '/psychology/intervention/event/statistics',
  );
}

/** 分配负责人 */
export function assignHandler({
  id,
  handlerUserId,
}: {
  handlerUserId: number;
  id: number;
}) {
  return requestClient.put<boolean>(
    `/psychology/intervention/event/${id}/assign`,
    { handlerUserId },
  );
}

/** 更改分配负责人 */
export function updateHandler({
  id,
  newHandlerUserId,
  reason,
}: {
  id: number;
  newHandlerUserId: number;
  reason: string;
}) {
  return requestClient.put<boolean>(
    `/psychology/intervention/event/${id}/reassign`,
    { newHandlerUserId, reason },
  );
}

/** 选择处理方式 */
export function selectHandleMethod({
  id,
  processMethod,
  processReason,
}: {
  id: number;
  processMethod: number;
  processReason: string;
}) {
  return requestClient.put<boolean>(
    `/psychology/intervention/event/${id}/process`,
    { processMethod, processReason },
  );
}

/** 更新事件处理记录 */
export function updateEventRecord({
  id,
  content,
}: {
  content: string;
  id: number;
}) {
  return requestClient.put<boolean>(
    `/psychology/intervention/event/process/${id}/update`,
    { id, content },
  );
}

/** 提交阶段性评估 */
export function submitStageAssessment(params: InterventionAssessmentReqVO) {
  return requestClient.post<boolean>(
    `/psychology/intervention/event/${params.id}/stage-assessment`,
    { ...params },
  );
}

/** 结案 */
export function closeEvent(params: InterventionAssessmentReqVO) {
  return requestClient.put<boolean>(
    `/psychology/intervention/event/${params.id}/close`,
    { ...params },
  );
}

/** 切换危机事件关闭状态 */
export function switchEventCloseStatus(id: number, closed: boolean) {
  return requestClient.put<boolean>(
    `/psychology/intervention/event/${id}/toggle-closed`,
    { closed },
  );
}

/** 获取学生的危机干预历史 */
export function getStudentCrisisRecords(studentProfileId: number) {
  return requestClient.get<CrisisEvent[]>(
    `/psychology/intervention/event/student/${studentProfileId}`,
  );
}

/** 获取学生是风险评估记录 */
export function getStudentRiskAssessmentRecords(studentProfileId: number) {
  return requestClient.get<AssessmentRecord[]>(
    `/psychology/intervention/assessments/student/${studentProfileId}`,
  );
}

/** 获取正在进行的风险预警流程 */
export function getOngoingRiskEvent(params: {
  pageNo: number;
  pageSize: number;
}) {
  return requestClient.get<PageResult<CrisisEvent>>(
    '/psychology/intervention/event/ongoing',
    { params },
  );
}

/** 完成学生独立评估 */
export function submitIndependentAssessment(params: AssessmentSaveReqVO) {
  return requestClient.post<boolean>(
    `/psychology/intervention/assessment/submit`,
    { ...params },
  );
}
