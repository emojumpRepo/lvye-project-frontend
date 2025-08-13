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

const TAG_TYPE = {
  warning: {
    bg: '#FEAE3314',
    color: '#FF9C05',
  },
  success: {
    bg: '#14E77E14',
    color: '#04DC70',
  },
  pending: {
    bg: '#1966FF14',
    color: '#1966FF',
  },
  error: {
    bg: '#FF083114',
    color: '#FF0831',
  },
};

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
