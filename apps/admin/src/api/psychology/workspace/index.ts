import type { PageResult } from '@vben/request';

import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { requestClient } from '#/api/request';

export interface WorkspaceDataReqVO {
  type?: 'HIGH_RISK_STUDENTS' | 'PENDING_ALERTS' | 'TODAY_CONSULTATIONS';
  counselorUserId?: number;
  pageNo?: number;
  pageSize?: number;
}

export function getWorkspaceData(params: WorkspaceDataReqVO) {
  return requestClient.get<
    PageResult<PsychologyStudentProfileApi.StudentProfile>
  >('/psychology/workspace/data', { params });
}
