export type RiskLevel = 1 | 2 | 3 | 4;

export interface DimensionResultBrief {
  dimensionId?: number;
  dimensionCode?: string;
  dimensionName?: string;
  riskLevel?: null | number | RiskLevel;
  score?: null | number;
}

export interface ModuleRuleContext {
  /** 当前插槽下已完成的维度结果（来自问卷结果聚合） */
  dimensions: DimensionResultBrief[];
}

export interface ModuleResultEvalOutput {
  hit: boolean;
  riskLevel?: RiskLevel;
  level?: string;
  studentComment?: string;
  teacherComment?: string;
  moduleDescription?: string;
}

/**
 * 规则1：参与模块计算的维度 risk_level 不存在 3 或 4 时命中
 */
export function ruleNoHighRisk(context: ModuleRuleContext): boolean {
  return !context.dimensions.some(
    (d) => Number(d.riskLevel) === 3 || Number(d.riskLevel) === 4,
  );
}

/**
 * 规则2：支持规则级的关联维度配置并判断 risk_level 组合
 * 例如：维度1、3、4、8、9 任一为1 且 维度7为2 且 未出现3、4
 */
export function ruleAssociatedDimensions(
  context: ModuleRuleContext,
  opts: {
    anyOfLevel1: (number | string)[];
    dimLevel2: number | string; // 指定维度要求为2
  },
): boolean {
  const getByKey = (key: number | string) =>
    context.dimensions.find(
      (d) =>
        String(d.dimensionCode || d.dimensionId || d.dimensionName) ===
        String(key),
    );

  const has34 = context.dimensions.some(
    (d) => Number(d.riskLevel) === 3 || Number(d.riskLevel) === 4,
  );
  if (has34) return false;

  const anyIs1 = opts.anyOfLevel1.some(
    (k) => Number(getByKey(k)?.riskLevel) === 1,
  );
  const targetIs2 = Number(getByKey(opts.dimLevel2)?.riskLevel) === 2;
  return anyIs1 && targetIs2;
}

/**
 * 规则3：多个维度联动
 * - 第一个维度结果为无极端行为(1) 且 其他两个结果中不存在中度(3)/重度(4)：未发现显著身心问题
 * - 第一个为轻度(2)或中度(3)极端行为 OR 其他两个结果存在中度(3)但不存在重度(4)：存在部分身心问题
 * - 若以上三个结果中存在重度(4)：存在一定风险的身心健康问题
 */
export function ruleMultiLinkage(
  dims: Array<DimensionResultBrief | undefined>,
): { conclusion: 'good' | 'partial' | 'risk'; riskLevel: RiskLevel } {
  const [d1, d2, d3] = dims;
  const l1 = Number(d1?.riskLevel || 0);
  const l2 = Number(d2?.riskLevel || 0);
  const l3 = Number(d3?.riskLevel || 0);

  const hasSevere = [l1, l2, l3].includes(4);
  const hasModerate = [l1, l2, l3].includes(3);

  if (hasSevere) return { conclusion: 'risk', riskLevel: 4 };

  if (l1 === 1 && !(hasModerate || hasSevere))
    return { conclusion: 'good', riskLevel: 1 };

  if (l1 === 2 || l1 === 3 || (hasModerate && !hasSevere))
    return { conclusion: 'partial', riskLevel: 2 as RiskLevel };

  return { conclusion: 'good', riskLevel: 1 };
}

/**
 * 从候选学生评语数组中随机取一条
 */
export function pickRandomComment(comments: string[] = []): string | undefined {
  if (comments.length === 0) return undefined;
  const idx = Math.floor(Math.random() * comments.length);
  return comments[idx];
}
