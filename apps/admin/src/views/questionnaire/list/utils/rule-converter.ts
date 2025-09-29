/**
 * 心理测评规则转换工具
 * 将前端表单数据转换为JSON表达式格式，并支持反向解析
 */

export interface RuleOutput {
  level?: string;
  isAbnormal?: boolean;
  message?: string;
  description?: string;
  suggestions?: string;
  teacherComment?: string;
  studentComments?: string[];
}

export interface AgeSexScoreCondition {
  sex: number; // 0-不限, 1-男, 2-女
  minAge: number;
  maxAge: number;
  minScore: number;
  maxScore: number;
}

export interface ScoreRange {
  minScore: number;
  maxScore: number;
  level?: string;
  isAbnormal?: boolean;
}

export interface QuestionCondition {
  questionNumber: number;
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ne';
  value: number;
}

export const RuleConverter = {
  /**
   * 转换年龄性别分数规则
   */
  convertAgeSexScoreRule(formData: {
    conditions: AgeSexScoreCondition[];
    resultConfig?: RuleOutput;
  }) {
    const { conditions, resultConfig } = formData;

    if (!conditions || conditions.length === 0) {
      throw new Error('至少需要一个匹配条件');
    }

    // 构建条件数组，直接使用原有的JSON格式（兼容性）
    const jsonConditions = conditions.map((condition) => ({
      sex: condition.sex,
      minAge: condition.minAge,
      maxAge: condition.maxAge,
      minScore: condition.minScore,
      maxScore: condition.maxScore,
    }));

    return {
      type: 'age_sex_score_conditions',
      conditions: jsonConditions,
      result: {
        level: resultConfig?.level || '',
        isAbnormal: resultConfig?.isAbnormal || false,
        message: resultConfig?.message || '',
        teacherComment: resultConfig?.teacherComment || '',
        studentComments: resultConfig?.studentComments || [],
      },
    };
  },

  /**
   * 转换分数区间规则
   */
  convertScoreRangeRule(formData: { ranges: ScoreRange[] }) {
    const { ranges } = formData;

    if (!ranges || ranges.length === 0) {
      throw new Error('至少需要一个分数区间');
    }

    // 兼容原有的分数区间格式
    return {
      type: 'score_ranges',
      ranges: ranges.map((range) => ({
        minScore: range.minScore,
        maxScore: range.maxScore,
        level: range.level || '',
        isAbnormal: range.isAbnormal || false,
      })),
    };
  },

  /**
   * 转换最多选择规则
   */
  convertMostChooseRule(formData: {
    chooseCount: number;
    questionScore: number;
    resultConfig?: RuleOutput;
  }) {
    const { questionScore, chooseCount, resultConfig } = formData;

    // 兼容原有的最多选择格式
    return {
      type: 'most_choose',
      questionScore,
      chooseCount,
      result: {
        level: resultConfig?.level || '',
        isAbnormal: resultConfig?.isAbnormal || false,
        message: resultConfig?.message || '',
        teacherComment: resultConfig?.teacherComment || '',
        studentComments: resultConfig?.studentComments || [],
      },
    };
  },

  /**
   * 转换单题条件规则
   */
  convertSingleQuestionRule(formData: {
    conditions: QuestionCondition[];
    logic: 'and' | 'or';
    resultConfig?: RuleOutput;
  }) {
    const { conditions, logic, resultConfig } = formData;

    if (!conditions || conditions.length === 0) {
      throw new Error('至少需要一个题目条件');
    }

    const ruleConditions = conditions.map((condition) => ({
      type: 'cmp',
      field: `Q${condition.questionNumber}`,
      operator: condition.operator,
      value: condition.value,
    }));

    if (ruleConditions.length === 1) {
      return {
        ...ruleConditions[0],
        on_match: {
          score: `{{Q${conditions[0].questionNumber}}}`,
          level: resultConfig?.level || '',
          isAbnormal: resultConfig?.isAbnormal || false,
          matched_condition: `Q${conditions[0].questionNumber} ${this.getOperatorText(conditions[0].operator)} ${conditions[0].value}`,
          teacherComment: resultConfig?.teacherComment || '',
          studentComments: resultConfig?.studentComments || [],
        },
      };
    }

    return {
      type: logic || 'or',
      conditions: ruleConditions,
      on_match: {
        score: '{{totalScore}}',
        level: resultConfig?.level || '',
        isAbnormal: resultConfig?.isAbnormal || false,
        matched_condition: conditions
          .map(
            (c) =>
              `Q${c.questionNumber} ${this.getOperatorText(c.operator)} ${c.value}`,
          )
          .join(logic === 'and' ? ' AND ' : ' OR '),
        teacherComment: resultConfig?.teacherComment || '',
        studentComments: resultConfig?.studentComments || [],
      },
    };
  },

  /**
   * 转换多题求和规则
   */
  convertMultiQuestionSumRule(formData: {
    operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
    questionNumbers: string;
    resultConfig?: RuleOutput & { description?: string };
    threshold: number;
  }) {
    const { questionNumbers, operator, threshold, resultConfig } = formData;

    const questionList = questionNumbers
      .split(',')
      .map((num) => Number.parseInt(num.trim()))
      .filter((num) => !isNaN(num));

    if (questionList.length === 0) {
      throw new Error('请输入有效的题目编号');
    }

    return {
      type: 'sum',
      fields: questionList.map((num) => `Q${num}`),
      operator: operator || 'gte',
      threshold,
      on_match: {
        score: '{{sumResult}}',
        level: resultConfig?.level || '',
        description: resultConfig?.description || '',
        isAbnormal: resultConfig?.isAbnormal || false,
        matched_condition: `题目${questionNumbers}求和${this.getOperatorText(operator)}${threshold}`,
        teacherComment: resultConfig?.teacherComment || '',
        studentComments: resultConfig?.studentComments || [],
      },
    };
  },

  /**
   * 转换选项内容匹配规则
   */
  convertOptionContentRule(formData: {
    collectType: 'multiple' | 'single';
    questionNumber: number;
    resultConfig?: RuleOutput & { description?: string };
    scoreThreshold: number;
  }) {
    const { questionNumber, scoreThreshold, collectType, resultConfig } =
      formData;

    return {
      type: 'cmp',
      field: `Q${questionNumber}`,
      operator: 'gte',
      value: scoreThreshold,
      on_match: {
        score: `{{Q${questionNumber}}}`,
        level: resultConfig?.level || '',
        isAbnormal: resultConfig?.isAbnormal || false,
        collected_options:
          collectType === 'multiple'
            ? `{{Q${questionNumber}.optionTexts}}`
            : `{{Q${questionNumber}.optionText}}`,
        description: `${resultConfig?.description || ''}{{Q${questionNumber}.optionText}}`,
        matched_condition: `Q${questionNumber}分数≥${scoreThreshold}`,
        teacherComment: resultConfig?.teacherComment || '',
        studentComments: resultConfig?.studentComments || [],
      },
    };
  },

  /**
   * 自定义JSON规则（直接解析）
   */
  convertCustomJsonRule(formData: {
    description?: string;
    jsonExpression: string;
  }) {
    try {
      const parsed = JSON.parse(formData.jsonExpression);
      return {
        ...parsed,
        meta: {
          ...parsed.meta,
          description: formData.description,
          custom: true,
        },
      };
    } catch (error: any) {
      throw new Error(`JSON格式错误: ${error?.message || '未知错误'}`);
    }
  },

  /**
   * 主转换方法
   */
  convert(ruleType: string, formData: any) {
    switch (ruleType) {
      case 'age_sex_score': {
        return this.convertAgeSexScoreRule(formData);
      }
      case 'custom_json': {
        return this.convertCustomJsonRule(formData);
      }
      case 'most_choose': {
        return this.convertMostChooseRule(formData);
      }
      case 'multi_question_sum': {
        return this.convertMultiQuestionSumRule(formData);
      }
      case 'option_content': {
        return this.convertOptionContentRule(formData);
      }
      case 'score_range': {
        return this.convertScoreRangeRule(formData);
      }
      case 'single_question': {
        return this.convertSingleQuestionRule(formData);
      }
      default: {
        throw new Error(`未知的规则类型: ${ruleType}`);
      }
    }
  },

  /**
   * 反向解析：从JSON表达式恢复表单数据
   */
  parseFromJson(jsonExpression: string): { formData: any; ruleType: string } {
    try {
      const parsed = JSON.parse(jsonExpression);

      // 检测规则类型
      switch (parsed.type) {
        case 'age_sex_score_conditions': {
          return {
            ruleType: 'age_sex_score',
            formData: {
              conditions: parsed.conditions,
              resultConfig: parsed.result,
            },
          };
        }
        case 'most_choose': {
          return {
            ruleType: 'most_choose',
            formData: {
              questionScore: parsed.questionScore,
              chooseCount: parsed.chooseCount,
              resultConfig: parsed.result,
            },
          };
        }
        case 'score_ranges': {
          return {
            ruleType: 'score_range',
            formData: {
              ranges: parsed.ranges,
            },
          };
        }
        case 'sum': {
          return {
            ruleType: 'multi_question_sum',
            formData: {
              questionNumbers:
                parsed.fields
                  ?.map((f: string) => f.replace('Q', ''))
                  .join(',') || '',
              operator: parsed.operator,
              threshold: parsed.threshold,
              resultConfig: parsed.on_match,
            },
          };
        }
        default: {
          if (parsed.meta?.custom) {
            return {
              ruleType: 'custom_json',
              formData: {
                jsonExpression: JSON.stringify(parsed, null, 2),
                description: parsed.meta?.description || '',
              },
            };
          } else {
            // 默认作为自定义JSON处理
            return {
              ruleType: 'custom_json',
              formData: {
                jsonExpression,
                description: '',
              },
            };
          }
        }
      }
    } catch (error: any) {
      throw new Error(`解析JSON表达式失败: ${error?.message || '未知错误'}`);
    }
  },

  /**
   * 验证JSON表达式
   */
  validateJsonExpression(jsonStr: string) {
    try {
      const json = JSON.parse(jsonStr);
      return this.validateRuleStructure(json);
    } catch (error) {
      return {
        valid: false,
        error: `JSON格式错误: ${(error as Error)?.message || '未知错误'}`,
      };
    }
  },

  /**
   * 验证规则结构
   */
  validateRuleStructure(rule: any): { error?: string; valid: boolean } {
    // 基本结构验证
    if (typeof rule !== 'object' || rule === null) {
      return {
        valid: false,
        error: '规则必须是一个对象',
      };
    }

    // 递归验证子条件
    if (rule.conditions && Array.isArray(rule.conditions)) {
      for (const condition of rule.conditions) {
        if (typeof condition === 'object' && condition !== null) {
          const result = this.validateRuleStructure(condition);
          if (!result.valid) {
            return result;
          }
        }
      }
    }

    return { valid: true };
  },

  /**
   * 获取操作符的文本表示
   */
  getOperatorText(operator: string) {
    const map: Record<string, string> = {
      gte: '≥',
      gt: '>',
      eq: '=',
      lte: '≤',
      lt: '<',
      ne: '≠',
    };
    return map[operator] || operator;
  },

  /**
   * 生成规则描述文本
   */
  generateRuleDescription(ruleType: string, formData: any): string {
    switch (ruleType) {
      case 'age_sex_score': {
        if (!formData.conditions?.length) return '请配置年龄性别条件';
        return formData.conditions
          .map((c: AgeSexScoreCondition) => {
            const sexText =
              c.sex === 1 ? '男性' : (c.sex === 2 ? '女性' : '不限性别');
            return `${sexText}, ${c.minAge}-${c.maxAge}岁, 分数${c.minScore}-${c.maxScore}`;
          })
          .join(' OR ');
      }

      case 'custom_json': {
        return '自定义JSON规则';
      }

      case 'most_choose': {
        return `选择分数为${formData.questionScore}的题目数量≥${formData.chooseCount}`;
      }

      case 'multi_question_sum': {
        return `题目${formData.questionNumbers}求和${this.getOperatorText(formData.operator)}${formData.threshold}`;
      }

      case 'option_content': {
        return `收集Q${formData.questionNumber}中分数≥${formData.scoreThreshold}的选项内容`;
      }

      case 'score_range': {
        if (!formData.ranges?.length) return '请配置分数区间';
        return `分数区间：${formData.ranges
          .map(
            (r: ScoreRange) =>
              `${r.minScore}-${r.maxScore}(${r.level || '未设置等级'})`,
          )
          .join(', ')}`;
      }

      case 'single_question': {
        if (!formData.conditions?.length) return '请配置题目条件';
        return formData.conditions
          .map(
            (c: QuestionCondition) =>
              `Q${c.questionNumber} ${this.getOperatorText(c.operator)} ${c.value}`,
          )
          .join(formData.logic === 'and' ? ' AND ' : ' OR ');
      }

      default: {
        return '未知规则类型';
      }
    }
  },
};
