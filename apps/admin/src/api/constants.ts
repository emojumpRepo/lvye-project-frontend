/** 标签类型 */
export const TAG_TYPE = {
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
  processing: {
    bg: '#1998FF14',
    color: '#1998FF',
  },
  error: {
    bg: '#FF083114',
    color: '#FF0831',
  },
};

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

/** 心理状态标签 */
export const PSYCHOLOGICAL_STATUS_TAG_MAP = {
  1: {
    tagStyle: getTagStyle(TAG_TYPE.success),
    label: '正常',
  },
  2: {
    tagStyle: getTagStyle(TAG_TYPE.processing),
    label: '一般',
  },
  3: {
    tagStyle: getTagStyle(TAG_TYPE.pending),
    label: '观察中',
  },
  4: {
    tagStyle: getTagStyle(TAG_TYPE.warning),
    label: '严重',
  },
  5: {
    tagStyle: getTagStyle(TAG_TYPE.error),
    label: '重大',
  },
};

/** 毕业状态标签 */
export const GRADUATION_STATUS_TAG_MAP = {
  0: {
    tagStyle: getTagStyle(TAG_TYPE.success),
    label: '未毕业',
  },
  1: {
    tagStyle: getTagStyle(TAG_TYPE.pending),
    label: '已毕业',
  },
};

// 获取标签样式
export function getTagStyle(tag: { bg: string; color: string }) {
  return {
    backgroundColor: tag.bg,
    color: tag.color,
  };
}

// 获取状态标签
export function getStatusTag(status: string) {
  return STATUS_TAG_MAP[status as keyof typeof STATUS_TAG_MAP];
}

// 获取风险等级标签
export function getRiskLevelTag(riskLevel: string) {
  return RISK_LEVEL_TAG_MAP[riskLevel as keyof typeof RISK_LEVEL_TAG_MAP];
}

// 获取心理状态标签
export function getPsychologicalStatusTag(psychologicalStatus: number) {
  return PSYCHOLOGICAL_STATUS_TAG_MAP[
    psychologicalStatus as keyof typeof PSYCHOLOGICAL_STATUS_TAG_MAP
  ];
}

// 获取毕业状态标签
export function getGraduationStatusTag(graduationStatus: number) {
  return GRADUATION_STATUS_TAG_MAP[
    graduationStatus as keyof typeof GRADUATION_STATUS_TAG_MAP
  ];
}
