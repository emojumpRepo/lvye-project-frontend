<script setup lang="ts">
import type {
  QuestionnaireConfigBaseVO,
  QuestionnaireConfigVO,
} from '#/api/psychology/questionnaire/index';

import { computed, ref, watch } from 'vue';

import { CircleMinus, CirclePlus } from '@vben/icons';

import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  RadioButton,
  RadioGroup,
  Row,
  Select,
} from 'ant-design-vue';

import { QUESTIONNAIRE_CONFIG_CALCULATE_TYPE } from '#/api/constants';
import {
  createQuestionnaireConfig,
  updateQuestionnaireConfig,
} from '#/api/psychology/questionnaire/index';

import { parseFormulaToFormData } from '../utils/formula-parser';

interface Props {
  title?: string;
  // 问卷ID
  questionnaireId?: number;
  // 当前选中的配置（编辑态）
  selectedConfig?: null | QuestionnaireConfigVO;
  // 问卷题目数量，用于生成题目索引选项
  questionCount?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void;
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const open = defineModel<boolean>('open');

const formRef = ref();

function createDefaultForm() {
  return {
    questionnaireId: props.questionnaireId || 0,
    dimensionName: '',
    questionIndex: [] as string[],
    calculateType: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE,
    minScore: undefined as number | undefined,
    maxScore: undefined as number | undefined,
    ageSexRules: [
      {
        maleMinAge: undefined as number | undefined,
        maleMaxAge: undefined as number | undefined,
        maleMinScore: undefined as number | undefined,
        maleMaxScore: undefined as number | undefined,
        femaleMinAge: undefined as number | undefined,
        femaleMaxAge: undefined as number | undefined,
        femaleMinScore: undefined as number | undefined,
        femaleMaxScore: undefined as number | undefined,
        _id: Date.now(),
      },
    ],
    questionScore: undefined as number | undefined,
    minThreshold: undefined as number | undefined,
    teacherComment: '',
    studentComment: '',
  };
}

const formData = ref<Record<string, any>>(createDefaultForm());

// 当选中记录或问卷ID变化时，初始化表单
watch(
  () => [props.selectedConfig, props.questionnaireId, open.value],
  () => {
    if (open.value) {
      formData.value = props.selectedConfig
        ? ({ ...createDefaultForm(), ...props.selectedConfig } as any)
        : createDefaultForm();

      formData.value.questionIndex =
        props.selectedConfig?.questionIndex === ALL_INDEX_VALUE
          ? [ALL_INDEX_VALUE]
          : props.selectedConfig?.questionIndex.split(',') || [];

      // 如果是编辑模式，解析计算公式
      if (props.selectedConfig) {
        const formDataFromFormula = parseFormulaToFormData(
          props.selectedConfig.calculateFormula,
          props.selectedConfig.calculateType,
        );
        Object.assign(formData.value, formDataFromFormula);
      }
    }
  },
  { immediate: true },
);

// ================================ 动态校验区间 ================================
// 动态校验区间：根据计算类型要求当前显示字段全部必填，并做区间校验
function requiredRule(message: string) {
  return { required: true, message } as const;
}

function rangeValidator(
  minKey: keyof typeof formData.value,
  maxKey: keyof typeof formData.value,
  label: string,
) {
  return async (_: any, _val: any) => {
    const min = (formData.value as any)[minKey];
    const max = (formData.value as any)[maxKey];
    if (min > max) {
      throw new Error(`${label}最小值不能大于最大值`);
    }
  };
}

// 校验单个区间的所有字段
function validateSingleRule(rule: any, ruleIndex: number) {
  const requiredFields: Array<[keyof typeof rule, string]> = [
    ['maleMinAge', `区间${ruleIndex + 1} 男生最低年龄`],
    ['maleMaxAge', `区间${ruleIndex + 1} 男生最高年龄`],
    ['maleMinScore', `区间${ruleIndex + 1} 男生最低分数`],
    ['maleMaxScore', `区间${ruleIndex + 1} 男生最高分数`],
    ['femaleMinAge', `区间${ruleIndex + 1} 女生最低年龄`],
    ['femaleMaxAge', `区间${ruleIndex + 1} 女生最高年龄`],
    ['femaleMinScore', `区间${ruleIndex + 1} 女生最低分数`],
    ['femaleMaxScore', `区间${ruleIndex + 1} 女生最高分数`],
  ];

  for (const [k, label] of requiredFields) {
    if (rule[k] === undefined || rule[k] === null) {
      throw new Error(`${label}必填`);
    }
    if (typeof rule[k] !== 'number') {
      throw new TypeError(`${label}必须为数字`);
    }
  }

  if (rule.maleMinAge > rule.maleMaxAge) {
    throw new Error(`区间${ruleIndex + 1} 男生年龄最小值不能大于最大值`);
  }
  if (rule.maleMinScore > rule.maleMaxScore) {
    throw new Error(`区间${ruleIndex + 1} 男生分数最小值不能大于最大值`);
  }
  if (rule.femaleMinAge > rule.femaleMaxAge) {
    throw new Error(`区间${ruleIndex + 1} 女生年龄最小值不能大于最大值`);
  }
  if (rule.femaleMinScore > rule.femaleMaxScore) {
    throw new Error(`区间${ruleIndex + 1} 女生分数最小值不能大于最大值`);
  }
}

// 校验区间数组
function rulesArrayValidator() {
  return async (_: any, _value: any) => {
    const rules = (formData.value as any).ageSexRules as any[];
    if (!Array.isArray(rules) || rules.length === 0) {
      throw new Error('请至少添加一条区间');
    }
    for (const [i, rule] of rules.entries()) {
      validateSingleRule(rule, i);
    }
  };
}

const dynamicRules = computed(() => {
  const base: Record<string, any[]> = {
    dimensionName: [requiredRule('请输入维度名称')],
    questionIndex: [requiredRule('请选择题目索引')],
    calculateType: [requiredRule('请选择计算类型')],
    teacherComment: [requiredRule('请输入教师端评语')],
    studentComment: [requiredRule('请输入学生端评语')],
  };

  const type = formData.value.calculateType;
  if (type === QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE) {
    base.minScore = [requiredRule('请输入最低分数')];
    base.maxScore = [
      requiredRule('请输入最高分数'),
      { validator: rangeValidator('minScore', 'maxScore', '分数') },
    ];
  }

  if (type === QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE) {
    // 只在年龄性别与分数区间类型时添加 ageSexRules 校验
    base.ageSexRules = [{ validator: rulesArrayValidator() }];
  }

  if (type === QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE) {
    base.questionScore = [requiredRule('请输入分数值')];
    base.minThreshold = [requiredRule('请输入次数阈值')];
  }

  return base;
});

// ================================ 题目索引多选 ================================
// 题目索引多选：选项列表（包含“全部”）
const ALL_INDEX_VALUE = 'all';
const questionIndexOptions = computed(() => {
  const total = Number(props.questionCount || 0);
  const indexes = Array.from({ length: total }, (_, i) => ({
    label: String(i + 1),
    value: String(i + 1),
  }));
  return [{ label: '全部', value: ALL_INDEX_VALUE }, ...indexes];
});

function handleQuestionIndexChange(value: any) {
  const values = (value ?? []) as string[];
  if (!Array.isArray(values)) return;
  if (values.includes(ALL_INDEX_VALUE)) {
    // 只保留“全部”
    (formData.value as any).questionIndex = [ALL_INDEX_VALUE];
  } else {
    // 移除“全部”
    (formData.value as any).questionIndex = values.filter(
      (v) => v !== ALL_INDEX_VALUE,
    );
  }
}

/**
 * 构建保存请求的 payload 参数
 */
function buildSavePayload() {
  const payload: QuestionnaireConfigBaseVO = {
    questionnaireId: props.questionnaireId || 0,
    dimensionName: formData.value.dimensionName,
    questionIndex: '',
    calculateType: formData.value.calculateType,
    calculateFormula: formatCalculateFormula(),
    teacherComment: formData.value.teacherComment,
    studentComment: formData.value.studentComment,
    isAbnormal: formData.value.isAbnormal,
  };

  payload.questionIndex =
    formData.value.questionIndex[0] === ALL_INDEX_VALUE
      ? questionIndexOptions.value
          .filter((v) => v.value !== ALL_INDEX_VALUE)
          .map((v) => v.value)
          .sort((a, b) => Number(a) - Number(b))
          .join(',')
      : formData.value.questionIndex
          .sort((a: string, b: string) => Number(a) - Number(b))
          .join(',');

  return payload;
}

async function handleSave() {
  try {
    // 先进行基础字段校验
    await formRef.value?.validate();

    // 手动进行 ageSexRules 校验
    if (
      formData.value.calculateType ===
      QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE
    ) {
      const rules = (formData.value as any).ageSexRules as any[];

      if (!Array.isArray(rules) || rules.length === 0) {
        throw new Error('请至少添加一条区间');
      }

      for (const [i, rule] of rules.entries()) {
        validateSingleRule(rule, i);
      }
    }

    const payload = buildSavePayload();

    if (props.selectedConfig && (props.selectedConfig as any).id) {
      await updateQuestionnaireConfig({
        id: (props.selectedConfig as any).id,
        createTime: (props.selectedConfig as any).createTime,
        ...payload,
      });
      message.success('更新成功');
    } else {
      await createQuestionnaireConfig(payload);
      message.success('创建成功');
    }
    emit('update:open', false);
    emit('success');
  } catch (error) {
    // 显示具体的校验错误信息
    if (error instanceof Error) {
      message.error(error.message);
    } else if (error && typeof error === 'object' && 'errorFields' in error) {
      // 处理 Ant Design Vue 的校验错误对象
      const errorFields = (error as any).errorFields;
      if (errorFields && errorFields.length > 0) {
        const firstError = errorFields[0];
        const errorMessage = firstError.errors?.[0] || '校验失败';
        message.error(errorMessage);
      } else {
        message.error('校验失败');
      }
    }
    return false;
  }
}

// 格式化计算公式
function formatCalculateFormula() {
  const type = formData.value.calculateType;
  let formula: any;
  switch (type) {
    case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE: {
      const rules = (formData.value as any).ageSexRules as any[];
      formula = rules.flatMap((r) => [
        {
          sex: 1,
          minAge: r.maleMinAge,
          maxAge: r.maleMaxAge,
          minScore: r.maleMinScore,
          maxScore: r.maleMaxScore,
        },
        {
          sex: 2,
          minAge: r.femaleMinAge,
          maxAge: r.femaleMaxAge,
          minScore: r.femaleMinScore,
          maxScore: r.femaleMaxScore,
        },
      ]);

      break;
    }
    case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE: {
      formula = {
        questionScore: formData.value.questionScore,
        chooseCount: formData.value.minThreshold,
      };

      break;
    }
    case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE: {
      formula = {
        minScore: formData.value.minScore,
        maxScore: formData.value.maxScore,
      };

      break;
    }
    default: {
      formula = {};
      break;
    }
  }

  return JSON.stringify(formula);
}

function handleCancel() {
  formRef.value?.resetFields();
  emit('cancel');
  emit('update:open', false);
}

function validate() {
  return formRef.value?.validate();
}

function resetFields() {
  return formRef.value?.resetFields();
}

defineExpose({ validate, resetFields });
</script>

<template>
  <Modal
    :open="open"
    :title="props.title || '评分配置'"
    width="50%"
    :footer="null"
    @update:open="(v: boolean) => (open = v)"
  >
    <div class="w-full px-4 pt-4">
      <Form
        ref="formRef"
        :model="formData"
        :rules="dynamicRules"
        layout="horizontal"
      >
        <Row :gutter="16">
          <Col :span="24">
            <Form.Item label="维度名称" name="dimensionName">
              <Input
                v-model:value="formData.dimensionName"
                placeholder="请输入维度名称"
              />
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item label="题目索引" name="questionIndex">
              <Select
                v-model:value="(formData as any).questionIndex"
                mode="multiple"
                :max-tag-count="10"
                :options="questionIndexOptions"
                :placeholder="`请选择题目索引（共 ${props.questionCount || 0} 题）`"
                @change="handleQuestionIndexChange"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="计算类型" name="calculateType">
              <Select
                v-model:value="formData.calculateType"
                :options="[
                  {
                    label: '分数区间',
                    value: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE,
                  },
                  {
                    label: '年龄性别与分数区间',
                    value: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE,
                  },
                  {
                    label: '最多选择',
                    value: QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE,
                  },
                ]"
              />
            </Form.Item>
          </Col>
        </Row>

        <!-- 分数区间 -->
        <Row
          v-show="
            formData.calculateType === QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE
          "
          :gutter="16"
        >
          <Col :span="12">
            <Form.Item label="最低分数" name="minScore">
              <InputNumber
                v-model:value="formData.minScore"
                class="w-full"
                addon-after="分"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="最高分数" name="maxScore">
              <InputNumber
                v-model:value="formData.maxScore"
                class="w-full"
                addon-after="分"
              />
            </Form.Item>
          </Col>
        </Row>

        <!-- 年龄性别与分数区间：年龄一行，分数一行，男女各两项 -->
        <template
          v-if="
            formData.calculateType ===
            QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE
          "
        >
          <div class="rules-wrap">
            <div
              v-for="(rule, idx) in (formData as any).ageSexRules"
              :key="rule._id"
              class="rule-card"
            >
              <div class="flex items-center justify-between">
                <div class="rule-title">区间 {{ idx + 1 }}</div>
                <CircleMinus
                  v-if="(formData as any).ageSexRules.length > 1"
                  class="size-4 cursor-pointer hover:text-red-500"
                  @click="(formData as any).ageSexRules.splice(idx, 1)"
                />
              </div>

              <Row :gutter="12">
                <Col :span="24">
                  <div class="custom-form-label">男生配置</div>
                  <div class="custom-form-item">
                    <div class="custom-form-item-content">
                      <Form.Item :name="['ageSexRules', idx, 'maleMinAge']">
                        <InputNumber
                          v-model:value="rule.maleMinAge"
                          :min="0"
                          :max="100"
                          placeholder="最低年龄"
                          addon-after="岁"
                        />
                      </Form.Item>
                      <Form.Item>
                        <span class="mx-2">~</span>
                      </Form.Item>
                      <Form.Item :name="['ageSexRules', idx, 'maleMaxAge']">
                        <InputNumber
                          v-model:value="rule.maleMaxAge"
                          :min="0"
                          :max="100"
                          placeholder="最高年龄"
                          addon-after="岁"
                        />
                      </Form.Item>
                    </div>
                    <div class="custom-form-item-content">
                      <Form.Item :name="['ageSexRules', idx, 'maleMinScore']">
                        <InputNumber
                          v-model:value="rule.maleMinScore"
                          :min="0"
                          :max="9999"
                          placeholder="最低分数"
                          addon-after="分"
                        />
                      </Form.Item>
                      <Form.Item>
                        <span class="mx-2 leading-none">~</span>
                      </Form.Item>
                      <Form.Item :name="['ageSexRules', idx, 'maleMaxScore']">
                        <InputNumber
                          v-model:value="rule.maleMaxScore"
                          :min="0"
                          :max="9999"
                          placeholder="最高分数"
                          addon-after="分"
                        />
                      </Form.Item>
                    </div>
                  </div>
                </Col>
                <Col :span="24">
                  <div class="custom-form-label">女生配置</div>
                  <div class="custom-form-item">
                    <div class="custom-form-item-content">
                      <Form.Item :name="['ageSexRules', idx, 'femaleMinAge']">
                        <InputNumber
                          v-model:value="rule.femaleMinAge"
                          :min="0"
                          :max="100"
                          placeholder="最低年龄"
                          addon-after="岁"
                        />
                      </Form.Item>
                      <Form.Item>
                        <span class="mx-2 leading-none">~</span>
                      </Form.Item>
                      <Form.Item :name="['ageSexRules', idx, 'femaleMaxAge']">
                        <InputNumber
                          v-model:value="rule.femaleMaxAge"
                          :min="0"
                          :max="100"
                          placeholder="最高年龄"
                          addon-after="岁"
                        />
                      </Form.Item>
                    </div>
                    <div class="custom-form-item-content">
                      <Form.Item :name="['ageSexRules', idx, 'femaleMinScore']">
                        <InputNumber
                          v-model:value="rule.femaleMinScore"
                          :min="0"
                          :max="9999"
                          placeholder="最低分数"
                          addon-after="分"
                        />
                      </Form.Item>
                      <Form.Item>
                        <span class="mx-2 leading-none">~</span>
                      </Form.Item>
                      <Form.Item :name="['ageSexRules', idx, 'femaleMaxScore']">
                        <InputNumber
                          v-model:value="rule.femaleMaxScore"
                          :min="0"
                          :max="9999"
                          placeholder="最高分数"
                          addon-after="分"
                        />
                      </Form.Item>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            <div class="mb-6">
              <Button
                type="dashed"
                block
                @click="
                  (formData as any).ageSexRules.push({
                    maleMinAge: undefined,
                    maleMaxAge: undefined,
                    maleMinScore: undefined,
                    maleMaxScore: undefined,
                    femaleMinAge: undefined,
                    femaleMaxAge: undefined,
                    femaleMinScore: undefined,
                    femaleMaxScore: undefined,
                    _id: Date.now(),
                  })
                "
              >
                <div class="flex items-center justify-center gap-2">
                  <CirclePlus class="size-4" />
                  添加区间
                </div>
              </Button>
            </div>
          </div>
        </template>

        <!-- 最多选择 -->
        <Row
          v-show="
            formData.calculateType ===
            QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE
          "
          :gutter="16"
        >
          <Col :span="12">
            <Form.Item label="分数值" name="questionScore">
              <InputNumber
                v-model:value="formData.questionScore"
                class="w-full"
                addon-after="分"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="次数阈值" name="minThreshold">
              <InputNumber
                v-model:value="formData.minThreshold"
                class="w-full"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="24">
            <Form.Item label="是否为异常因子配置" name="teacherComment">
              <RadioGroup
                v-model:value="formData.isAbnormal"
                button-style="solid"
              >
                <RadioButton :value="1">是</RadioButton>
                <RadioButton :value="0">否</RadioButton>
              </RadioGroup>
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item label="教师端评语" name="teacherComment">
              <Input.TextArea
                v-model:value="formData.teacherComment"
                placeholder="请输入教师端评语"
                :rows="3"
              />
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item label="学生端评语" name="studentComment">
              <Input.TextArea
                v-model:value="formData.studentComment"
                placeholder="请输入学生端评语"
                :rows="3"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row class="justify-center gap-6">
          <Button type="primary" @click="handleSave">保存</Button>
          <Button @click="handleCancel">取消</Button>
        </Row>
      </Form>
    </div>
  </Modal>
</template>
<style scoped lang="scss">
.rules-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .rule-card {
    padding: 12px 12px 16px;
    background: #fff;
    border: 1px solid #e5e7eb; // gray-200
    border-radius: 10px;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 4%);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    .rule-title {
      font-weight: 600;
      color: #111827; // gray-900
    }

    &:hover {
      border-color: #d1d5db; // gray-300
      box-shadow: 0 2px 6px 0 rgb(0 0 0 / 6%);
    }
  }
}

.custom-form-label {
  @apply my-3 flex items-center;

  &::before {
    display: inline-block;
    margin-inline-end: 4px;
    font-family: SimSun, sans-serif;
    font-size: 14px;
    line-height: 1;
    color: #ff3860;
    content: '*';
  }
}

.custom-form-item {
  @apply flex items-center justify-around gap-6;

  .custom-form-item-content {
    @apply flex items-center;

    :deep(.ant-form-item) {
      margin-bottom: 0;
    }
  }
}
</style>
