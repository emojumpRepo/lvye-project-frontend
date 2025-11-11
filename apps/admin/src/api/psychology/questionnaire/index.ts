import type { Question, QuestionnaireVO } from '@vben/types';

import { QUESTIONNAIRE_CONFIG_CALCULATE_TYPE } from '#/api/constants';
import { requestClient } from '#/api/request';

export interface QuestionnairePageReqVO {
  pageNo?: number;
  pageSize?: number;
  title?: string;
  syncStatus?: number;
  questionnaireType?: number;
  isOpen?: number;
  createTime?: string[];
}

export interface QuestionnaireConfigBaseVO {
  questionnaireId: number; // 问卷ID
  dimensionName: string; // 维度名称
  questionIndex: string; // 题目索引
  calculateType: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE; // 计算类型
  calculateFormula: string; // 计算公式
  description?: string; // 配置描述
  teacherComment: string; // 老师评语
  studentComment: string; // 学生评语
  isAbnormal: number; // 是否异常
  level: string; // 评级等级
}

export interface QuestionnaireConfigVO extends QuestionnaireConfigBaseVO {
  id: number; // 配置ID
  createTime: string; // 创建时间
}

export interface QuestionnaireConfigPageReqVO {
  pageNo?: number;
  pageSize?: number;
  questionnaireId?: number;
  dimensionName?: string;
  calculateType?: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE;
  isAbnormal?: number;
  createTime?: string[];
}

export interface QuestionnaireConfigPageResVO {
  list: QuestionnaireConfigVO[];
  total: number;
}

// =============== 问卷维度相关 ===============

export interface QuestionnaireDimensionVO {
  id?: number; // 主键
  questionnaireId: number; // 问卷ID
  dimensionName: string; // 维度名称
  colloquialAlias?: string; // 口语化别称
  dimensionCode: string; // 维度编码
  description?: string; // 描述
  calculateType?: number; // 兼容旧类型，可为空
  participateModuleCalc: boolean | number; // 是否参与模块计算（boolean或0/1）
  participateAssessmentCalc: boolean | number; // 是否参与测评计算（boolean或0/1）
  participateRanking: boolean | number; // 是否参与心理问题排行（boolean或0/1）
  showScore: boolean | number; // 是否展示测评得分（boolean或0/1）
  sortOrder?: number; // 排序
  status: number; // 状态（0：禁用，1：启用）
  createTime?: string; // 创建时间
  updateTime?: string; // 更新时间
}

export interface QuestionnaireDimensionPageReqVO {
  pageNo?: number;
  pageSize?: number;
  questionnaireId?: number;
  dimensionName?: string;
  status?: number;
  createTime?: string[];
}

export interface QuestionnaireDimensionPageResVO {
  list: QuestionnaireDimensionVO[];
  total: number;
}

// =============== 问卷结果配置相关（新架构） ===============

export interface QuestionnaireResultConfigVO {
  id?: number; // 配置ID
  dimensionId: number; // 维度ID（新架构）
  questionIndex: string; // 题目索引
  calculateType: number; // 计算类型
  calculateFormula: string; // 计算公式
  teacherComment: string; // 教师端评语
  studentComment: string; // 学生端评语
  isAbnormal: number; // 是否异常
  riskLevel?: number; // 风险等级：1-无/低风险，2-轻度风险，3-中度风险，4-重度风险
  level: string; // 等级：优秀、良好、一般、较差、很差
  description?: string; // 描述
  status: number; // 状态（0：禁用，1：启用）
  createTime?: string; // 创建时间
  updateTime?: string; // 更新时间
  matchOrder: number; // 匹配优先级
  isMultiHit?: number; // 是否可多命中（0：否，1：是）
}

export interface QuestionnaireResultConfigBaseVO {
  dimensionId: number;
  questionIndex: string;
  calculateType: number;
  calculateFormula: string;
  teacherComment: string;
  studentComment: string;
  isAbnormal: number;
  riskLevel?: number; // 风险等级：1-无/低风险，2-轻度风险，3-中度风险，4-重度风险
  level: string;
  description?: string;
  status?: number;
  matchOrder: number;
  isMultiHit?: number; // 是否可多命中（0：否，1：是）
}

export interface QuestionnaireResultConfigPageReqVO {
  pageNo?: number;
  pageSize?: number;
  dimensionId?: number;
  calculateType?: number;
  isAbnormal?: number;
  createTime?: string[];
}

export interface QuestionnaireResultConfigPageResVO {
  list: QuestionnaireResultConfigVO[];
  total: number;
}

export interface QuestionnaireResultVO {
  id?: number;
  assessmentResultId?: number;
  assessmentId?: number;
  babyId?: number;
  assessmentTitle?: string;
  babyName?: string;
  questionnaireTitle?: string;
  questionnaireId?: number;
  resultData?: string;
  answerData?: string;
  score?: number;
  level?: number;
  completionTime?: string;
}

export interface QuestionnaireResultPageReqVO {
  pageNo?: number;
  pageSize?: number;
  assessmentResultId?: number;
  assessmentId?: number;
  babyId?: number;
  questionnaireId?: number;
  assessmentTitle?: string;
  questionnaireTitle?: string;
  babyName?: string;
  level?: string;
  completionTime?: string[];
  createTime?: string[];
}

// ============== 问卷系统 ===============

export interface QuestionnaireQuestionReq {
  code: number;
  data: Question[];
  message: string;
  success: boolean;
}

/** 获取问卷题目 */
export function getAssessmentQuestionnaireQuestion(questionnaireId: string) {
  return requestClient.get<QuestionnaireQuestionReq>(
    '/psychology/questionnaire/survey-questions',
    {
      params: { questionnaireId },
    },
  );
}

// 创建问卷
export const createQuestionnaire = (data: QuestionnaireVO) => {
  return requestClient.post('/emojump/questionnaire/create', data);
};

// 更新问卷
export const updateQuestionnaire = (data: QuestionnaireVO) => {
  return requestClient.put('/psychology/questionnaire/update', data);
};

// 删除问卷
export const deleteQuestionnaire = (id: number) => {
  return requestClient.delete(`/psychology/questionnaire/delete?id=${id}`);
};

// 获取问卷详情
export const getQuestionnaire = (id: number) => {
  return requestClient.get<QuestionnaireVO>(
    `/psychology/questionnaire/get?id=${id}`,
  );
};

// 获取问卷列表
export const getQuestionnaireList = (params: QuestionnairePageReqVO) => {
  return requestClient.get<{
    list: QuestionnaireVO[];
    total: number;
  }>('/psychology/questionnaire/page', { params });
};

// 获取所有问卷列表
export const getAllQuestionnaireList = () => {
  return requestClient.get<QuestionnaireVO[]>('/emojump/questionnaire/all');
};

// 发布问卷
export const publishQuestionnaire = (params: {
  externalId: string;
  id: number;
  syncType: number;
}) => {
  return requestClient.post(`/psychology/questionnaire/publish`, params);
};

// 暂停问卷
export const pauseQuestionnaire = (params: {
  externalId: string;
  id: number;
  syncType: number;
}) => {
  return requestClient.post(`/psychology/questionnaire/pause`, params);
};

// 获取已发布问卷列表
export const getPublishedQuestionnaireList = (
  params: QuestionnairePageReqVO,
) => {
  return requestClient.get<{
    list: QuestionnaireVO[];
    total: number;
  }>('/emojump/questionnaire/published', { params });
};

// 测试问卷链接
export const testQuestionnaireLink = (id: number) => {
  return requestClient.post(`/emojump/questionnaire/test-link?id=${id}`);
};

// 同步最新问卷数据
export const syncQuestionnaireData = () => {
  return requestClient.post('/psychology/questionnaire/manual-sync');
};

// =============== 问卷配置 ===============

export const getQuestionnaireConfigPage = (
  params: QuestionnaireConfigPageReqVO,
) => {
  return requestClient.get<QuestionnaireConfigPageResVO>(
    '/psychology/questionnaire-result-config/page',
    { params },
  );
};

export const getQuestionnaireConfigList = (questionnaireId: number) => {
  return requestClient.get<QuestionnaireConfigPageResVO>(
    `/psychology/questionnaire-result-config/list-by-questionnaire?questionnaireId=${questionnaireId}`,
  );
};

export const getQuestionnaireConfig = (id: number) => {
  return requestClient.get<QuestionnaireConfigVO>(
    `/psychology/questionnaire-result-config/get?id=${id}`,
  );
};

export const createQuestionnaireConfig = (data: QuestionnaireConfigBaseVO) => {
  return requestClient.post(
    '/psychology/questionnaire-result-config/create',
    data,
  );
};

export const updateQuestionnaireConfig = (data: QuestionnaireConfigVO) => {
  return requestClient.put(
    '/psychology/questionnaire-result-config/update',
    data,
  );
};

export const deleteQuestionnaireConfig = (id: number) => {
  return requestClient.delete(
    `/psychology/questionnaire-result-config/delete?id=${id}`,
  );
};

// =============== 问卷维度 API ===============

export const getQuestionnaireDimensionPage = (
  params: QuestionnaireDimensionPageReqVO,
) => {
  return requestClient.get<QuestionnaireDimensionPageResVO>(
    '/psychology/questionnaire-dimension/page',
    { params },
  );
};

export const getQuestionnaireDimension = (id: number) => {
  return requestClient.get<QuestionnaireDimensionVO>(
    `/psychology/questionnaire-dimension/get?id=${id}`,
  );
};

export const createQuestionnaireDimension = (
  data: Omit<QuestionnaireDimensionVO, 'createTime' | 'id' | 'updateTime'>,
) => {
  return requestClient.post('/psychology/questionnaire-dimension/create', data);
};

export const updateQuestionnaireDimension = (
  data: QuestionnaireDimensionVO,
) => {
  return requestClient.put('/psychology/questionnaire-dimension/update', data);
};

export const deleteQuestionnaireDimension = (id: number) => {
  return requestClient.delete(
    `/psychology/questionnaire-dimension/delete?id=${id}`,
  );
};

// 根据测评场景插槽ID获得维度列表
export function getDimensionListByScenarioSlot(scenarioSlotId: number) {
  return requestClient.get<QuestionnaireDimensionVO[]>(
    '/psychology/questionnaire-dimension/list-by-scenario-slot',
    {
      params: { scenarioSlotId },
    },
  );
}

// =============== 问卷结果配置 API（新架构） ===============

export const getQuestionnaireResultConfigPage = (
  params: QuestionnaireResultConfigPageReqVO,
) => {
  return requestClient.get<QuestionnaireResultConfigPageResVO>(
    '/psychology/questionnaire-result-config/page',
    { params },
  );
};

export const getQuestionnaireResultConfig = (id: number) => {
  return requestClient.get<QuestionnaireResultConfigVO>(
    `/psychology/questionnaire-result-config/get?id=${id}`,
  );
};

export const createQuestionnaireResultConfig = (
  data: QuestionnaireResultConfigBaseVO,
) => {
  return requestClient.post(
    '/psychology/questionnaire-result-config/create',
    data,
  );
};

export const updateQuestionnaireResultConfig = (
  data: QuestionnaireResultConfigVO,
) => {
  return requestClient.put(
    '/psychology/questionnaire-result-config/update',
    data,
  );
};

export const deleteQuestionnaireResultConfig = (id: number) => {
  return requestClient.delete(
    `/psychology/questionnaire-result-config/delete?id=${id}`,
  );
};

// =============== 问卷结果 ===============
export const getQuestionnaireResultList = (
  params: QuestionnaireResultPageReqVO,
) => {
  return requestClient.get<{
    list: QuestionnaireResultVO[];
    total: number;
  }>('/emojump/questionnaire-result/page', { params });
};

// 获取问卷结果
export const getQuestionnaireResult = (id: number) => {
  return requestClient.get<QuestionnaireResultVO>(
    `/emojump/questionnaire-result/get?id=${id}`,
  );
};

// 获取问卷精简列表
export const getQuestionnaireListSimple = (supportIndependentUse = 1) => {
  return requestClient.get<QuestionnaireVO[]>(
    '/psychology/questionnaire/list-all-simple',
    {
      params: {
        supportIndependentUse,
      },
    },
  );
};

// 根据测评场景ID获取参与测评计算的维度列表
export const getAssessmentDimensionsByScenario = (scenarioId: number) => {
  return requestClient.get<QuestionnaireDimensionVO[]>(
    '/psychology/questionnaire-dimension/list-by-scenario',
    { params: { scenarioId } },
  );
};
