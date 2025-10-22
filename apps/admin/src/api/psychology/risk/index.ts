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
  content: string;
  followUpSuggestion: number;
  id?: number;
  problemTypes: string[];
  riskLevel: number;
  summary?: string;
  fileId?: number;
  attachments?: number[];
  assessmentMode: number;
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
