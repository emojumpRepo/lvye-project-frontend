<script setup lang="ts">
import type { AssessmentScenario } from '@vben/types';

import type {
  AbnormalFactorAggregationConfig,
  CalculateStrategyType,
} from './data';

import type { AssessmentResultConfigDO } from '#/api/psychology/assessment-result-config';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CirclePlus } from '@vben/icons';
import { riskLevelOptions } from '@vben/types';

import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  createAssessmentResultConfig,
  deleteAssessmentResultConfig,
  getAssessmentResultConfigsByScenarioId,
  updateAssessmentResultConfig,
} from '#/api/psychology/assessment-result-config';
import { getAssessmentDimensionsByScenario } from '#/api/psychology/questionnaire/index';
import RichTextEditor from '#/components/Common/RichTextEditor.vue';

interface Emits {
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const selectedScenario = ref<AssessmentScenario | null>(null);
const loading = ref(false);
const dimensionOptions = ref<{ label: string; value: string }[]>([]);

// 策略类型配置
const strategyTypes = [
  {
    value: 'abnormalFactorAggregation',
    label: '异常因子叠加',
    description: '根据异常维度数量进行分级评估',
    icon: '📊',
  },
  {
    value: 'dimensionInterlock',
    label: '多维度联动',
    description: '基于主维度和其他维度的级别分布进行联动判断',
    icon: '🔄',
  },
  {
    value: 'customExpression',
    label: '自定义表达式',
    description: '使用通用表达式引擎的自定义规则',
    icon: '💻',
  },
];

// 表单状态
const currentStrategyType = ref<CalculateStrategyType>(
  'abnormalFactorAggregation',
);
const strategyFormData = ref<any>({});
const resultConfig = ref({
  configName: '',
  ruleType: 0 as 0 | 1 | 2, // 0-综合方面规则，1-等级方面规则，2-评语方面规则
  description: '',
  level: '',
  suggestions: '',
  comment: '',
  status: true,
  riskLevel: 1, // 新增风险等级字段
});

// 已有配置列表
const configList = ref<AssessmentResultConfigDO[]>([]);
// 当前编辑的配置
const editingConfig = ref<AssessmentResultConfigDO | null>(null);

const [Modal, modalApi] = useVbenModal({
  class: 'w-[90%] max-w-[1200px]',
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{ scenario: AssessmentScenario }>();
      if (data?.scenario) {
        selectedScenario.value = data.scenario;
        loadScenarioConfigs();
        loadScenarioDimensions();
        initDefaultForm();
      }
    } else {
      // 关闭时重置
      selectedScenario.value = null;
      configList.value = [];
      dimensionOptions.value = [];
    }
  },
});

const getTitle = computed(() => {
  const baseTitle = `${selectedScenario.value?.name || '测评场景'} - 结果配置`;
  return editingConfig.value ? `${baseTitle} (编辑模式)` : baseTitle;
});

// 加载场景配置
async function loadScenarioConfigs() {
  if (!selectedScenario.value?.id) return;

  try {
    loading.value = true;
    const configs = await getAssessmentResultConfigsByScenarioId(
      selectedScenario.value.id,
    );
    configList.value = configs || [];
  } catch (error) {
    console.error('加载场景配置失败:', error);
    message.error('加载场景配置失败');
    configList.value = [];
  } finally {
    loading.value = false;
  }
}

// 加载场景相关维度
async function loadScenarioDimensions() {
  if (!selectedScenario.value?.id) return;

  try {
    const list = await getAssessmentDimensionsByScenario(
      selectedScenario.value.id,
    );
    const arr = Array.isArray(list) ? list : [];
    dimensionOptions.value = arr.map((d: any) => {
      const key = d.dimensionCode || String(d.id);
      const label = `${d.dimensionName || key}（${key}）`;
      return { label, value: key };
    });
  } catch (error) {
    console.error('加载维度列表失败:', error);
    dimensionOptions.value = [];
  }
}

// 初始化默认表单
function initDefaultForm() {
  currentStrategyType.value = 'abnormalFactorAggregation';
  strategyFormData.value = {
    thresholds: [{ min: 0, max: 0, level: '正常', riskLevel: 1 }],
  };

  resultConfig.value = {
    configName: '',
    ruleType: 0,
    description: '',
    level: '',
    suggestions: '',
    comment: '',
    status: true,
    riskLevel: 1,
  };
}

// 生成计算公式
function generateFormula(): string {
  switch (currentStrategyType.value) {
    case 'abnormalFactorAggregation': {
      return generateAbnormalFactorFormula();
    }
    case 'customExpression': {
      return generateCustomExpressionFormula();
    }
    case 'dimensionInterlock': {
      return generateDimensionInterlockFormula();
    }
    default: {
      return '{}';
    }
  }
}

// 根据等级获取描述
function getDescriptionByLevel(level: string): string {
  switch (level) {
    case '中度风险': {
      return '需要干预';
    }
    case '正常': {
      return '心理状态良好';
    }
    case '轻度关注': {
      return '建议关注';
    }
    case '高度风险': {
      return '需要专业帮助';
    }
    default: {
      return '需要关注';
    }
  }
}

// 生成异常因子叠加策略公式
function generateAbnormalFactorFormula(): string {
  const config: AbnormalFactorAggregationConfig = {
    thresholds:
      strategyFormData.value.thresholds?.map((t: any) => ({
        range: { min: t.min, max: t.max },
        level: t.level,
        riskLevel: t.riskLevel,
        description: `异常因子数量在${t.min}-${t.max}个范围内，${getDescriptionByLevel(t.level)}`,
      })) || [],
  };

  return JSON.stringify({ abnormalFactorAggregation: config });
}

// 生成多维度联动策略公式（V2）
function generateDimensionInterlockFormula(): string {
  const mainDim = String(strategyFormData.value.mainDimension || '');
  const otherDims = (strategyFormData.value.otherDimensions || []).map(String);
  const mapOp: Record<string, string> = {
    eq: '==',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    ne: '!=',
  };
  const buildCond = (c: any) => {
    if (c.type === 'mainRisk') {
      return {
        cmp: {
          lhs: { dim: 'main', var: 'riskLevel' },
          op: mapOp[c.operator || 'eq'] || '==',
          rhs: Number(c.value || 1),
        },
      };
    }
    return {
      cmp: {
        lhs: { dim: 'other', var: `riskLevel${Number(c.riskLevel || 1)}Count` },
        op: mapOp[c.operator || 'eq'] || '==',
        rhs: Number(c.value || 0),
      },
    };
  };
  const buildBranch = (b: any) => {
    const conds = (b.conditions || []).map((x: any) => buildCond(x));
    const logic =
      conds.length <= 1 ? conds[0] || {} : { [b.topLogic || 'and']: conds };
    return {
      ...logic,
      result: {
        riskLevel: Number(resultConfig.value.riskLevel || 0) || undefined,
        description: String(resultConfig.value.description || ''),
      },
    };
  };
  const branches = (strategyFormData.value.branches || []).map((b: any) =>
    buildBranch(b),
  );
  return JSON.stringify({
    strategy: 'multi_linkage',
    multiDimensionV2: {
      mainDimension: mainDim,
      otherDimensions: otherDims,
      othersApply: strategyFormData.value.othersApply || 'any',
      branchLogic: strategyFormData.value.branchLogic || 'or',
      branches,
    },
  });
}

// 生成自定义表达式公式
function generateCustomExpressionFormula(): string {
  const customExpression = strategyFormData.value.customExpression;

  if (!customExpression) {
    throw new Error('自定义表达式不能为空');
  }

  try {
    const parsed = JSON.parse(customExpression);
    return JSON.stringify(parsed);
  } catch {
    throw new Error('自定义表达式JSON格式错误');
  }
}

// 保存配置规则
async function handleSave() {
  try {
    if (!resultConfig.value.configName?.trim()) {
      throw new Error('请输入配置名称');
    }

    loading.value = true;
    const formula = generateFormula();

    const configData: AssessmentResultConfigDO = {
      scenarioId: selectedScenario.value?.id || 0,
      configName: resultConfig.value.configName,
      ruleType: resultConfig.value.ruleType,
      calculateFormula: formula,
      description: resultConfig.value.description,
      level: resultConfig.value.level,
      suggestions: resultConfig.value.suggestions,
      comment: resultConfig.value.comment,
      status: resultConfig.value.status ? 1 : 0,
    };

    if (editingConfig.value?.id) {
      // 更新模式
      configData.id = editingConfig.value.id;
      await updateAssessmentResultConfig(configData);
      message.success('更新配置成功');
    } else {
      // 新建模式
      await createAssessmentResultConfig(configData);
      message.success('创建配置成功');
    }

    // 重新加载列表
    await loadScenarioConfigs();

    // 重置表单和编辑状态
    editingConfig.value = null;
    initDefaultForm();

    emit('success');
  } catch (error: any) {
    console.error('保存配置失败:', error);
    message.error(error.message || '保存配置失败');
  } finally {
    loading.value = false;
  }
}

// 重置表单
function handleReset() {
  editingConfig.value = null;
  initDefaultForm();
}

// 编辑配置
async function handleEdit(config: any) {
  try {
    editingConfig.value = config;

    // 解析配置数据到表单
    resultConfig.value = {
      configName: config.configName,
      ruleType: config.ruleType,
      description: config.description || '',
      level: config.level || '',
      suggestions: config.suggestions || '',
      comment: config.comment || '',
      status: config.status === 1,
      riskLevel: 1,
    };

    // 解析计算公式
    if (config.calculateFormula) {
      try {
        const formula = JSON.parse(config.calculateFormula);

        if (formula.abnormalFactorAggregation) {
          currentStrategyType.value = 'abnormalFactorAggregation';
          strategyFormData.value = {
            thresholds:
              formula.abnormalFactorAggregation.thresholds?.map((t: any) => ({
                min: t.range?.min || 0,
                max: t.range?.max || 0,
                level: t.level || '',
                riskLevel: t.riskLevel || 1,
              })) || [],
          };
        } else if (formula.multiDimensionV2) {
          currentStrategyType.value = 'dimensionInterlock';
          const md = formula.multiDimensionV2;
          strategyFormData.value = {
            mainDimension: md.mainDimension || '',
            otherDimensions: md.otherDimensions || [],
            othersApply: md.othersApply || 'any',
            branchLogic: md.branchLogic || 'or',
            branches: (md.branches || []).map((b: any) => {
              const conditions: any[] = [];
              const extractConds = (node: any): any[] => {
                if (node?.cmp) return [node];
                if (node?.and) return node.and;
                if (node?.or) return node.or;
                return [];
              };
              const cmpList = extractConds(b);
              for (const c of cmpList) {
                const lhs = c?.cmp?.lhs || {};
                const op = c?.cmp?.op;
                const rhs = c?.cmp?.rhs;
                const opMap: Record<string, string> = {
                  '==': 'eq',
                  '>': 'gt',
                  '>=': 'gte',
                  '<': 'lt',
                  '<=': 'lte',
                  '!=': 'ne',
                };
                if (lhs?.dim === 'main' && lhs?.var === 'riskLevel') {
                  conditions.push({
                    type: 'mainRisk',
                    operator: opMap[op] || 'eq',
                    value: Number(rhs || 1),
                  });
                } else if (
                  lhs?.dim === 'other' &&
                  typeof lhs?.var === 'string' &&
                  /riskLevel\d+Count/.test(lhs.var)
                ) {
                  const match = lhs.var.match(/riskLevel(\d+)Count/);
                  const num = match ? Number(match[1]) : 1;
                  conditions.push({
                    type: 'otherCount',
                    riskLevel: num,
                    operator: opMap[op] || 'eq',
                    value: Number(rhs || 0),
                  });
                }
              }
              let topLogic = 'and';
              if (b?.or) topLogic = 'or';
              return { topLogic, conditions };
            }),
          };
          // 回填结果配置
          const r0 = md.branches?.[0]?.result;
          if (r0) {
            if (typeof r0.riskLevel === 'number')
              resultConfig.value.riskLevel = r0.riskLevel;
            if (
              typeof r0.description === 'string' &&
              !resultConfig.value.description
            )
              resultConfig.value.description = r0.description;
          }
        } else {
          currentStrategyType.value = 'customExpression';
          strategyFormData.value = {
            customExpression: config.calculateFormula,
          };
        }
      } catch {
        currentStrategyType.value = 'customExpression';
        strategyFormData.value = {
          customExpression: config.calculateFormula,
        };
      }
    }

    message.info('已载入配置到表单，可进行编辑');
  } catch (error) {
    console.error('编辑配置失败:', error);
    message.error('载入配置失败');
  }
}

// 删除配置
async function handleDelete(config: any) {
  try {
    if (!config.id) return;

    loading.value = true;
    await deleteAssessmentResultConfig(config.id);
    message.success('删除配置成功');

    // 重新加载列表
    await loadScenarioConfigs();
    emit('success');
  } catch (error) {
    console.error('删除配置失败:', error);
    message.error('删除配置失败');
  } finally {
    loading.value = false;
  }
}

// 关闭对话框
function handleClose() {
  modalApi.close();
}

// 策略类型变化处理
function handleStrategyTypeChange(strategyType: CalculateStrategyType) {
  currentStrategyType.value = strategyType;

  switch (strategyType) {
    case 'abnormalFactorAggregation': {
      strategyFormData.value = {
        thresholds: [{ min: 0, max: 0, level: '正常', riskLevel: 1 }],
      };
      break;
    }
    case 'customExpression': {
      strategyFormData.value = {
        customExpression:
          '{"cmp": {"lhs": {"var": "abnormalCount"}, "op": ">=", "rhs": 3}}',
      };
      break;
    }
    case 'dimensionInterlock': {
      strategyFormData.value = {
        mainDimension: '',
        otherDimensions: [],
        othersApply: 'any',
        branchLogic: 'or',
        branches: [
          {
            topLogic: 'and',
            conditions: [{ type: 'mainRisk', operator: 'eq', value: 1 }],
          },
        ],
      };
      break;
    }
  }
}

// 添加阈值
function addThreshold() {
  if (!strategyFormData.value.thresholds) {
    strategyFormData.value.thresholds = [];
  }
  strategyFormData.value.thresholds.push({
    min: 0,
    max: 10,
    level: '',
    riskLevel: 1,
  });
}

// 删除阈值
function removeThreshold(index: number) {
  if (
    strategyFormData.value.thresholds &&
    strategyFormData.value.thresholds.length > 1
  ) {
    strategyFormData.value.thresholds.splice(index, 1);
  }
}

// 规则类型映射
const getRuleTypeText = (ruleType: number) => {
  switch (ruleType) {
    case 0: {
      return '综合方面规则';
    }
    case 1: {
      return '等级方面规则';
    }
    case 2: {
      return '评语方面规则';
    }
    default: {
      return '未知类型';
    }
  }
};

// 配置列表表格列
const configColumns = [
  {
    title: '配置名称',
    dataIndex: 'configName',
    key: 'configName',
    width: 200,
  },
  {
    title: '规则类型',
    dataIndex: 'ruleType',
    key: 'ruleType',
    width: 120,
    customRender: ({ text }: any) => getRuleTypeText(text),
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '等级',
    dataIndex: 'level',
    key: 'level',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    customRender: ({ text }: any) =>
      text === 1
        ? h('span', { style: 'color: #52c41a' }, '启用')
        : h('span', { style: 'color: #ff4d4f' }, '禁用'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right' as const,
  },
];

const formRef = ref();
</script>

<template>
  <Modal :title="getTitle">
    <div class="w-full px-6 py-4">
      <!-- 基本信息 -->
      <div class="mb-6">
        <h3 class="mb-2 text-lg font-medium">场景信息</h3>
        <div class="text-gray-600">
          场景：{{ selectedScenario?.name || '未知' }} ({{
            selectedScenario?.code || ''
          }})
        </div>
      </div>

      <!-- 现有配置列表 -->
      <Card title="现有配置规则" class="mb-6">
        <Table
          :data-source="configList"
          :columns="configColumns"
          :pagination="false"
          size="small"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 800 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'actions'">
              <div class="flex gap-2">
                <Button type="link" size="small" @click="handleEdit(record)">
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除这个配置吗？"
                  @confirm="handleDelete(record)"
                  ok-text="确定"
                  cancel-text="取消"
                >
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </div>
            </template>
          </template>
        </Table>
      </Card>

      <Form ref="formRef" layout="vertical">
        <!-- 编辑状态提示 -->
        <Alert
          v-if="editingConfig"
          :message="`正在编辑配置：${editingConfig.configName}`"
          type="info"
          show-icon
          closable
          class="mb-4"
          @close="handleReset"
        />

        <!-- 基础信息 -->
        <Card title="基础信息" class="mb-6">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="配置名称" required>
                <Input
                  v-model:value="resultConfig.configName"
                  placeholder="例如：高风险异常因子叠加规则"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="规则类型">
                <Select v-model:value="resultConfig.ruleType">
                  <Select.Option :value="0">综合方面规则</Select.Option>
                  <Select.Option :value="1">等级方面规则</Select.Option>
                  <Select.Option :value="2">评语方面规则</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="配置描述">
                <Input.TextArea
                  v-model:value="resultConfig.description"
                  placeholder="详细描述该规则的用途和逻辑"
                  :rows="2"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="启用状态">
                <Switch v-model:checked="resultConfig.status" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <!-- 策略类型选择 -->
        <Card title="计算策略" class="mb-6">
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div
              v-for="strategyType in strategyTypes"
              :key="strategyType.value"
              class="cursor-pointer rounded-lg border-2 p-4 transition-colors"
              :class="[
                currentStrategyType === strategyType.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
              @click="
                handleStrategyTypeChange(
                  strategyType.value as CalculateStrategyType,
                )
              "
            >
              <div class="flex items-start space-x-3">
                <span class="text-2xl">{{ strategyType.icon }}</span>
                <div>
                  <div class="font-medium">{{ strategyType.label }}</div>
                  <div class="text-sm text-gray-600">
                    {{ strategyType.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <!-- 策略配置 -->
        <Card title="策略配置" class="mb-6">
          <!-- 异常因子叠加策略 -->
          <template v-if="currentStrategyType === 'abnormalFactorAggregation'">
            <Alert
              message="异常因子阈值配置"
              description="系统将根据测评结果中的异常维度数量，自动匹配阈值规则，输出对应的风险等级和建议。"
              type="info"
              show-icon
              class="mb-4"
            />
            <div class="space-y-4">
              <div
                v-for="(threshold, index) in strategyFormData.thresholds || []"
                :key="index"
                class="rounded-lg border p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="font-medium">阈值 {{ index + 1 }}</h4>
                  <Button
                    v-if="(strategyFormData.thresholds?.length || 0) > 1"
                    size="small"
                    danger
                    @click="removeThreshold(index)"
                  >
                    删除
                  </Button>
                </div>
                <Row :gutter="16">
                  <Col :span="6">
                    <Form.Item label="最小值">
                      <InputNumber
                        v-model:value="threshold.min"
                        :min="0"
                        addon-after="个"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="6">
                    <Form.Item label="最大值">
                      <InputNumber
                        v-model:value="threshold.max"
                        :min="0"
                        addon-after="个"
                        class="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="6">
                    <Form.Item label="等级名称">
                      <Input
                        v-model:value="threshold.level"
                        placeholder="如：正常"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="6">
                    <Form.Item label="风险等级">
                      <Select
                        v-model:value="threshold.riskLevel"
                        :options="riskLevelOptions"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
              <Button type="dashed" block @click="addThreshold">
                <CirclePlus class="mr-2" />
                添加阈值
              </Button>
            </div>
          </template>

          <!-- 多维度联动策略（V2：主维度风险值 + 其他维度某等级数量阈值） -->
          <template v-else-if="currentStrategyType === 'dimensionInterlock'">
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label="主维度">
                  <Select
                    v-model:value="strategyFormData.mainDimension"
                    :options="dimensionOptions"
                    placeholder="选择主维度"
                    allow-clear
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="其他维度">
                  <Select
                    v-model:value="strategyFormData.otherDimensions"
                    :options="dimensionOptions"
                    mode="multiple"
                    placeholder="选择其他参考维度（多个）"
                  />
                </Form.Item>
              </Col>
              <Col :span="24">
                <Form.Item label="分支（从上到下优先匹配）">
                  <div class="space-y-3">
                    <div
                      v-for="(br, bi) in strategyFormData.branches || []"
                      :key="bi"
                      class="rounded-lg border p-3"
                    >
                      <div class="mb-2 flex items-center justify-between">
                        <div class="text-sm font-medium">分支 {{ bi + 1 }}</div>
                        <div class="flex items-center gap-2">
                          <Form.Item label="分支逻辑" class="mb-0">
                            <a-radio-group
                              v-model:value="br.topLogic"
                              size="small"
                            >
                              <a-radio-button value="and">AND</a-radio-button>
                              <a-radio-button value="or">OR</a-radio-button>
                            </a-radio-group>
                          </Form.Item>
                          <Button
                            v-if="(strategyFormData.branches?.length || 0) > 1"
                            size="small"
                            danger
                            @click="strategyFormData.branches.splice(bi, 1)"
                          >
                            删除分支
                          </Button>
                        </div>
                      </div>
                      <!-- 条件列表：主维度风险等级 / 其他维度某等级数量阈值 -->
                      <div class="space-y-2">
                        <div
                          v-for="(c, ci) in br.conditions || []"
                          :key="ci"
                          class="rounded border p-2"
                        >
                          <div class="grid grid-cols-12 items-center gap-2">
                            <div class="col-span-3">
                              <Select
                                v-model:value="c.type"
                                :options="[
                                  {
                                    label: '主维度风险等级',
                                    value: 'mainRisk',
                                  },
                                  {
                                    label: '其他维度',
                                    value: 'otherCount',
                                  },
                                ]"
                              />
                            </div>
                            <template v-if="c.type === 'mainRisk'">
                              <div class="col-span-3">
                                <Select
                                  v-model:value="c.operator"
                                  :options="[
                                    { label: '等于(=)', value: 'eq' },
                                    { label: '大于(>)', value: 'gt' },
                                    { label: '≥', value: 'gte' },
                                    { label: '小于(<)', value: 'lt' },
                                    { label: '≤', value: 'lte' },
                                    { label: '不等于(≠)', value: 'ne' },
                                  ]"
                                />
                              </div>
                              <div class="col-span-4">
                                <Select
                                  v-model:value="c.value"
                                  :options="riskLevelOptions"
                                />
                              </div>
                            </template>
                            <template v-else>
                              <div class="col-span-2">
                                <Select
                                  v-model:value="c.riskLevel"
                                  :options="riskLevelOptions"
                                  placeholder="统计哪个风险等级的数量"
                                />
                              </div>
                              <div class="col-span-3">
                                <Select
                                  v-model:value="c.operator"
                                  :options="[
                                    { label: '等于(=)', value: 'eq' },
                                    { label: '大于(>)', value: 'gt' },
                                    { label: '大于等于(≥)', value: 'gte' },
                                    { label: '小于(<)', value: 'lt' },
                                    { label: '小于等于(≤)', value: 'lte' },
                                    { label: '不等于(≠)', value: 'ne' },
                                  ]"
                                />
                              </div>
                              <div class="col-span-2">
                                <InputNumber
                                  v-model:value="c.value"
                                  :min="0"
                                  class="w-full"
                                />
                              </div>
                            </template>
                            <div class="col-span-2 text-right">
                              <Button
                                v-if="(br.conditions?.length || 0) > 1"
                                size="small"
                                danger
                                @click="br.conditions.splice(ci, 1)"
                              >
                                删除
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="dashed"
                          block
                          @click="
                            (br.conditions || (br.conditions = [])).push({
                              type: 'mainRisk',
                              operator: 'eq',
                              value: 1,
                            })
                          "
                        >
                          新增条件
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="dashed"
                      block
                      @click="
                        (
                          strategyFormData.branches ||
                          (strategyFormData.branches = [])
                        ).push({
                          topLogic: 'and',
                          conditions: [
                            { type: 'mainRisk', operator: 'eq', value: 1 },
                          ],
                        })
                      "
                    >
                      新增分支
                    </Button>
                    <Form.Item label="分支间逻辑" class="mt-4">
                      <a-radio-group
                        v-model:value="strategyFormData.branchLogic"
                        size="small"
                      >
                        <a-radio-button value="or">或 (OR)</a-radio-button>
                        <a-radio-button value="and">且 (AND)</a-radio-button>
                      </a-radio-group>
                    </Form.Item>
                    <Form.Item label="其他维度匹配方式">
                      <a-radio-group
                        v-model:value="strategyFormData.othersApply"
                        size="small"
                      >
                        <a-radio-button value="any">任意(other)</a-radio-button>
                        <a-radio-button value="all">全部(other)</a-radio-button>
                      </a-radio-group>
                    </Form.Item>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </template>

          <!-- 自定义表达式 -->
          <template v-else-if="currentStrategyType === 'customExpression'">
            <Alert
              message="支持表达式：and、or、cmp、range、count、sum 等操作符"
              type="info"
              show-icon
              class="mb-4"
            />
            <Form.Item label="自定义表达式">
              <Input.TextArea
                v-model:value="strategyFormData.customExpression"
                placeholder="请输入JSON表达式，支持 cmp、range、count 等操作符"
                :rows="8"
              />
            </Form.Item>
          </template>
        </Card>

        <!-- 结果配置 -->
        <Card title="结果配置" class="mb-6">
          <Row :gutter="16">
            <Col :span="8">
              <Form.Item label="评价等级">
                <Input
                  v-model:value="resultConfig.level"
                  placeholder="例如：正常、轻度关注、中度风险、高度风险"
                />
              </Form.Item>
            </Col>
            <Col :span="8">
              <Form.Item label="风险等级">
                <Select
                  v-model:value="resultConfig.riskLevel"
                  :options="riskLevelOptions"
                  placeholder="选择风险等级"
                />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="建议文本">
                <RichTextEditor
                  v-model="resultConfig.suggestions"
                  :height="150"
                  placeholder="给出相应的建议和指导"
                />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="评语文本">
                <RichTextEditor
                  v-model="resultConfig.comment"
                  :height="180"
                  placeholder="针对该结果的评语"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <!-- 操作按钮 -->
        <div class="flex justify-center gap-4">
          <Button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleSave"
          >
            {{ editingConfig ? '更新配置' : '保存配置' }}
          </Button>
          <Button size="large" @click="handleReset">重置</Button>
          <Button size="large" @click="handleClose">关闭</Button>
        </div>
      </Form>
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.ant-modal-body {
  padding: 24px;
}
</style>
