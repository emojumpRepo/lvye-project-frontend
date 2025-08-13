import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PsychologyNotificationApi {
  /** 通知记录信息 */
  export interface NotificationRecord {
    id?: number;
    type: number;
    title: string;
    content: string;
    targetType: number;
    targetIds?: number[];
    targetNames?: string[];
    sendChannel: number;
    templateId?: number;
    templateName?: string;
    sendTime?: Date;
    status: number;
    sendCount?: number;
    successCount?: number;
    failCount?: number;
    creatorUserId?: number;
    creatorName?: string;
    createTime?: Date;
    updateTime?: Date;
  }

  /** 通知记录分页查询参数 */
  export interface NotificationRecordPageReq extends PageParam {
    type?: number;
    title?: string;
    targetType?: number;
    sendChannel?: number;
    status?: number;
    sendTime?: Date[];
    createTime?: Date[];
  }

  /** 通知发送请求 */
  export interface NotificationSendReq {
    type: number;
    title: string;
    content: string;
    targetType: number;
    targetIds?: number[];
    sendChannel: number;
    templateId?: number;
    sendTime?: Date;
  }

  /** 通知模板信息 */
  export interface NotificationTemplate {
    id?: number;
    name: string;
    type: number;
    title: string;
    content: string;
    variables?: string[];
    status: number;
    remark?: string;
    createTime?: Date;
    updateTime?: Date;
  }

  /** 通知模板分页查询参数 */
  export interface NotificationTemplatePageReq extends PageParam {
    name?: string;
    type?: number;
    status?: number;
  }

  /** 通知模板创建/更新请求 */
  export interface NotificationTemplateSaveReq {
    id?: number;
    name: string;
    type: number;
    title: string;
    content: string;
    variables?: string[];
    status?: number;
    remark?: string;
  }

  /** 通知发送详情 */
  export interface NotificationDetail {
    id?: number;
    recordId: number;
    targetId: number;
    targetName?: string;
    targetType: number;
    sendChannel: number;
    sendTime?: Date;
    status: number;
    errorMessage?: string;
    readTime?: Date;
  }

  /** 通知统计信息 */
  export interface NotificationStatistics {
    totalSent: number;
    todaySent: number;
    successRate: number;
    channelDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    recentTrend: Array<{
      date: string;
      count: number;
      successCount: number;
    }>;
  }
}

// ==================== 通知记录管理 ====================

/** 查询通知记录分页列表 */
export function getNotificationRecordPage(params: PsychologyNotificationApi.NotificationRecordPageReq) {
  return requestClient.get<PageResult<PsychologyNotificationApi.NotificationRecord>>(
    '/admin-api/psychology/notification-record/page',
    { params },
  );
}

/** 查询通知记录详情 */
export function getNotificationRecord(id: number) {
  return requestClient.get<PsychologyNotificationApi.NotificationRecord>(
    `/admin-api/psychology/notification-record/get?id=${id}`,
  );
}

/** 发送通知 */
export function sendNotification(data: PsychologyNotificationApi.NotificationSendReq) {
  return requestClient.post('/admin-api/psychology/notification-record/send', data);
}

/** 重新发送失败的通知 */
export function resendNotification(id: number) {
  return requestClient.post(`/admin-api/psychology/notification-record/resend?id=${id}`);
}

/** 取消待发送的通知 */
export function cancelNotification(id: number) {
  return requestClient.post(`/admin-api/psychology/notification-record/cancel?id=${id}`);
}

/** 删除通知记录 */
export function deleteNotificationRecord(id: number) {
  return requestClient.delete(`/admin-api/psychology/notification-record/delete?id=${id}`);
}

/** 批量删除通知记录 */
export function deleteNotificationRecordList(ids: number[]) {
  return requestClient.delete(
    `/admin-api/psychology/notification-record/delete-list?ids=${ids.join(',')}`,
  );
}

/** 获取通知发送详情列表 */
export function getNotificationDetails(recordId: number) {
  return requestClient.get<PsychologyNotificationApi.NotificationDetail[]>(
    `/admin-api/psychology/notification-record/details?recordId=${recordId}`,
  );
}

// ==================== 通知模板管理 ====================

/** 查询通知模板分页列表 */
export function getNotificationTemplatePage(params: PsychologyNotificationApi.NotificationTemplatePageReq) {
  return requestClient.get<PageResult<PsychologyNotificationApi.NotificationTemplate>>(
    '/admin-api/psychology/notification-template/page',
    { params },
  );
}

/** 查询通知模板详情 */
export function getNotificationTemplate(id: number) {
  return requestClient.get<PsychologyNotificationApi.NotificationTemplate>(
    `/admin-api/psychology/notification-template/get?id=${id}`,
  );
}

/** 创建通知模板 */
export function createNotificationTemplate(data: PsychologyNotificationApi.NotificationTemplateSaveReq) {
  return requestClient.post('/admin-api/psychology/notification-template/create', data);
}

/** 更新通知模板 */
export function updateNotificationTemplate(data: PsychologyNotificationApi.NotificationTemplateSaveReq) {
  return requestClient.put('/admin-api/psychology/notification-template/update', data);
}

/** 删除通知模板 */
export function deleteNotificationTemplate(id: number) {
  return requestClient.delete(`/admin-api/psychology/notification-template/delete?id=${id}`);
}

/** 获取通知模板简单列表 */
export function getNotificationTemplateSimpleList(type?: number) {
  return requestClient.get<PsychologyNotificationApi.NotificationTemplate[]>(
    '/admin-api/psychology/notification-template/simple-list',
    { params: { type } },
  );
}

/** 预览通知模板 */
export function previewNotificationTemplate(templateId: number, variables?: Record<string, any>) {
  return requestClient.post<{ title: string; content: string }>(
    '/admin-api/psychology/notification-template/preview',
    { templateId, variables },
  );
}

// ==================== 快捷通知 ====================

/** 发送测评提醒通知 */
export function sendAssessmentReminder(taskId: number, targetIds?: number[]) {
  return requestClient.post('/admin-api/psychology/notification/assessment-reminder', {
    taskId,
    targetIds,
  });
}

/** 发送危机干预通知 */
export function sendCrisisNotification(crisisId: number, targetIds: number[]) {
  return requestClient.post('/admin-api/psychology/notification/crisis-alert', {
    crisisId,
    targetIds,
  });
}

/** 发送咨询预约通知 */
export function sendConsultationNotification(consultationId: number) {
  return requestClient.post('/admin-api/psychology/notification/consultation-appointment', {
    consultationId,
  });
}

/** 发送家长通知 */
export function sendParentNotification(studentProfileId: number, title: string, content: string) {
  return requestClient.post('/admin-api/psychology/notification/parent-notice', {
    studentProfileId,
    title,
    content,
  });
}

// ==================== 统计分析 ====================

/** 获取通知统计信息 */
export function getNotificationStatistics() {
  return requestClient.get<PsychologyNotificationApi.NotificationStatistics>(
    '/admin-api/psychology/notification-record/statistics',
  );
}

/** 导出通知记录 */
export function exportNotificationRecord(params: PsychologyNotificationApi.NotificationRecordPageReq) {
  return requestClient.download('/admin-api/psychology/notification-record/export-excel', {
    params,
  });
}
