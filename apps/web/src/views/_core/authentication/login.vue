<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { AuthApi } from '#/api/core/auth';

import { computed, onMounted, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { isTenantEnable } from '@vben/hooks';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { getTenantByWebsite, getTenantSimpleList } from '#/api/core/auth';
import { getEnablePasswordLogin } from '#/api/infra/config';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });
const authStore = useAuthStore();
const accessStore = useAccessStore();
const tenantEnable = isTenantEnable();

const loginRef = ref();
const enablePasswordLogin = ref(true);

/** 获取租户列表，并默认选中 */
const tenantList = ref<AuthApi.TenantResult[]>([]); // 租户列表
async function fetchTenantList() {
  if (!tenantEnable) {
    return;
  }
  try {
    // 获取租户列表、域名对应租户
    const websiteTenantPromise = getTenantByWebsite(window.location.hostname);
    tenantList.value = await getTenantSimpleList();

    // 选中租户：域名 > store 中的租户 > 首个租户
    let tenantId: null | number = null;
    const websiteTenant = await websiteTenantPromise;
    if (websiteTenant?.id) {
      tenantId = websiteTenant.id;
    }
    // 如果没有从域名获取到租户，尝试从 store 中获取
    if (!tenantId && accessStore.tenantId) {
      tenantId = accessStore.tenantId;
    }
    // 如果还是没有租户，使用列表中的第一个
    if (!tenantId && tenantList.value?.[0]?.id) {
      tenantId = tenantList.value[0].id;
    }

    // 设置选中的租户编号
    accessStore.setTenantId(tenantId);
    loginRef.value.getFormApi().setFieldValue('tenantId', tenantId?.toString());
  } catch (error) {
    console.error('获取租户列表失败:', error);
  }
}

/** 处理登录 */
async function handleLogin(values: any) {
  // 无验证码，直接登录
  await authStore.authLogin('username', {
    ...values,
    isParent: Number(values.isParent),
  });
}

/** 组件挂载时获取租户信息、密码登录开关 */
onMounted(async () => {
  // 多租户场景：必须先确定并设置 tenantId，再请求配置
  if (tenantEnable) {
    await fetchTenantList();
    if (!accessStore.tenantId) {
      // 无法确定租户时，直接回退为需要密码，避免 400 和循环
      enablePasswordLogin.value = true;
      return;
    }
  }

  try {
    if (tenantEnable) {
      const val = await getEnablePasswordLogin();
      enablePasswordLogin.value = Boolean(val?.enablePasswordLogin);
    } else {
      enablePasswordLogin.value = true;
    }
  } catch {
    // 出错时默认需要密码
    enablePasswordLogin.value = true;
  }
});

const formSchema = computed((): VbenFormSchema[] => {
  const schema: VbenFormSchema[] = [
    {
      component: 'VbenSelect',
      componentProps: {
        options: tenantList.value.map((item) => ({
          label: item.name,
          value: item.id.toString(),
        })),
        placeholder: $t('authentication.tenantTip'),
      },
      fieldName: 'tenantId',
      label: $t('authentication.tenant'),
      rules: z.string().min(1, { message: $t('authentication.tenantTip') }),
      dependencies: {
        triggerFields: ['tenantId'],
        if: tenantEnable,
        trigger(values) {
          if (values.tenantId) {
            accessStore.setTenantId(Number(values.tenantId));
          }
        },
      },
    },
    {
      component: 'VbenSelect',
      componentProps: {
        options: [
          { label: '学生', value: '0' },
          { label: '家长', value: '1' },
        ],
        placeholder: $t('authentication.isParentTip'),
      },
      fieldName: 'isParent',
      label: $t('authentication.isParent'),
      rules: z.string().min(1, { message: $t('authentication.isParentTip') }),
      defaultValue: '0',
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.usernameTip') })
        .default(import.meta.env.VITE_APP_DEFAULT_USERNAME),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.studentNameTip'),
      },
      fieldName: 'studentName',
      label: $t('authentication.studentName'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.studentNameTip') }),
    },
  ];

  if (enablePasswordLogin.value) {
    schema.push({
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.passwordTip'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.passwordTip') })
        .default(import.meta.env.VITE_APP_DEFAULT_PASSWORD),
    });
  }

  return schema;
});
</script>

<template>
  <div>
    <AuthenticationLogin
      ref="loginRef"
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      :show-code-login="false"
      :show-qrcode-login="false"
      :show-register="false"
      :show-third-party-login="false"
      @submit="handleLogin"
    />
  </div>
</template>
