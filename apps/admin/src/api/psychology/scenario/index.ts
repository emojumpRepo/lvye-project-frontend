import type { PageParam, PageResult } from '@vben/request';
import type { QuestionnaireVO } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace PsychologyScenarioApi {
  /** 测评场景信息 */
  export interface AssessmentScenario {
    id?: number;
    code: string;
    name: string;
    maxQuestionnaireCount?: number;
    frontendRoute?: string;
    isActive: boolean; // 修改为boolean类型，与后端保持一致
    metadataJson?: string;
    createTime?: Date;
    updateTime?: Date;
  }

  export interface AssessmentScenarioWithSlotsAndQuestionnaires
    extends AssessmentScenario {
    slots?: AssessmentScenarioSlotVO[];
  }

  /** 测评场景槽位信息 */
  export interface AssessmentScenarioSlot {
    id?: number;
    scenarioId: number;
    slotKey: string;
    slotName: string;
    slotOrder: number;
    questionnaireId?: number;
    metadataJson?: string;
    allowedQuestionnaireTypes?: string;
    frontendComponent?: string;
  }

  export interface AssessmentScenarioSlotVO extends AssessmentScenarioSlot {
    questionnaire?: QuestionnaireVO;
  }

  /** 测评场景分页查询参数 */
  export interface AssessmentScenarioPageReq extends PageParam {
    code?: string;
    name?: string;
    isActive?: boolean;
  }

  /** 测评场景创建/更新请求 - 统一使用一个VO */
  export interface AssessmentScenarioVO {
    id?: number; // 创建时为空，更新时必填
    code: string;
    name: string;
    maxQuestionnaireCount?: number;
    frontendRoute?: string;
    isActive: boolean;
    metadataJson?: string;
    slots?: AssessmentScenarioSlot[];
  }
}

// ==================== 测评场景管理 ====================

/** 查询测评场景分页列表 */
export function getAssessmentScenarioPage(
  params: PsychologyScenarioApi.AssessmentScenarioPageReq,
) {
  return requestClient.get<
    PageResult<PsychologyScenarioApi.AssessmentScenario>
  >('/psychology/assessment-task/scenarios/page', { params });
}

/** 查询测评场景列表 */
export function getAssessmentScenarioList() {
  return requestClient.get<
    PsychologyScenarioApi.AssessmentScenarioWithSlotsAndQuestionnaires[]
  >('/psychology/assessment-task/scenarios');
}

/** 查询测评场景详情 */
export function getAssessmentScenario(id: number) {
  return requestClient.get<PsychologyScenarioApi.AssessmentScenario>(
    `/psychology/assessment-task/scenarios/${id}`,
  );
}

/** 创建测评场景 */
export function createAssessmentScenario(
  data: PsychologyScenarioApi.AssessmentScenarioVO,
) {
  return requestClient.post('/psychology/assessment-task/scenarios', data);
}

/** 更新测评场景 */
export function updateAssessmentScenario(
  data: PsychologyScenarioApi.AssessmentScenarioVO,
) {
  return requestClient.put('/psychology/assessment-task/scenarios', data);
}

/** 删除测评场景 */
export function deleteAssessmentScenario(id: number) {
  return requestClient.delete(`/psychology/assessment-task/scenarios/${id}`);
}

/** 获取场景槽位列表 */
export function getAssessmentScenarioSlots(scenarioId: number) {
  return requestClient.get<PsychologyScenarioApi.AssessmentScenarioSlot[]>(
    `/psychology/assessment-task/scenarios/${scenarioId}/slots`,
  );
}
