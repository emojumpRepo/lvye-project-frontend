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
} from 'ant-design-vue';

import { QUESTIONNAIRE_CONFIG_CALCULATE_TYPE } from '#/api/constants';
import {
  createQuestionnaireResultConfig,
  updateQuestionnaireResultConfig,
} from '#/api/psychology/questionnaire/index';

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
  // 处理新格式：{"range": {"target": "totalScore", "min": 0, "max": 21}}
  if (formula.range && formula.range.target === 'totalScore') {
    return {
      ranges: [
        {
          minScore: formula.range.min || 0,
          maxScore: formula.range.max || 100,
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
        maxScore: rangeObj.range?.max || 100,
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
          maxScore: formula.maxScore || 100,
          level: config.level || '',
          isAbnormal: config.isAbnormal === 1,
        },
      ],
    };
  }

  // 默认值
  return {
    ranges: [{ minScore: 0, maxScore: 100, level: '', isAbnormal: false }],
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
  // 单纯的 range + totalScore = score_range
  if (formula.range && formula.range.target === 'totalScore') {
    return 'score_range';
  }

  // or + range = score_range (多区间)
  if (
    formula.or &&
    Array.isArray(formula.or) &&
    formula.or[0]?.range?.target === 'totalScore'
  ) {
    return 'score_range';
  }

  // count + cmp = most_choose
  if (formula.cmp?.lhs?.count) {
    return 'most_choose';
  }

  // cmp + var = multi_question_sum 或者 single_question
  if (formula.cmp?.lhs?.var === 'totalScore') {
    return 'multi_question_sum';
  }

  if (formula.cmp?.lhs?.q) {
    return 'single_question';
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
    case 'multi_question_sum': {
      return parseMultiQuestionSumFormula(formula);
    }
    case 'score_range': {
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

// 解析单题条件公式
function parseSingleQuestionFormula(formula: any) {
  const conditions: any[] = [];

  if (formula.cmp && formula.cmp.lhs && formula.cmp.lhs.q) {
    // 单个条件
    const qNumber = formula.cmp.lhs.q.replace('Q', '');
    conditions.push({
      questionNumber: Number.parseInt(qNumber),
      operator: formula.cmp.op,
      value: formula.cmp.rhs,
    });
  } else if (formula.and || formula.or) {
    // 多个条件
    const logic = formula.and ? 'and' : 'or';
    const condArray = formula.and || formula.or;

    for (const cond of condArray) {
      if (cond.cmp?.lhs?.q) {
        const qNumber = cond.cmp.lhs.q.replace('Q', '');
        conditions.push({
          questionNumber: Number.parseInt(qNumber),
          operator: cond.cmp.op,
          value: cond.cmp.rhs,
        });
      }
    }

    return { conditions, logic };
  }

  return {
    conditions:
      conditions.length > 0
        ? conditions
        : [{ questionNumber: 1, operator: 'gt', value: 0 }],
    logic: 'or',
  };
}

// 解析多题求和公式
function parseMultiQuestionSumFormula(formula: any) {
  if (formula.cmp && formula.cmp.lhs && formula.cmp.lhs.var === 'totalScore') {
    return {
      questionNumbers: '1,2,3', // 默认值，实际应该从某处获取
      operator: formula.cmp.op,
      threshold: formula.cmp.rhs,
    };
  }

  return {
    questionNumbers: '1,2,3',
    operator: 'gte',
    threshold: 10,
  };
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
  if (!studentComments || studentComments.length === 0) return '';
  const validComments = studentComments.filter(
    (comment) => comment && comment.trim(),
  );
  return validComments.length > 0 ? JSON.stringify(validComments) : '';
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

      case 'multi_question_sum': {
        return `题目${ruleFormData.value.questionNumbers}求和${getOperatorText(ruleFormData.value.operator)}${ruleFormData.value.threshold}`;
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

      case 'single_question': {
        if (!ruleFormData.value.conditions?.length) return '请配置题目条件';
        return ruleFormData.value.conditions
          .map(
            (c: any) =>
              `Q${c.questionNumber} ${getOperatorText(c.operator)} ${c.value}`,
          )
          .join(ruleFormData.value.logic === 'and' ? ' AND ' : ' OR ');
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
    case 'multi_question_sum': {
      ruleFormData.value = {
        questionNumbers: '1,2,3',
        operator: 'gte',
        threshold: 10,
      };
      break;
    }
    case 'score_range': {
      ruleFormData.value = {
        ranges: [{ minScore: 0, maxScore: 100, level: '', isAbnormal: false }],
      };
      break;
    }
    case 'single_question': {
      ruleFormData.value = {
        conditions: [{ questionNumber: 1, operator: 'gt', value: 0 }],
        logic: 'or',
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

    case 'score_range': {
      if (ruleFormData.value.ranges?.length === 1) {
        const range = ruleFormData.value.ranges[0];
        return {
          range: {
            target: 'totalScore',
            min: range.minScore,
            max: range.maxScore,
          },
        };
      } else {
        return {
          or:
            ruleFormData.value.ranges?.map((range: any) => ({
              range: {
                target: 'totalScore',
                min: range.minScore,
                max: range.maxScore,
              },
            })) || [],
        };
      }
    }

    case 'age_sex_score': {
      // 将年龄性别条件转换为基础表达式，平铺所有条件
      const allConditions: any[] = [];

      ruleFormData.value.conditions?.forEach((condition: any) => {
        if (condition.sex === 1) {
          // 只生成男性条件
          const maleCondition = {
            and: [
              { cmp: { lhs: { var: 'sex' }, op: '==', rhs: 1 } },
              {
                range: {
                  target: 'age',
                  min: condition.minAge,
                  max: condition.maxAge,
                },
              },
              {
                range: {
                  target: 'totalScore',
                  min: condition.minScore,
                  max: condition.maxScore,
                },
              },
            ],
          };
          allConditions.push(maleCondition);
        } else if (condition.sex === 2) {
          // 只生成女性条件
          const femaleCondition = {
            and: [
              { cmp: { lhs: { var: 'sex' }, op: '==', rhs: 2 } },
              {
                range: {
                  target: 'age',
                  min: condition.minAge,
                  max: condition.maxAge,
                },
              },
              {
                range: {
                  target: 'totalScore',
                  min: condition.minScore,
                  max: condition.maxScore,
                },
              },
            ],
          };
          allConditions.push(femaleCondition);
        } else {
          // sex = 0 (不限性别)，生成男女两个条件
          const maleCondition = {
            and: [
              { cmp: { lhs: { var: 'sex' }, op: '==', rhs: 1 } },
              {
                range: {
                  target: 'age',
                  min: condition.minAge,
                  max: condition.maxAge,
                },
              },
              {
                range: {
                  target: 'totalScore',
                  min: condition.minScore,
                  max: condition.maxScore,
                },
              },
            ],
          };

          const femaleCondition = {
            and: [
              { cmp: { lhs: { var: 'sex' }, op: '==', rhs: 2 } },
              {
                range: {
                  target: 'age',
                  min: condition.minAge,
                  max: condition.maxAge,
                },
              },
              {
                range: {
                  target: 'totalScore',
                  min: condition.minScore,
                  max: condition.maxScore,
                },
              },
            ],
          };

          allConditions.push(maleCondition, femaleCondition);
        }
      });

      return allConditions.length === 1
        ? allConditions[0]
        : { or: allConditions };
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

    case 'multi_question_sum': {
      // 多题求和：先求和再比较
      return {
        cmp: {
          lhs: { var: 'totalScore' }, // 后端会计算指定题目的总分
          op: ruleFormData.value.operator || '>=',
          rhs: ruleFormData.value.threshold || 0,
        },
      };
    }

    case 'single_question': {
      const conditions =
        ruleFormData.value.conditions?.map((c: any) => ({
          cmp: {
            lhs: { q: `Q${c.questionNumber}` },
            op: c.operator,
            rhs: c.value,
          },
        })) || [];

      return conditions.length === 1
        ? conditions[0]
        : {
            [ruleFormData.value.logic || 'or']: conditions,
          };
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
    default: {
      return QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE;
    }
  }
}

// 保存配置
async function handleSave() {
  try {
    if (!resultConfig.value.level?.trim()) {
      throw new Error('请输入评级等级');
    }

    // 所有规则类型都生成符合后端要求的基础表达式
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
          <!-- 分数区间规则 -->
          <template v-if="currentRuleType === 'score_range'">
            <div class="space-y-4">
              <div
                v-for="(range, index) in ruleFormData.ranges || []"
                :key="index"
                class="rounded-lg border p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="font-medium">区间 {{ index + 1 }}</h4>
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
                    <Form.Item label="最小分数">
                      <InputNumber
                        v-model:value="range.minScore"
                        :min="0"
                        addon-after="分"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="12">
                    <Form.Item label="最大分数">
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
                添加区间
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

          <!-- 单题条件规则 -->
          <template v-else-if="currentRuleType === 'single_question'">
            <div class="space-y-4">
              <div
                v-for="(condition, index) in ruleFormData.conditions || []"
                :key="index"
                class="rounded-lg border p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="font-medium">题目条件 {{ index + 1 }}</h4>
                  <Button
                    v-if="(ruleFormData.conditions?.length || 0) > 1"
                    size="small"
                    danger
                    @click="removeCondition('single_question_condition', index)"
                  >
                    删除
                  </Button>
                </div>
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
              </div>
              <Button
                type="dashed"
                block
                @click="addCondition('single_question_condition')"
              >
                <CirclePlus class="mr-2" />
                添加题目条件
              </Button>
              <Form.Item label="条件逻辑">
                <RadioGroup
                  v-model:value="ruleFormData.logic"
                  button-style="solid"
                >
                  <RadioButton value="or">或 (OR) - 满足任一条件</RadioButton>
                  <RadioButton value="and">且 (AND) - 满足所有条件</RadioButton>
                </RadioGroup>
              </Form.Item>
            </div>
          </template>

          <!-- 多题求和规则 -->
          <template v-else-if="currentRuleType === 'multi_question_sum'">
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item
                  label="题目编号"
                  help="输入要求和的题目编号，用逗号分隔"
                >
                  <Input
                    v-model:value="ruleFormData.questionNumbers"
                    placeholder="如：1,3,5,7,9"
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
                <Form.Item label="阈值">
                  <InputNumber
                    v-model:value="ruleFormData.threshold"
                    :min="0"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>
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
        </Card>

        <!-- 规则预览 -->
        <Card title="规则预览" class="mb-6">
          <Alert :message="rulePreview" type="info" show-icon />
        </Card>

        <!-- 结果配置 -->
        <Card title="结果配置" class="mb-6">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="评级等级" required>
                <Input
                  v-model:value="resultConfig.level"
                  placeholder="如：轻度、中度、重度"
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
