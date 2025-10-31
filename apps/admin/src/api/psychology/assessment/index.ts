import type { PageParam, PageResult } from '@vben/request';
import type {
  ASSESSMENT_TARGET_TYPE,
  AssessmentResultVO,
  AssessmentTask,
  AssessmentTaskRiskLevelStatistics,
  OngoingTask,
  QuestionnaireResultVO,
} from '@vben/types';

import { requestClient } from '#/api/request';

export namespace PsychologyAssessmentApi {
  /** 基本信息 */
  export interface BasicInfo {
    description: string;
    name: string;
    timeRange: [any, any];
  }

  /** 已选择的班级以及学生 */
  export interface SelectedAssessmentTargetItem {
    classId: number;
    className: string;
    studentIds: number[];
    totalStudent: number; // 班级人数
  }

  /** 选择量表 */
  export interface AssessmentTarget {
    type: ASSESSMENT_TARGET_TYPE;
    selected: SelectedAssessmentTargetItem[];
  }

  /** 测评任务分页查询参数 */
  export interface AssessmentTaskPageReq extends PageParam {
    taskNo?: string;
    name?: string;
    questionnaireIds?: number[];
    targetAudience?: number;
    status?: number;
    publishUserId?: number;
    deadline?: [Date, Date] | [string, string];
    createTime?: [Date, Date] | [string, string];
  }

  /** 测评任务创建/更新请求 */
  export interface AssessmentTaskSaveReq {
    id?: number;
    taskNo?: string;
    taskName: string;
    questionnaireIds: number[];
    targetAudience: number; // 0-学生，1-家长
    startline?: number; // 毫秒时间戳
    deadline?: number; // 毫秒时间戳
    deptIdList?: number[];
    userIdList?: number[];
    isPublish?: boolean; // 是否发布
    scenarioId?: number; // 场景ID，可为空（默认NONE）
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

  /** 测评任务参与者问卷分页查询参数 */
  export interface AssessmentTaskParticipantsQuestionnairePageReq
    extends PageParam {
    taskNo: string;
    questionnaireId: number;
    studentName?: string;
    studentNo?: string;
    status?: number;
    riskLevel?: string;
    className?: string;
  }

  /** 测评参与者请求参数 */
  export interface AssessmentTaskParticipantsReq {
    taskNo: string;
    userIds: number[];
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

  /** 测评问卷学生参与答题记录分页查询参数 */
  export interface ParticipantsQuestionnairePageReq {
    taskNo?: string;
    questionnaireId?: number;
    name?: string;
    studentNo?: string;
    status?: number;
    riskLevel?: number;
    classId?: number[];
    pageNo?: number;
    pageSize?: number;
  }

  /** 测评问卷学生参与答题记录 */
  export interface ParticipantsQuestionnairePageRes {
    id?: string; // 结果ID
    studentProfileId: number;
    taskNo: string;
    studentNo: string;
    score: number;
    riskLevel: number;
    level: string;
    name: string;
    className: string;
    gradeName: string;
    status: number;
    finishTime: number;
    questionnaireName: string;
  }

  export interface DeptTree {
    deptId: number;
    deptName: string;
    totalParticipants: number;
    completedParticipants: number;
    completionRate: number;
    children: DeptTree[] | null;
  }

  export interface AssessmentStatistics {
    totalParticipants: number;
    completedParticipants: number;
    inProgressParticipants: number;
    notStartedParticipants: number;
    completionRate: number;
    deptTree?: DeptTree[];
  }
}

// ==================== 测评任务管理 ====================

/** 查询测评任务分页列表 */
export function getAssessmentTaskPage(
  params: PsychologyAssessmentApi.AssessmentTaskPageReq,
) {
  return requestClient.get<PageResult<AssessmentTask>>(
    '/psychology/assessment-task/page',
    { params },
  );
}

/** 查询测评任务详情 */
export function getAssessmentTask(taskNo: string) {
  return requestClient.get<AssessmentTask>(
    `/psychology/assessment-task/get?taskNo=${taskNo}`,
  );
}

/** 创建测评任务 */
export function createAssessmentTask(
  data: PsychologyAssessmentApi.AssessmentTaskSaveReq,
) {
  return requestClient.post('/psychology/assessment-task/create', data);
}

/** 更新测评任务 */
export function updateAssessmentTask(data: {
  deadline: number; // 毫秒时间戳
  description: string;
  id: string;
  startline: number; // 毫秒时间戳
  targetAudience: string;
  taskName: string;
  taskNo: string;
}) {
  return requestClient.post('/psychology/assessment-task/update', data);
}

/** 删除测评任务 */
export function deleteAssessmentTask(taskNo: string) {
  return requestClient.post(
    `/psychology/assessment-task/delete?taskNo=${taskNo}`,
  );
}

/** 发布测评任务 */
export function publishAssessmentTask(taskNo: string) {
  return requestClient.post(
    `/psychology/assessment-task/publish?taskNo=${taskNo}`,
  );
}

/** 关闭测评任务 */
export function closeAssessmentTask(taskNo: string) {
  return requestClient.post(
    `/psychology/assessment-task/close?taskNo=${taskNo}`,
  );
}

/** 延长测评任务时间 */
export function extendAssessmentTask(taskNo: string, endTime: Date) {
  return requestClient.post(`/psychology/assessment-task/extend`, {
    taskNo,
    endTime,
  });
}

/** 发送测评提醒 */
export function sendAssessmentReminder(
  taskNo: string,
  participantIds?: number[],
) {
  return requestClient.post(`/psychology/assessment-task/send-reminder`, {
    taskNo,
    participantIds,
  });
}

/** 导出测评任务 */
export function exportAssessmentTask(
  params: PsychologyAssessmentApi.AssessmentTaskPageReq,
) {
  return requestClient.download(`/psychology/assessment-task/export-excel`, {
    params,
  });
}

/** 获取正在进行的任务 */
export function getOngoingTasks(params: { pageNo: number; pageSize: number }) {
  return requestClient.get<PageResult<OngoingTask>>(
    '/psychology/assessment-task/get-ongoing-tasks-page',
    { params },
  );
}

// ==================== 测评模板管理 ====================

/** 获取测评模板列表 */
export function getAssessmentTemplateList() {
  return requestClient.get<PsychologyAssessmentApi.AssessmentTemplate[]>(
    '/psychology/assessment-task/get-exam-template',
  );
}

// ==================== 测评参与者管理 ====================

/** 查询测评参与者分页列表 */
export function getAssessmentParticipantPage(
  params: PsychologyAssessmentApi.AssessmentParticipantPageReq,
) {
  return requestClient.get<
    PageResult<PsychologyAssessmentApi.AssessmentParticipant>
  >('/psychology/assessment-participant/page', { params });
}

/** 获取测评参与者详情 */
export function getAssessmentParticipant(id: number) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentParticipant>(
    `/psychology/assessment-participant/get?id=${id}`,
  );
}

/** 获取参与者测评结果 */
export function getAssessmentResults(participantId: number) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentResult[]>(
    `/psychology/assessment-participant/results?participantId=${participantId}`,
  );
}

/** 获取参与者答题记录 */
export function getAssessmentAnswers(participantId: number) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentAnswer[]>(
    `/psychology/assessment-participant/answers?participantId=${participantId}`,
  );
}

/** 新增测评参与者 */
export function addAssessmentParticipants(
  data: PsychologyAssessmentApi.AssessmentTaskParticipantsReq,
) {
  return requestClient.post<boolean>(
    '/psychology/assessment-task/add-participants',
    data,
  );
}

/** 获取测评问卷学生答题记录 */
export function getAssessmentTaskParticipantsQuestionnairePage(
  params: PsychologyAssessmentApi.ParticipantsQuestionnairePageReq,
) {
  return requestClient.get<
    PageResult<PsychologyAssessmentApi.ParticipantsQuestionnairePageRes>
  >('/psychology/assessment-task/participants-questionnaire-page', { params });
}

/** 移除测评参与者 */
export function removeAssessmentParticipants(
  data: PsychologyAssessmentApi.AssessmentTaskParticipantsReq,
) {
  return requestClient.post<boolean>(
    '/psychology/assessment-task/remove-participants',
    data,
  );
}

// ==================== 测评统计分析 ====================

/** 获取测评任务统计信息 */
export function getAssessmentStatistics(params: {
  includeDeptTree?: number;
  taskNo: string;
}) {
  return requestClient.get<PsychologyAssessmentApi.AssessmentStatistics>(
    `/psychology/assessment-task/statistics`,
    { params },
  );
}

/** 获取任务风险等级统计信息 */
export function getAssessmentTaskRiskLevelStatistics(taskNo: string) {
  return requestClient.get<AssessmentTaskRiskLevelStatistics>(
    `/psychology/assessment-task/risk-level-statistics?taskNo=${taskNo}`,
  );
}

// ==================== 测评问卷结果 ====================
/** 问卷结果 */
export function getAssessmentQuestionnaireResult(id: string) {
  return requestClient.get<QuestionnaireResultVO>(
    `/psychology/questionnaire/get-result?id=${id}`,
  );
}

/** 测评报告结果 */
export function getAssessmentResult(id: string) {
  return requestClient.get<AssessmentResultVO>(
    '/psychology/assessment-result/get',
    { params: { id }, timeout: 15_000 },
  );
}
