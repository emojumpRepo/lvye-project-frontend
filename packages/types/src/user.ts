import type { AppRouteRecordRaw, BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * 家长学生端 标识
   */
  isParent?: number;

  /**
   * 用户ID
   */
  id?: number;

  /**
   * 所属租户名称
   */
  tenantName?: string;
}

/** 权限信息 */
interface AuthPermissionInfo {
  user: UserInfo;
  roles: string[];
  permissions: string[];
  menus: AppRouteRecordRaw[];
  isParent: number;
  tenantName?: string;
}

export type { AuthPermissionInfo, UserInfo };
