import { TAG_TYPE } from '#/api/constants';

export namespace QuestionnaireApi {
  export interface Questionnaire {
    id: number;
    name: string;
    class: string;
    studentId: string;
    status: string;
    completedTime: string;
    riskLevel: string;
  }
}

export const STATUS_TAG_MAP = {
  uncompleted: {
    tag: TAG_TYPE.warning,
    label: '未完成',
  },
  completed: {
    tag: TAG_TYPE.success,
    label: '已完成',
  },
  pending: {
    tag: TAG_TYPE.pending,
    label: '进行中',
  },
};

export const RISK_LEVEL_TAG_MAP = {
  normal: {
    tag: TAG_TYPE.success,
    label: '正常',
  },
  warning: {
    tag: TAG_TYPE.warning,
    label: '预警',
  },
  high: {
    tag: TAG_TYPE.error,
    label: '高危',
  },
};

// 获取状态标签
export function getStatusTag(status: string) {
  return STATUS_TAG_MAP[status as keyof typeof STATUS_TAG_MAP];
}

// 获取风险等级标签
export function getRiskLevelTag(riskLevel: string) {
  return RISK_LEVEL_TAG_MAP[riskLevel as keyof typeof RISK_LEVEL_TAG_MAP];
}
