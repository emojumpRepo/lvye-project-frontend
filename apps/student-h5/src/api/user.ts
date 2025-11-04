import type { AuthPermissionInfo } from '@vben/types'
import type { IUpdateInfo, IUpdatePassword, IUserInfoRes } from './types/login'
import { http } from '@/http/http'

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return http.get<IUserInfoRes>('/psychology/user/info')
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.post('/psychology/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/psychology/user/updatePassword', data)
}

/**
 * 获取用户和权限信息
 */
export async function getAuthPermissionInfo() {
  return http.get<AuthPermissionInfo>(
    '/system/auth/get-permission-info',
  )
}
