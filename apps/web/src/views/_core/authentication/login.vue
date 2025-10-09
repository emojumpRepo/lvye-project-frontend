<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { AuthApi } from '#/api/core/auth';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { isTenantEnable } from '@vben/hooks';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { getTenantById, getTenantSimpleList } from '#/api/core/auth';
import { getEnablePasswordLogin } from '#/api/infra/config';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });
const authStore = useAuthStore();
const accessStore = useAccessStore();
const tenantEnable = isTenantEnable();
const route = useRoute();
const router = useRouter();

const loginRef = ref();
const enablePasswordLogin = ref(true);
const hasTenantFromUrl = ref(false);
const noTenantProvided = ref(false);
const tenantLoading = ref(false);
const tenantInfo = ref<AuthApi.TenantResult | null>(null);

/** 获取租户列表，并默认选中 */
const tenantList = ref<AuthApi.TenantResult[]>([]); // 租户列表
const TENANT_CACHE_KEY = 'school_tenant_id'; // localStorage缓存键名

// 判断是否为开发环境
const isDevelopment =
  import.meta.env.MODE === 'development' || import.meta.env.DEV;

async function fetchTenantList() {
  if (!tenantEnable) {
    return;
  }

  tenantLoading.value = true;
  try {
    // 开发环境：允许显示租户列表供选择
    if (isDevelopment) {
      // 获取租户列表
      tenantList.value = await getTenantSimpleList();

      // 尝试从URL或缓存获取默认选中的租户
      const tenantIdFromUrl = route.query.id as string;
      const cachedTenantId = tenantIdFromUrl
        ? null
        : localStorage.getItem(TENANT_CACHE_KEY);
      const defaultTenantId = tenantIdFromUrl || cachedTenantId;

      if (defaultTenantId) {
        // 设置默认选中的租户
        accessStore.setTenantId(Number(defaultTenantId));
        loginRef.value
          ?.getFormApi()
          ?.setFieldValue('tenantId', defaultTenantId.toString());

        // 如果是从URL获取的，缓存它
        if (tenantIdFromUrl) {
          localStorage.setItem(TENANT_CACHE_KEY, defaultTenantId.toString());
        }
      } else if (tenantList.value.length > 0) {
        // 如果没有默认值，选择第一个租户
        const firstTenantId = tenantList?.value?.[0]?.id;
        if (firstTenantId) {
          accessStore.setTenantId(firstTenantId);
          loginRef.value
            ?.getFormApi()
            ?.setFieldValue('tenantId', firstTenantId.toString());
        }
      }

      // 开发环境不需要显示无租户提示
      return;
    }

    // 生产环境：保持原有的安全限制逻辑
    // 1. 优先从URL参数获取租户ID
    const tenantIdFromUrl = route.query.id as string;

    // 2. 如果URL没有，从localStorage获取缓存的租户ID
    const cachedTenantId = tenantIdFromUrl
      ? null
      : localStorage.getItem(TENANT_CACHE_KEY);

    // 使用URL参数或缓存的ID
    const tenantId = tenantIdFromUrl || cachedTenantId;

    if (tenantId) {
      // 如果有租户ID，直接使用免鉴权接口查询
      try {
        const tenantData = await getTenantById(Number(tenantId));

        if (tenantData) {
          // 成功获取租户信息
          hasTenantFromUrl.value = !!tenantIdFromUrl; // 只有URL有参数时才标记
          tenantInfo.value = {
            id: tenantData.id,
            name: tenantData.name,
          };

          // 设置租户ID
          accessStore.setTenantId(tenantData.id);
          loginRef.value
            ?.getFormApi()
            ?.setFieldValue('tenantId', tenantData.id.toString());

          // 如果是从URL获取的，缓存到localStorage
          if (tenantIdFromUrl) {
            localStorage.setItem(TENANT_CACHE_KEY, tenantData.id.toString());
          }

          // 不需要获取租户列表，直接返回
          return;
        } else {
          // 租户ID无效或租户被禁用
          console.error('未找到指定的租户ID或租户已被禁用:', tenantId);
          // 清除无效的缓存
          if (cachedTenantId) {
            localStorage.removeItem(TENANT_CACHE_KEY);
          }
          // 只有URL参数无效时才显示错误，缓存无效时静默失败
          if (tenantIdFromUrl) {
            noTenantProvided.value = true;
            return;
          }
        }
      } catch (error) {
        console.error('获取租户信息失败:', error);
        // 清除无效的缓存
        if (cachedTenantId) {
          localStorage.removeItem(TENANT_CACHE_KEY);
        }
        // 只有URL参数请求失败时才显示错误
        if (tenantIdFromUrl) {
          noTenantProvided.value = true;
          return;
        }
      }
    }

    // 如果没有URL参数也没有缓存，显示无租户提示
    if (!tenantIdFromUrl && !cachedTenantId) {
      noTenantProvided.value = true;
    }
  } catch (error) {
    console.error('获取租户信息失败:', error);
    noTenantProvided.value = true;
  } finally {
    tenantLoading.value = false;
  }
}

/** 处理登录 */
async function handleLogin(values: any) {
  // 登录前确保租户ID已缓存（用于退出时保持）
  const currentTenantId = accessStore.tenantId || values.tenantId;
  if (currentTenantId) {
    localStorage.setItem(TENANT_CACHE_KEY, currentTenantId.toString());
  }

  // 无验证码，直接登录
  await authStore.authLogin('username', {
    ...values,
    isParent: Number(values.isParent),
  });

  // 登录成功后，如果URL中有id参数，清理它
  if (route.query.id) {
    // 移除URL中的id参数，保持URL干净
    const { id, ...otherQuery } = route.query;
    router.replace({
      path: route.path,
      query: otherQuery,
    });
  }
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
  const schema: VbenFormSchema[] = [];

  // 角色选择 - 使用RadioGroup（放在第一个）
  schema.push({
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: $t('authentication.iAmStudent'), value: '0' },
        { 
          label: $t('authentication.iAmParent'),
          value: '1', 
          disabled: true 
        },
      ],
      optionType: 'button',
      buttonStyle: 'solid',
      class: 'flex justify-center',
    },
    fieldName: 'isParent',
    label: $t('authentication.selectIdentity'),
    rules: z.string().min(1, { message: $t('authentication.isParentTip') }),
    defaultValue: '0',
  });

  // 开发环境或没有从URL获取租户时显示租户选择字段
  if (
    tenantEnable &&
    (isDevelopment || (!hasTenantFromUrl.value && !noTenantProvided.value))
  ) {
    schema.push({
      component: 'VbenSelect',
      componentProps: {
        options: tenantList.value.map((item) => ({
          label: item.name,
          value: item.id.toString(),
        })),
        placeholder: isDevelopment
          ? '请选择学校（开发环境）'
          : $t('authentication.tenantTip'),
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
            // 开发环境下，选择租户后也缓存
            if (isDevelopment) {
              localStorage.setItem(
                TENANT_CACHE_KEY,
                values.tenantId.toString(),
              );
            }
          }
        },
      },
    });
  }

  // 生产环境：如果从URL获取了租户，显示租户名称（只读）
  if (!isDevelopment && hasTenantFromUrl.value && tenantInfo.value) {
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

  // 其他字段
  schema.push(
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.studentNoTip'),
      },
      fieldName: 'username',
      label: $t('authentication.studentNoAndId'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.studentNoTip') })
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
  );

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
    <!-- 加载中状态 -->
    <div v-if="tenantLoading" class="flex h-full items-center justify-center">
      <div class="text-center">
        <div class="mb-4">
          <svg
            class="text-primary mx-auto h-12 w-12 animate-spin"
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
        <p class="text-muted-foreground text-lg">正在加载...</p>
      </div>
    </div>

    <!-- 无租户提示（仅生产环境） -->
    <div
      v-else-if="!isDevelopment && noTenantProvided"
      class="flex h-full items-center justify-center"
    >
      <div class="bg-card mx-auto max-w-md rounded-lg p-8 text-center">
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

        <h2 class="text-foreground mb-3 text-2xl font-semibold">
          无法识别学校信息
        </h2>

        <p
          class="text-muted-foreground mb-8 text-base font-normal leading-relaxed"
        >
          系统无法识别您的学校信息，请确认访问链接是否正确。
        </p>

        <div class="bg-muted/30 space-y-4 rounded-md p-4">
          <div class="text-left">
            <h3 class="text-foreground mb-2 text-sm font-medium">
              如果您是学生或家长
            </h3>
            <p
              class="text-muted-foreground text-sm font-normal leading-relaxed"
            >
              请联系学校心理老师获取专属登录链接
            </p>
          </div>

          <div class="border-border/50 my-3 border-t"></div>

          <div class="text-left">
            <h3 class="text-foreground mb-2 text-sm font-medium">
              如果您是学校管理员
            </h3>
            <p
              class="text-muted-foreground text-sm font-normal leading-relaxed"
            >
              请确认链接中包含正确的学校标识参数
            </p>
          </div>
        </div>

        <div class="mt-6">
          <p class="text-muted-foreground/70 text-xs">
            需要帮助？请联系技术支持
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
      :show-remember-me="false"
      :show-forget-password="false"
      :title="$t('authentication.studentWelcomeTitle')"
      :sub-title="$t('authentication.studentWelcomeSubtitle')"
      @submit="handleLogin"
    />
  </div>
</template>

<style lang="scss" scoped>
/* 角色选择Radio按钮居中 */
:deep(.ant-radio-group) {
  display: flex;
  justify-content: center;
  width: 100%;
  
  &.ant-radio-group-solid {
    .ant-radio-button-wrapper {
      min-width: 120px;
      text-align: center;
    }
  }
}
</style>
