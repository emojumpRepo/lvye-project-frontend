import type { AssessmentTask, AssessmentTaskParticipantStatus, Dimension } from '@vben/types'
import { http } from '@/http/http'

// 测评结果
export interface AssessmentResult {
  assessmentTaskNo: string
  id: number
  questionnaireId: number
  resultDataParsed: AssessmentResultItem[]
  score: number
  userId: number
}

// 测评结果数据
export interface AssessmentResultItem {
  dimensionCode: string
  dimensionName: string
  isAbnormal: number
  score: number
  studentComment: string
}

// 模块结果
export interface ModuleResultVO {
  id: number
  assessmentTaskNo: string
  userId: number
  scenarioSlotId: number
  slotKey: string
  slotName: string
  moduleScore: number
  riskLevel: number
  riskLevelDesc: string
  studentComment: string
  moduleDescription: string
  resultData: string
  resultDataParsed: any
  createTime: string
  dimensionResults: Dimension[]
}

/**
 * 获取我的测评任务列表
 */
export function getMyAssessmentTask() {
  return http.get<AssessmentTask[]>(
    '/psychology/assessment-task/my-tasks',
  )
}

/**
 * 查询测评任务详情
 */
export function getAssessmentTask(taskNo: string) {
  return http.get<AssessmentTask>(
    `/psychology/assessment-task/get?taskNo=${taskNo}`,
  )
}

/**
 * 开始测评
 */
export function startAssessment(taskNo: string) {
  return http.post<AssessmentTask>(
    `/psychology/assessment-participant/start?taskNo=${taskNo}`,
  )
}

/**
 * 获取测评参与状态
 */
export function getAssessmentParticipantStatus(taskNo: string) {
  return http.get<AssessmentTaskParticipantStatus>(
    `/psychology/assessment-participant/status?taskNo=${taskNo}`,
  )
}

/**
 * 获取测评结果
 */
export function getAssessmentResult(taskNo: string) {
  return http.get<AssessmentResult[]>(
    `/psychology/assessment-task/my-task-results?taskNo=${taskNo}`,
  )
}

/**
 * 轮询获取结果正在生成中的测评任务列表
 */
export function getGeneratingTasks() {
  return http.get<AssessmentTask[]>(
    '/psychology/assessment-task/generating-tasks',
  )
}

/**
 * 获取模块结果（根据任务编号和插槽ID）
 */
export function getModuleResult(taskNo: string, scenarioSlotId: number) {
  return http.get<ModuleResultVO>(
    `/psychology/assessment-task/module-result?taskNo=${taskNo}&scenarioSlotId=${scenarioSlotId}`,
  )
}
