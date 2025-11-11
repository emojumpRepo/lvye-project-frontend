<script setup lang="ts">
import type { AssessmentScenario, AssessmentScenarioSlot } from '@vben/types';

import type { ModuleResultConfigVO } from '#/api/psychology/module-result-config';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { riskLevelOptions } from '@vben/types';

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from 'ant-design-vue';

import {
  createModuleResultConfig,
  updateModuleResultConfig,
} from '#/api/psychology/module-result-config';
import { getDimensionListByScenarioSlot } from '#/api/psychology/questionnaire/index';
import StudentCommentEditor from '#/components/Common/StudentCommentEditor.vue';

interface DialogData {
  scenario?: AssessmentScenario | null;
  scenarioSlot?: AssessmentScenarioSlot | null;
  selectedConfig?: ModuleResultConfigVO | null;
  onSuccess?: () => void;
}

interface Emits {
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const [FormDialog, formDialogApi] = useVbenModal({
  class: 'w-[80%]',
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = formDialogApi.getData<DialogData>();
      selectedScenario.value = data?.scenario || null;
      selectedSlot.value = data?.scenarioSlot || null;
      selectedConfig.value = data?.selectedConfig || null;
      initForm();
      void loadAssociatedDimensionOptions();
      formDialogApi.setState({
        title: selectedConfig.value ? '编辑模块结果配置' : '新增模块结果配置',
      });
    }
  },
});

const selectedScenario = ref<AssessmentScenario | null>(null);
const selectedSlot = ref<AssessmentScenarioSlot | null>(null);
const selectedConfig = ref<ModuleResultConfigVO | null>(null);
const dimensionOptions = ref<{ label: string; value: string }[]>([]);

const formModel = ref<any>({
  configName: '',
  ruleType: 0,
  status: 1,
  level: '',
  suggestions: '',
  comments: [] as string[],
  description: '',
  // 三类规则的表达式容器
  formula: {},
  // 策略类型与配置项
  strategyType: 'overall_risk', // overall_risk | associated_combo | multi_linkage
  // overall_risk
  forbiddenLevels: [3, 4] as number[],
  scope: 'participating' as 'associated' | 'participating',
  associatedDimIds: [] as Array<number | string>,
  // associated_combo
  assoc: {
    groups: [
      {
        groupLogic: 'or',
        conditions: [{ dimensionKey: '', operator: 'gte', value: 1 }],
      },
    ],
    topLogic: 'and',
  },
  // multi_linkage（V2）
  linkageFirstDim: '' as number | string,
  linkageOtherDims: [] as Array<number | string>,
  multiV2: {
    othersApply: 'any' as 'all' | 'any',
    branchLogic: 'or' as 'and' | 'or',
    branches: [
      {
        topLogic: 'and',
        conditions: [{ type: 'mainRisk', operator: 'eq', value: 1 }],
        result: { riskLevel: 1, description: '' },
      },
    ],
  },
  // overall_risk：完全可配置的分支
  overall: {
    branches: [
      {
        topLogic: 'and',
        conditions: [
          { left: 'riskLevel3Count', operator: '==', right: 0 },
          { left: 'riskLevel4Count', operator: '==', right: 0 },
        ],
        result: { riskLevel: 1, description: '' },
      },
    ],
  },
});

function initForm() {
  const defaults: any = {
    configName: '',
    ruleType: 0,
    status: 1,
    level: '',
    suggestions: '',
    comments: [],
    description: '',
    formula: {},
    strategyType: 'overall_risk',
    forbiddenLevels: [3, 4],
    scope: 'participating',
    associatedDimIds: [],
    assoc: {
      groups: [
        {
          groupLogic: 'or',
          conditions: [{ dimensionKey: '', operator: 'gte', value: 1 }],
        },
      ],
      topLogic: 'and',
    },
    linkageFirstDim: '',
    linkageOtherDims: [],
    multiV2: {
      othersApply: 'any',
      branchLogic: 'or',
      branches: [
        {
          topLogic: 'and',
          conditions: [{ type: 'mainRisk', operator: 'eq', value: 1 }],
          result: { riskLevel: 1, description: '' },
        },
      ],
    },
    overall: {
      branches: [
        {
          topLogic: 'and',
          conditions: [
            { left: 'riskLevel3Count', operator: '==', right: 0 },
            { left: 'riskLevel4Count', operator: '==', right: 0 },
          ],
          result: { riskLevel: 1, description: '' },
        },
      ],
    },
  };

  formModel.value = selectedConfig.value
    ? {
        ...defaults,
        configName: selectedConfig.value.configName,
        ruleType: selectedConfig.value.ruleType,
        status: selectedConfig.value.status ?? 1,
        level: selectedConfig.value.level || '',
        suggestions: selectedConfig.value.suggestions || '',
        comments: parseComments(selectedConfig.value.comments),
        description: selectedConfig.value.description || '',
        formula: safeParse(selectedConfig.value.calculateFormula),
      }
    : { ...defaults };

  // 回填结果配置的风险等级（从计算公式中解析）
  try {
    const f: any = formModel.value.formula || {};
    // 优先使用显式 strategy
    if (
      typeof f.strategy === 'string' &&
      ['associated_combo', 'multi_linkage', 'overall_risk'].includes(f.strategy)
    ) {
      formModel.value.strategyType = f.strategy;
    }
    // 检测策略类型
    const hasOverallKey = (node: any): boolean => {
      if (!node || typeof node !== 'object') return false;
      if (
        node?.cmp?.left === 'riskLevel3Count' ||
        node?.cmp?.left === 'riskLevel4Count'
      )
        return true;
      if (Array.isArray(node.and))
        return node.and.some((it: any) => hasOverallKey(it));
      if (Array.isArray(node.or))
        return node.or.some((it: any) => hasOverallKey(it));
      return false;
    };
    // overall_risk：or 分支内的 result
    if (Array.isArray(f.or) && f.or.length > 0 && f.or[0]?.result) {
      const r = f.or[0].result || {};
      if (typeof r.riskLevel === 'number')
        formModel.value.riskLevel = r.riskLevel;
      if (typeof r.description === 'string' && !formModel.value.description)
        formModel.value.description = r.description;
    }
    // 单结果 { result: {...} }
    if (f.result && typeof f.result.riskLevel === 'number') {
      formModel.value.riskLevel = f.result.riskLevel;
      if (
        typeof f.result.description === 'string' &&
        !formModel.value.description
      )
        formModel.value.description = f.result.description;
    }
    // 关联维度组合：and/or + cmp(lhs.dim, var: riskLevel)
    const looksAssoc = (node: any): boolean => {
      if (!node) return false;
      if (node?.cmp?.lhs?.dim && node?.cmp?.lhs?.var === 'riskLevel')
        return true;
      if (Array.isArray(node.and))
        return node.and.some((n: any) => looksAssoc(n));
      if (Array.isArray(node.or))
        return node.or.some((n: any) => looksAssoc(n));
      return false;
    };
    if (!f.strategy) {
      let detectedStrategy:
        | ''
        | 'associated_combo'
        | 'multi_linkage'
        | 'overall_risk' = '';
      if (f.multiDimensionV2 || f.multiDimensionLogic)
        detectedStrategy = 'multi_linkage';
      else if (
        hasOverallKey(f) ||
        (Array.isArray(f.or) && f.or.some((b: any) => hasOverallKey(b)))
      )
        detectedStrategy = 'overall_risk';
      else if (looksAssoc(f)) detectedStrategy = 'associated_combo';
      if (detectedStrategy) formModel.value.strategyType = detectedStrategy;
    }
    if (formModel.value.strategyType === 'associated_combo' && looksAssoc(f)) {
      const toCond = (cmpNode: any) => ({
        dimensionKey: String(cmpNode?.cmp?.lhs?.dim || ''),
        operator:
          (
            {
              '==': 'eq',
              '>': 'gt',
              '>=': 'gte',
              '<': 'lt',
              '<=': 'lte',
              '!=': 'ne',
            } as Record<string, string>
          )[cmpNode?.cmp?.op] || 'eq',
        value: Number(cmpNode?.cmp?.rhs ?? 1),
      });
      const parseTop = (node: any) => {
        if (node?.cmp?.lhs?.dim) {
          return {
            topLogic: 'and',
            groups: [{ groupLogic: 'and', conditions: [toCond(node)] }],
          };
        }
        const topLogic = Array.isArray(node.and) ? 'and' : 'or';
        const arr = (node.and || node.or) as any[];
        const groups: any[] = [];
        for (const item of arr || []) {
          if (item?.cmp?.lhs?.dim) {
            groups.push({ groupLogic: 'and', conditions: [toCond(item)] });
          } else if (Array.isArray(item.and) || Array.isArray(item.or)) {
            const inner = (item.and || item.or) as any[];
            const conds = inner
              .filter((n: any) => n?.cmp?.lhs?.dim)
              .map((n: any) => toCond(n));
            if (conds.length > 0)
              groups.push({
                groupLogic: Array.isArray(item.and) ? 'and' : 'or',
                conditions: conds,
              });
          }
        }
        if (groups.length === 0) {
          groups.push({
            groupLogic: 'and',
            conditions: [toCond(arr?.[0] || {})],
          });
        }
        return { topLogic, groups };
      };
      const assoc = parseTop(f);
      formModel.value.assoc = assoc;
    }
    // overall_risk：两层结构（分支 + 条件）
    if (formModel.value.strategyType === 'overall_risk') {
      const toCond = (n: any) => ({
        left: n?.cmp?.left,
        operator: n?.cmp?.op || '==',
        right: n?.cmp?.right,
      });
      const mapBranch = (node: any) => {
        if (node?.cmp) {
          return {
            topLogic: 'and',
            conditions: [toCond(node)],
            result: node.result || {},
          };
        }
        let key = 'and';
        if (Array.isArray(node?.or)) key = 'or';
        const arr = (node?.and || node?.or || []) as any[];
        const conds = arr.filter((x) => x?.cmp).map((x) => toCond(x));
        return { topLogic: key, conditions: conds, result: node.result || {} };
      };
      let branchesSrc: any[] = [];
      if (Array.isArray(f.or)) branchesSrc = f.or;
      else if (f.result || f.cmp) branchesSrc = [f];
      if (branchesSrc.length > 0) {
        formModel.value.overall.branches = branchesSrc.map((b: any) =>
          mapBranch(b),
        );
        const r0 = branchesSrc[0]?.result || {};
        if (typeof r0.riskLevel === 'number')
          formModel.value.riskLevel = r0.riskLevel;
        if (typeof r0.description === 'string' && !formModel.value.description)
          formModel.value.description = r0.description;
      }
    }
    // 回填 multiDimensionV2
    if (f.multiDimensionV2) {
      formModel.value.linkageFirstDim = f.multiDimensionV2.mainDimension || '';
      formModel.value.linkageOtherDims =
        f.multiDimensionV2.otherDimensions || [];
      formModel.value.multiV2.othersApply =
        f.multiDimensionV2.othersApply || 'any';
      const toUiCond = (c: any) => {
        // 识别 mainRisk vs otherCount
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
          return {
            type: 'mainRisk',
            operator: opMap[op] || 'eq',
            value: Number(rhs || 1),
          };
        }
        if (
          lhs?.dim === 'other' &&
          typeof lhs?.var === 'string' &&
          lhs.var.startsWith('riskLevel') &&
          lhs.var.endsWith('Count')
        ) {
          const num =
            Number(
              (lhs.var || '').replace('riskLevel', '').replace('Count', ''),
            ) || 1;
          return {
            type: 'otherCount',
            riskLevel: num,
            operator: opMap[op] || 'eq',
            value: Number(rhs || 0),
          };
        }
        return { type: 'mainRisk', operator: 'eq', value: 1 };
      };
      const toUiBranch = (b: any) => {
        let condsSrc: any[] = [];
        if (Array.isArray(b.and)) condsSrc = b.and;
        else if (Array.isArray(b.or)) condsSrc = b.or;
        else condsSrc = [b];

        let topLogic = 'and';
        if (Array.isArray(b.or)) topLogic = 'or';

        const conditions = (condsSrc || []).map((x: any) => toUiCond(x));
        return {
          topLogic,
          conditions,
          result: b.result || { riskLevel: 1, description: '' },
        };
      };
      // 回填分支间逻辑
      if (f.multiDimensionV2.branchLogic) {
        formModel.value.multiV2.branchLogic = f.multiDimensionV2.branchLogic;
      }
      formModel.value.multiV2.branches = (
        f.multiDimensionV2.branches || []
      ).map((br: any) => toUiBranch(br));
      // 结果输出配置回填
      const firstBranchResult = f.multiDimensionV2.branches?.[0]?.result || {};
      if (typeof firstBranchResult.riskLevel === 'number')
        formModel.value.riskLevel = firstBranchResult.riskLevel;
      if (
        typeof firstBranchResult.description === 'string' &&
        !formModel.value.description
      )
        formModel.value.description = firstBranchResult.description;
    }
  } catch {}
}

function safeParse(json?: string) {
  try {
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

function parseComments(json?: string): string[] {
  try {
    const v = json ? JSON.parse(json) : [];
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

async function loadAssociatedDimensionOptions() {
  try {
    const slotId = Number((selectedSlot.value as any)?.id || 0);
    if (!slotId) {
      dimensionOptions.value = [];
      return;
    }
    const list = await getDimensionListByScenarioSlot(slotId);
    const arr = Array.isArray(list) ? list : [];
    dimensionOptions.value = arr.map((d: any) => {
      const key = d.dimensionCode || String(d.id);
      const label = `${d.dimensionName || key}（${key}）`;
      return { label, value: key };
    });
  } catch {
    dimensionOptions.value = [];
  }
}

const ruleTypeOptions = [
  { label: '等级方面规则', value: 0 },
  { label: '评语方面规则', value: 1 },
  { label: '综合方面规则', value: 2 },
];

// 生成后端需要的 calculateFormula（JSON 对象，不做细化，先透传）
function buildCalculateFormulaObject() {
  const s = formModel.value.strategyType;
  if (s === 'overall_risk') {
    // 完全可配置分支：按优先级从上到下匹配
    const mapOp: Record<string, string> = {
      '==': '==',
      '>': '>',
      '>=': '>=',
      '<': '<',
      '<=': '<=',
      '!=': '!=',
    };
    const buildCmp = (c: any) => ({
      cmp: {
        left: c.left,
        op: mapOp[c.operator || '=='],
        right: Number(c.right || 0),
      },
    });
    const orBranches: any[] = [];
    for (const br of formModel.value.overall?.branches || []) {
      const top = br.topLogic || 'and';
      const conds = (br.conditions || []).map((c: any) => buildCmp(c));
      const logic =
        conds.length <= 1 ? conds[0] || {} : ({ [top]: conds } as any);
      orBranches.push({
        ...logic,
        result: {
          riskLevel: Number(formModel.value.riskLevel || 0) || undefined,
          description: String(formModel.value.description || ''),
        },
      });
    }
    return { strategy: 'overall_risk', or: orBranches } as any;
  }
  if (s === 'associated_combo') {
    const opMap: Record<string, string> = {
      gte: '>=',
      gt: '>',
      eq: '==',
      lte: '<=',
      lt: '<',
      ne: '!=',
    };
    const buildCond = (c: any) => ({
      cmp: {
        lhs: { dim: String(c.dimensionKey || ''), var: 'riskLevel' },
        op: opMap[c.operator || 'gte'] || '>=',
        rhs: Number(c.value || 1),
      },
    });
    const buildGroup = (g: any) => {
      const conds = (g.conditions || []).map((c: any) => buildCond(c));
      if (conds.length === 1) return conds[0];
      return { [g.groupLogic || 'or']: conds } as any;
    };
    const groups = (formModel.value.assoc?.groups || []).map((g: any) =>
      buildGroup(g),
    );
    if (groups.length === 0) return {} as any;
    if (groups.length === 1)
      return {
        strategy: 'associated_combo',
        ...groups[0],
        riskLevel: Number((formModel.value as any).riskLevel || 0) || undefined,
      } as any;
    const top = formModel.value.assoc?.topLogic || 'and';
    return { strategy: 'associated_combo', [top]: groups } as any;
  }
  if (s === 'multi_linkage') {
    const first = String(formModel.value.linkageFirstDim || '');
    const others = (formModel.value.linkageOtherDims || []).map(String);
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
      // otherCount
      return {
        cmp: {
          lhs: {
            dim: 'other',
            var: `riskLevel${Number(c.riskLevel || 1)}Count`,
          },
          op: mapOp[c.operator || 'eq'] || '==',
          rhs: Number(c.value || 0),
        },
      };
    };
    const buildBranch = (b: any) => {
      const conds = (b.conditions || []).map((x: any) => buildCond(x));
      const logic =
        conds.length <= 1
          ? conds[0] || {}
          : ({ [b.topLogic || 'and']: conds } as any);
      return {
        ...logic,
        result: {
          riskLevel: Number(formModel.value.riskLevel || 0) || undefined,
          description: String(formModel.value.description || ''),
        },
      };
    };
    const branches = (formModel.value.multiV2?.branches || []).map((b: any) =>
      buildBranch(b),
    );
    return {
      strategy: 'multi_linkage',
      multiDimensionV2: {
        mainDimension: first,
        otherDimensions: others,
        othersApply: formModel.value.multiV2?.othersApply || 'any',
        branchLogic: formModel.value.multiV2?.branchLogic || 'or',
        branches,
      },
    } as any;
  }
  return formModel.value.formula || {};
}

function formatComments(comments: string[]) {
  return JSON.stringify((comments || []).filter((s) => !!s));
}

async function handleSave() {
  if (!selectedSlot.value?.id) throw new Error('缺少槽位ID');
  const payload: ModuleResultConfigVO = {
    id: selectedConfig.value?.id,
    scenarioSlotId: Number(selectedSlot.value.id),
    configName: formModel.value.configName,
    ruleType: formModel.value.ruleType,
    calculateFormula: JSON.stringify(buildCalculateFormulaObject()),
    description: formModel.value.description,
    level: formModel.value.level,
    suggestions: formModel.value.suggestions,
    comments: formatComments(formModel.value.comments),
    status: formModel.value.status,
  } as ModuleResultConfigVO;

  await (payload.id
    ? updateModuleResultConfig(payload)
    : createModuleResultConfig(payload));
  formDialogApi.close();
  try {
    const cb = (formDialogApi.getData<DialogData>() || {}).onSuccess;
    if (typeof cb === 'function') cb();
  } catch {}
  emit('success');
}

function handleCancel() {
  formDialogApi.close();
}
</script>

<template>
  <FormDialog>
    <div class="p-4">
      <Form layout="vertical">
        <Card title="基础信息" class="mb-6">
          <Row :gutter="16">
            <Col :span="8">
              <Form.Item label="配置名称" required>
                <Input
                  v-model:value="formModel.configName"
                  placeholder="请输入配置名称"
                />
              </Form.Item>
            </Col>
            <Col :span="8">
              <Form.Item label="规则类型" required>
                <Select
                  v-model:value="formModel.ruleType"
                  :options="ruleTypeOptions"
                />
              </Form.Item>
            </Col>
            <Col :span="8">
              <Form.Item label="状态">
                <Switch
                  v-model:checked="formModel.status"
                  :checked-value="1"
                  :un-checked-value="0"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="策略配置" class="mb-6">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="策略类型">
                <Select
                  v-model:value="formModel.strategyType"
                  :options="[
                    { label: '整体风险', value: 'overall_risk' },
                    { label: '关联维度组合', value: 'associated_combo' },
                    { label: '多维度联动', value: 'multi_linkage' },
                  ]"
                />
              </Form.Item>
            </Col>

            <!-- overall_risk 配置（分支规则） -->
            <template v-if="formModel.strategyType === 'overall_risk'">
              <Col :span="24">
                <Form.Item label="分支规则（从上到下依次匹配，命中即输出结果）">
                  <div class="space-y-4">
                    <div
                      v-for="(br, bi) in formModel.overall?.branches || []"
                      :key="bi"
                      class="rounded-lg border p-3"
                    >
                      <div class="mb-2 flex items-center justify-between">
                        <div class="text-sm font-medium">分支 {{ bi + 1 }}</div>
                        <div class="flex items-center gap-2">
                          <Form.Item label="分支顶层逻辑" class="mb-0">
                            <a-radio-group
                              v-model:value="br.topLogic"
                              size="small"
                            >
                              <a-radio-button value="and">AND</a-radio-button>
                              <a-radio-button value="or">OR</a-radio-button>
                            </a-radio-group>
                          </Form.Item>
                          <Button
                            v-if="(formModel.overall.branches?.length || 0) > 1"
                            size="small"
                            danger
                            @click="formModel.overall.branches.splice(bi, 1)"
                          >
                            删除分支
                          </Button>
                        </div>
                      </div>

                      <!-- 条件项（两层：分支 + 条件） -->
                      <div class="space-y-2">
                        <div
                          v-for="(c, ci) in br.conditions || []"
                          :key="ci"
                          class="rounded border p-2"
                        >
                          <div class="grid grid-cols-12 gap-2">
                            <div class="col-span-4">
                              <Select
                                v-model:value="c.left"
                                :options="[
                                  {
                                    label: '中度风险数量',
                                    value: 'riskLevel3Count',
                                  },
                                  {
                                    label: '重度风险数量',
                                    value: 'riskLevel4Count',
                                  },
                                ]"
                              />
                            </div>
                            <div class="col-span-3">
                              <Select
                                v-model:value="c.operator"
                                :options="[
                                  { label: '等于（=）', value: '==' },
                                  { label: '大于（>）', value: '>' },
                                  { label: '大于等于（≥）', value: '>=' },
                                  { label: '小于（<）', value: '<' },
                                  { label: '小于等于（≤）', value: '<=' },
                                  { label: '不等于（≠）', value: '!=' },
                                ]"
                              />
                            </div>
                            <div class="col-span-3">
                              <InputNumber
                                v-model:value="c.right"
                                :min="0"
                                class="w-full"
                              />
                            </div>
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
                              left: 'riskLevel3Count',
                              operator: '==',
                              right: 0,
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
                          formModel.overall.branches ||
                          (formModel.overall.branches = [])
                        ).push({
                          topLogic: 'and',
                          groups: [
                            {
                              groupLogic: 'and',
                              conditions: [
                                {
                                  left: 'riskLevel3Count',
                                  operator: '==',
                                  right: 0,
                                },
                              ],
                            },
                          ],
                          result: { riskLevel: 1, description: '' },
                        })
                      "
                    >
                      新增分支
                    </Button>
                  </div>
                </Form.Item>
              </Col>
            </template>

            <!-- associated_combo 配置 -->
            <template v-else-if="formModel.strategyType === 'associated_combo'">
              <Col :span="24">
                <Form.Item label="条件分组">
                  <div class="space-y-3">
                    <div
                      v-for="(group, gIndex) in formModel.assoc.groups || []"
                      :key="gIndex"
                      class="rounded-lg border p-3"
                    >
                      <div class="mb-2 flex items-center justify-between">
                        <div class="text-sm font-medium">
                          分组 {{ gIndex + 1 }}
                        </div>
                        <div class="flex items-center gap-2">
                          <Form.Item label="分组逻辑" class="mb-0">
                            <a-radio-group
                              v-model:value="group.groupLogic"
                              size="small"
                            >
                              <a-radio-button value="or">OR</a-radio-button>
                              <a-radio-button value="and">AND</a-radio-button>
                            </a-radio-group>
                          </Form.Item>
                          <Button
                            v-if="(formModel.assoc.groups?.length || 0) > 1"
                            size="small"
                            danger
                            @click="formModel.assoc.groups.splice(gIndex, 1)"
                          >
                            删除分组
                          </Button>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="(c, ci) in group.conditions || []"
                          :key="ci"
                          class="rounded border p-2"
                        >
                          <div class="grid grid-cols-12 gap-2">
                            <div class="col-span-5">
                              <Select
                                v-model:value="c.dimensionKey"
                                :options="dimensionOptions"
                                placeholder="选择维度"
                              />
                            </div>
                            <div class="col-span-3">
                              <Select
                                v-model:value="c.operator"
                                :options="[
                                  { label: '大于等于（≥）', value: 'gte' },
                                  { label: '大于（>）', value: 'gt' },
                                  { label: '等于（=）', value: 'eq' },
                                  { label: '小于等于（≤）', value: 'lte' },
                                  { label: '小于（<）', value: 'lt' },
                                  { label: '不等于（≠）', value: 'ne' },
                                ]"
                              />
                            </div>
                            <div class="col-span-3">
                              <Select
                                v-model:value="c.value"
                                :options="riskLevelOptions"
                              />
                            </div>
                            <div class="col-span-1 text-right">
                              <Button
                                v-if="(group.conditions?.length || 0) > 1"
                                size="small"
                                danger
                                @click="group.conditions.splice(ci, 1)"
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
                            (group.conditions || (group.conditions = [])).push({
                              dimensionKey: '',
                              operator: 'gte',
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
                          formModel.assoc.groups ||
                          (formModel.assoc.groups = [])
                        ).push({
                          groupLogic: 'or',
                          conditions: [
                            { dimensionKey: '', operator: 'gte', value: 1 },
                          ],
                        })
                      "
                    >
                      添加分组
                    </Button>
                    <Form.Item label="分组之间的逻辑">
                      <a-radio-group
                        v-model:value="formModel.assoc.topLogic"
                        button-style="solid"
                      >
                        <a-radio-button value="and">且 (AND)</a-radio-button>
                        <a-radio-button value="or">或 (OR)</a-radio-button>
                      </a-radio-group>
                    </Form.Item>
                  </div>
                </Form.Item>
              </Col>
            </template>

            <!-- multi_linkage 配置（V2：主维度风险值 + 其他维度某等级数量阈值） -->
            <template v-else>
              <Col :span="12">
                <Form.Item label="主维度">
                  <Select
                    v-model:value="formModel.linkageFirstDim"
                    :options="dimensionOptions"
                    allow-clear
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="其他维度">
                  <Select
                    v-model:value="formModel.linkageOtherDims"
                    :options="dimensionOptions"
                    mode="tags"
                  />
                </Form.Item>
              </Col>
              <Col :span="24">
                <Form.Item label="分支（从上到下优先匹配）">
                  <div class="space-y-3">
                    <div
                      v-for="(br, bi) in formModel.multiV2?.branches || []"
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
                            v-if="(formModel.multiV2.branches?.length || 0) > 1"
                            size="small"
                            danger
                            @click="formModel.multiV2.branches.splice(bi, 1)"
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
                            <div class="col-span-1 text-right">
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
                          formModel.multiV2.branches ||
                          (formModel.multiV2.branches = [])
                        ).push({
                          topLogic: 'and',
                          conditions: [
                            { type: 'mainRisk', operator: 'eq', value: 1 },
                          ],
                          result: { riskLevel: 1, description: '' },
                        })
                      "
                    >
                      新增分支
                    </Button>
                    <Form.Item label="分支间逻辑">
                      <a-radio-group
                        v-model:value="formModel.multiV2.branchLogic"
                        size="small"
                      >
                        <a-radio-button value="or">或 (OR)</a-radio-button>
                        <a-radio-button value="and">且 (AND)</a-radio-button>
                      </a-radio-group>
                    </Form.Item>
                    <Form.Item label="其他维度匹配方式">
                      <a-radio-group
                        v-model:value="formModel.multiV2.othersApply"
                        size="small"
                      >
                        <a-radio-button value="any">任意(other)</a-radio-button>
                        <a-radio-button value="all">全部(other)</a-radio-button>
                      </a-radio-group>
                    </Form.Item>
                  </div>
                </Form.Item>
              </Col>
            </template>
          </Row>
        </Card>

        <Card title="结果输出配置" class="mb-6">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="评价等级">
                <Input
                  v-model:value="formModel.level"
                  placeholder="如：无/轻度/中度/重度"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="风险等级">
                <Select
                  v-model:value="formModel.riskLevel"
                  :options="riskLevelOptions"
                  allow-clear
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="建议文本">
                <Input
                  v-model:value="formModel.suggestions"
                  placeholder="建议文本"
                />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="学生端评语（多条）">
                <StudentCommentEditor
                  v-model="formModel.comments"
                  :min-height="150"
                />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="配置描述">
                <Input.TextArea
                  v-model:value="formModel.description"
                  :rows="2"
                  placeholder="配置用途/说明"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

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
