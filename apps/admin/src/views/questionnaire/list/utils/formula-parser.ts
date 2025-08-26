import { QUESTIONNAIRE_CONFIG_CALCULATE_TYPE } from '#/api/constants';

/**
 * 解析计算公式JSON字符串为可读的配置对象
 * @param calculateFormula JSON字符串格式的计算公式
 * @param calculateType 计算类型
 * @returns 解析后的配置对象
 */
export function parseCalculateFormula(
  calculateFormula: string,
  calculateType: number,
) {
  if (!calculateFormula) return null;

  try {
    const formula = JSON.parse(calculateFormula);

    switch (calculateType) {
      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE: {
        // 年龄性别与分数区间: [{"sex": 1,"minAge": 8,"maxAge": 12,"minScore": 0,"maxScore": 10},...]
        if (Array.isArray(formula)) {
          const rules = formula.map((rule: any) => ({
            sex: rule.sex === 1 ? '男生' : '女生',
            ageRange: `${rule.minAge} - ${rule.maxAge} 岁`,
            scoreRange: `${rule.minScore} - ${rule.maxScore} 分`,
          }));

          return {
            type: '年龄性别与分数区间',
            config: { rules },
            description: `根据性别和年龄范围，对应不同的分数区间，同时在此范围内的年龄、性别和分数会应用此评分规则`,
          };
        }
        return null;
      }

      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE: {
        // 最多选择: {"questionScore":5,"chooseCount":5}
        return {
          type: '最多选择',
          config: {
            questionScore: formula.questionScore,
            chooseCount: formula.chooseCount,
          },
          description: `选择分数为 ${formula.questionScore} 的选项，选择次数 ≥ ${formula.chooseCount} 次时会应用此评分规则`,
        };
      }

      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE: {
        // 分数区间: {"minScore":0,"maxScore":27}
        return {
          type: '分数区间',
          config: {
            minScore: formula.minScore,
            maxScore: formula.maxScore,
          },
          description: `问卷分数范围为 ${formula.minScore} - ${formula.maxScore} 分，在此范围内的分数会应用此评分规则`,
        };
      }

      default: {
        return null;
      }
    }
  } catch (error) {
    console.error('解析计算公式失败:', error);
    return null;
  }
}

/**
 * 格式化计算公式为表单数据（用于编辑）
 * @param calculateFormula JSON字符串格式的计算公式
 * @param calculateType 计算类型
 * @returns 表单数据对象
 */
export function parseFormulaToFormData(
  calculateFormula: string,
  calculateType: number,
) {
  if (!calculateFormula) return {};

  try {
    const formula = JSON.parse(calculateFormula);

    switch (calculateType) {
      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE: {
        if (Array.isArray(formula)) {
          const maleRules: any[] = [];
          const femaleRules: any[] = [];

          formula.forEach((rule: any) => {
            if (rule.sex === 1) {
              maleRules.push(rule);
            } else if (rule.sex === 2) {
              femaleRules.push(rule);
            }
          });

          const maxRules = Math.max(maleRules.length, femaleRules.length);
          const ageSexRules = [];

          for (let i = 0; i < maxRules; i++) {
            const maleRule = maleRules[i];
            const femaleRule = femaleRules[i];

            ageSexRules.push({
              maleMinAge: maleRule?.minAge,
              maleMaxAge: maleRule?.maxAge,
              maleMinScore: maleRule?.minScore,
              maleMaxScore: maleRule?.maxScore,
              femaleMinAge: femaleRule?.minAge,
              femaleMaxAge: femaleRule?.maxAge,
              femaleMinScore: femaleRule?.minScore,
              femaleMaxScore: femaleRule?.maxScore,
              _id: Date.now() + i,
            });
          }

          return { ageSexRules };
        }
        return {};
      }

      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE: {
        return {
          questionScore: formula.questionScore,
          minThreshold: formula.chooseCount,
        };
      }

      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE: {
        return {
          minScore: formula.minScore,
          maxScore: formula.maxScore,
        };
      }

      default: {
        return {};
      }
    }
  } catch (error) {
    console.error('解析计算公式失败:', error);
    return {};
  }
}
