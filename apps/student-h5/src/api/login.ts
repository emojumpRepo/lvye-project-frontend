import type { IWebAuthLoginRes } from './types/login'
import { http } from '@/http/http'

enum SmsSceneEnum {
  SMS_LOGIN = 1,
  UPDATE_PHONE = 2,
  UPDATE_PASSWORD = 3,
  RESET_PASSWORD = 4,
}

/**
 * 手机验证码登录表单
 */
export interface ISmsLoginForm {
  mobile: string
  code: string
}

/**
 * 发送手机验证码
 * @param phone 手机号
 */
export function sendSmsCode(mobile: string) {
  return http.post<void>('/psychology/auth/send-sms-code', { mobile, scene: SmsSceneEnum.SMS_LOGIN })
}

/**
 * 手机验证码登录
 * @param loginForm 登录表单
 */
export function smsLogin(loginForm: ISmsLoginForm) {
  return http.post<IWebAuthLoginRes>('/psychology/auth/sms-login', loginForm)
}

/**
 * 刷新token
 * @param refreshToken 刷新token
 */
export function refreshToken(refreshToken: string) {
  return http.post<IWebAuthLoginRes>('/psychology/auth/refresh-token', { refreshToken })
}

/**
 * 退出登录
 */
export function logout() {
  return http.get<void>('/psychology/auth/logout')
}
