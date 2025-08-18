// 测评任务管理
import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

// 供前端表单使用的“基础信息”结构
export interface BasicInfo {
  description: string;
  name: string;
  timeRange: [any, any];
}

// 选择量表组件使用到的结构（来自模板接口做轻度映射）
export interface AssessmentType {
  id: string;
  time: string;
  questionCount: [number, number] | number;
  name: string;
  description: string;
  dimension: string[];
}

export interface SelectedAssessmentTargetItem {
  classId: number;
  className: string;
  studentIds: number[];
}

export enum AssessmentTargetType {
  PARENT = 2,
  STUDENT = 1,
}

export interface AssessmentTarget {
  type: AssessmentTargetType;
  selected: SelectedAssessmentTargetItem[];
}

// ================= 后端 VO（TypeScript 定义）=================

// 模板 DO（后端返回）
export interface AssessmentTemplateDO {
  templateId: number;
  name: string;
  link?: string;
  description?: string;
}

// 保存请求
export interface AssessmentTaskSaveReq {
  id?: number;
  taskNo?: string;
  taskName: string;
  scaleCode: string; // A/B 等
  targetAudience: number; // 1-学生，2-家长
  startline?: Date | string;
  deadline?: Date | string;
  deptIdList?: number[];
  userIdList?: number[];
}

// 分页请求
export interface AssessmentTaskPageReq extends PageParam {
  taskNo?: string;
  name?: string;
  scaleCode?: string;
  targetAudience?: number;
  status?: number;
  publishUserId?: number;
  deadline?: [Date, Date] | [string, string];
  createTime?: [Date, Date] | [string, string];
}

// 列表/详情返回（精简）
export interface AssessmentTaskVO {
  id: number;
  taskNo: string;
  name: string;
  scaleCode: string;
  targetAudience: number;
  status?: number;
  publishUserId?: number;
  publishUser?: string;
  deadline?: Date | string;
  createTime?: Date | string;
}

export interface AssessmentTaskRespVO extends AssessmentTaskSaveReq {
  id: number;
  status: number;
  createTime: string;
  updateTime: string;
}

export interface AssessmentTaskParticipantsReq {
  taskNo: string;
  userIds: number[];
}

export interface AssessmentTaskStatisticsResp {
  totalParticipants: number;
  completedParticipants: number;
  inProgressParticipants: number;
  notStartedParticipants: number;
  completionRate: number;
}

// ================= API =================

const BASE = '/psychology/assessment-task';

// 模板
export function getAssessmentTemplates() {
  return requestClient.get<AssessmentTemplateDO[]>(`${BASE}/get-exam-template`);
}

// 创建/更新/删除
export function createAssessmentTask(data: AssessmentTaskSaveReq) {
  return requestClient.post<number>(`${BASE}/create`, data);
}

export function updateAssessmentTask(data: AssessmentTaskSaveReq) {
  return requestClient.post<boolean>(`${BASE}/update`, data);
}

export function deleteAssessmentTask(taskNo: string) {
  return requestClient.post<boolean>(`${BASE}/delete`, null, {
    params: { taskNo },
  });
}

// 查询
export function getAssessmentTask(taskNo: string) {
  return requestClient.get<AssessmentTaskRespVO>(`${BASE}/get`, {
    params: { taskNo },
  });
}

export function getAssessmentTaskPage(params: AssessmentTaskPageReq) {
  return requestClient.get<PageResult<AssessmentTaskVO>>(`${BASE}/page`, {
    params,
  });
}

export function exportAssessmentTask(params: AssessmentTaskPageReq) {
  return requestClient.download(`${BASE}/export-excel`, { params });
}

// 发布/关闭
export function publishAssessmentTask(taskNo: string) {
  return requestClient.post<boolean>(`${BASE}/publish`, null, {
    params: { taskNo },
  });
}

export function closeAssessmentTask(taskNo: string) {
  return requestClient.post<boolean>(`${BASE}/close`, null, {
    params: { taskNo },
  });
}

// 参与者管理
export function addAssessmentParticipants(data: AssessmentTaskParticipantsReq) {
  return requestClient.post<boolean>(`${BASE}/add-participants`, data);
}

export function removeAssessmentParticipants(
  data: AssessmentTaskParticipantsReq,
) {
  return requestClient.post<boolean>(`${BASE}/remove-participants`, data);
}

// 统计
export function getAssessmentTaskStatistics(id: number) {
  return requestClient.get<AssessmentTaskStatisticsResp>(
    `${BASE}/statistics/${id}`,
  );
}

// 检查测评任务的名称重复性
export function checkAssessmentTaskName(taskName: string) {
  return requestClient.get<boolean>(`${BASE}/check-by-name`, {
    params: { taskName },
  });
}
