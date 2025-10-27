<script setup lang="ts">
import type { QuestionnaireVO } from '@vben/types';

import type {
  QuestionnaireDimensionVO,
  QuestionnaireResultConfigBaseVO,
  QuestionnaireResultConfigVO,
} from '#/api/psychology/questionnaire/index';

import { computed, nextTick, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CirclePlus } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  RadioButton,
  RadioGroup,
  Row,
  Select,
  Switch,
  Tooltip,
} from 'ant-design-vue';

import { QUESTIONNAIRE_CONFIG_CALCULATE_TYPE } from '#/api/constants';
import {
  createQuestionnaireResultConfig,
  updateQuestionnaireResultConfig,
} from '#/api/psychology/questionnaire/index';

import { formatQuestionIndex } from '../utils/question-index';

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

// 规则类型配置（生成符合后端的基础表达式）
const ruleTypes = [
  {
    value: 'score_range',
    label: '分数区间',
    description: '根据总分区间进行匹配',
    icon: '📊',
  },
  {
    value: 'seven_factors_score_range',
    label: '七因子总分范围',
    description: '后端按七因子计算总分，前端配置总分区间',
    icon: '7️⃣',
  },
  {
    value: 'age_sex_score',
    label: '年龄性别与分数',
    description: '根据用户年龄、性别和总分进行匹配',
    icon: '👥',
  },
  {
    value: 'most_choose',
    label: '最多选择',
    description: '根据特定分数的选择次数进行匹配',
    icon: '✅',
  },
  {
    value: 'single_question',
    label: '单题条件',
    description: '基于单个题目的分数进行判断',
    icon: '❓',
  },
  {
    value: 'multi_question_sum',
    label: '多题求和',
    description: '多个题目分数求和后与阈值比较',
    icon: '🧮',
  },
  {
    value: 'multi_question_avg',
    label: '多题均值范围',
    description: '多个题目均值落在指定区间',
    icon: '📐',
  },
  {
    value: 'question_filter_concat',
    label: '题干拼接(筛选)',
    description: '按分数条件筛选关联题并拼接题干为等级',
    icon: '🧾',
  },
  {
    value: 'part_sum_compare',
    label: '分部分总分对比',
    description: '各部分求和命区间，再按严重度/同分段比较输出',
    icon: '🧩',
  },
  {
    value: 'custom_json',
    label: '自定义表达式',
    description: '直接编写符合后端的JSON表达式',
    icon: '💻',
  },
];

const selectedConfig = ref<null | QuestionnaireResultConfigVO>(null);
const selectedDimension = ref<null | QuestionnaireDimensionVO>(null);
const selectedQuestionnaire = ref<null | QuestionnaireVO>(null);

// 表单状态
const currentRuleType = ref<string>('score_range');
const ruleFormData = ref<any>({});
const resultConfig = ref({
  level: '',
  isAbnormal: false,
  riskLevel: undefined as number | undefined,
  message: '',
  teacherComment: '',
  studentComments: [] as string[],
  questionIndex: [] as string[],
  matchOrder: 1 as number,
  isMultiHit: 0 as number,
});

// 创建主弹窗
const [FormDialog, formDialogApi] = useVbenModal({
  class: 'w-[80%]',
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = formDialogApi.getData<{
        dimension: null | QuestionnaireDimensionVO;
        questionnaire: null | QuestionnaireVO;
        selectedConfig?: null | QuestionnaireResultConfigVO;
      }>();

      if (data) {
        selectedConfig.value = data.selectedConfig || null;
        selectedDimension.value = data.dimension || null;
        selectedQuestionnaire.value = data.questionnaire || null;

        initFormData();

        formDialogApi.setState({
          title: selectedConfig.value ? '编辑结果配置' : '新增结果配置',
        });
      }
    }
  },
});

const formRef = ref();
// 初始化时避免 watch 重置回显数据
const isInitializing = ref(false);

// 初始化表单数据
function initFormData() {
  isInitializing.value = true;
  if (selectedConfig.value) {
    // 编辑模式：从现有配置解析
    const config = selectedConfig.value;

    resultConfig.value = {
      level: config.level || '',
      isAbnormal: config.isAbnormal === 1,
      riskLevel: config.riskLevel,
      message: config.description || '',
      teacherComment: config.teacherComment || '',
      studentComments: config.studentComment
        ? parseStudentComment(config.studentComment)
        : ([] as string[]),
      questionIndex: config.questionIndex
        ? config.questionIndex.split(',')
        : ([] as string[]),
      matchOrder: config.matchOrder,
      isMultiHit: (config as any).isMultiHit ?? 0,
    };

    // 优先基于公式识别规则类型，避免 calculateType 错配导致回显错误
    if (config.calculateFormula) {
      try {
        const formula = JSON.parse(config.calculateFormula);
        const detectedType = detectRuleTypeFromFormula(formula);
        if (detectedType) {
          currentRuleType.value = detectedType;
          ruleFormData.value = parseFormulaByType(formula, detectedType);
          nextTick(() => (isInitializing.value = false));
          return;
        }
      } catch {
        // 忽略解析错误，交由后续逻辑处理
      }
    }

    // 根据原有计算类型确定规则类型
    switch (config.calculateType) {
      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE: {
        currentRuleType.value = 'age_sex_score';
        if (config.calculateFormula) {
          try {
            const formula = JSON.parse(config.calculateFormula);
            ruleFormData.value = {
              conditions: parseAgeSexRuleFormula(formula),
            };
          } catch {
            ruleFormData.value = {
              conditions: [
                { sex: 0, minAge: 0, maxAge: 100, minScore: 0, maxScore: 100 },
              ],
            };
          }
        }

        break;
      }
      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE: {
        currentRuleType.value = 'most_choose';
        if (config.calculateFormula) {
          try {
            const formula = JSON.parse(config.calculateFormula);
            ruleFormData.value = parseMostChooseFormula(formula);
          } catch {
            ruleFormData.value = { questionScore: 1, chooseCount: 1 };
          }
        }

        break;
      }
      case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE: {
        currentRuleType.value = 'score_range';
        if (config.calculateFormula) {
          try {
            const formula = JSON.parse(config.calculateFormula);
            ruleFormData.value = parseScoreRangeFormula(formula, config);
          } catch {
            ruleFormData.value = {
              ranges: [
                { minScore: 0, maxScore: 100, level: '', isAbnormal: false },
              ],
            };
          }
        }

        break;
      }
      default: {
        // 尝试从JSON判断规则类型
        if (config.calculateFormula) {
          try {
            const formula = JSON.parse(config.calculateFormula);
            const detectedType = detectRuleTypeFromFormula(formula);

            if (detectedType) {
              currentRuleType.value = detectedType;
              ruleFormData.value = parseFormulaByType(formula, detectedType);
            } else {
              // 无法识别，使用自定义JSON
              currentRuleType.value = 'custom_json';
              ruleFormData.value = {
                jsonExpression: config.calculateFormula,
                description: '',
              };
            }
          } catch {
            // JSON解析失败，使用自定义JSON
            currentRuleType.value = 'custom_json';
            ruleFormData.value = {
              jsonExpression: config.calculateFormula || '',
              description: '',
            };
          }
        } else {
          // 没有公式，使用自定义JSON
          currentRuleType.value = 'custom_json';
          ruleFormData.value = {
            jsonExpression: '',
            description: '',
          };
        }
      }
    }
  } else {
    // 新建模式
    initDefaultForm();
  }
  nextTick(() => (isInitializing.value = false));
}

// 解析年龄性别公式
function parseAgeSexFormula(formula: any[]) {
  const conditions: any[] = [];

  for (let i = 0; i < formula.length; i += 2) {
    const maleRule = formula[i];
    const femaleRule = formula[i + 1];

    if (maleRule && femaleRule && maleRule.sex === 1 && femaleRule.sex === 2) {
      conditions.push({
        sex: 0, // 不限性别，界面上分别配置男女
        minAge: maleRule.minAge,
        maxAge: maleRule.maxAge,
        minScore: maleRule.minScore,
        maxScore: maleRule.maxScore,
        // 女性配置存储在额外字段中
        femaleMinAge: femaleRule.minAge,
        femaleMaxAge: femaleRule.maxAge,
        femaleMinScore: femaleRule.minScore,
        femaleMaxScore: femaleRule.maxScore,
      });
    }
  }

  return conditions.length > 0
    ? conditions
    : [{ sex: 0, minAge: 0, maxAge: 100, minScore: 0, maxScore: 100 }];
}

// 解析分数区间公式
function parseScoreRangeFormula(formula: any, config: any) {
  // 处理新格式：{"range": {"target": "totalScore"|"sevenFactors.totalScore", "min": 0, "max": 21}}
  if (
    formula.range &&
    (formula.range.target === 'totalScore' ||
      formula.range.target === 'sevenFactors.totalScore')
  ) {
    return {
      ranges: [
        {
          minScore: formula.range.min || 0,
          maxScore: formula.range.max || 0,
          level: config.level || '',
          isAbnormal: config.isAbnormal === 1,
        },
      ],
    };
  }

  // 处理多区间格式：{"or": [{"range": {...}}, {"range": {...}}]}
  if (formula.or && Array.isArray(formula.or)) {
    return {
      ranges: formula.or.map((rangeObj: any, index: number) => ({
        minScore: rangeObj.range?.min || 0,
        maxScore: rangeObj.range?.max || 0,
        level: config.level || `等级${index + 1}`,
        isAbnormal: config.isAbnormal === 1,
      })),
    };
  }

  // 兼容旧格式
  if (formula.minScore !== undefined && formula.maxScore !== undefined) {
    return {
      ranges: [
        {
          minScore: formula.minScore || 0,
          maxScore: formula.maxScore || 0,
          level: config.level || '',
          isAbnormal: config.isAbnormal === 1,
        },
      ],
    };
  }

  // 默认值
  return {
    ranges: [{ minScore: 0, maxScore: 0, level: '', isAbnormal: false }],
  };
}

// 解析最多选择公式
function parseMostChooseFormula(formula: any) {
  // 处理新格式：{"cmp": {"lhs": {"count": {"of": [...], "when": {"cmp": {...}}}}, "op": ">=", "rhs": 5}}
  if (formula.cmp && formula.cmp.lhs && formula.cmp.lhs.count) {
    const countExpr = formula.cmp.lhs.count;
    const whenExpr = countExpr.when?.cmp;

    return {
      questionScore: whenExpr?.rhs || 1, // 从 when.cmp.rhs 中获取分数值
      chooseCount: formula.cmp.rhs || 1, // 从外层 cmp.rhs 中获取次数阈值
    };
  }

  // 兼容旧格式
  if (
    formula.questionScore !== undefined &&
    formula.chooseCount !== undefined
  ) {
    return {
      questionScore: formula.questionScore || 1,
      chooseCount: formula.chooseCount || 1,
    };
  }

  // 默认值
  return { questionScore: 1, chooseCount: 1 };
}

// 解析年龄性别分数规则（新版JSON格式）
function parseAgeSexRuleFormula(formula: any) {
  let conditions: any[] = [];

  if (formula.or && Array.isArray(formula.or)) {
    // 直接解析每个条件，每个条件对应一个特定的性别、年龄、分数组合
    formula.or.forEach((condition: any) => {
      if (condition.and && Array.isArray(condition.and)) {
        const sexCmp = condition.and.find(
          (c: any) => c.cmp?.lhs?.var === 'sex',
        );
        const ageRange = condition.and.find(
          (c: any) => c.range?.target === 'age',
        );
        const scoreRange = condition.and.find(
          (c: any) => c.range?.target === 'totalScore',
        );

        if (sexCmp && ageRange && scoreRange) {
          conditions.push({
            sex: sexCmp.cmp.rhs, // 1=男，2=女
            minAge: ageRange.range.min,
            maxAge: ageRange.range.max,
            minScore: scoreRange.range.min,
            maxScore: scoreRange.range.max,
          });
        }
      }
    });
  } else if (formula.and && Array.isArray(formula.and)) {
    // 单个and条件
    const condition = parseAndCondition(formula.and);
    if (condition) {
      conditions.push(condition);
    }
  } else if (Array.isArray(formula)) {
    // 兼容旧数组格式
    conditions = parseAgeSexFormula(formula);
  }

  return conditions.length > 0
    ? conditions
    : [{ sex: 0, minAge: 0, maxAge: 100, minScore: 0, maxScore: 100 }];
}

// 解析and条件，提取年龄、性别、分数信息
function parseAndCondition(andArray: any[]) {
  let maxAge = 100;
  let maxScore = 100;
  let minAge = 0;
  let minScore = 0;
  let sex = 0;
  let femaleMaxAge, femaleMaxScore, femaleMinAge, femaleMinScore;

  for (const item of andArray) {
    if (item.cmp && item.cmp.lhs && item.cmp.lhs.var === 'sex') {
      sex = item.cmp.rhs;
    } else if (item.range && item.range.target === 'age') {
      if (sex === 1 || sex === 0) {
        minAge = item.range.min;
        maxAge = item.range.max;
      } else if (sex === 2) {
        femaleMinAge = item.range.min;
        femaleMaxAge = item.range.max;
      }
    } else if (item.range && item.range.target === 'totalScore') {
      if (sex === 1 || sex === 0) {
        minScore = item.range.min;
        maxScore = item.range.max;
      } else if (sex === 2) {
        femaleMinScore = item.range.min;
        femaleMaxScore = item.range.max;
      }
    }
  }

  return {
    sex: 0, // 在界面上统一显示为不限，但内部存储男女的具体值
    minAge,
    maxAge,
    minScore,
    maxScore,
    femaleMinAge: femaleMinAge || minAge,
    femaleMaxAge: femaleMaxAge || maxAge,
    femaleMinScore: femaleMinScore || minScore,
    femaleMaxScore: femaleMaxScore || maxScore,
  };
}

// 从JSON公式检测规则类型
function detectRuleTypeFromFormula(formula: any): null | string {
  // 单纯的 range + sevenFactors.totalScore = seven_factors_score_range
  if (formula.range && formula.range.target === 'sevenFactors.totalScore') {
    return 'seven_factors_score_range';
  }
  // 单纯的 range + totalScore = score_range
  if (formula.range && formula.range.target === 'totalScore') {
    return 'score_range';
  }

  // or + range = score_range (多区间)
  if (formula.or && Array.isArray(formula.or)) {
    const firstTarget = formula.or[0]?.range?.target;
    if (firstTarget === 'sevenFactors.totalScore')
      return 'seven_factors_score_range';
    if (firstTarget === 'totalScore') return 'score_range';
  }

  // count + cmp = most_choose
  if (formula.cmp?.lhs?.count) {
    return 'most_choose';
  }

  // range.field.avg 或 顶层 avg 或 使用 avgScore 变量 = multi_question_avg
  if (
    (formula.range &&
      formula.range.field &&
      (formula.range.field.avg || formula.range.field.var === 'avgScore')) ||
    formula.avg
  ) {
    return 'multi_question_avg';
  }

  // sum 聚合（单个或组合） = multi_question_sum
  if (formula.cmp?.lhs?.sum) {
    return 'multi_question_sum';
  }
  if (
    (Array.isArray(formula.or) || Array.isArray(formula.and)) &&
    ((formula.or || formula.and) as any[]).some(
      (item: any) => item?.cmp?.lhs?.sum,
    )
  ) {
    return 'multi_question_sum';
  }

  // cmp + var = multi_question_sum 或者 single_question
  if (formula.cmp?.lhs?.var === 'totalScore') {
    return 'multi_question_sum';
  }

  // 顶层 cmp 为单题
  if (formula.cmp?.lhs?.q) {
    return 'single_question';
  }

  // and/or 内部包含 cmp.lhs.q 也判定为单题条件
  const containsSingleQuestionInNested = (node: any): boolean => {
    if (!node) return false;
    // 直接是单题 cmp
    if (node.cmp?.lhs?.q) return true;
    // 递归 and/or 数组
    if (Array.isArray(node.and)) {
      for (const child of node.and as any[]) {
        if (containsSingleQuestionInNested(child)) return true;
      }
    }
    if (Array.isArray(node.or)) {
      for (const child of node.or as any[]) {
        if (containsSingleQuestionInNested(child)) return true;
      }
    }
    return false;
  };

  if (containsSingleQuestionInNested(formula)) {
    return 'single_question';
  }

  // part-sum-compare 元数据
  if (formula.type === 'part-sum-compare' && Array.isArray(formula.parts)) {
    return 'part_sum_compare';
  }

  // 题干拼接(筛选)
  if (formula.qfc) {
    return 'question_filter_concat';
  }

  // 元数据标记：七因子总分范围
  if (formula.meta?.sevenFactors === true) {
    return 'seven_factors_score_range';
  }

  // and/or + cmp的组合，检查是否包含性别和年龄 = age_sex_score
  if (
    (formula.and || formula.or) &&
    JSON.stringify(formula).includes('"var":"sex"')
  ) {
    return 'age_sex_score';
  }

  return null; // 无法识别
}

// 根据规则类型解析公式
function parseFormulaByType(formula: any, ruleType: string) {
  switch (ruleType) {
    case 'age_sex_score': {
      return { conditions: parseAgeSexRuleFormula(formula) };
    }
    case 'most_choose': {
      return parseMostChooseFormula(formula);
    }
    case 'multi_question_avg': {
      return parseMultiQuestionAvgFormula(formula);
    }
    case 'multi_question_sum': {
      return parseMultiQuestionSumFormula(formula);
    }
    case 'part_sum_compare': {
      const parts = (formula.parts || []).map((p: any) => ({
        key: p.key || '',
        name: p.name || '',
        questionIndex: p.questionIndex || '',
        ranges: (p.ranges || []).map((r: any) => ({
          min: r.min ?? 0,
          max: r.max ?? 0,
          band: r.band || 'MID',
          level: r.level || '',
          rank: r.rank ?? 1,
          riskLevel: r.riskLevel ?? undefined,
          isAbnormal: Boolean(r.isAbnormal),
          teacherComment: r.teacherComment || '',
          studentComment: r.studentComment || '',
        })),
      }));
      const compare = {
        tieBreak: formula.compare?.tieBreak || 'byScore',
        onTie: {
          byBand: (formula.compare?.onTie?.byBand || []).map((b: any) => ({
            band: b.band,
            level: b.level || '',
            riskLevel: b.riskLevel ?? undefined,
            teacherComment: b.teacherComment || '',
            studentComment: b.studentComment || '',
            isAbnormal: Boolean(b.isAbnormal),
          })),
          fallback: formula.compare?.onTie?.fallback
            ? {
                level: formula.compare.onTie.fallback.level || '',
                riskLevel:
                  formula.compare.onTie.fallback.riskLevel ?? undefined,
                teacherComment:
                  formula.compare.onTie.fallback.teacherComment || '',
                studentComment:
                  formula.compare.onTie.fallback.studentComment || '',
                isAbnormal: Boolean(formula.compare.onTie.fallback.isAbnormal),
              }
            : undefined,
        },
      };
      const output = {
        inheritWinner: Boolean(formula.output?.inheritWinner) !== false,
        extra: {
          showWinnerPartName:
            Boolean(formula.output?.extra?.showWinnerPartName) !== false,
        },
      };
      return { parts, compare, output };
    }
    case 'question_filter_concat': {
      return parseQuestionFilterConcatFormula(formula);
    }
    case 'score_range': {
      return parseScoreRangeFormula(formula, {});
    }
    case 'seven_factors_score_range': {
      return parseScoreRangeFormula(formula, {});
    }
    case 'single_question': {
      return parseSingleQuestionFormula(formula);
    }
    default: {
      return {};
    }
  }
}

// 解析题干拼接(筛选)公式
function parseQuestionFilterConcatFormula(formula: any) {
  const qfc = formula?.qfc || formula?.meta?.qfc || {};
  const opMapBack: Record<string, string> = {
    '>=': 'gte',
    '>': 'gt',
    '==': 'eq',
    '<=': 'lte',
    '<': 'lt',
    '!=': 'ne',
  };
  const of = Array.isArray(qfc.of) ? qfc.of : [];
  const nums = (of || [])
    .map((q: any) => String(q).replace('Q', ''))
    .map((s: any) => Number.parseInt(s, 10))
    .filter((n: any) => Number.isFinite(n) && n > 0)
    .join(',');
  return {
    useSelectedIndex: !qfc.of, // 若未提供具体 of，默认使用题目索引
    questionNumbers: nums,
    operator: opMapBack[qfc.op] || 'gte',
    threshold: Number(qfc.rhs ?? 4),
    requireAll: Boolean(qfc.all) || false,
  };
}

// 解析多题均值范围公式
function parseMultiQuestionAvgFormula(formula: any) {
  const toQuestionNumbersString = (arr: any[]): string => {
    const nums = (arr || [])
      .map((q: any) => String(q).replace('Q', ''))
      .map((s) => Number.parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    return nums.join(',');
  };

  // range + field.avg
  if (formula?.range?.field?.avg) {
    const avgNode = formula.range.field.avg;
    const ofArray = Array.isArray(avgNode) ? avgNode : avgNode.of || [];
    const questionNumbers = toQuestionNumbersString(ofArray);
    const minAvg = formula.range.min ?? 0;
    const maxAvg = formula.range.max ?? 0;

    const whenCmp =
      !Array.isArray(avgNode) && avgNode.when && avgNode.when.cmp
        ? avgNode.when.cmp
        : null;
    const opMap: Record<string, string> = {
      '>=': 'gte',
      '>': 'gt',
      '==': 'eq',
      '<=': 'lte',
      '<': 'lt',
      '!=': 'ne',
    };
    const whenOperator = whenCmp ? opMap[whenCmp.op] || 'gte' : 'gte';
    const whenValue = whenCmp ? whenCmp.rhs : 0;

    return {
      questionNumbers: questionNumbers || '1,2,3',
      minAvg,
      maxAvg,
      useQuestionIndexVar: false,
      enableFilter: Boolean(whenCmp),
      whenOperator,
      whenValue,
    };
  }

  // range + field.var = avgScore
  if (formula?.range?.field?.var === 'avgScore') {
    return {
      questionNumbers: '',
      minAvg: formula.range.min ?? 0,
      maxAvg: formula.range.max ?? 0,
      useQuestionIndexVar: true,
      enableFilter: false,
      whenOperator: 'gte',
      whenValue: 0,
    };
  }

  // 顶层 avg（未与 range 组合），尽力回显题号
  if (formula?.avg) {
    const ofArray = Array.isArray(formula.avg)
      ? formula.avg
      : formula.avg.of || [];
    return {
      questionNumbers: toQuestionNumbersString(ofArray) || '1,2,3',
      minAvg: 0,
      maxAvg: 5,
      useQuestionIndexVar: false,
      enableFilter: Boolean(!Array.isArray(formula.avg) && formula.avg.when),
      whenOperator: 'gte',
      whenValue: 0,
    };
  }

  // 默认
  return {
    questionNumbers: '1,2,3',
    minAvg: 0,
    maxAvg: 5,
    useQuestionIndexVar: false,
    enableFilter: false,
    whenOperator: 'gte',
    whenValue: 0,
  };
}

// 解析单题条件公式
function parseSingleQuestionFormula(formula: any) {
  // 解析为分组结构：groups: [{ groupLogic, conditions: [...] }], topLogic
  const makeCond = (node: any) => {
    const qNumber = String(node.cmp.lhs.q).replace('Q', '');
    return {
      questionNumber: Number.parseInt(qNumber),
      operator: node.cmp.op,
      value: node.cmp.rhs,
    };
  };

  if (formula.cmp?.lhs?.q) {
    return {
      groups: [{ groupLogic: 'or', conditions: [makeCond(formula)] }],
      topLogic: 'and',
    };
  }

  const collectConds = (arr: any[]): any[] => {
    const out: any[] = [];
    for (const item of arr || []) {
      if (item?.cmp?.lhs?.q) {
        out.push(makeCond(item));
      } else if (Array.isArray(item?.and)) {
        out.push(...collectConds(item.and));
      } else if (Array.isArray(item?.or)) {
        out.push(...collectConds(item.or));
      }
    }
    return out;
  };

  if (formula.and || formula.or) {
    const topLogic = formula.and ? 'and' : 'or';
    const topArray = (formula.and || formula.or) as any[];

    const groups: any[] = [];
    for (const node of topArray) {
      if (node?.cmp?.lhs?.q) {
        groups.push({ groupLogic: 'or', conditions: [makeCond(node)] });
      } else if (Array.isArray(node?.and)) {
        const innerConds = collectConds(node.and);
        if (innerConds.length > 0) {
          groups.push({ groupLogic: 'and', conditions: innerConds });
        }
      } else if (Array.isArray(node?.or)) {
        const innerConds = collectConds(node.or);
        if (innerConds.length > 0) {
          groups.push({ groupLogic: 'or', conditions: innerConds });
        }
      }
    }

    if (groups.length === 0) {
      return {
        groups: [
          {
            groupLogic: 'or',
            conditions: [{ questionNumber: 1, operator: 'gt', value: 0 }],
          },
        ],
        topLogic: 'and',
      };
    }
    return { groups, topLogic };
  }

  return {
    groups: [
      {
        groupLogic: 'or',
        conditions: [{ questionNumber: 1, operator: 'gt', value: 0 }],
      },
    ],
    topLogic: 'and',
  };
}

// 解析多题求和公式
function parseMultiQuestionSumFormula(formula: any) {
  const fromSumCmp = (node: any) => {
    const of = node?.cmp?.lhs?.sum?.of || [];
    const nums = (of || [])
      .map((q: any) => String(q).replace('Q', ''))
      .map((s: string) => Number.parseInt(s, 10))
      .filter((n: number) => Number.isFinite(n) && n > 0)
      .join(',');
    const opMapBack: Record<string, string> = {
      '>=': 'gte',
      '>': 'gt',
      '==': 'eq',
      '<=': 'lte',
      '<': 'lt',
      '!=': 'ne',
    };
    const operator = opMapBack[node?.cmp?.op] || 'gte';
    const threshold = node?.cmp?.rhs ?? 0;
    const label = node?.label || node?.cmp?.lhs?.sum?.label || '';
    return { questionNumbers: nums || '1,2,3', operator, threshold, label };
  };

  if (formula?.cmp?.lhs?.sum) {
    const one = fromSumCmp(formula);
    return { groups: [one], topLogic: 'or' } as any;
  }
  if (Array.isArray(formula?.or)) {
    return {
      groups: (formula.or as any[])
        .filter((n) => n?.cmp?.lhs?.sum)
        .map((n) => fromSumCmp(n)),
      topLogic: 'or',
    } as any;
  }
  if (Array.isArray(formula?.and)) {
    return {
      groups: (formula.and as any[])
        .filter((n) => n?.cmp?.lhs?.sum)
        .map((n) => fromSumCmp(n)),
      topLogic: 'and',
    } as any;
  }

  // 兼容旧格式：使用 totalScore（无法识别具体题号）
  if (formula.cmp && formula.cmp.lhs && formula.cmp.lhs.var === 'totalScore') {
    return {
      groups: [
        {
          questionNumbers: '1,2,3',
          operator: formula.cmp.op || '>=',
          threshold: formula.cmp.rhs ?? 0,
          label: '',
        },
      ],
      topLogic: 'or',
    } as any;
  }

  return {
    groups: [
      { questionNumbers: '1,2,3', operator: 'gte', threshold: 10, label: '' },
    ],
    topLogic: 'or',
  } as any;
}

// 解析学生评语
function parseStudentComment(studentComment: string): string[] {
  if (!studentComment) return [];

  try {
    const parsed = JSON.parse(studentComment);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string');
    }
  } catch {
    // 如果不是JSON，按换行符分割
    if (typeof studentComment === 'string' && studentComment.trim()) {
      return studentComment
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    }
  }

  return typeof studentComment === 'string' && studentComment.trim()
    ? [studentComment]
    : [];
}

// 格式化学生评语为JSON
function formatStudentComment(studentComments: string[]): string {
  if (!studentComments || studentComments.length === 0) return '[]';
  const validComments = studentComments.filter(
    (comment) => comment && comment.trim(),
  );
  return validComments.length > 0 ? JSON.stringify(validComments) : '[]';
}

// 初始化默认表单数据
function initDefaultForm() {
  currentRuleType.value = 'score_range';
  ruleFormData.value = {
    ranges: [
      {
        minScore: 0,
        maxScore: 100,
        level: '',
        isAbnormal: false,
      },
    ],
  };

  resultConfig.value = {
    level: '',
    isAbnormal: false,
    riskLevel: undefined,
    message: '',
    teacherComment: '',
    studentComments: [],
    questionIndex: [],
    matchOrder: 1,
    isMultiHit: 0,
  };
}

// 规则预览
const rulePreview = computed(() => {
  try {
    switch (currentRuleType.value) {
      case 'age_sex_score': {
        if (!ruleFormData.value.conditions?.length) return '请配置年龄性别条件';
        return ruleFormData.value.conditions
          .map((c: any) => {
            return `年龄${c.minAge}-${c.maxAge}岁, 分数${c.minScore}-${c.maxScore}`;
          })
          .join(' OR ');
      }

      case 'custom_json': {
        return '自定义JSON表达式';
      }

      case 'most_choose': {
        return `选择分数为${ruleFormData.value.questionScore}的题目数量≥${ruleFormData.value.chooseCount}`;
      }

      case 'multi_question_avg': {
        const useVar = ruleFormData.value.useQuestionIndexVar;
        const rangeText = `${ruleFormData.value.minAvg} - ${ruleFormData.value.maxAvg}`;
        const base = useVar
          ? `维度题目索引均值 ∈ [${rangeText}]`
          : `题目${ruleFormData.value.questionNumbers}均值 ∈ [${rangeText}]`;
        if (ruleFormData.value.enableFilter) {
          return `${base}，过滤条件: 分数${getOperatorText(ruleFormData.value.whenOperator)}${ruleFormData.value.whenValue}`;
        }
        return base;
      }

      case 'multi_question_sum': {
        const groups = ruleFormData.value.groups || [];
        if (groups.length > 0) {
          const items = groups.map((g: any) => {
            const head = g.label ? `${g.label}: ` : '';
            return `${head}题目${g.questionNumbers}求和${getOperatorText(g.operator)}${g.threshold}`;
          });
          const joiner =
            (ruleFormData.value.topLogic || 'or') === 'and' ? ' AND ' : ' OR ';
          return items.map((s: string) => `(${s})`).join(joiner);
        }
        return `题目${ruleFormData.value.questionNumbers}求和${getOperatorText(ruleFormData.value.operator)}${ruleFormData.value.threshold}`;
      }

      case 'part_sum_compare': {
        const parts = ruleFormData.value.parts || [];
        if (parts.length === 0) return '请添加部分与区间';
        const partText = parts
          .map(
            (p: any) =>
              `${p.key || ''}${p.name ? `(${p.name})` : ''} = [${(
                p.ranges || []
              )
                .map((r: any) => `${r.band}:${r.min}-${r.max}`)
                .join(', ')}]`,
          )
          .join(' | ');
        const tie = ruleFormData.value.compare?.tieBreak || 'byScore';
        const bands = (ruleFormData.value.compare?.onTie?.byBand || [])
          .map((b: any) => `${b.band}:${b.level || '-'}`)
          .join(', ');
        return `分部分总分对比：${partText}；平分策略=${tie}；同分段输出=[${bands}]`;
      }

      case 'question_filter_concat': {
        const src = ruleFormData.value.useSelectedIndex
          ? '题目索引'
          : `题目${ruleFormData.value.questionNumbers}`;
        return `从${src}中筛选 分数${getOperatorText(ruleFormData.value.operator)}${ruleFormData.value.threshold} 的题干组成等级`;
      }

      case 'score_range': {
        if (!ruleFormData.value.ranges?.length) return '请配置分数区间';
        return `分数区间：${ruleFormData.value.ranges
          .map(
            (r: any) =>
              `${r.minScore}-${r.maxScore}(${r.level || '未设置等级'})`,
          )
          .join(', ')}`;
      }

      case 'seven_factors_score_range': {
        if (!ruleFormData.value.ranges?.length) return '请配置分数区间';
        return `七因子总分区间：${ruleFormData.value.ranges
          .map(
            (r: any) =>
              `${r.minScore}-${r.maxScore}(${r.level || '未设置等级'})`,
          )
          .join(', ')}`;
      }

      case 'single_question': {
        const groups = ruleFormData.value.groups || [];
        if (groups.length === 0) return '请配置题目条件';
        const groupTexts = groups.map((g: any) => {
          const conds = g.conditions || [];
          const txt = conds
            .map(
              (c: any) =>
                `Q${c.questionNumber} ${getOperatorText(c.operator)} ${c.value}`,
            )
            .join(g.groupLogic === 'and' ? ' AND ' : ' OR ');
          return `(${txt})`;
        });
        return groupTexts.join(
          (ruleFormData.value.topLogic || 'and') === 'and' ? ' AND ' : ' OR ',
        );
      }

      default: {
        return '请选择规则类型';
      }
    }
  } catch {
    return '规则配置不完整';
  }
});

function getOperatorText(operator: string) {
  const map: Record<string, string> = {
    gte: '≥',
    gt: '>',
    eq: '=',
    lte: '≤',
    lt: '<',
    ne: '≠',
  };
  return map[operator] || operator;
}

// 规则类型变化时重置表单数据
watch(currentRuleType, (newType) => {
  if (isInitializing.value) return;
  switch (newType) {
    case 'age_sex_score': {
      ruleFormData.value = {
        conditions: [
          { sex: 0, minAge: 0, maxAge: 100, minScore: 0, maxScore: 100 },
        ],
      };
      break;
    }
    case 'custom_json': {
      ruleFormData.value = {
        jsonExpression:
          '{"cmp": {"lhs": {"var": "totalScore"}, "op": ">=", "rhs": 30}}',
        description: '',
      };
      break;
    }
    case 'most_choose': {
      ruleFormData.value = { questionScore: 1, chooseCount: 1 };
      break;
    }
    case 'multi_question_avg': {
      ruleFormData.value = {
        questionNumbers: '1,2,3',
        minAvg: 0,
        maxAvg: 5,
        useQuestionIndexVar: false,
        enableFilter: false,
        whenOperator: 'gte',
        whenValue: 0,
      };
      break;
    }
    case 'multi_question_sum': {
      ruleFormData.value = {
        groups: [
          { questionNumbers: '3,8,14,18,25', operator: 'gte', threshold: 13 },
        ],
        topLogic: 'or',
      };
      break;
    }
    case 'part_sum_compare': {
      ruleFormData.value = {
        parts: [
          {
            key: 'A',
            name: '部分A',
            questionIndex: '',
            ranges: [
              {
                min: 0,
                max: 16,
                band: 'LOW',
                level: '',
                rank: 1,
                isAbnormal: false,
              },
              {
                min: 17,
                max: 23,
                band: 'MID',
                level: '',
                rank: 2,
                isAbnormal: false,
              },
              {
                min: 24,
                max: 999,
                band: 'HIGH',
                level: '',
                rank: 3,
                isAbnormal: true,
              },
            ],
          },
          {
            key: 'B',
            name: '部分B',
            questionIndex: '',
            ranges: [
              {
                min: 0,
                max: 16,
                band: 'LOW',
                level: '',
                rank: 1,
                isAbnormal: false,
              },
              {
                min: 17,
                max: 23,
                band: 'MID',
                level: '',
                rank: 2,
                isAbnormal: false,
              },
              {
                min: 24,
                max: 999,
                band: 'HIGH',
                level: '',
                rank: 3,
                isAbnormal: true,
              },
            ],
          },
        ],
        compare: {
          strategy: 'byRank',
          tieBreak: 'byScore',
          onTie: {
            mode: 'byBand',
            byBand: [
              {
                band: 'LOW',
                level: '',
                isAbnormal: false,
                teacherComment: '',
                studentComment: '',
              },
              {
                band: 'MID',
                level: '',
                isAbnormal: false,
                teacherComment: '',
                studentComment: '',
              },
              {
                band: 'HIGH',
                level: '',
                isAbnormal: true,
                teacherComment: '',
                studentComment: '',
              },
            ],
            fallback: {
              level: '',
              isAbnormal: false,
              teacherComment: '',
              studentComment: '',
            },
          },
        },
        output: { inheritWinner: true, extra: { showWinnerPartName: true } },
      };
      break;
    }
    case 'question_filter_concat': {
      ruleFormData.value = {
        useSelectedIndex: true,
        questionNumbers: '',
        operator: 'gte',
        threshold: 4,
        requireAll: false,
      };
      break;
    }
    case 'score_range': {
      ruleFormData.value = {
        ranges: [{ minScore: 0, maxScore: 100, level: '', isAbnormal: false }],
      };
      break;
    }
    case 'seven_factors_score_range': {
      ruleFormData.value = {
        ranges: [{ minScore: 0, maxScore: 100, level: '', isAbnormal: false }],
      };
      break;
    }
    case 'single_question': {
      ruleFormData.value = {
        groups: [
          {
            groupLogic: 'or',
            conditions: [{ questionNumber: 1, operator: 'gt', value: 0 }],
          },
        ],
        topLogic: 'and',
      };
      break;
    }
  }
});

// 题目索引选项
const ALL_INDEX_VALUE = 'all';
const questionIndexOptions = computed(() => {
  const total = Number(selectedQuestionnaire.value?.questionCount || 0);
  const indexes = Array.from({ length: total }, (_, i) => ({
    label: String(i + 1),
    value: String(i + 1),
  }));
  return [{ label: '全部', value: ALL_INDEX_VALUE }, ...indexes];
});

function handleQuestionIndexChange(value: any) {
  const values = (value ?? []) as string[];
  if (!Array.isArray(values)) return;
  resultConfig.value.questionIndex = values.includes(ALL_INDEX_VALUE)
    ? [ALL_INDEX_VALUE]
    : values.filter((v) => v !== ALL_INDEX_VALUE);
}

// 题目编号选项
const questionOptions = computed(() => {
  const total = Number(selectedQuestionnaire.value?.questionCount || 50);
  return Array.from({ length: total }, (_, i) => ({
    label: `Q${i + 1}`,
    value: i + 1,
  }));
});

// 操作符选项
const operatorOptions = [
  { label: '大于 (>)', value: 'gt' },
  { label: '大于等于 (≥)', value: 'gte' },
  { label: '等于 (=)', value: 'eq' },
  { label: '小于等于 (≤)', value: 'lte' },
  { label: '小于 (<)', value: 'lt' },
  { label: '不等于 (≠)', value: 'ne' },
];

// 性别选项
const sexOptions = [
  { label: '不限', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
];

// 风险等级选项
const riskLevelOptions = [
  { label: '无/低风险', value: 1 },
  { label: '轻度风险', value: 2 },
  { label: '中度风险', value: 3 },
  { label: '重度风险', value: 4 },
];

// 生成符合后端要求的JSON表达式
function generateBackendExpression() {
  switch (currentRuleType.value) {
    case 'custom_json': {
      try {
        return JSON.parse(ruleFormData.value.jsonExpression || '{}');
      } catch {
        return {};
      }
    }

    case 'age_sex_score': {
      // 依据界面条件生成：按性别、年龄、总分的组合进行匹配
      const conditions = (ruleFormData.value.conditions || []) as any[];
      const blocks: any[] = [];
      const toAnd = (sex: number, c: any) => ({
        and: [
          { cmp: { lhs: { var: 'sex' }, op: '==', rhs: sex } },
          {
            range: {
              target: 'age',
              min: Number(c.minAge ?? 0),
              max: Number(c.maxAge ?? 0),
            },
          },
          {
            range: {
              target: 'totalScore',
              min: Number(c.minScore ?? 0),
              max: Number(c.maxScore ?? 0),
            },
          },
        ],
      });
      for (const c of conditions) {
        const sex = Number(c.sex);
        if (sex === 1) blocks.push(toAnd(1, c));
        else if (sex === 2) blocks.push(toAnd(2, c));
        else blocks.push(toAnd(1, c), toAnd(2, c));
      }
      if (blocks.length === 0) {
        return {
          and: [
            { cmp: { lhs: { var: 'sex' }, op: '==', rhs: 1 } },
            { range: { target: 'age', min: 0, max: 100 } },
            { range: { target: 'totalScore', min: 0, max: 100 } },
          ],
        } as any;
      }
      return blocks.length === 1 ? (blocks[0] as any) : ({ or: blocks } as any);
    }

    case 'most_choose': {
      // 根据示例：统计指定题目中分数>=某值的题目数量
      const questionNumbers = Array.from(
        { length: Number(selectedQuestionnaire.value?.questionCount || 50) },
        (_, i) => `Q${i + 1}`,
      );
      return {
        cmp: {
          lhs: {
            count: {
              of: questionNumbers,
              when: {
                cmp: {
                  lhs: { var: 'current.score' },
                  op: '==',
                  rhs: ruleFormData.value.questionScore || 1,
                },
              },
            },
          },
          op: '>=',
          rhs: ruleFormData.value.chooseCount || 1,
        },
      };
    }

    case 'multi_question_avg': {
      const min = Number(ruleFormData.value.minAvg ?? 0);
      const max = Number(ruleFormData.value.maxAvg ?? 0);

      let field: any;
      if (ruleFormData.value.useQuestionIndexVar) {
        field = { var: 'avgScore' };
      } else {
        const ofArray = String(ruleFormData.value.questionNumbers || '')
          .split(',')
          .map((s) => s.trim())
          .map((s) => Number.parseInt(s, 10))
          .filter((n) => Number.isFinite(n) && n > 0)
          .map((n) => `Q${n}`);

        const avgExpr: any = { of: ofArray };
        if (ruleFormData.value.enableFilter) {
          const opMap: Record<string, string> = {
            gte: '>=',
            gt: '>',
            eq: '==',
            lte: '<=',
            lt: '<',
            ne: '!=',
          };
          avgExpr.when = {
            cmp: {
              lhs: { var: 'current.score' },
              op: opMap[ruleFormData.value.whenOperator || 'gte'] || '>=',
              rhs: Number(ruleFormData.value.whenValue || 0),
            },
          };
        }

        field = { avg: avgExpr };
      }

      return {
        range: {
          field,
          min,
          max,
        },
      };
    }

    case 'multi_question_sum': {
      const groups = (ruleFormData.value.groups || []) as Array<{
        label?: string;
        operator: string;
        questionNumbers: string;
        threshold: number;
      }>;
      const opMap: Record<string, string> = {
        gte: '>=',
        gt: '>',
        eq: '==',
        lte: '<=',
        lt: '<',
        ne: '!=',
      };
      const buildSumCmp = (g: any) => {
        const ofArray = String(g.questionNumbers || '')
          .split(',')
          .map((s: string) => s.trim())
          .map((s: string) => Number.parseInt(s, 10))
          .filter((n: number) => Number.isFinite(n) && n > 0)
          .map((n: number) => `Q${n}`);
        const node: any = {
          cmp: {
            lhs: { sum: { of: ofArray } },
            op: opMap[g.operator || 'gte'] || '>=',
            rhs: Number(g.threshold || 0),
          },
        };
        if (g.label) {
          node.label = g.label;
        }
        return node as any;
      };

      if (groups && groups.length > 0) {
        if (groups.length === 1) return buildSumCmp(groups[0]);
        const top = ruleFormData.value.topLogic || 'or';
        return { [top]: groups.map((g) => buildSumCmp(g)) } as any;
      }

      // 回退：单组配置（兼容旧UI字段）
      const ofArray = String(ruleFormData.value.questionNumbers || '')
        .split(',')
        .map((s: string) => s.trim())
        .map((s: string) => Number.parseInt(s, 10))
        .filter((n: number) => Number.isFinite(n) && n > 0)
        .map((n: number) => `Q${n}`);
      return {
        cmp: {
          lhs: { sum: { of: ofArray } },
          op: opMap[ruleFormData.value.operator || 'gte'] || '>=',
          rhs: Number(ruleFormData.value.threshold || 0),
        },
      } as any;
    }

    case 'part_sum_compare': {
      // 构造 parts
      const parts = (ruleFormData.value.parts || []).map((p: any) => {
        // 支持直接输入逗号分隔的题号或勾选题目索引（这里用字符串）
        const nums = String(p.questionIndex || '')
          .split(',')
          .map((s: string) => s.trim())
          .map((s: string) => Number.parseInt(s, 10))
          .filter((n: number) => Number.isFinite(n) && n > 0)
          .sort((a, b) => a - b)
          .join(',');
        return {
          key: p.key || '',
          name: p.name || '',
          questionIndex: nums,
          ranges: (p.ranges || []).map((r: any) => ({
            min: Number(r.min ?? 0),
            max: Number(r.max ?? 0),
            band: r.band || 'MID',
            level: r.level || '',
            rank: Number(r.rank ?? 1),
            riskLevel:
              r.riskLevel === undefined ? undefined : Number(r.riskLevel),
            teacherComment: r.teacherComment || '',
            studentComment: r.studentComment || '',
            isAbnormal: r.isAbnormal ? 1 : 0,
          })),
        };
      });

      // compare / onTie
      const compare = {
        strategy: 'byRank',
        tieBreak: ruleFormData.value?.compare?.tieBreak || 'byScore',
        onTie: {
          mode: 'byBand',
          byBand: (ruleFormData.value?.compare?.onTie?.byBand || []).map(
            (b: any) => ({
              band: b.band,
              level: b.level || '',
              riskLevel:
                b.riskLevel === undefined ? undefined : Number(b.riskLevel),
              teacherComment: b.teacherComment || '',
              studentComment: b.studentComment || '',
              isAbnormal: b.isAbnormal ? 1 : 0,
            }),
          ),
          fallback: ruleFormData.value?.compare?.onTie?.fallback
            ? {
                level:
                  ruleFormData.value?.compare?.onTie?.fallback?.level || '',
                riskLevel:
                  ruleFormData.value?.compare?.onTie?.fallback?.riskLevel ===
                  undefined
                    ? undefined
                    : Number(
                        ruleFormData.value?.compare?.onTie?.fallback?.riskLevel,
                      ),
                teacherComment:
                  ruleFormData.value?.compare?.onTie?.fallback
                    ?.teacherComment || '',
                studentComment:
                  ruleFormData.value?.compare?.onTie?.fallback
                    ?.studentComment || '',
                isAbnormal: ruleFormData.value?.compare?.onTie?.fallback
                  ?.isAbnormal
                  ? 1
                  : 0,
              }
            : undefined,
        },
      } as any;

      const output = {
        inheritWinner:
          Boolean(ruleFormData.value?.output?.inheritWinner) !== false,
        extra: {
          showWinnerPartName:
            Boolean(ruleFormData.value?.output?.extra?.showWinnerPartName) !==
            false,
        },
      };

      return {
        type: 'part-sum-compare',
        parts,
        compare,
        output,
      } as any;
    }

    case 'question_filter_concat': {
      // 题干拼接(筛选)：使用顶层 qfc 字段（不再放 meta 内）
      const opMap: Record<string, string> = {
        gte: '>=',
        gt: '>',
        eq: '==',
        lte: '<=',
        lt: '<',
        ne: '!=',
      };
      const op = opMap[ruleFormData.value.operator || 'gte'] || '>=';
      const rhs = Number(ruleFormData.value.threshold ?? 0);
      const qfc: any = { op, rhs };
      if (ruleFormData.value.requireAll) qfc.all = true;
      if (!ruleFormData.value.useSelectedIndex) {
        const ofArray = String(ruleFormData.value.questionNumbers || '')
          .split(',')
          .map((s: string) => s.trim())
          .map((s: string) => Number.parseInt(s, 10))
          .filter((n: number) => Number.isFinite(n) && n > 0)
          .map((n: number) => `Q${n}`);
        qfc.of = ofArray;
      }
      return { qfc } as any;
    }

    case 'score_range': {
      // 普通分数区间（使用 totalScore）
      if (ruleFormData.value.ranges?.length === 1) {
        const range = ruleFormData.value.ranges[0];
        return {
          range: {
            target: 'totalScore',
            min: range.minScore,
            max: range.maxScore,
          },
        } as any;
      }
      return {
        or:
          ruleFormData.value.ranges?.map((range: any) => ({
            range: {
              target: 'totalScore',
              min: range.minScore,
              max: range.maxScore,
            },
          })) || [],
      } as any;
    }

    case 'seven_factors_score_range': {
      // 前端仅配置总分区间；通过 meta 标记 sevenFactors: true 告知后端按七因子计算
      if (ruleFormData.value.ranges?.length === 1) {
        const range = ruleFormData.value.ranges[0];
        return {
          meta: { sevenFactors: true },
          range: {
            target: 'sevenFactors.totalScore',
            min: range.minScore,
            max: range.maxScore,
          },
        } as any;
      }
      return {
        meta: { sevenFactors: true },
        or:
          ruleFormData.value.ranges?.map((range: any) => ({
            range: {
              target: 'sevenFactors.totalScore',
              min: range.minScore,
              max: range.maxScore,
            },
          })) || [],
      } as any;
    }

    case 'single_question': {
      // 将分组条件生成基础表达式
      const groups = (ruleFormData.value.groups || []) as any[];
      const topLogic = ruleFormData.value.topLogic || 'and';
      const buildGroup = (g: any) => {
        const conds = (g.conditions || []).map((c: any) => ({
          cmp: {
            lhs: { q: `Q${c.questionNumber}` },
            op: c.operator,
            rhs: c.value,
          },
        }));
        if (conds.length === 1) return conds[0];
        return { [g.groupLogic || 'or']: conds } as any;
      };
      if (groups.length === 0) {
        return { cmp: { lhs: { q: 'Q1' }, op: 'gt', rhs: 0 } } as any;
      }
      const builtGroups = groups.map((g) => buildGroup(g));
      if (builtGroups.length === 1) return builtGroups[0];
      return { [topLogic]: builtGroups } as any;
    }

    default: {
      return {};
    }
  }
}

// 映射规则类型到计算类型
function mapRuleTypeToCalculateType(ruleType: string): number {
  switch (ruleType) {
    case 'age_sex_score': {
      return QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE;
    }
    case 'most_choose': {
      return QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE;
    }
    case 'score_range': {
      return QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE;
    }
    case 'seven_factors_score_range': {
      // 与普通分数区间同一calculateType，后端通过 meta.sevenFactors 区分
      return QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE;
    }
    default: {
      return QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE;
    }
  }
}

// 保存配置
async function handleSave() {
  try {
    // 顶层等级校验：part_sum_compare、question_filter_concat 可为空（由后端或拼接回填）；其余类型仍必填
    const needTopLevel = ![
      'part_sum_compare',
      'question_filter_concat',
    ].includes(currentRuleType.value);
    if (needTopLevel && !resultConfig.value.level?.trim()) {
      throw new Error('请输入评级等级');
    }

    // part_sum_compare 额外校验
    if (currentRuleType.value === 'part_sum_compare') {
      const parts = ruleFormData.value.parts || [];
      if (parts.length === 0) throw new Error('请添加至少一个部分');
      for (const p of parts) {
        if (!p.questionIndex || !String(p.questionIndex).trim()) {
          throw new Error(`部分 ${p.key || p.name || ''} 题目编号不能为空`);
        }
        // 区间不重叠
        const ranges = (p.ranges || [])
          .map((r: any) => ({ min: Number(r.min), max: Number(r.max) }))
          .sort((a: any, b: any) => a.min - b.min);
        for (let i = 1; i < ranges.length; i++) {
          if (ranges[i].min <= ranges[i - 1].max) {
            throw new Error(`部分 ${p.key || p.name || ''} 存在区间重叠`);
          }
        }
      }
      // 同分段覆盖提示
      const bands = new Set<string>();
      parts.forEach((pp: any) =>
        (pp.ranges || []).forEach((rr: any) => rr.band && bands.add(rr.band)),
      );
      const byBand = ruleFormData.value.compare?.onTie?.byBand || [];
      const missing = [...bands].filter(
        (b) => !byBand.some((x: any) => x.band === b),
      );
      if (missing.length > 0) {
        message.warning(`建议为同分段配置补齐分段规则: ${missing.join(', ')}`);
      }
    }

    // 所有规则类型都生成表达式
    const calculateFormula = generateBackendExpression();

    const payload: QuestionnaireResultConfigBaseVO = {
      dimensionId: selectedDimension.value?.id || 0,
      description: resultConfig.value.message || '',
      questionIndex:
        resultConfig.value.questionIndex[0] === ALL_INDEX_VALUE
          ? questionIndexOptions.value
              .filter((v) => v.value !== ALL_INDEX_VALUE)
              .map((v) => v.value)
              .sort((a, b) => Number(a) - Number(b))
              .join(',')
          : resultConfig.value.questionIndex
              .sort((a: string, b: string) => Number(a) - Number(b))
              .join(','),
      calculateType: mapRuleTypeToCalculateType(currentRuleType.value),
      calculateFormula: JSON.stringify(calculateFormula),
      teacherComment: resultConfig.value.teacherComment || '',
      studentComment: formatStudentComment(
        resultConfig.value.studentComments || [],
      ),
      isAbnormal: resultConfig.value.isAbnormal ? 1 : 0,
      riskLevel: resultConfig.value.riskLevel,
      level: resultConfig.value.level || '',
      status: 1,
      matchOrder: Number(resultConfig.value.matchOrder),
      isMultiHit: Number(resultConfig.value.isMultiHit || 0),
    };

    if (selectedConfig.value && (selectedConfig.value as any).id) {
      await updateQuestionnaireResultConfig({
        ...payload,
        id: (selectedConfig.value as any).id,
        createTime: (selectedConfig.value as any).createTime,
        updateTime: (selectedConfig.value as any).updateTime,
      } as any);
      message.success('更新成功');
    } else {
      await createQuestionnaireResultConfig(payload);
      message.success('创建成功');
    }

    formDialogApi.close();
    emit('success');
  } catch (error: any) {
    console.error('保存失败:', error);
    message.error(error.message || '保存失败');
  }
}

function handleCancel() {
  emit('cancel');
  formDialogApi.close();
}

// 添加条件/区间的通用方法
function addCondition(type: string) {
  switch (type) {
    case 'age_sex_score_condition': {
      ruleFormData.value.conditions.push({
        sex: 0,
        minAge: 0,
        maxAge: 100,
        minScore: 0,
        maxScore: 100,
      });

      break;
    }
    case 'score_range': {
      ruleFormData.value.ranges.push({
        minScore: 0,
        maxScore: 100,
        level: '',
        isAbnormal: false,
      });

      break;
    }
    case 'single_question_condition': {
      ruleFormData.value.conditions.push({
        questionNumber: 1,
        operator: 'gt',
        value: 0,
      });

      break;
    }
    // No default
  }
}

function removeCondition(type: string, index: number) {
  if (
    type === 'age_sex_score_condition' &&
    ruleFormData.value.conditions.length > 1
  ) {
    ruleFormData.value.conditions.splice(index, 1);
  } else if (type === 'score_range' && ruleFormData.value.ranges.length > 1) {
    ruleFormData.value.ranges.splice(index, 1);
  } else if (
    type === 'single_question_condition' &&
    ruleFormData.value.conditions.length > 1
  ) {
    ruleFormData.value.conditions.splice(index, 1);
  }
}

defineExpose({
  open: () => formDialogApi.open(),
  close: () => formDialogApi.close(),
});
</script>

<template>
  <FormDialog>
    <div class="w-full px-6 py-4">
      <!-- 基本信息 -->
      <div class="mb-6">
        <h3 class="mb-2 text-lg font-medium">基本信息</h3>
        <div class="text-gray-600">
          维度：{{ selectedDimension?.dimensionName || '未知' }} ({{
            selectedDimension?.dimensionCode || ''
          }})
        </div>
        <div class="text-gray-600">
          问卷：{{ selectedQuestionnaire?.title || '未知' }} (共{{
            selectedQuestionnaire?.questionCount || 0
          }}题)
        </div>
      </div>

      <Form ref="formRef" layout="vertical">
        <!-- 题目索引配置 -->
        <Card title="题目索引" class="mb-6">
          <Form.Item label="适用题目">
            <Select
              v-model:value="resultConfig.questionIndex"
              mode="multiple"
              :max-tag-count="10"
              :options="questionIndexOptions"
              :placeholder="`请选择题目索引（共 ${selectedQuestionnaire?.questionCount || 0} 题）`"
              @change="handleQuestionIndexChange"
            />
          </Form.Item>
          <div class="text-gray-500">
            <Tooltip
              :title="formatQuestionIndex(resultConfig.questionIndex).fullText"
            >
              <span>
                摘要：{{ formatQuestionIndex(resultConfig.questionIndex).text }}
              </span>
            </Tooltip>
          </div>
        </Card>

        <!-- 规则类型选择 -->
        <Card title="规则类型" class="mb-6">
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div
              v-for="ruleType in ruleTypes"
              :key="ruleType.value"
              class="cursor-pointer rounded-lg border-2 p-4 transition-colors"
              :class="[
                currentRuleType === ruleType.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
              @click="currentRuleType = ruleType.value"
            >
              <div class="flex items-start space-x-3">
                <span class="text-2xl">{{ ruleType.icon }}</span>
                <div>
                  <div class="font-medium">{{ ruleType.label }}</div>
                  <div class="text-sm text-gray-600">
                    {{ ruleType.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <!-- 规则配置 -->
        <Card title="规则配置" class="mb-6">
          <!-- 多题均值范围 -->
          <template v-if="currentRuleType === 'multi_question_avg'">
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item
                  label="题目编号"
                  help="输入要求平均的题目编号，逗号分隔，例如：1,3,5"
                >
                  <Input
                    v-model:value="ruleFormData.questionNumbers"
                    :disabled="ruleFormData.useQuestionIndexVar"
                    placeholder="如：1,3,5"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="使用维度题目索引变量">
                  <Switch v-model:checked="ruleFormData.useQuestionIndexVar" />
                </Form.Item>
              </Col>

              <Col :span="12">
                <Form.Item label="最小均值">
                  <InputNumber
                    v-model:value="ruleFormData.minAvg"
                    :min="0"
                    :step="0.1"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大均值">
                  <InputNumber
                    v-model:value="ruleFormData.maxAvg"
                    :min="0"
                    :step="0.1"
                    class="w-full"
                  />
                </Form.Item>
              </Col>

              <Col :span="24">
                <Alert
                  message="可选过滤：仅统计分数满足条件的题目参与均值计算"
                  type="info"
                  show-icon
                  class="mb-3"
                />
                <Row :gutter="16">
                  <Col :span="8">
                    <Form.Item label="启用过滤">
                      <Switch v-model:checked="ruleFormData.enableFilter" />
                    </Form.Item>
                  </Col>
                  <Col :span="8">
                    <Form.Item label="比较操作">
                      <Select
                        v-model:value="ruleFormData.whenOperator"
                        :options="operatorOptions"
                        :disabled="!ruleFormData.enableFilter"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="8">
                    <Form.Item label="比较值">
                      <InputNumber
                        v-model:value="ruleFormData.whenValue"
                        :min="0"
                        :disabled="!ruleFormData.enableFilter"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
          </template>
          <!-- 分数区间规则（含七因子总分范围复用UI） -->
          <template
            v-if="
              currentRuleType === 'score_range' ||
              currentRuleType === 'seven_factors_score_range'
            "
          >
            <div class="space-y-4">
              <div
                v-for="(range, index) in ruleFormData.ranges || []"
                :key="index"
                class="rounded-lg border p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="font-medium">
                    {{
                      currentRuleType === 'seven_factors_score_range'
                        ? '七因子总分区间'
                        : '区间'
                    }}
                    {{ index + 1 }}
                  </h4>
                  <Button
                    v-if="(ruleFormData.ranges?.length || 0) > 1"
                    size="small"
                    danger
                    @click="removeCondition('score_range', index)"
                  >
                    删除
                  </Button>
                </div>
                <Row :gutter="16">
                  <Col :span="12">
                    <Form.Item
                      :label="
                        currentRuleType === 'seven_factors_score_range'
                          ? '最小总分'
                          : '最小分数'
                      "
                    >
                      <InputNumber
                        v-model:value="range.minScore"
                        :min="0"
                        addon-after="分"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="12">
                    <Form.Item
                      :label="
                        currentRuleType === 'seven_factors_score_range'
                          ? '最大总分'
                          : '最大分数'
                      "
                    >
                      <InputNumber
                        v-model:value="range.maxScore"
                        :min="0"
                        addon-after="分"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
              <Button type="dashed" block @click="addCondition('score_range')">
                <CirclePlus class="mr-2" />
                {{
                  currentRuleType === 'seven_factors_score_range'
                    ? '添加总分区间'
                    : '添加区间'
                }}
              </Button>
            </div>
          </template>

          <!-- 年龄性别与分数规则 -->
          <template v-else-if="currentRuleType === 'age_sex_score'">
            <div class="space-y-4">
              <div
                v-for="(condition, index) in ruleFormData.conditions || []"
                :key="index"
                class="rounded-lg border p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="font-medium">条件 {{ index + 1 }}</h4>
                  <Button
                    v-if="(ruleFormData.conditions?.length || 0) > 1"
                    size="small"
                    danger
                    @click="removeCondition('age_sex_score_condition', index)"
                  >
                    删除
                  </Button>
                </div>
                <Row :gutter="16">
                  <Col :span="8">
                    <Form.Item label="性别">
                      <Select
                        v-model:value="condition.sex"
                        :options="sexOptions"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="8">
                    <Form.Item label="最小年龄">
                      <InputNumber
                        v-model:value="condition.minAge"
                        :min="0"
                        :max="100"
                        addon-after="岁"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="8">
                    <Form.Item label="最大年龄">
                      <InputNumber
                        v-model:value="condition.maxAge"
                        :min="0"
                        :max="100"
                        addon-after="岁"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="12">
                    <Form.Item label="最小分数">
                      <InputNumber
                        v-model:value="condition.minScore"
                        :min="0"
                        addon-after="分"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="12">
                    <Form.Item label="最大分数">
                      <InputNumber
                        v-model:value="condition.maxScore"
                        :min="0"
                        addon-after="分"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
              <Button
                type="dashed"
                block
                @click="addCondition('age_sex_score_condition')"
              >
                <CirclePlus class="mr-2" />
                添加条件
              </Button>
            </div>
          </template>

          <!-- 最多选择规则 -->
          <template v-else-if="currentRuleType === 'most_choose'">
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label="目标分数" help="要统计的题目分数值">
                  <InputNumber
                    v-model:value="ruleFormData.questionScore"
                    :min="0"
                    addon-after="分"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="选择次数阈值" help="满足条件的题目数量阈值">
                  <InputNumber
                    v-model:value="ruleFormData.chooseCount"
                    :min="1"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>
          </template>

          <!-- 单题条件规则（支持分组） -->
          <template v-else-if="currentRuleType === 'single_question'">
            <div class="space-y-4">
              <div
                v-for="(group, gIndex) in ruleFormData.groups || []"
                :key="gIndex"
                class="rounded-lg border p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="font-medium">条件分组 {{ gIndex + 1 }}</h4>
                  <div class="flex items-center gap-2">
                    <Form.Item label="分组逻辑" class="mb-0">
                      <RadioGroup v-model:value="group.groupLogic" size="small">
                        <RadioButton value="or">OR</RadioButton>
                        <RadioButton value="and">AND</RadioButton>
                      </RadioGroup>
                    </Form.Item>
                    <Button
                      v-if="(ruleFormData.groups?.length || 0) > 1"
                      size="small"
                      danger
                      @click="ruleFormData.groups.splice(gIndex, 1)"
                    >
                      删除分组
                    </Button>
                  </div>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(condition, index) in group.conditions || []"
                    :key="index"
                    class="rounded border p-3"
                  >
                    <Row :gutter="16">
                      <Col :span="8">
                        <Form.Item label="题目编号">
                          <Select
                            v-model:value="condition.questionNumber"
                            :options="questionOptions"
                          />
                        </Form.Item>
                      </Col>
                      <Col :span="8">
                        <Form.Item label="比较操作">
                          <Select
                            v-model:value="condition.operator"
                            :options="operatorOptions"
                          />
                        </Form.Item>
                      </Col>
                      <Col :span="8">
                        <Form.Item label="比较值">
                          <InputNumber
                            v-model:value="condition.value"
                            :min="0"
                            class="w-full"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <div class="text-right">
                      <Button
                        v-if="(group.conditions?.length || 0) > 1"
                        size="small"
                        danger
                        @click="group.conditions.splice(index, 1)"
                      >
                        删除条件
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="dashed"
                    block
                    @click="
                      group.conditions.push({
                        questionNumber: 1,
                        operator: 'gt',
                        value: 0,
                      })
                    "
                  >
                    <CirclePlus class="mr-2" />
                    添加条件
                  </Button>
                </div>
              </div>

              <Button
                type="dashed"
                block
                @click="
                  (ruleFormData.groups || (ruleFormData.groups = [])).push({
                    groupLogic: 'or',
                    conditions: [
                      { questionNumber: 1, operator: 'gt', value: 0 },
                    ],
                  })
                "
              >
                <CirclePlus class="mr-2" />
                添加分组
              </Button>

              <Form.Item label="分组之间的逻辑">
                <RadioGroup
                  v-model:value="ruleFormData.topLogic"
                  button-style="solid"
                >
                  <RadioButton value="and">且 (AND)</RadioButton>
                  <RadioButton value="or">或 (OR)</RadioButton>
                </RadioGroup>
              </Form.Item>
            </div>
          </template>

          <!-- 多题求和规则（支持分组 + 顶层逻辑） -->
          <template v-else-if="currentRuleType === 'multi_question_sum'">
            <div class="space-y-4">
              <div
                v-for="(g, idx) in ruleFormData.groups || []"
                :key="idx"
                class="rounded-lg border p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="font-medium">求和条件 {{ idx + 1 }}</h4>
                  <Button
                    v-if="(ruleFormData.groups?.length || 0) > 1"
                    size="small"
                    danger
                    @click="ruleFormData.groups.splice(idx, 1)"
                  >
                    删除
                  </Button>
                </div>
                <Row :gutter="16">
                  <Col :span="8">
                    <Form.Item
                      label="标签 (可选)"
                      help="如：情感虐待、躯体虐待"
                    >
                      <Input v-model:value="g.label" />
                    </Form.Item>
                  </Col>
                  <Col :span="8">
                    <Form.Item
                      label="题目编号"
                      help="逗号分隔，如 3,8,14,18,25"
                    >
                      <Input v-model:value="g.questionNumbers" />
                    </Form.Item>
                  </Col>
                  <Col :span="4">
                    <Form.Item label="比较操作">
                      <Select
                        v-model:value="g.operator"
                        :options="operatorOptions"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="4">
                    <Form.Item label="阈值">
                      <InputNumber
                        v-model:value="g.threshold"
                        :min="0"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Button
                type="dashed"
                block
                @click="
                  (ruleFormData.groups || (ruleFormData.groups = [])).push({
                    questionNumbers: '1,2,3',
                    operator: 'gte',
                    threshold: 10,
                  })
                "
              >
                <CirclePlus class="mr-2" />
                添加求和条件
              </Button>

              <Form.Item label="分组之间的逻辑">
                <RadioGroup
                  v-model:value="ruleFormData.topLogic"
                  button-style="solid"
                >
                  <RadioButton value="and">且 (AND)</RadioButton>
                  <RadioButton value="or">或 (OR)</RadioButton>
                </RadioGroup>
              </Form.Item>
            </div>
          </template>

          <!-- 题干拼接(筛选) -->
          <template v-else-if="currentRuleType === 'question_filter_concat'">
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label="使用上方题目索引">
                  <Switch v-model:checked="ruleFormData.useSelectedIndex" />
                </Form.Item>
              </Col>
            </Row>
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label="题目编号" help="逗号分隔，如 1,3,5">
                  <Input
                    v-model:value="ruleFormData.questionNumbers"
                    :disabled="ruleFormData.useSelectedIndex"
                    placeholder="如：1,3,5"
                  />
                </Form.Item>
              </Col>
              <Col :span="6">
                <Form.Item label="比较操作">
                  <Select
                    v-model:value="ruleFormData.operator"
                    :options="operatorOptions"
                  />
                </Form.Item>
              </Col>
              <Col :span="6">
                <Form.Item label="比较值">
                  <InputNumber
                    v-model:value="ruleFormData.threshold"
                    :min="0"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item
                  label="匹配方式"
                  help="任意：有一题满足即命中；全部：所有题都需满足"
                >
                  <RadioGroup
                    v-model:value="ruleFormData.requireAll"
                    :options="[
                      { label: '任意一题满足', value: false },
                      { label: '全部题满足', value: true },
                    ]"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Alert
              message="根据比较条件筛选题目，将符合条件的题干拼接成等级名称"
              type="info"
              show-icon
            />
          </template>

          <!-- 自定义JSON规则 -->
          <template v-else-if="currentRuleType === 'custom_json'">
            <Alert
              message="支持后端基础表达式：and, or, cmp, range, count"
              type="info"
              show-icon
              class="mb-4"
            />
            <Form.Item label="JSON表达式">
              <Input.TextArea
                v-model:value="ruleFormData.jsonExpression"
                :rows="8"
                placeholder="例如：JSON表达式，如分数比较"
              />
            </Form.Item>
          </template>

          <!-- 分部分总分对比 -->
          <template v-else-if="currentRuleType === 'part_sum_compare'">
            <div class="space-y-6">
              <!-- 部分设置 -->
              <Card title="部分设置">
                <div
                  v-for="(p, idx) in ruleFormData.parts || []"
                  :key="idx"
                  class="mb-4 rounded-lg border p-4"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <h4 class="font-medium">{{ p.name }} 部分</h4>
                    <Button
                      v-if="(ruleFormData.parts?.length || 0) > 1"
                      size="small"
                      danger
                      @click="ruleFormData.parts.splice(idx, 1)"
                    >
                      删除部分
                    </Button>
                  </div>
                  <Row :gutter="16">
                    <Col :span="6">
                      <Form.Item label="部分Key">
                        <Input v-model:value="p.key" placeholder="如：A" />
                      </Form.Item>
                    </Col>
                    <Col :span="6">
                      <Form.Item label="部分名称">
                        <Input
                          v-model:value="p.name"
                          placeholder="如：注意力不集中"
                        />
                      </Form.Item>
                    </Col>
                    <Col :span="12">
                      <Form.Item
                        label="题目编号"
                        help="逗号分隔，如 1,2,3；或直接从上方题目索引选择"
                      >
                        <Input
                          v-model:value="p.questionIndex"
                          placeholder="如：1,2,3"
                        />
                        <div class="mt-1 text-gray-500">
                          <a-tooltip
                            :title="
                              formatQuestionIndex(
                                (p.questionIndex || '').split(','),
                              ).fullText
                            "
                          >
                            <span>
                              摘要：{{
                                formatQuestionIndex(
                                  (p.questionIndex || '').split(','),
                                ).text
                              }}
                            </span>
                          </a-tooltip>
                        </div>
                      </Form.Item>
                    </Col>
                  </Row>

                  <!-- 分段区间 -->
                  <div class="rounded-md bg-gray-50 p-3">
                    <div
                      v-for="(r, rIdx) in p.ranges || []"
                      :key="rIdx"
                      class="mb-3 rounded border bg-white p-3"
                    >
                      <div class="mb-2 flex items-center justify-between">
                        <h5 class="font-medium">区间 {{ rIdx + 1 }}</h5>
                        <Button
                          v-if="(p.ranges?.length || 0) > 1"
                          size="small"
                          danger
                          @click="p.ranges.splice(rIdx, 1)"
                        >
                          删除区间
                        </Button>
                      </div>
                      <Row :gutter="12">
                        <Col :span="6">
                          <Form.Item label="最小分数">
                            <InputNumber
                              v-model:value="r.min"
                              :min="0"
                              class="w-full"
                            />
                          </Form.Item>
                        </Col>
                        <Col :span="6">
                          <Form.Item label="最大分数">
                            <InputNumber
                              v-model:value="r.max"
                              :min="0"
                              class="w-full"
                            />
                          </Form.Item>
                        </Col>
                        <Col :span="6">
                          <Form.Item label="分段编码">
                            <Select
                              v-model:value="r.band"
                              :options="[
                                { label: 'LOW', value: 'LOW' },
                                { label: 'MID', value: 'MID' },
                                { label: 'HIGH', value: 'HIGH' },
                              ]"
                              allow-clear
                            />
                          </Form.Item>
                        </Col>
                        <Col :span="6">
                          <Form.Item label="严重度阶位">
                            <InputNumber
                              v-model:value="r.rank"
                              :min="1"
                              class="w-full"
                            />
                          </Form.Item>
                        </Col>
                        <Col :span="6">
                          <Form.Item label="风险等级">
                            <Select
                              v-model:value="r.riskLevel"
                              :options="[
                                { label: '无/低风险(1)', value: 1 },
                                { label: '轻度风险(2)', value: 2 },
                                { label: '中度风险(3)', value: 3 },
                                { label: '重度风险(4)', value: 4 },
                              ]"
                              allow-clear
                            />
                          </Form.Item>
                        </Col>
                        <Col :span="8">
                          <Form.Item label="等级">
                            <Input v-model:value="r.level" />
                          </Form.Item>
                        </Col>
                        <Col :span="8">
                          <Form.Item label="是否异常">
                            <Switch v-model:checked="r.isAbnormal" />
                          </Form.Item>
                        </Col>
                        <Col :span="24">
                          <Form.Item label="教师端评语">
                            <Input.TextArea
                              v-model:value="r.teacherComment"
                              :rows="2"
                            />
                          </Form.Item>
                        </Col>
                        <Col :span="24">
                          <Form.Item label="学生端评语">
                            <Input.TextArea
                              v-model:value="r.studentComment"
                              :rows="2"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                    <Button
                      type="dashed"
                      block
                      @click="
                        (p.ranges || (p.ranges = [])).push({
                          min: 0,
                          max: 100,
                          band: 'MID',
                          level: '',
                          rank: 1,
                          isAbnormal: false,
                        })
                      "
                    >
                      <CirclePlus class="mr-2" /> 添加区间
                    </Button>
                  </div>
                </div>

                <Button
                  type="dashed"
                  block
                  @click="
                    (ruleFormData.parts || (ruleFormData.parts = [])).push({
                      key: String.fromCharCode(
                        65 + (ruleFormData.parts?.length || 0),
                      ),
                      name: '',
                      questionIndex: '',
                      ranges: [
                        {
                          min: 0,
                          max: 100,
                          band: 'MID',
                          level: '',
                          rank: 1,
                          isAbnormal: false,
                        },
                      ],
                    })
                  "
                >
                  <CirclePlus class="mr-2" /> 添加部分
                </Button>
              </Card>

              <!-- 平分配置 -->
              <Card title="平分配置">
                <Row :gutter="16">
                  <Col :span="8">
                    <Form.Item label="平分优先策略">
                      <Select
                        v-model:value="
                          (ruleFormData.compare || (ruleFormData.compare = {}))
                            .tieBreak
                        "
                        :options="[
                          { label: '按原始总分', value: 'byScore' },
                          { label: '不比较总分', value: 'none' },
                        ]"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div class="rounded-lg border p-3">
                  <h4 class="mb-3 font-medium">按分段输出</h4>
                  <div
                    v-for="(b, i) in ruleFormData.compare?.onTie?.byBand ||
                    ((ruleFormData.compare.onTie = {
                      byBand: [],
                      fallback: {
                        level: '',
                        isAbnormal: false,
                        teacherComment: '',
                        studentComment: '',
                      },
                    }),
                    ruleFormData.compare.onTie.byBand)"
                    :key="i"
                    class="mb-3 rounded border p-3"
                  >
                    <Row :gutter="12">
                      <Col :span="6">
                        <Form.Item label="分段编码">
                          <Select
                            v-model:value="b.band"
                            :options="[
                              { label: 'LOW', value: 'LOW' },
                              { label: 'MID', value: 'MID' },
                              { label: 'HIGH', value: 'HIGH' },
                            ]"
                          />
                        </Form.Item>
                      </Col>
                      <Col :span="6">
                        <Form.Item label="等级">
                          <Input v-model:value="b.level" />
                        </Form.Item>
                      </Col>
                      <Col :span="6">
                        <Form.Item label="是否异常">
                          <Switch v-model:checked="b.isAbnormal" />
                        </Form.Item>
                      </Col>
                      <Col :span="6">
                        <Form.Item label="风险等级">
                          <Select
                            v-model:value="b.riskLevel"
                            :options="[
                              { label: '无/低风险(1)', value: 1 },
                              { label: '轻度风险(2)', value: 2 },
                              { label: '中度风险(3)', value: 3 },
                              { label: '重度风险(4)', value: 4 },
                            ]"
                            allow-clear
                          />
                        </Form.Item>
                      </Col>
                      <Col :span="24">
                        <Form.Item label="教师端评语">
                          <Input.TextArea
                            v-model:value="b.teacherComment"
                            :rows="2"
                          />
                        </Form.Item>
                      </Col>
                      <Col :span="24">
                        <Form.Item label="学生端评语">
                          <Input.TextArea
                            v-model:value="b.studentComment"
                            :rows="2"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                  <Button
                    type="dashed"
                    block
                    @click="
                      (
                        ruleFormData.compare.onTie.byBand ||
                        (ruleFormData.compare.onTie.byBand = [])
                      ).push({
                        band: 'MID',
                        level: '',
                        isAbnormal: false,
                        teacherComment: '',
                        studentComment: '',
                      })
                    "
                  >
                    <CirclePlus class="mr-2" /> 添加分段规则
                  </Button>
                </div>
              </Card>

              <!-- 输出设置 -->
              <Card title="输出设置">
                <Row :gutter="16">
                  <Col :span="8">
                    <Form.Item label="继承胜出部分">
                      <Switch
                        v-model:checked="
                          (ruleFormData.output || (ruleFormData.output = {}))
                            .inheritWinner
                        "
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="8">
                    <Form.Item label="显示胜出部分名称">
                      <Switch
                        v-model:checked="
                          (
                            ruleFormData.output.extra ||
                            (ruleFormData.output.extra = {})
                          ).showWinnerPartName
                        "
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </div>
          </template>
        </Card>

        <!-- 规则预览 -->
        <Card title="规则预览" class="mb-6">
          <Alert :message="rulePreview" type="info" show-icon />
        </Card>

        <!-- 结果配置 -->
        <Card title="结果配置" class="mb-6">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="匹配优先级" help="数字越小优先匹配，默认1">
                <InputNumber
                  v-model:value="resultConfig.matchOrder"
                  :min="0"
                  class="w-full"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="评级等级" required>
                <Input
                  v-model:value="resultConfig.level"
                  placeholder="如：轻度、中度、重度"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="是否可多命中">
                <Switch
                  v-model:checked="resultConfig.isMultiHit as any"
                  :checked-value="1"
                  :un-checked-value="0"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="是否异常">
                <Switch v-model:checked="resultConfig.isAbnormal" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="风险等级">
                <Select
                  v-model:value="resultConfig.riskLevel"
                  :options="riskLevelOptions"
                  placeholder="请选择风险等级"
                  allow-clear
                />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="配置描述">
                <Input.TextArea
                  v-model:value="resultConfig.message"
                  placeholder="请输入此配置的描述（用途、提示等）"
                  :rows="2"
                />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="教师端评语">
                <Input.TextArea
                  v-model:value="resultConfig.teacherComment"
                  placeholder="请输入教师端评语"
                  :rows="3"
                />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="学生端评语">
                <Select
                  v-model:value="resultConfig.studentComments"
                  mode="tags"
                  placeholder="请输入学生端评语，支持多条"
                  class="w-full"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <!-- 操作按钮 -->
        <div class="flex justify-center gap-4">
          <Button type="primary" size="large" @click="handleSave">
            保存配置
          </Button>
          <Button size="large" @click="handleCancel">取消</Button>
        </div>
      </Form>
    </div>
  </FormDialog>
</template>
