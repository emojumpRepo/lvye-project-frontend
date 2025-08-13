import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PsychologyAssessmentApi {
  /** 测评任务信息 */
  export interface AssessmentTask {
    id?: number;
    taskNo?: string;
    title: string;
    description?: string;
    templateId: number;
    templateName?: string;
    status: number;
    startTime?: Date;
    endTime?: Date;
    targetType: number;
    targetIds?: number[];
    allowParentParticipation?: boolean;
    creatorUserId?: number;
    creatorName?: string;
    createTime?: Date;
    updateTime?: Date;
    // 统计字段
    totalParticipants?: number;
    completedParticipants?: number;
    completionRate?: number;
  }

  /** 测评任务分页查询参数 */
  export interface AssessmentTaskPageReq extends PageParam {
    title?: string;
    status?: number;
    templateId?: number;
    startTime?: Date[];
    createTime?: Date[];
  }

  /** 测评任务创建/更新请求 */
  export interface AssessmentTaskSaveReq {
    id?: number;
    title: string;
    description?: string;
    templateId: number;
    startTime?: Date;
    endTime?: Date;
    targetType: number;
    targetIds?: number[];
    allowParentParticipation?: boolean;
  }

  /** 测评模板信息 */
  export interface AssessmentTemplate {
    id: number;
    name: string;
    description?: string;
    type: number;
    questionCount?: number;
    estimatedMinutes?: number;
    status: number;
  }

  /** 测评参与者信息 */
  export interface AssessmentParticipant {
    id?: number;
    taskId: number;
    studentProfileId: number;
    studentName?: string;
    studentNo?: string;
    className?: string;
    memberUserId?: number;
    isParent?: boolean;
    status: number;
    startTime?: Date;
    submitTime?: Date;
    score?: number;
    riskLevel?: number;
  }

  /** 测评参与者分页查询参数 */
  export interface AssessmentParticipantPageReq extends PageParam {
    taskId?: number;
    studentName?: string;
    studentNo?: string;
    status?: number;
    isParent?: boolean;
  }

  /** 测评结果信息 */
  export interface AssessmentResult {
    id?: number;
    participantId: number;
    dimensionCode: string;
    dimensionName?: string;
    score: number;
    riskLevel?: number;
    suggestion?: string;
  }

  /** 测评答题记录 */
  export interface AssessmentAnswer {
    id?: number;
    participantId: number;
    questionIndex: number;
    answer: string;
    score?: number;
  }

  /** 测评统计信息 */
  export interface AssessmentStatistics {
    taskId: number;
    totalParticipants: number;
    completedParticipants: number;
    inProgressParticipants: number;
    notStartedParticipants: number;
    completionRate: number;
    averageScore?: number;
    riskLevelDistribution?: Record<string, number>;
  }
}

// ==================== 测评任务管理 ====================

/** 查询测评任务分页列表 */
export function getAssessmentTaskPage(params: PsychologyAssessmentApi.AssessmentTaskPageReq) {
  return requestClient.get<PageResult<PsychologyAssessmentApi.AssessmentTask>>(
    '/admin-api/psychology/assessment-task/page',
    { params },
  );
}

/** 查询测评任务详情 */
export function getAssessmentTask(taskNo: string) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentTask>(
    `/admin-api/psychology/assessment-task/get?taskNo=${taskNo}`,
  );
}

/** 创建测评任务 */
export function createAssessmentTask(data: PsychologyAssessmentApi.AssessmentTaskSaveReq) {
  return requestClient.post('/admin-api/psychology/assessment-task/create', data);
}

/** 更新测评任务 */
export function updateAssessmentTask(data: PsychologyAssessmentApi.AssessmentTaskSaveReq) {
  return requestClient.post('/admin-api/psychology/assessment-task/update', data);
}

/** 删除测评任务 */
export function deleteAssessmentTask(taskNo: string) {
  return requestClient.delete(`/admin-api/psychology/assessment-task/delete?taskNo=${taskNo}`);
}

/** 发布测评任务 */
export function publishAssessmentTask(taskNo: string) {
  return requestClient.post(`/admin-api/psychology/assessment-task/publish?taskNo=${taskNo}`);
}

/** 关闭测评任务 */
export function closeAssessmentTask(taskNo: string) {
  return requestClient.post(`/admin-api/psychology/assessment-task/close?taskNo=${taskNo}`);
}

/** 延长测评任务时间 */
export function extendAssessmentTask(taskNo: string, endTime: Date) {
  return requestClient.post(`/admin-api/psychology/assessment-task/extend`, {
    taskNo,
    endTime,
  });
}

/** 发送测评提醒 */
export function sendAssessmentReminder(taskNo: string, participantIds?: number[]) {
  return requestClient.post(`/admin-api/psychology/assessment-task/send-reminder`, {
    taskNo,
    participantIds,
  });
}

// ==================== 测评模板管理 ====================

/** 获取测评模板列表 */
export function getAssessmentTemplateList() {
  return requestClient.get<PsychologyAssessmentApi.AssessmentTemplate[]>(
    '/admin-api/psychology/assessment-task/get-exam-template',
  );
}

// ==================== 测评参与者管理 ====================

/** 查询测评参与者分页列表 */
export function getAssessmentParticipantPage(params: PsychologyAssessmentApi.AssessmentParticipantPageReq) {
  return requestClient.get<PageResult<PsychologyAssessmentApi.AssessmentParticipant>>(
    '/admin-api/psychology/assessment-participant/page',
    { params },
  );
}

/** 获取测评参与者详情 */
export function getAssessmentParticipant(id: number) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentParticipant>(
    `/admin-api/psychology/assessment-participant/get?id=${id}`,
  );
}

/** 获取参与者测评结果 */
export function getAssessmentResults(participantId: number) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentResult[]>(
    `/admin-api/psychology/assessment-participant/results?participantId=${participantId}`,
  );
}

/** 获取参与者答题记录 */
export function getAssessmentAnswers(participantId: number) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentAnswer[]>(
    `/admin-api/psychology/assessment-participant/answers?participantId=${participantId}`,
  );
}

// ==================== 测评统计分析 ====================

/** 获取测评任务统计信息 */
export function getAssessmentStatistics(taskId: number) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentStatistics>(
    `/admin-api/psychology/assessment-task/statistics?taskId=${taskId}`,
  );
}

/** 导出测评结果 */
export function exportAssessmentResults(taskId: number) {
  return requestClient.download(`/admin-api/psychology/assessment-task/export-results?taskId=${taskId}`);
}

/** 导出测评报告 */
export function exportAssessmentReport(taskId: number) {
  return requestClient.download(`/admin-api/psychology/assessment-task/export-report?taskId=${taskId}`);
}
