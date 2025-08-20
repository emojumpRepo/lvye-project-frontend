import type { PageParam, PageResult } from '@vben/request';

import { appRequestClient } from '#/api/request';

export namespace PsychologyAssessmentApi {
  /** 测评任务信息 */
  export interface AssessmentTask {
    id?: number;
    taskNo?: string;
    deadline?: Date;
    finishNum?: number; // 完成人数
    totalNum?: number; // 总人数
    taskName: string;
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

/** 查询我的测评任务列表 */
export function getMyAssessmentTask() {
  return appRequestClient.get<
    PageResult<PsychologyAssessmentApi.AssessmentTask>
  >('/psychology/assessment-task/my-tasks');
}

/** 查询测评任务详情 */
export function getAssessmentTask(taskNo: string) {
  return appRequestClient.get<PsychologyAssessmentApi.AssessmentTask>(
    `/psychology/assessment-task/get?taskNo=${taskNo}`,
  );
}
