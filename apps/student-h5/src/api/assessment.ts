import type { AssessmentTask, AssessmentTaskParticipantStatus, Dimension } from '@vben/types'
import { http } from '@/http/http'

// 问卷结果详情
export interface QuestionnaireResultDetail {
  id: number
  questionnaireId: number
  questionnaireName: string
  score: number
  riskLevel: number
  riskLevelDesc: string
  resultData: string
  resultDataParsed: any
  createTime: string
}

// App - 我的测评结果
export interface AppMyAssessmentResultVO {
  /** 测评结果ID */
  id: number
  /** 测评任务编号 */
  taskNo: string
  /** 参与者ID */
  participantId: number
  /** 维度编码 */
  dimensionCode: string
  /** 得分 */
  score: number
  /** 风险等级：1-无/低风险，2-轻度风险，3-中度风险，4-重度风险 */
  riskLevel: number
  /** 风险等级描述 */
  riskLevelDesc: string
  /** 综合风险等级 */
  combinedRiskLevel: number
  /** 建议/结论摘要 */
  suggestion: string
  /** 规则计算结果数据（JSON字符串） */
  resultData: string
  /** 规则计算结果数据（解析后的对象） */
  resultDataParsed: any
  /** 创建时间 */
  createTime: string
  /** 问卷结果列表（可选） */
  questionnaireResults?: QuestionnaireResultDetail[]
}

// 测评结果（向后兼容的别名）
export interface AssessmentResult extends AppMyAssessmentResultVO {
  assessmentTaskNo: string
  userId: number
  questionnaireId: number
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
 * @param taskNo 测评任务编号
 * @param includeQuestionnaireResults 是否包含问卷结果，默认true
 */
export function getAssessmentResult(taskNo: string, includeQuestionnaireResults: boolean = true) {
  return http.get<AppMyAssessmentResultVO>(
    `/psychology/assessment-task/my-task-results?taskNo=${taskNo}&includeQuestionnaireResults=${includeQuestionnaireResults}`,
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
