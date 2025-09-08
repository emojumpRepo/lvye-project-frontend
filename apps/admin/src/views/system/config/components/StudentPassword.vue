<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import { onMounted, reactive, ref, watch } from 'vue';

import {
  Form as AForm,
  Input as AInput,
  Radio as ARadio,
  RadioGroup as ARadioGroup,
  message,
} from 'ant-design-vue';

import { createConfig, getConfigPage, updateConfig } from '#/api/infra/config';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

type StudentPasswordConfigKeys =
  | 'student.defaultPassword'
  | 'student.enablePasswordLogin';

interface StudentPasswordState {
  enablePasswordLogin: boolean;
  defaultPassword: string;
}

const form = reactive<StudentPasswordState>({
  enablePasswordLogin: true,
  defaultPassword: '123456',
});

const initialSnapshot = ref<null | StudentPasswordState>(null);

const loading = ref(false);

const formRef = ref();

const openConfirmDialog = ref(false); // 保存确认
const openToggleDialog = ref(false); // 切换开关确认
const pendingEnableValue = ref<boolean | null>(null);

// 默认值
const DEFAULT_ENABLE_PASSWORD_LOGIN = true;
const DEFAULT_PASSWORD = '123456';

async function fetchKeyValue(
  key: StudentPasswordConfigKeys,
): Promise<{ id?: number; value: string }> {
  // 并行策略：先取值，再尝试查找 id
  const page = await getConfigPage({ pageNo: 1, pageSize: 10, key }).catch(
    () => undefined as any,
  );
  const id = page?.list?.find?.((it: any) => it?.key === key)?.id;
  const value = page?.list?.find?.((it: any) => it?.key === key)?.value;
  return { id, value: typeof value === 'string' ? value : String(value ?? '') };
}

async function upsertConfig(
  key: StudentPasswordConfigKeys,
  value: string,
  meta: { category: string; name: string; remark?: string },
) {
  // 通过分页查询尝试拿到 id；拿不到则创建
  const page = await getConfigPage({ pageNo: 1, pageSize: 10, key }).catch(
    () => undefined as any,
  );
  const exist = page?.list?.find?.((it: any) => it?.key === key);
  const payload = {
    id: exist?.id,
    key,
    value,
    category: meta.category,
    name: meta.name,
    type: 1,
    visible: true,
    remark: meta.remark ?? '',
  } as any;
  await (exist?.id ? updateConfig(payload) : createConfig(payload));
}

async function load() {
  loading.value = true;
  try {
    const [{ value: enablePasswordLogin }, { value: defaultPassword }] =
      await Promise.all([
        fetchKeyValue('student.enablePasswordLogin'),
        fetchKeyValue('student.defaultPassword'),
      ]);
    form.enablePasswordLogin =
      String(enablePasswordLogin).trim().toLowerCase() === 'true' ||
      String(enablePasswordLogin).trim() === '1';
    form.defaultPassword = defaultPassword || DEFAULT_PASSWORD;
    initialSnapshot.value = { ...form };
  } finally {
    loading.value = false;
  }
}

async function handleSaveConfirm() {
  try {
    await formRef.value?.validate();
    loading.value = true;

    await Promise.all([
      upsertConfig(
        'student.enablePasswordLogin',
        form.enablePasswordLogin.toString(),
        {
          category: 'student',
          name: '启用学生密码验证',
          remark: '学生登录时需要验证密码',
        },
      ),
      upsertConfig('student.defaultPassword', form.defaultPassword, {
        category: 'student',
        name: '学生默认密码',
        remark: '新建学生账户的统一默认密码设置',
      }),
    ]);

    openConfirmDialog.value = false;
    initialSnapshot.value = { ...form };
    message.success('已保存');
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

function handleSave() {
  openConfirmDialog.value = true;
}

function handleReset() {
  if (initialSnapshot.value) {
    Object.assign(form, initialSnapshot.value);
  }
}

function handleEnableChange(e: any) {
  const val = (e?.target?.value ?? e) as boolean;
  pendingEnableValue.value = val;
  openToggleDialog.value = true;
}

function handleEnableConfirm() {
  if (pendingEnableValue.value === null) return;
  form.enablePasswordLogin = pendingEnableValue.value as boolean;
  initialSnapshot.value = { ...form };
  openToggleDialog.value = false;
  pendingEnableValue.value = null;
}

function handleEnableCancel() {
  openToggleDialog.value = false;
  pendingEnableValue.value = null;
}

const validateDefaultPassword = async (_rule: Rule, value: string) => {
  if (!value || value.length < 6)
    throw new Error('默认密码至少 6 位，建议 6-12 位');
  if (value.length > 12) throw new Error('默认密码最多 12 位，建议 6-12 位');
  if (!/^[A-Z0-9]+$/i.test(value)) throw new Error('仅支持数字和字母');
};

const rules = ref<Record<string, any>>({
  defaultPassword: [
    { validator: validateDefaultPassword, trigger: ['change', 'blur'] },
  ],
});

// 初次加载后，如为空则填充默认值
watch(
  () => initialSnapshot.value,
  (snap) => {
    if (!snap) return;
    if (form.enablePasswordLogin === undefined)
      form.enablePasswordLogin = DEFAULT_ENABLE_PASSWORD_LOGIN;
    if (!form.defaultPassword) form.defaultPassword = DEFAULT_PASSWORD;
  },
);

onMounted(() => {
  load();
});

defineExpose({
  handleSave,
  handleReset,
});
</script>

<template>
  <div class="h-full w-full">
    <LyLabel
      title="学生登录验证"
      has-indicator
      custom-title-class="text-[16px] font-semibold"
      custom-gap-class="gap-3"
      custom-indicator-class="h-[14px] w-[2px]"
      margin-bottom-class="mb-5"
    />

    <section>
      <AForm
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
        :disabled="loading"
      >
        <!-- 启用学生密码验证 -->
        <AForm.Item>
          <LyLabel
            title="启用学生密码验证"
            custom-title-class="text-[14px] font-semibold"
          />
          <ARadioGroup
            :value="form.enablePasswordLogin"
            @change="handleEnableChange"
          >
            <ARadio :value="true">启用</ARadio>
            <ARadio :value="false">不启用</ARadio>
          </ARadioGroup>
          <div class="input-description">
            {{
              form.enablePasswordLogin
                ? '学生登录时需要验证密码，默认密码为123456'
                : '学生仅需输入学号即可登录，适用于内网环境或低安全要求场景'
            }}
          </div>
          <div class="input-description">
            <span class="mr-1 inline-block">影响范围：</span>
            所有学生用户的登录流程和系统访问控制
          </div>
        </AForm.Item>

        <div class="mb-6 h-[1px] w-full bg-[#E9E9E9]"></div>

        <!-- 默认密码 -->
        <AForm.Item name="defaultPassword">
          <LyLabel
            title="学生默认密码"
            custom-title-class="text-[14px] font-semibold"
          />
          <AInput
            v-model:value="form.defaultPassword"
            placeholder="请输入默认密码"
            class="mb-1 min-h-[40px] max-w-[448px] rounded-[4px]"
          />
          <div class="input-description">新建学生账户的统一默认密码设置</div>
          <div class="input-description">
            <span class="mr-1 inline-block">影响范围：</span>
            所有新建学生账户的初始密码
          </div>
        </AForm.Item>
      </AForm>
    </section>

    <!-- 保存确认 -->
    <ConfirmDialog
      v-model:show="openConfirmDialog"
      @confirm="handleSaveConfirm"
    >
      <template #title>
        <div class="confirm-dialog-title">确认保存学生登录密码策略？</div>
        <div class="confirm-dialog-description">
          修改默认密码将影响新建的学生账户，现有账户密码不变.
        </div>
      </template>
    </ConfirmDialog>

    <!-- 切换开关确认 -->
    <ConfirmDialog
      v-model:show="openToggleDialog"
      @confirm="handleEnableConfirm"
      @cancel="handleEnableCancel"
    >
      <template #title>
        <template v-if="pendingEnableValue">
          <div>
            <div class="confirm-dialog-title">确定启用学生密码验证？</div>
            <div class="confirm-dialog-description">
              学生登录时需要验证密码，默认密码为123456
            </div>
          </div>
        </template>
        <template v-else>
          <div>
            <div class="confirm-dialog-title">确定不启用学生密码验证？</div>
            <div class="confirm-dialog-description">
              学生仅需输入学号即可登录，适用于内网环境或低安全要求场景
            </div>
          </div>
        </template>
      </template>
    </ConfirmDialog>
  </div>
</template>

<style scoped lang="scss">
.input-description {
  @apply mt-2 text-[12px] leading-[12px] text-[#979899];
}

.confirm-dialog-title {
  @apply mb-2 text-[16px] font-medium;
}

.confirm-dialog-description {
  @apply text-[14px] leading-[12px] text-[#979899];
}

:deep(.ant-select-selector) {
  height: 40px !important;
  border-radius: 4px;
}

:deep(.ant-select-selection-item) {
  line-height: 40px !important;
}
</style>
