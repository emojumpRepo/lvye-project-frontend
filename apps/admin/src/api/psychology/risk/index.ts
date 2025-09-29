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
  attachmentUrls?: string[];
  sourceType: number;
}

/** 上报危机事件 */
export function reportCrisisEvent(data: ReportCrisisEventReqVO) {
  return requestClient.post<number>(
    '/psychology/intervention/event/create',
    data,
  );
}

/** 检测重复上报事件 */
export function checkDuplicateReportEvent(studentProfileId: number) {
  return requestClient.get<boolean>(
    '/psychology/intervention/event/check-duplicate',
    { params: { studentProfileId } },
  );
}

/** 获取事件状态统计 */
export function getEventStatusStatistics() {
  return requestClient.get<{ count: number; status: number }[]>(
    '/psychology/intervention/event/status-statistics',
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
  processMethod: string;
  processReason: string;
}) {
  return requestClient.put<boolean>(
    `/psychology/intervention/event/${id}/process`,
    { processMethod, processReason },
  );
}
