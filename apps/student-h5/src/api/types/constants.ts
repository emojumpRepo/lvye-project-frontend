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
} as const

/** 根据字典获取标签样式 */
export function getTagByCategory(dictType: string, value: number | string) {
  const dictObj = getDictObj(dictType, value)

  if (!dictObj) {
    return null
  }

  return {
    tagStyle: dictObj.cssClass || TAG_TYPE[dictObj.colorType as keyof typeof TAG_TYPE],
    label: dictObj.label,
    value: dictObj.value,
  } as const
}
