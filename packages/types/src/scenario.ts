import type { QuestionnaireVO } from './questionnaire';

export interface AssessmentScenario {
  id?: number;
  code: string;
  name: string;
  description?: string; // 场景描述
  maxQuestionnaireCount?: number;
  frontendRoute?: string;
  isActive: boolean; // 修改为boolean类型，与后端保持一致
  metadataJson?: string;
  metadata?: ScenarioMetadata; // 场景扩展配置对象（前端解析获得）
  createTime?: Date;
  updateTime?: Date;
}

export interface AssessmentScenarioDetailed extends AssessmentScenario {
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
  metadata?: SlotMetadata; // 插槽扩展配置对象（前端解析获得）
  allowedQuestionnaireTypes?: string;
  frontendComponent?: string;
}

export interface AssessmentScenarioSlotVO extends AssessmentScenarioSlot {
  questionnaire?: QuestionnaireVO;
}

// 测评场景 扩展配置对象
export interface ScenarioMetadata {
  sceneImageUrl: string;
}

// 测评场景 插槽 扩展配置对象
export interface SlotMetadata {
  icon: string;
  position: {
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
    top?: number | string;
  };
  introConfig: {
    backgroundImageUrl: string;
    characterConfig: {
      description: string;
      imageUrl: string;
      name: string;
    };
    description: string;
  };
}
