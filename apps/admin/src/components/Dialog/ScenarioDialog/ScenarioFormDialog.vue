<script setup lang="ts">
import type { AssessmentScenario, AssessmentScenarioSlot } from '@vben/types';

import type { PsychologyScenarioApi } from '#/api/psychology/scenario';

import { computed, reactive, ref, watch } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Select,
  Table,
} from 'ant-design-vue';

import { getQuestionnaireListSimple } from '#/api/psychology/questionnaire';
import {
  createAssessmentScenario,
  getAssessmentScenario,
  getAssessmentScenarioSlots,
  updateAssessmentScenario,
} from '#/api/psychology/scenario';
import { useScenarioFormSchema } from '#/views/assessment/scenario/data';

interface Props {
  isEdit?: boolean;
  record?: AssessmentScenario;
}

interface Emits {
  (e: 'success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  record: undefined,
});

const emit = defineEmits<Emits>();

// ============== 表单配置 ==============
const [BaseForm, formApi] = useVbenForm({
  // 使用 reactive 包装表单配置
  commonConfig: reactive({
    hideRequiredMark: false,
    labelWidth: 120,
  }),
  showDefaultActions: false,
  submitButtonOptions: {
    show: false,
  },
  resetButtonOptions: {
    show: false,
  },
  schema: useScenarioFormSchema(),
});

// ============== 数据状态 ==============
const loading = ref(false);
const isEditRef = ref(!!props.isEdit);
const currentRecord = ref<AssessmentScenario | undefined>(undefined);
const slotsRef = ref<AssessmentScenarioSlot[]>([]);
const maxQuestionnaireCountRef = ref<number | undefined>(undefined);
const questionnaireOptions = ref<{ label: string; value: number }[]>([]);
const loadingQuestionnaires = ref(false);

async function loadQuestionnaireOptions() {
  try {
    loadingQuestionnaires.value = true;
    const list = await getQuestionnaireListSimple(0);
    const arr = Array.isArray(list) ? list : [];
    questionnaireOptions.value = arr
      .map((q: any) => ({
        label: String(q.title ?? q.name ?? q.questionnaireTitle ?? q.id),
        value: Number(q.id),
      }))
      .filter((opt) => !!opt.value && !!opt.label);
  } catch (error) {
    console.error('加载问卷列表失败:', error);
    questionnaireOptions.value = [];
  } finally {
    loadingQuestionnaires.value = false;
  }
}

function filterQuestionnaireOption(input: string, option?: { label?: string }) {
  if (!option?.label) return false;
  return option.label.toLowerCase().includes(input.toLowerCase());
}

const isAddDisabled = computed(() => {
  const max = maxQuestionnaireCountRef.value;
  if (!max || max <= 0) return false;
  return slotsRef.value.length >= max;
});
const slotColumns = [
  { title: '槽位编码', dataIndex: 'slotKey', key: 'slotKey', width: 180 },
  { title: '槽位名称', dataIndex: 'slotName', key: 'slotName', width: 180 },
  { title: '顺序', dataIndex: 'slotOrder', key: 'slotOrder', width: 120 },
  {
    title: '允许类型',
    dataIndex: 'allowedQuestionnaireTypes',
    key: 'allowedQuestionnaireTypes',
    width: 180,
  },
  {
    title: '扩展配置',
    dataIndex: 'metadataJson',
    key: 'metadataJson',
  },
  {
    title: '关联问卷（多选）',
    dataIndex: 'questionnaire',
    key: 'questionnaire',
    width: 280,
  },
  { title: '操作', key: 'actions', width: 80 },
];

// ============== 表单处理 ==============
// 监听编辑数据变化，自动填充表单
watch(
  () => props.record,
  (record) => {
    if (!record) return;
    if (isEditRef.value) {
      formApi.setValues({
        code: record.code,
        name: record.name,
        maxQuestionnaireCount: record.maxQuestionnaireCount,
        frontendRoute: record.frontendRoute,
        isActive: record.isActive,
        metadataJson: record.metadataJson,
      });
    }
  },
);

// 禁用编码字段在编辑模式下
const formSchema = computed(() => {
  const schema = useScenarioFormSchema();
  if (isEditRef.value) {
    const codeField = schema.find((field) => field.fieldName === 'code');
    if (codeField) {
      codeField.componentProps = {
        ...codeField.componentProps,
        disabled: true,
      };
    }
  }
  // 监听并同步最大问卷数，用于限制槽位数量
  const maxField = schema.find(
    (field) => field.fieldName === 'maxQuestionnaireCount',
  );
  if (maxField) {
    const prev = maxField.componentProps || {};
    maxField.componentProps = {
      ...prev,
      onChange: (value: number) => {
        const num = Number(value) || 0;
        maxQuestionnaireCountRef.value = num > 0 ? num : undefined;
        const max = maxQuestionnaireCountRef.value;
        if (max && slotsRef.value.length > max) {
          slotsRef.value = slotsRef.value.slice(0, max);
        }
      },
    } as any;
  }
  return schema;
});

// 更新表单配置
watch(
  formSchema,
  (newSchema) => {
    formApi.updateSchema(newSchema);
  },
  { immediate: true },
);

// ============== 提交处理 ==============
async function handleSubmit(): Promise<boolean> {
  try {
    loading.value = true;

    // 验证并获取表单值
    const { valid } = await formApi.validate();
    if (!valid) return false;
    const values = (await formApi.getValues()) as Record<string, any>;

    // 校验槽位
    if (slotsRef.value.length === 0) {
      message.error('请至少添加一个槽位');
      return false;
    }
    if (
      maxQuestionnaireCountRef.value &&
      slotsRef.value.length > maxQuestionnaireCountRef.value
    ) {
      message.error('槽位数量不能超过最大问卷数');
      return false;
    }
    const invalid = slotsRef.value.find(
      (s) => !s.slotKey || !s.slotName || s.slotOrder === undefined,
    );
    if (invalid) {
      message.error('请完善槽位的编码、名称和顺序');
      return false;
    }

    // 转换数据格式，清理临时字段
    const cleanSlots = slotsRef.value.map((slot) => {
      const { _tempId, ...cleanSlot } = slot as any;
      return cleanSlot;
    });

    const formData: PsychologyScenarioApi.AssessmentScenarioVO = {
      ...(values as PsychologyScenarioApi.AssessmentScenarioVO),
      isActive: !!values.isActive,
      slots: cleanSlots,
    };

    // 添加ID（编辑模式）
    if (isEditRef.value && currentRecord.value?.id) {
      formData.id = currentRecord.value.id;
    }

    // 调用API
    if (isEditRef.value) {
      await updateAssessmentScenario(formData);
      message.success('更新成功');
    } else {
      await createAssessmentScenario(formData);
      message.success('创建成功');
    }

    emit('success');
    return true;
  } catch (error) {
    console.error('提交失败:', error);
    message.error('操作失败，请重试');
    return false;
  } finally {
    loading.value = false;
  }
}

function addSlot() {
  if (isAddDisabled.value) {
    return;
  }

  const newSlot = {
    scenarioId: currentRecord.value?.id ?? 0,
    slotKey: '',
    slotName: '',
    slotOrder: (slotsRef.value[slotsRef.value.length - 1]?.slotOrder ?? 0) + 1,
    allowedQuestionnaireTypes: '',
    questionnaireIds: [],
    metadataJson: '',
    frontendComponent: '',
    // 添加一个唯一的临时ID作为key
    _tempId: Date.now() + Math.random(),
  };

  slotsRef.value.push(newSlot);
}

// ============== Dialog ==============
const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  centered: true,
  class: 'scenario-form-dialog',
  onConfirm: async () => {
    try {
      // 可选：提交时锁定弹窗，避免重复提交
      modalApi.lock?.();
      const ok = await handleSubmit();
      if (ok) {
        modalApi.close();
      }
    } finally {
      modalApi.unlock?.();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      try {
        // 打开弹窗时加载问卷选项
        if (questionnaireOptions.value.length === 0) {
          await loadQuestionnaireOptions();
        }
        const data = modalApi.getData<Record<string, any>>() || {};
        isEditRef.value = !!(data.isEdit ?? props.isEdit ?? false);
        const incomingRecord = data.record as AssessmentScenario | undefined;
        if (incomingRecord) {
          let detailAny: any = incomingRecord as any;
          // 若缺少完整详情或 slots，进行兜底加载
          try {
            const id = detailAny.id as number | undefined;
            if (id) {
              const [detail, slots] = await Promise.all([
                getAssessmentScenario(id),
                getAssessmentScenarioSlots(id),
              ]);
              detailAny = { ...detail, slots } as any;
            }
          } catch {}

          currentRecord.value = detailAny as AssessmentScenario;
          formApi.setValues({
            code: detailAny.code,
            name: detailAny.name,
            description: detailAny.description,
            maxQuestionnaireCount: detailAny.maxQuestionnaireCount,
            frontendRoute: detailAny.frontendRoute,
            isActive: detailAny.isActive,
            metadataJson: detailAny.metadataJson,
          });

          slotsRef.value = Array.isArray(detailAny.slots)
            ? detailAny.slots.map((slot: any) => ({
                ...slot,
                questionnaireIds: slot.questionnaireIdList,
                // 确保每个槽位都有唯一ID作为key
                _tempId: slot.id || Date.now() + Math.random(),
              }))
            : [];

          maxQuestionnaireCountRef.value =
            detailAny.maxQuestionnaireCount &&
            detailAny.maxQuestionnaireCount > 0
              ? detailAny.maxQuestionnaireCount
              : undefined;
        } else {
          // 重置表单时确保包含所有字段
          formApi.setValues({
            code: '',
            name: '',
            description: '',
            maxQuestionnaireCount: undefined,
            frontendRoute: '',
            isActive: true,
            metadataJson: '',
          });
          slotsRef.value = [];
          maxQuestionnaireCountRef.value = undefined;
        }
        modalApi.setState({
          title: isEditRef.value ? '编辑场景' : '新建场景',
          confirmText: '保存',
        });
      } catch (error) {
        console.error('打开场景表单对话框时发生错误:', error);
        message.error('加载表单数据失败，请重试');
      }
    }
  },
});
</script>

<template>
  <Modal :width="920">
    <div class="p-2">
      <BaseForm />
      <!-- 槽位编辑（Ant Design） -->
      <div class="mt-4">
        <div class="mb-2 flex justify-between text-sm font-semibold">
          场景槽位
          <div class="space-x-2">
            <Button
              type="primary"
              :disabled="isAddDisabled"
              @click="addSlot"
              size="small"
            >
              新增槽位 +
            </Button>
          </div>
        </div>
      </div>
      <Table
        :data-source="slotsRef"
        :columns="slotColumns"
        :pagination="false"
        :row-key="
          (record) =>
            record._tempId || record.id || record.slotKey || Math.random()
        "
        size="small"
        bordered
      >
        <template #bodyCell="{ column, record: rowItem, index }">
          <template v-if="column.key === 'slotKey' && rowItem">
            <Input
              v-model:value="rowItem.slotKey"
              placeholder="槽位编码，如：library"
              :key="`slotKey-${rowItem._tempId || index}`"
            />
          </template>
          <template v-else-if="column.key === 'slotName' && rowItem">
            <Input
              v-model:value="rowItem.slotName"
              placeholder="槽位名称，如：图书馆"
              :key="`slotName-${rowItem._tempId || index}`"
            />
          </template>
          <template v-else-if="column.key === 'slotOrder' && rowItem">
            <InputNumber
              v-model:value="rowItem.slotOrder"
              :min="1"
              style="width: 100%"
              :key="`slotOrder-${rowItem._tempId || index}`"
            />
          </template>
          <template
            v-else-if="column.key === 'allowedQuestionnaireTypes' && rowItem"
          >
            <Input
              v-model:value="rowItem.allowedQuestionnaireTypes"
              placeholder="允许类型，如：ANXIETY,DEPRESSION"
              :key="`allowedTypes-${rowItem._tempId || index}`"
            />
          </template>
          <template v-else-if="column.key === 'metadataJson' && rowItem">
            <Input.TextArea
              v-model:value="rowItem.metadataJson"
              :rows="3"
              placeholder="请输入JSON格式的扩展配置（可选）"
              :key="`metadataJson-${rowItem._tempId || index}`"
            />
          </template>
          <template v-else-if="column.key === 'questionnaire' && rowItem">
            <Select
              style="width: 100%"
              mode="multiple"
              v-model:value="rowItem.questionnaireIds"
              placeholder="请选择关联问卷（可多选）"
              :options="questionnaireOptions"
              :loading="loadingQuestionnaires"
              show-search
              :filter-option="filterQuestionnaireOption as any"
              :key="`questionnaire-${rowItem._tempId || index}`"
              :max-tag-count="2"
              :max-tag-text-length="10"
            />
          </template>
          <template v-else-if="column.key === 'actions'">
            <Popconfirm
              title="确定删除该槽位？"
              @confirm="() => slotsRef.splice(index, 1)"
            >
              <Button type="link" danger>删除</Button>
            </Popconfirm>
          </template>
        </template>
        <template #emptyText>
          <div class="py-4 text-center text-gray-500">暂无槽位，请添加</div>
        </template>
      </Table>
    </div>
  </Modal>
</template>

<style lang="scss">
.scenario-form-dialog {
  width: 90vw !important;
  max-width: 95vw !important;
}
</style>
