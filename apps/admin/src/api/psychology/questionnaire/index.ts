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
