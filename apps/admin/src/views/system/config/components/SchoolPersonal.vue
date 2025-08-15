<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Form as AForm, Input as AInput, message } from 'ant-design-vue';

import { createConfig, getConfigPage, updateConfig } from '#/api/infra/config';
import LyLabel from '#/components/LyLabel/index.vue';

type SchoolConfigKeys = 'school.contact' | 'school.name' | 'system.welcome';

interface SchoolConfigState {
  schoolName: string;
  systemWelcome: string;
  schoolContact: string;
}

const form = reactive<SchoolConfigState>({
  schoolName: '',
  systemWelcome: '',
  schoolContact: '',
});

const initialSnapshot = ref<null | SchoolConfigState>(null);
const loading = ref(false);

// ================= 校验与状态 =================
const NAME_MAX = 50;
const WELCOME_MAX = 100;

// 默认值
const DEFAULT_SCHOOL_NAME = '示例中学';
const DEFAULT_WELCOME = '欢迎使用心理健康管理系统';
const DEFAULT_CONTACT = '010-12345678';

// 欢迎语模板
const welcomeTemplates = [
  '欢迎使用心理健康管理系统',
  '祝你每天开心，成长进步！',
  '关注心理健康，关爱自我！',
];

function applyWelcomeTemplate(t: string) {
  form.systemWelcome = t.slice(0, WELCOME_MAX);
}

// 联系方式：支持分号分隔多个；支持手机号/固话
const mobileReg = /^1[3-9]\d{9}$/;
const landlineReg = /^0\d{9,11}$/;

function normalizeDigits(s: string) {
  return s.replaceAll(/\D/g, '');
}

function formatPhone(raw: string): string {
  const digits = normalizeDigits(raw);
  if (mobileReg.test(digits)) {
    // 3-4-4
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (landlineReg.test(digits)) {
    // 固话按 3-4-4 或 4-4-4（不严格区号判断，仅做美化）
    const area = digits.slice(0, 3);
    const remain = digits.slice(3);
    return `${area}-${remain.slice(0, 4)}-${remain.slice(4)}`;
  }
  return raw;
}

const contactParts = computed(() =>
  form.schoolContact
    .split(/[:;；]/) // 兼容中文分号
    .map((s) => s.trim())
    .filter(Boolean),
);

function formatContacts() {
  const formatted = contactParts.value.map((p) => formatPhone(p));
  form.schoolContact = formatted.join('; ');
}

// ================ AntDV 表单与自定义规则 ================
const formRef = ref();

const validateSchoolName = async (_rule: Rule, value: string) => {
  if (!value || !value.trim()) throw new Error('学校名称不能为空');
  if (value.length > NAME_MAX) throw new Error(`最多输入${NAME_MAX}个字符`);
};

const validateWelcome = async (_rule: Rule, value: string) => {
  if (value && value.length > WELCOME_MAX)
    throw new Error(`最多输入${WELCOME_MAX}个字符`);
};

const validateContacts = async (_rule: Rule, value: string) => {
  if (!value) return; // 非必填；有值时校验
  const parts = value
    .split(/[;；]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = parts.every((p) => {
    const d = normalizeDigits(p);
    return mobileReg.test(d) || landlineReg.test(d);
  });
  if (!ok) throw new Error('请输入有效的手机号或固话，多个用分号分隔');
};

const formRules = ref<Record<string, any>>({
  schoolName: [
    {
      validator: validateSchoolName,
      trigger: ['change', 'blur'],
      required: true,
    },
  ],
  systemWelcome: [{ validator: validateWelcome, trigger: ['change', 'blur'] }],
  schoolContact: [{ validator: validateContacts, trigger: ['change', 'blur'] }],
});

// 初次加载后，如为空则填充默认值
watch(
  () => initialSnapshot.value,
  (snap) => {
    if (!snap) return;
    if (!form.schoolName) form.schoolName = DEFAULT_SCHOOL_NAME;
    if (!form.systemWelcome) form.systemWelcome = DEFAULT_WELCOME;
    if (!form.schoolContact) form.schoolContact = DEFAULT_CONTACT;
  },
);

async function fetchKeyValue(
  key: SchoolConfigKeys,
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
  key: SchoolConfigKeys,
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
    const [
      { value: schoolName },
      { value: systemWelcome },
      { value: schoolContact },
    ] = await Promise.all([
      fetchKeyValue('school.name'),
      fetchKeyValue('system.welcome'),
      fetchKeyValue('school.contact'),
    ]);
    form.schoolName = schoolName || DEFAULT_SCHOOL_NAME;
    form.systemWelcome = systemWelcome || DEFAULT_WELCOME;
    form.schoolContact = schoolContact || DEFAULT_CONTACT;
    initialSnapshot.value = { ...form };
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  try {
    await formRef.value?.validate();

    await Promise.all([
      upsertConfig('school.name', form.schoolName, {
        category: 'school',
        name: '学校名称',
      }),
      upsertConfig('system.welcome', form.systemWelcome, {
        category: 'school',
        name: '系统欢迎词',
      }),
      upsertConfig('school.contact', form.schoolContact, {
        category: 'school',
        name: '学校联系方式',
      }),
    ]);
    initialSnapshot.value = { ...form };
    message.success('已保存');
  } catch {
    message.error('保存失败');
  }
}

function handleReset() {
  // keep simple, linter prefers no conditional side-effect as expression
  if (initialSnapshot.value) {
    Object.assign(form, initialSnapshot.value);
  }
}

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
      title="学校基本信息"
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
        :rules="formRules"
        layout="vertical"
        :disabled="loading"
      >
        <!-- 学校名称 -->
        <AForm.Item name="schoolName">
          <LyLabel
            title="学校名称"
            custom-title-class="text-[14px] font-semibold"
          />
          <AInput
            v-model:value="form.schoolName"
            placeholder="请输入学校名称"
            :maxlength="NAME_MAX"
            show-count
            class="school-personal-input"
          />
          <div class="school-personal-input-description">
            显示在系统各处的学校名称
          </div>
          <div class="school-personal-input-description">
            <span class="mr-1 inline-block">影响范围：</span>
            系统标题、登录页、页面标题、报告抬头
          </div>
        </AForm.Item>

        <div class="mb-6 h-[1px] w-full bg-[#E9E9E9]"></div>

        <!-- 系统欢迎词 -->
        <AForm.Item name="systemWelcome">
          <LyLabel
            title="系统欢迎词"
            custom-title-class="text-[14px] font-semibold"
          />
          <AInput.TextArea
            v-model:value="form.systemWelcome"
            placeholder="请输入欢迎词"
            :maxlength="WELCOME_MAX"
            :auto-size="{ minRows: 1, maxRows: 5 }"
            show-count
            class="school-personal-input"
          />
          <div class="school-personal-input-description !mt-3">
            用户登录后展示的欢迎语
          </div>
          <div class="school-personal-input-description">
            <span class="mr-1 inline-block">影响范围：</span>
            登录成功页、用户登录后的欢迎页
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <button
              v-for="t in welcomeTemplates"
              :key="t"
              type="button"
              class="rounded border border-[#C8C9CC] px-2 py-1 text-[12px] text-[#4C4C4D] hover:bg-[#F2F3F5]"
              @click="applyWelcomeTemplate(t)"
            >
              {{ t }}
            </button>
          </div>
        </AForm.Item>

        <div class="mb-6 h-[1px] w-full bg-[#E9E9E9]"></div>

        <!-- 学校联系方式 -->
        <AForm.Item name="schoolContact">
          <LyLabel
            title="学校联系方式"
            custom-title-class="text-[14px] font-semibold"
          />
          <AInput
            v-model:value="form.schoolContact"
            placeholder="请输入联系电话"
            class="school-personal-input"
            @blur="formatContacts"
          />
          <div class="school-personal-input-description">学校的联系电话</div>
          <div class="school-personal-input-description">
            <span class="mr-1 inline-block">影响范围：</span>
            系统关于页面、紧急联系场景等
          </div>
        </AForm.Item>
      </AForm>
    </section>
  </div>
</template>

<style scoped lang="scss">
.school-personal-input {
  @apply mb-1 min-h-[40px] max-w-[448px] rounded-[4px];
}

.school-personal-input-description {
  @apply mt-2 text-[12px] leading-[12px] text-[#979899];
}

:deep(.ant-input-textarea-show-count::after) {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 12px;
  color: #b0b1b2;
}
</style>
