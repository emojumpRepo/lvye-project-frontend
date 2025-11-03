import type { IUpdateInfo, IUpdatePassword, IUserInfoRes } from './types/login'
import { http } from '@/http/http'

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return http.get<IUserInfoRes>('/user/info')
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}
