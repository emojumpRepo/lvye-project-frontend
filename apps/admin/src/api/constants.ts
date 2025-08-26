import { getDictObj } from '#/utils/dict';

/** 标签类型 */
export const TAG_TYPE = {
  warning: {
    backgroundColor: '#FEAE3314',
    color: '#FF9C05',
  },
  success: {
    backgroundColor: '#14E77E14',
    color: '#04DC70',
  },
  processing: {
    backgroundColor: '#1966FF14',
    color: '#1966FF',
  },
  pending: {
    backgroundColor: '#1998FF14',
    color: '#1998FF',
  },
  error: {
    backgroundColor: '#FF083114',
    color: '#FF0831',
  },
} as const;

/** 获取标签样式 */
export function getTagByCategory(category: string, value: number | string) {
  const dictObj = getDictObj(category, value);
  if (!dictObj) {
    return null;
  }
  return {
    tagStyle: TAG_TYPE[dictObj.colorType as keyof typeof TAG_TYPE],
    label: dictObj.label,
    value: dictObj.value,
  };
}

/** 状态标签 */
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

/** 风险等级标签 */
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

// 问卷配置计算类型
export enum QUESTIONNAIRE_CONFIG_CALCULATE_TYPE {
  AGE_SEX_SCORE = 2, // 年龄性别与分数区间
  MOST_CHOOSE = 3, // 最多选择
  SCORE = 1, // 分数区间
}
