<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { AuthApi } from '#/api/core/auth';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { isCaptchaEnable, isTenantEnable } from '@vben/hooks';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { getTenantById, getTenantByWebsite, getTenantSimpleList } from '#/api/core/auth';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const accessStore = useAccessStore();
const tenantEnable = isTenantEnable();
const captchaEnable = isCaptchaEnable();
const route = useRoute();

const loginRef = ref();
const verifyRef = ref();
const hasTenantFromUrl = ref(false);
const noTenantProvided = ref(false);
const tenantLoading = ref(false);
const tenantInfo = ref<AuthApi.TenantResult | null>(null);

/** 获取租户列表，并默认选中 */
const tenantList = ref<AuthApi.TenantResult[]>([]); // 租户列表
async function fetchTenantList() {
  if (!tenantEnable) {
    return;
  }
  
  tenantLoading.value = true;
  try {
    // 优先从URL参数获取租户ID（使用简洁的 id 参数）
    const tenantIdFromUrl = route.query.id as string;
    
    if (tenantIdFromUrl) {
      // 如果URL中有租户ID，直接使用免鉴权接口查询
      try {
        const tenantData = await getTenantById(Number(tenantIdFromUrl));
        
        if (tenantData) {
          // 成功获取租户信息
          hasTenantFromUrl.value = true;
          tenantInfo.value = {
            id: tenantData.id,
            name: tenantData.name
          };
          
          // 设置租户ID
          accessStore.setTenantId(tenantData.id);
          loginRef.value?.getFormApi()?.setFieldValue('tenantId', tenantData.id.toString());
          
          // 不需要获取租户列表，直接返回
          return;
        } else {
          // 租户ID无效或租户被禁用，显示无租户提示
          console.error('未找到指定的租户ID或租户已被禁用:', tenantIdFromUrl);
          noTenantProvided.value = true;
          return;
        }
      } catch (error) {
        console.error('获取租户信息失败:', error);
        // 租户ID无效，显示无租户提示
        noTenantProvided.value = true;
        return;
      }
    }
    
    // 如果没有URL参数，直接显示无租户提示
    if (!tenantIdFromUrl) {
      // 没有提供租户ID，显示提示信息
      noTenantProvided.value = true;
      return;
    }
    
    // 以下是原有的域名获取租户逻辑（作为备用方案）
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
    loginRef.value?.getFormApi()?.setFieldValue('tenantId', tenantId?.toString());
  } catch (error) {
    console.error('获取租户列表失败:', error);
    noTenantProvided.value = true;
  } finally {
    tenantLoading.value = false;
  }
}

/** 处理登录 */
async function handleLogin(values: any) {
  // 如果开启验证码，则先验证验证码
  if (captchaEnable) {
    verifyRef.value.show();
    return;
  }
  // 无验证码，直接登录
  await authStore.authLogin('username', values);
}

/** 组件挂载时获取租户信息 */
onMounted(() => {
  fetchTenantList();
});

const formSchema = computed((): VbenFormSchema[] => {
  const schema: VbenFormSchema[] = [];
  
  // 只有在没有从URL获取租户时才显示租户选择字段
  if (tenantEnable && !hasTenantFromUrl.value && !noTenantProvided.value) {
    schema.push({
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
    });
  }
  
  // 如果从URL获取了租户，显示租户名称（只读）
  if (hasTenantFromUrl.value && tenantInfo.value) {
    schema.push({
      component: 'VbenInput',
      componentProps: {
        disabled: true,
        placeholder: tenantInfo.value.name,
        value: tenantInfo.value.name,
      },
      fieldName: 'tenantName',
      label: $t('authentication.tenant'),
      defaultValue: tenantInfo.value.name,
    });
  }
  
  // 其他字段保持不变
  schema.push(
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
    }
  );
  
  return schema;
});
</script>

<template>
  <div>
    <!-- 加载中状态 -->
    <div v-if="tenantLoading" class="flex h-full items-center justify-center">
      <div class="text-center">
        <div class="mb-4">
          <svg
            class="mx-auto h-12 w-12 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p class="text-lg text-muted-foreground">正在加载...</p>
      </div>
    </div>
    
    <!-- 无租户提示 -->
    <div
      v-else-if="noTenantProvided"
      class="flex h-full items-center justify-center"
    >
      <div class="mx-auto max-w-md rounded-lg bg-card p-8 text-center">
        <div class="mb-6">
          <svg
            class="mx-auto h-20 w-20 text-yellow-500 opacity-80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        
        <h2 class="mb-3 text-2xl font-semibold text-foreground">
          无法识别学校信息
        </h2>
        
        <p class="mb-8 text-base font-normal leading-relaxed text-muted-foreground">
          系统无法识别您的学校信息，请确认访问链接是否正确。
        </p>
        
        <div class="space-y-4 rounded-md bg-muted/30 p-4">
          <div class="text-left">
            <h3 class="mb-2 text-sm font-medium text-foreground">
              如果您是管理员
            </h3>
            <p class="text-sm font-normal leading-relaxed text-muted-foreground">
              请确认链接中包含正确的学校标识参数
            </p>
          </div>
          
          <div class="my-3 border-t border-border/50"></div>
          
          <div class="text-left">
            <h3 class="mb-2 text-sm font-medium text-foreground">
              正确的访问格式
            </h3>
            <p class="text-sm font-normal leading-relaxed text-muted-foreground">
              /auth/login?id=您的学校ID
            </p>
          </div>
        </div>
        
        <div class="mt-6">
          <p class="text-xs text-muted-foreground/70">
            需要帮助？请联系系统管理员
          </p>
        </div>
      </div>
    </div>

    <!-- 正常登录界面 -->
    <AuthenticationLogin
      v-else
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
