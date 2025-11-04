// 认证模式类型
export type AuthMode = 'single' | 'double'

// 单Token响应类型
export interface ISingleTokenRes {
  token: string
  expiresIn: number // 有效期(秒)
}

// 双Token响应类型
export interface IDoubleTokenRes {
  accessToken: string
  refreshToken: string
  accessExpiresIn: number // 访问令牌有效期(秒)
  refreshExpiresIn: number // 刷新令牌有效期(秒)
}

/**
 * Web 端登录响应类型（学生家长端）
 */
export interface IWebAuthLoginRes {
  userId: number // 用户编号
  accessToken: string // 访问令牌
  refreshToken: string // 刷新令牌
  expiresTime: string // 过期时间（ISO 8601 格式）
  isParent: number // 是否家长登录 (0-学生 1-家长)
}

/**
 * 登录返回的信息，其实就是 token 信息
 */
export type IAuthLoginRes = ISingleTokenRes | IDoubleTokenRes | IWebAuthLoginRes

/**
 * 用户信息
 */
export interface IUserInfoRes {
  userId: number
  username: string
  nickname: string
  studentNo?: string // 学号
  avatar?: string
  isParent?: number // 是否家长
  [key: string]: any // 允许其他扩展字段
}

// 认证存储数据结构
export interface AuthStorage {
  mode: AuthMode
  tokens: ISingleTokenRes | IDoubleTokenRes
  userInfo?: IUserInfoRes
  loginTime: number // 登录时间戳
}

/**
 * 获取验证码
 */
export interface ICaptcha {
  captchaEnabled: boolean
  uuid: string
  image: string
}
/**
 * 上传成功的信息
 */
export interface IUploadSuccessInfo {
  fileId: number
  originalName: string
  fileName: string
  storagePath: string
  fileHash: string
  fileType: string
  fileBusinessType: string
  fileSize: number
}
/**
 * 更新用户信息
 */
export interface IUpdateInfo {
  id: number
  name: string
  sex: string
}
/**
 * 更新用户信息
 */
export interface IUpdatePassword {
  id: number
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * 判断是否为单Token响应
 * @param tokenRes 登录响应数据
 * @returns 是否为单Token响应
 */
export function isSingleTokenRes(tokenRes: IAuthLoginRes): tokenRes is ISingleTokenRes {
  return 'token' in tokenRes && !('refreshToken' in tokenRes)
}

/**
 * 判断是否为双Token响应
 * @param tokenRes 登录响应数据
 * @returns 是否为双Token响应
 */
export function isDoubleTokenRes(tokenRes: IAuthLoginRes): tokenRes is IDoubleTokenRes {
  return 'accessToken' in tokenRes && 'refreshToken' in tokenRes && 'accessExpiresIn' in tokenRes
}

/**
 * 判断是否为 Web 端登录响应
 * @param tokenRes 登录响应数据
 * @returns 是否为 Web 端登录响应
 */
export function isWebAuthLoginRes(tokenRes: IAuthLoginRes): tokenRes is IWebAuthLoginRes {
  return 'accessToken' in tokenRes && 'refreshToken' in tokenRes && 'expiresTime' in tokenRes && 'userId' in tokenRes
}
