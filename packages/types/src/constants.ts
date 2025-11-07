/** 性别枚举 */
export enum GenderEnum {
  FEMALE = 2,
  MALE = 1,
}

/** 风险等级枚举 */
export enum RiskLevelEnum {
  LOW = 1, // 无/低风险
  MEDIUM = 3, // 中度风险
  Mild = 2, // 轻度风险
  NONE = 0, // 不参与风险评级
  SEVERE = 4, // 重度风险
}

// 风险等级选项
export const riskLevelOptions = [
  { label: '不参与风险评级', value: RiskLevelEnum.NONE },
  { label: '无/低风险', value: RiskLevelEnum.LOW },
  { label: '轻度风险', value: RiskLevelEnum.Mild },
  { label: '中度风险', value: RiskLevelEnum.MEDIUM },
  { label: '重度风险', value: RiskLevelEnum.SEVERE },
];

/** 特殊等级 */
export const specialLevel = [
  '存在抑郁核心症状',
  '存在自伤意念',
  '抑郁核心症状相关选项得分异常',
];
