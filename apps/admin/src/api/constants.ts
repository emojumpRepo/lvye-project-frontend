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
  default: {
    backgroundColor: '#f7f8fa',
    color: '#1e1e1e',
  },
} as const;

const STUDENT_PSYCHOLOGICAL_STATUS = {
  success: {
    backgroundColor: '#E4FFF0',
    borderColor: '#8CFFC6',
    color: '#04DC70',
  },
  processing: {
    backgroundColor: '#1966FF14',
    borderColor: '#1966FF66',
    color: '#1966FF',
  },
  warning: {
    backgroundColor: '#FF9C0514',
    borderColor: '#FF9C0566',
    color: '#FF9C05',
  },
  error: {
    backgroundColor: '#FF08310D',
    borderColor: '#FF083166',
    color: '#FF0831',
  },
  pending: {
    backgroundColor: '#1E96FF14',
    borderColor: '#1E96FF66',
    color: '#1E96FF',
  },
  default: {
    backgroundColor: '#f7f8fa',
    borderColor: '#d9d9d9',
    color: '#1e1e1e',
  },
};

/** 获取标签样式 */
export function getTagByCategory(dictType: string, value: number | string) {
  const dictObj = getDictObj(dictType, value);
  if (!dictObj) {
    return null;
  }

  return {
    tagStyle:
      STUDENT_PSYCHOLOGICAL_STATUS[
        dictObj.colorType as keyof typeof STUDENT_PSYCHOLOGICAL_STATUS
      ],
    label: dictObj.label,
    value: dictObj.value,
  };
}

/** 学生心理状态标签 */
export function getStudentPsychologicalStatusTag(
  dictType: string,
  value: number,
) {
  const dictObj = getDictObj(dictType, value);

  const colorType =
    STUDENT_PSYCHOLOGICAL_STATUS[
      dictObj?.colorType as keyof typeof STUDENT_PSYCHOLOGICAL_STATUS
    ];

  return {
    colorConfig: {
      style: {
        backgroundColor:
          colorType?.backgroundColor ||
          STUDENT_PSYCHOLOGICAL_STATUS.default.backgroundColor,
        borderColor:
          colorType?.borderColor ||
          STUDENT_PSYCHOLOGICAL_STATUS.default.borderColor,
      },
      color: colorType?.color || STUDENT_PSYCHOLOGICAL_STATUS.default.color,
    },
    label: dictObj?.label || '未知',
    value: dictObj?.value || value,
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
