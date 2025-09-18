import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PsychologyConsultationApi {
  /** 心理咨询记录信息 */
  export interface ConsultationRecord {
    id?: number;
    studentProfileId: number;
    studentName?: string;
    studentNumber?: string;
    className?: string;
    counselorUserId: number;
    counselorName?: string;
    type: number;
    method: number;
    appointmentStartTime: Date;
    appointmentEndTime: Date;
    durationMinutes?: number;
    consultationType: string;
    overdue?: boolean;
    location?: string;
    notes?: string;
    notifyStudent: boolean;
    status: number;
    createTime?: Date;
    updateTime?: Date;
  }

  /** 心理咨询记录分页查询参数 */
  export interface ConsultationRecordPageReq extends PageParam {
    studentProfileId?: number;
    studentName?: string;
    counselorUserId?: number;
    teacherId?: number;
    status?: number;
    startTime?: Date[];
    endTime?: Date[];
  }

  /** 心理咨询记录创建/更新请求 */
  export interface ConsultationRecordSaveReq {
    id?: number;
    studentProfileId: number;
    counselorUserId?: number;
    consultationType?: string;
    location?: string;
    appointmentStartTime: Date;
    appointmentEndTime: Date;
    durationMinutes?: number;
    notes?: string;
    status?: number;
  }

  /** 危机干预事件信息 */
  export interface CrisisIntervention {
    id?: number;
    studentProfileId: number;
    studentName?: string;
    studentNo?: string;
    title: string;
    description: string;
    riskLevel: number;
    status: number;
    handlerUserId?: number;
    handlerName?: string;
    sourceType: number;
    sourceDescription?: string;
    interventionPlan?: string;
    interventionResult?: string;
    followUpPlan?: string;
    reportTime?: Date;
    handleTime?: Date;
    completeTime?: Date;
    createTime?: Date;
    updateTime?: Date;
  }

  /** 危机干预事件分页查询参数 */
  export interface CrisisInterventionPageReq extends PageParam {
    studentProfileId?: number;
    studentName?: string;
    title?: string;
    riskLevel?: number;
    status?: number;
    handlerUserId?: number;
    sourceType?: number;
    reportTime?: Date[];
    createTime?: Date[];
  }

  /** 危机干预事件创建/更新请求 */
  export interface CrisisInterventionSaveReq {
    id?: number;
    studentProfileId: number;
    title: string;
    description: string;
    riskLevel: number;
    status?: number;
    handlerUserId?: number;
    sourceType: number;
    sourceDescription?: string;
    interventionPlan?: string;
    interventionResult?: string;
    followUpPlan?: string;
  }

  /** 咨询统计信息 */
  export interface ConsultationStatistics {
    totalRecords: number;
    thisMonthRecords: number;
    activeStudents: number;
    averageDuration: number;
    typeDistribution: Record<string, number>;
    methodDistribution: Record<string, number>;
    riskLevelDistribution: Record<string, number>;
  }

  /** 危机干预统计信息 */
  export interface CrisisStatistics {
    totalCrises: number;
    activeCrises: number;
    resolvedCrises: number;
    highRiskCount: number;
    riskLevelDistribution: Record<string, number>;
    sourceTypeDistribution: Record<string, number>;
  }
}

// ==================== 心理咨询记录管理 ====================

/** 查询心理咨询记录分页列表 */
export function getConsultationPage(
  params: PsychologyConsultationApi.ConsultationRecordPageReq,
) {
  return requestClient.get<
    PageResult<PsychologyConsultationApi.ConsultationRecord>
  >('/psychology/consultation/appointment/page', { params });
}

/** 查询心理咨询记录详情 */
export function getConsultationRecord(id: number) {
  return requestClient.get<PsychologyConsultationApi.ConsultationRecord>(
    `/psychology/consultation/appointment/get?id=${id}`,
  );
}

/** 创建心理咨询记录 */
export function createConsultationRecord(
  data: PsychologyConsultationApi.ConsultationRecordSaveReq,
) {
  return requestClient.post(
    '/psychology/consultation/appointment/create',
    data,
  );
}

/** 更新心理咨询记录 */
export function updateConsultationRecord(
  data: PsychologyConsultationApi.ConsultationRecordSaveReq,
) {
  return requestClient.put('/psychology/consultation-record/update', data);
}

/** 删除心理咨询记录 */
export function deleteConsultationRecord(id: number) {
  return requestClient.delete(
    `/psychology/consultation-record/delete?id=${id}`,
  );
}

/** 批量删除心理咨询记录 */
export function deleteConsultationRecordList(ids: number[]) {
  return requestClient.delete(
    `/psychology/consultation-record/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出心理咨询记录 */
export function exportConsultationRecord(
  params: PsychologyConsultationApi.ConsultationRecordPageReq,
) {
  return requestClient.download(
    '/psychology/consultation-record/export-excel',
    {
      params,
    },
  );
}

// ==================== 危机干预事件管理 ====================

/** 查询危机干预事件分页列表 */
export function getCrisisInterventionPage(
  params: PsychologyConsultationApi.CrisisInterventionPageReq,
) {
  return requestClient.get<
    PageResult<PsychologyConsultationApi.CrisisIntervention>
  >('/psychology/crisis-intervention/page', { params });
}

/** 查询危机干预事件详情 */
export function getCrisisIntervention(id: number) {
  return requestClient.get<PsychologyConsultationApi.CrisisIntervention>(
    `/psychology/crisis-intervention/get?id=${id}`,
  );
}

/** 创建危机干预事件 */
export function createCrisisIntervention(
  data: PsychologyConsultationApi.CrisisInterventionSaveReq,
) {
  return requestClient.post('/psychology/crisis-intervention/create', data);
}

/** 更新危机干预事件 */
export function updateCrisisIntervention(
  data: PsychologyConsultationApi.CrisisInterventionSaveReq,
) {
  return requestClient.put('/psychology/crisis-intervention/update', data);
}

/** 删除危机干预事件 */
export function deleteCrisisIntervention(id: number) {
  return requestClient.delete(
    `/psychology/crisis-intervention/delete?id=${id}`,
  );
}

/** 分配危机干预处理人 */
export function assignCrisisHandler(id: number, handlerUserId: number) {
  return requestClient.put(`/psychology/crisis-intervention/assign`, {
    id,
    handlerUserId,
  });
}

/** 更新危机干预状态 */
export function updateCrisisStatus(
  id: number,
  status: number,
  remark?: string,
) {
  return requestClient.put(`/psychology/crisis-intervention/update-status`, {
    id,
    status,
    remark,
  });
}

/** 完成危机干预 */
export function completeCrisisIntervention(
  id: number,
  interventionResult: string,
  followUpPlan?: string,
) {
  return requestClient.put(`/psychology/crisis-intervention/complete`, {
    id,
    interventionResult,
    followUpPlan,
  });
}

// ==================== 统计分析 ====================

/** 获取咨询统计信息 */
export function getConsultationStatistics() {
  return requestClient.get<PsychologyConsultationApi.ConsultationStatistics>(
    '/psychology/consultation-record/statistics',
  );
}

/** 获取危机干预统计信息 */
export function getCrisisStatistics() {
  return requestClient.get<PsychologyConsultationApi.CrisisStatistics>(
    '/psychology/crisis-intervention/statistics',
  );
}

/** 获取学生咨询历史 */
export function getStudentConsultationHistory(studentProfileId: number) {
  return requestClient.get<PsychologyConsultationApi.ConsultationRecord[]>(
    `/psychology/consultation-record/student-history?studentProfileId=${studentProfileId}`,
  );
}

/** 获取学生危机干预历史 */
export function getStudentCrisisHistory(studentProfileId: number) {
  return requestClient.get<PsychologyConsultationApi.CrisisIntervention[]>(
    `/psychology/crisis-intervention/student-history?studentProfileId=${studentProfileId}`,
  );
}
