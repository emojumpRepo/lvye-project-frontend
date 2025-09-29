// 简化为只包含必要的类型定义和常量

/**
 * 计算策略类型
 */
export type CalculateStrategyType =
  | 'abnormalFactorAggregation'
  | 'customExpression'
  | 'dimensionInterlock';

/**
 * 异常因子叠加策略配置
 */
export interface AbnormalFactorAggregationConfig {
  thresholds: {
    description: string;
    level: string;
    range: { max: number; min: number };
    riskLevel: number;
  }[];
}

/**
 * 多维度联动策略配置
 */
export interface DimensionInterlockConfig {
  selfDimension: string;
  otherDimensions: string[];
  interlockTable: {
    condition: {
      otherLevelCounts: Record<string, number | { max: number; min: number }>;
      selfLevel: string;
    };
    result: {
      description: string;
      level: string;
      riskLevel: number;
    };
  }[];
}

/**
 * 场景配置规则接口
 */
export interface ScenarioConfigRule {
  id?: number;
  scenarioId: number;
  configName: string; // 配置名称
  ruleType: 0 | 1; // 0-等级方面规则，1-评语方面规则
  calculateFormula: string; // JSON字符串
  description?: string;
  level?: string;
  suggestions?: string;
  comment?: string;
  status: 0 | 1;
  creator?: string;
  createTime?: string;
  updater?: string;
  updateTime?: string;
  deleted?: 0 | 1;
}

/**
 * 表单数据接口
 */
export interface ScenarioConfigFormData {
  // 基础信息
  scenarioId?: number;
  configName: string;
  ruleType: 0 | 1;
  description?: string;
  level?: string;
  suggestions?: string;
  comment?: string;
  status: boolean;

  // 计算策略
  strategyType: CalculateStrategyType;

  // 异常因子叠加策略 - 使用默认预设配置
  useDefaultThresholds?: boolean;

  // 多维度联动策略
  selfDimension?: string;
  otherDimensions?: string[];

  // 自定义表达式
  customExpression?: string;
}
