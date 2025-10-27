import icon_done from '#/static/icons/consulting/icon_done.svg';
import icon_guancha from '#/static/icons/consulting/icon_guancha.svg';
import icon_test from '#/static/icons/consulting/icon_test.svg';
import icon_zhiliao from '#/static/icons/consulting/icon_zhiliao.svg';
import icon_zixun from '#/static/icons/consulting/icon_zixun.svg';
import crisisContinuousIcon from '#/static/icons/crisis/crisis_continuous_icon.png';
import crisisCriticalIcon from '#/static/icons/crisis/crisis_critical_icon.png';
import crisisEvaluationIcon from '#/static/icons/crisis/crisis_evaluation_icon.png';
import crisisGeneralIcon from '#/static/icons/crisis/crisis_general_icon.png';
import crisisSevereIcon from '#/static/icons/crisis/crisis_severe_icon.png';
import { getDictObj } from '#/utils/dict';

export interface InterventionType {
  key: number;
  bgColor: string;
  color: string;
  description: string;
  icon: string;
  title: string;
}

export type TagType =
  | 'default'
  | 'error'
  | 'pending'
  | 'processing'
  | 'success'
  | 'warning';

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
    backgroundColor: '#F7F8FA',
    color: '#979899',
  },
  pink: {
    backgroundColor: '#FF418D14',
    color: '#FF418D',
  },
} as const;

/** 学生心理状态颜色配置 */
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
    backgroundColor: '#F7F8FA',
    borderColor: '#d9d9d9',
    color: '#979899',
  },
};

export const DICT_Value_COLOR_MAP: Record<number, TagType> = {
  1: 'success',
  2: 'processing',
  3: 'warning',
  4: 'error',
  5: 'default',
};

/** 获取标签颜色配置 */
export function getColorConfig({
  dictValue = 5,
  tagType = 'default',
  target = 'config',
}: {
  dictValue?: number | string;
  tagType?: TagType;
  target?: 'bg' | 'color' | 'config';
} = {}) {
  let resolvedTagType: TagType = tagType || 'default';

  if (dictValue) {
    resolvedTagType =
      DICT_Value_COLOR_MAP[Number(dictValue)] || resolvedTagType;
  }

  switch (target) {
    case 'bg': {
      return (
        TAG_TYPE[resolvedTagType].backgroundColor ||
        TAG_TYPE.default.backgroundColor
      );
    }
    case 'color': {
      return TAG_TYPE[resolvedTagType].color || TAG_TYPE.default.color;
    }
    case 'config': {
      return TAG_TYPE[resolvedTagType] || TAG_TYPE.default;
    }
    default: {
      return TAG_TYPE.default;
    }
  }
}

/** 根据字典获取标签样式 */
export function getTagByCategory(dictType: string, value: number | string) {
  const dictObj = getDictObj(dictType, value);

  if (!dictObj) {
    return null;
  }

  return {
    tagStyle: TAG_TYPE[dictObj.colorType as keyof typeof TAG_TYPE],
    label: dictObj.label,
    value: dictObj.value,
  };
}

/** 根据字典学生心理状态标签 */
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

// 问卷配置计算类型
export enum QUESTIONNAIRE_CONFIG_CALCULATE_TYPE {
  AGE_SEX_SCORE = 2, // 年龄性别与分数区间
  MOST_CHOOSE = 3, // 最多选择
  SCORE = 1, // 分数区间
}

// 咨询状态
export const COUNSELING_STATUS = {
  APPOINTMENT: 1, // 已预约
  CANCELED: 4, // 已取消
  CLOSED: 3, // 已闭环
  COMPLETED: 2, // 已完成
};

// 危机事件处理方式
export const INTERVENTION_PROCESS_METHOD = {
  INTERVIEW: 1, // 访谈评估
  QUESTIONNAIRE: 2, // 量表评估
  CONTINUTE: 3, // 持续关注
  RESLOVE: 4, // 直接解决
};

// 评估来源
export const EVALUATION_SOURCE = {
  COUNSELING: 1, // 访谈评估
  INTERVENTION: 2, // 危机干预
};

//  ===================== 危机干预模块UI配置 =====================

// 干预卡片类型配置
export const INTERVENTION_TYPE_MAP: InterventionType[] = [
  {
    key: 1,
    title: '危机干预中',
    description: '正在被干预的学生列表',
    icon: crisisEvaluationIcon,
    bgColor: '#DDE3FF',
    color: '#8D00F1',
  },
  {
    key: 2,
    title: '危机干预结案',
    description: '已结案但需要持续关注的学生',
    icon: crisisContinuousIcon,
    bgColor: '#D0E5FF',
    color: '#1966FF',
  },
  {
    key: 3,
    title: '一般风险(一类)',
    description: '需要关注但无需干预的学生',
    icon: crisisGeneralIcon,
    bgColor: '#CFFFF1',
    color: '#25D94C',
  },
  {
    key: 4,
    title: '严重风险(二类)',
    description: '需要定期咨询干预的学生',
    icon: crisisSevereIcon,
    bgColor: '#FFEAD2',
    color: '#FF9C05',
  },
  {
    key: 5,
    title: '重大风险(三类)',
    description: '需要紧急干预的学生',
    icon: crisisCriticalIcon,
    bgColor: '#FFDBD0',
    color: '#FF0831',
  },
];

/** 根据key获取干预配置 */
export function getInterventionTypeByDictValue(dictValue: number) {
  return INTERVENTION_TYPE_MAP.find((item) => item.key === dictValue);
}

// 后续处理建议
export const FOLLOW_UP_SUGGESTION = [
  {
    key: 1,
    title: '需要持续咨询',
    desc: '建议安排后续咨询会面',
    icon: icon_zixun,
  },
  {
    key: 2,
    title: '需要继续量表测评',
    desc: '建议安排后续咨询会面',
    icon: icon_test,
  },
  {
    key: 3,
    title: '持续观察',
    desc: '建议安排后续咨询会面',
    icon: icon_guancha,
  },
  {
    key: 4,
    title: '问题基本解决',
    desc: '建议安排后续咨询会面',
    icon: icon_done,
  },
  {
    key: 5,
    title: '转介专业治疗',
    desc: '建议安排后续咨询会面',
    icon: icon_zhiliao,
  },
];

/** 根据key获取后续处理建议 */
export function getFollowUpSuggestionByDictValue(dictValue: number) {
  return FOLLOW_UP_SUGGESTION.find((item) => item.key === dictValue);
}
