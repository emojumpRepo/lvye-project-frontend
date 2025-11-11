import { RiskLevelEnum } from '@vben/types'
import { getDictObj } from '@/utils/dict'

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
    backgroundColor: '#D5596614',
    color: '#D55966FF',
  },
  default: {
    backgroundColor: '#F7F8FA',
    color: '#979899',
  },
  pink: {
    backgroundColor: '#FF418D14',
    color: '#FF418D',
  },
} as const

/** 根据字典获取标签样式 */
export function getTagByCategory(dictType: string, value: number | string) {
  const dictObj = getDictObj(dictType, value)

  if (!dictObj) {
    return null
  }

  // 确保 tagStyle 总是对象类型，如果 cssClass 是字符串则使用 default 样式
  let tagStyle: typeof TAG_TYPE[keyof typeof TAG_TYPE]
  if (typeof dictObj.cssClass === 'string') {
    // 如果 cssClass 是字符串，尝试从 TAG_TYPE 中获取，否则使用 default
    tagStyle = TAG_TYPE[dictObj.colorType as keyof typeof TAG_TYPE] || TAG_TYPE.default
  }
  else {
    tagStyle = dictObj.cssClass || TAG_TYPE[dictObj.colorType as keyof typeof TAG_TYPE] || TAG_TYPE.default
  }

  return {
    tagStyle,
    label: dictObj.label,
    value: dictObj.value,
  } as const
}

/** 地图模块icon映射 */
export const MAP_MODULE_MAP = {
  gym: {
    icon: 'hugeicons:champion',
  },
  hospital: {
    icon: 'lucide:hospital',
  },
  library: {
    icon: 'basil:book-open-outline',
  },
  dormitory: {
    icon: 'hugeicons:building-03',
  },
  teaching: {
    icon: 'streamline-ultimate:presentation-board-graph',
  },
}

/** 风险等级结果图片映射 */
export const RISK_LEVEL_RESULT_ICON_MAP = {
  [RiskLevelEnum.LOW]: '/student_h5/icon/icon_low.png',
  [RiskLevelEnum.MEDIUM]: '/student_h5/icon/icon_medium.png',
  [RiskLevelEnum.SEVERE]: '/student_h5/icon/icon_severe.png',
}
