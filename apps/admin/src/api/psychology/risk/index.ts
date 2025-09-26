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
