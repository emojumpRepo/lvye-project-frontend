import type { PageParam, PageResult } from '@vben/request';
import type {
  CrisisBoardData,
  CrisisEvent,
  CrisisEventRecord,
} from '@vben/types';

import { requestClient } from '#/api/request';

/** 五级干预看板统计数据分页查询参数 */
export interface CrisisBoardDataPageReq extends PageParam {
  pageNo: number;
  pageSize: number;
  riskLevel?: number;
  onlyMine?: boolean;
  sortField?: string;
  sortOrder?: string;
}

/** 危机事件列表查询参数 */
export interface CrisisEventListReq extends PageParam {
  studentProfileId?: number;
  status?: number;
  riskLevel?: number;
  priority?: number;
  handlerUserId?: number;
  startTime?: number;
  endTime?: number;
  studentName?: string;
  classId?: number;
  counselorUserId?: number;
}

/** 获取危机事件处理历史记录请求参数 */
export interface CrisisEventProcessHistoryReq {
  id: number;
}

/** 获取五级干预看板统计数据 */

export function getCrisisBoardData(params: CrisisBoardDataPageReq) {
  return requestClient.get<CrisisBoardData[]>(
    '/psychology/intervention/dashboard/summary',
    { params },
  );
}

/** 获取危机事件列表 */
export function getCrisisEventList(params: CrisisEventListReq) {
  return requestClient.get<PageResult<CrisisEvent[]>>(
    '/psychology/intervention/event/page',
    { params },
  );
}

/** 获取危机干预系统设置 */
export function getCrisisInterventionSystemSetting() {
  return requestClient.get<{
    defaultPsychologyId: number;
    mode: string;
  }>('/psychology/intervention/admin/get-assignment-settings');
}

/** 危机干预系统设置 */
export function crisisInterventionSystemSetting({
  mode,
  defaultPsychologyId = undefined,
}: {
  defaultPsychologyId?: number;
  mode: string;
}) {
  return requestClient.put<boolean>(
    `/psychology/intervention/admin/settings/intervention-assignment-mode`,
    {
      mode,
      defaultPsychologyId,
    },
  );
}

/** 获取危机事件详情 */
export function getCrisisEventDetail(id: number) {
  return requestClient.get<CrisisEvent>(`/psychology/intervention/event/${id}`);
}

/** 获取危机事件处理历史记录 */
export function getCrisisEventProcessHistory(
  params: CrisisEventProcessHistoryReq,
) {
  return requestClient.get<PageResult<CrisisEventRecord>>(
    `psychology/intervention/event/${params.id}/process-history`,
    { params },
  );
}

/** 更新危机事件描述 */
export function updateCrisisEventDescription(id: number, description: string) {
  return requestClient.put<boolean>(
    `/psychology/intervention/event/${id}/description`,
    {
      id,
      description,
    },
  );
}
