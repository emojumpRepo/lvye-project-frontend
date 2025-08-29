import type { AuthPermissionInfo } from '@vben/types';

import {
  appBaseRequestClient,
  appRequestClient,
  requestClient,
} from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
    captchaVerification?: string;
    // 绑定社交登录时，需要传递如下参数
    socialType?: number;
    socialCode?: string;
    socialState?: string;
    isParent?: number;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    userId: number;
    expiresTime: number;
    isParent: number;
  }

  /** 租户信息返回值 */
  export interface TenantResult {
    id: number;
    name: string;
  }

  /** 手机验证码获取接口参数 */
  export interface SmsCodeParams {
    mobile: string;
    scene: number;
  }

  /** 手机验证码登录接口参数 */
  export interface SmsLoginParams {
    mobile: string;
    code: string;
  }

  /** 注册接口参数 */
  export interface RegisterParams {
    username: string;
    password: string;
    captchaVerification: string;
  }

  /** 重置密码接口参数 */
  export interface ResetPasswordParams {
    password: string;
    mobile: string;
    code: string;
  }

  /** 社交快捷登录接口参数 */
  export interface SocialLoginParams {
    type: number;
    code: string;
    state: string;
  }
}

/** 登录 */
export async function loginApi(data: AuthApi.LoginParams) {
  return appRequestClient.post<AuthApi.LoginResult>(
    '/psychology/auth/login',
    data,
  );
}

/** 刷新 accessToken */
export async function refreshTokenApi(refreshToken: string) {
  return appBaseRequestClient.post(
    `/psychology/auth/refresh-token?refreshToken=${refreshToken}`,
  );
}

/** 退出登录 */
export async function logoutApi(accessToken: string) {
  return appBaseRequestClient.post(
    '/psychology/auth/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

/** 获取权限信息 */
export async function getAuthPermissionInfoApi() {
  return appRequestClient.get<AuthPermissionInfo>(
    '/system/auth/get-permission-info',
  );
}

/** 获取租户列表 */
export async function getTenantSimpleList() {
  return requestClient.get<AuthApi.TenantResult[]>(
    `/system/tenant/simple-list`,
  );
}

/** 使用租户域名，获得租户信息 */
export async function getTenantByWebsite(website: string) {
  return requestClient.get<AuthApi.TenantResult>(
    `/system/tenant/get-by-website?website=${website}`,
  );
}
