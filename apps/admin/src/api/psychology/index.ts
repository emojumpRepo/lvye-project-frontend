/**
 * 心理健康管理系统 API 统一导出
 *
 * 模块划分：
 * - student-profile: 学生档案管理
 * - assessment: 测评管理（任务、参与者、结果）
 * - consultation: 咨询管理（心理咨询、危机干预）
 * - notification: 通知系统（通知记录、模板管理）
 * - timeline: 时间线管理（学生档案时间线）
 * - quick-report: 快速上报（任课老师快速上报）
 * - config: 系统配置（年级班级、教师、字典等）
 */

// ==================== 测评管理 ====================
export * from './assessment';

// ==================== 咨询管理 ====================
export * from './consultation';

// ==================== 学生档案管理 ====================
export * from './student-profile';

// ==================== 常用枚举定义 ====================
/** 心理状态枚举 */
export enum PsychologicalStatusEnum {
  GOOD = 1,
  NORMAL = 0,
  POOR = 2,
}

/** 毕业状态枚举 */
export enum GraduationStatusEnum {
  GRADUATED = 1,
  NOT_GRADUATED = 0,
}

/** 测评任务状态枚举 */
export enum AssessmentTaskStatusEnum {
  CLOSED = 2,
  DRAFT = 0,
  PUBLISHED = 1,
}

/** 测评参与者状态枚举 */
export enum AssessmentParticipantStatusEnum {
  COMPLETED = 2,
  IN_PROGRESS = 1,
  NOT_STARTED = 0,
}

/** 咨询类型枚举 */
export enum ConsultationTypeEnum {
  CRISIS = 4,
  FAMILY = 3,
  GROUP = 2,
  INDIVIDUAL = 1,
}

/** 咨询方式枚举 */
export enum ConsultationMethodEnum {
  FACE_TO_FACE = 1,
  ONLINE = 4,
  PHONE = 2,
  VIDEO = 3,
}

/** 危机干预状态枚举 */
export enum CrisisStatusEnum {
  ASSIGNED = 2,
  COMPLETED = 4,
  IN_PROGRESS = 3,
  REPORTED = 1,
}

/** 通知类型枚举 */
export enum NotificationTypeEnum {
  ASSESSMENT_REMINDER = 1,
  CONSULTATION_APPOINTMENT = 2,
  CRISIS_ALERT = 3,
  PARENT_NOTICE = 4,
  SYSTEM_NOTICE = 5,
}

/** 通知渠道枚举 */
export enum NotificationChannelEnum {
  APP_PUSH = 4,
  EMAIL = 2,
  SMS = 1,
  WECHAT = 3,
}

/** 时间线事件类型枚举 */
export enum TimelineEventTypeEnum {
  ASSESSMENT_COMPLETED = 3,
  CONSULTATION_RECORD = 4,
  CRISIS_INTERVENTION = 5,
  NOTIFICATION_SENT = 7,
  PROFILE_CREATED = 1,
  PROFILE_UPDATED = 2,
  QUICK_REPORT = 6,
}

/** 快速上报类型枚举 */
export enum QuickReportTypeEnum {
  ACADEMIC_PRESSURE = 3,
  BEHAVIORAL_ABNORMAL = 1,
  EMOTIONAL_CRISIS = 2,
  FAMILY_ISSUE = 5,
  INTERPERSONAL_CONFLICT = 4,
  OTHER = 99,
  SAFETY_CONCERN = 6,
}

/** 严重程度枚举 */
export enum SeverityLevelEnum {
  CRITICAL = 4,
  HIGH = 3,
  LOW = 1,
  MEDIUM = 2,
}

/** 重要性级别枚举 */
export enum ImportanceLevelEnum {
  CRITICAL = 4,
  HIGH = 3,
  LOW = 1,
  MEDIUM = 2,
}
