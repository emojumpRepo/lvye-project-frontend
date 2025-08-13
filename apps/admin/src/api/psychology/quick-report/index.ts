import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PsychologyQuickReportApi {
  /** 快速上报记录信息 */
  export interface QuickReport {
    id?: number;
    studentProfileId: number;
    studentName?: string;
    studentNo?: string;
    className?: string;
    reporterUserId: number;
    reporterName?: string;
    reporterRole?: string;
    reportType: number;
    reportTypeName?: string;
    title: string;
    description: string;
    severity: number;
    severityName?: string;
    location?: string;
    occurTime: Date;
    witnesses?: string[];
    attachments?: string[];
    status: number;
    statusName?: string;
    handlerUserId?: number;
    handlerName?: string;
    handleTime?: Date;
    handleResult?: string;
    followUpPlan?: string;
    isUrgent?: boolean;
    tags?: string[];
    createTime?: Date;
    updateTime?: Date;
  }

  /** 快速上报分页查询参数 */
  export interface QuickReportPageReq extends PageParam {
    studentProfileId?: number;
    studentName?: string;
    reporterUserId?: number;
    reportType?: number;
    severity?: number;
    status?: number;
    isUrgent?: boolean;
    occurTime?: Date[];
    createTime?: Date[];
    keyword?: string;
  }

  /** 快速上报创建请求 */
  export interface QuickReportCreateReq {
    studentProfileId: number;
    reportType: number;
    title: string;
    description: string;
    severity: number;
    location?: string;
    occurTime: Date;
    witnesses?: string[];
    attachments?: string[];
    isUrgent?: boolean;
    tags?: string[];
  }

  /** 快速上报处理请求 */
  export interface QuickReportHandleReq {
    id: number;
    handlerUserId?: number;
    handleResult: string;
    followUpPlan?: string;
    status: number;
  }

  /** 上报统计信息 */
  export interface QuickReportStatistics {
    totalReports: number;
    todayReports: number;
    urgentReports: number;
    pendingReports: number;
    reportTypeDistribution: Record<string, number>;
    severityDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    reporterDistribution: Record<string, number>;
    recentTrend: Array<{
      date: string;
      count: number;
      urgentCount: number;
    }>;
  }

  /** 上报类型配置 */
  export interface ReportTypeConfig {
    code: number;
    name: string;
    description: string;
    color: string;
    icon: string;
    requiresUrgentFlag: boolean;
    defaultSeverity: number;
    suggestedTags: string[];
  }
}

// ==================== 快速上报管理 ====================

/** 查询快速上报分页列表 */
export function getQuickReportPage(params: PsychologyQuickReportApi.QuickReportPageReq) {
  return requestClient.get<PageResult<PsychologyQuickReportApi.QuickReport>>(
    '/admin-api/psychology/quick-report/page',
    { params },
  );
}

/** 查询快速上报详情 */
export function getQuickReport(id: number) {
  return requestClient.get<PsychologyQuickReportApi.QuickReport>(
    `/admin-api/psychology/quick-report/get?id=${id}`,
  );
}

/** 创建快速上报 */
export function createQuickReport(data: PsychologyQuickReportApi.QuickReportCreateReq) {
  return requestClient.post('/admin-api/psychology/quick-report/create', data);
}

/** 处理快速上报 */
export function handleQuickReport(data: PsychologyQuickReportApi.QuickReportHandleReq) {
  return requestClient.put('/admin-api/psychology/quick-report/handle', data);
}

/** 分配处理人 */
export function assignQuickReportHandler(id: number, handlerUserId: number) {
  return requestClient.put('/admin-api/psychology/quick-report/assign', {
    id,
    handlerUserId,
  });
}

/** 更新上报状态 */
export function updateQuickReportStatus(id: number, status: number, remark?: string) {
  return requestClient.put('/admin-api/psychology/quick-report/update-status', {
    id,
    status,
    remark,
  });
}

/** 标记为紧急 */
export function markAsUrgent(id: number, isUrgent: boolean) {
  return requestClient.put('/admin-api/psychology/quick-report/mark-urgent', {
    id,
    isUrgent,
  });
}

/** 删除快速上报 */
export function deleteQuickReport(id: number) {
  return requestClient.delete(`/admin-api/psychology/quick-report/delete?id=${id}`);
}

/** 批量删除快速上报 */
export function deleteQuickReportList(ids: number[]) {
  return requestClient.delete(
    `/admin-api/psychology/quick-report/delete-list?ids=${ids.join(',')}`,
  );
}

// ==================== 我的上报 ====================

/** 获取我的上报列表 */
export function getMyQuickReports(params?: {
  status?: number;
  reportType?: number;
  pageNo?: number;
  pageSize?: number;
}) {
  return requestClient.get<PageResult<PsychologyQuickReportApi.QuickReport>>(
    '/admin-api/psychology/quick-report/my-reports',
    { params },
  );
}

/** 获取待我处理的上报 */
export function getPendingQuickReports(params?: {
  severity?: number;
  isUrgent?: boolean;
  pageNo?: number;
  pageSize?: number;
}) {
  return requestClient.get<PageResult<PsychologyQuickReportApi.QuickReport>>(
    '/admin-api/psychology/quick-report/pending-reports',
    { params },
  );
}

// ==================== 学生相关 ====================

/** 获取学生上报历史 */
export function getStudentQuickReports(studentProfileId: number) {
  return requestClient.get<PsychologyQuickReportApi.QuickReport[]>(
    `/admin-api/psychology/quick-report/student-reports?studentProfileId=${studentProfileId}`,
  );
}

/** 获取学生上报统计 */
export function getStudentReportStatistics(studentProfileId: number) {
  return requestClient.get<{
    totalReports: number;
    recentReports: number;
    severityDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    trend: Array<{ date: string; count: number }>;
  }>(`/admin-api/psychology/quick-report/student-statistics?studentProfileId=${studentProfileId}`);
}

// ==================== 统计分析 ====================

/** 获取快速上报统计信息 */
export function getQuickReportStatistics() {
  return requestClient.get<PsychologyQuickReportApi.QuickReportStatistics>(
    '/admin-api/psychology/quick-report/statistics',
  );
}

/** 获取上报趋势分析 */
export function getReportTrendAnalysis(days: number = 30) {
  return requestClient.get<Array<{
    date: string;
    totalCount: number;
    urgentCount: number;
    typeDistribution: Record<string, number>;
  }>>(`/admin-api/psychology/quick-report/trend-analysis?days=${days}`);
}

/** 获取热点问题分析 */
export function getHotIssuesAnalysis() {
  return requestClient.get<Array<{
    issue: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
    relatedReports: number[];
  }>>('/admin-api/psychology/quick-report/hot-issues');
}

// ==================== 配置管理 ====================

/** 获取上报类型配置 */
export function getReportTypeConfig() {
  return requestClient.get<PsychologyQuickReportApi.ReportTypeConfig[]>(
    '/admin-api/psychology/quick-report/report-types',
  );
}

/** 获取严重程度配置 */
export function getSeverityLevels() {
  return requestClient.get<Array<{
    level: number;
    name: string;
    color: string;
    description: string;
    autoEscalate: boolean;
  }>>('/admin-api/psychology/quick-report/severity-levels');
}

/** 获取常用标签 */
export function getCommonReportTags() {
  return requestClient.get<string[]>('/admin-api/psychology/quick-report/common-tags');
}

// ==================== 导出功能 ====================

/** 导出快速上报记录 */
export function exportQuickReport(params: PsychologyQuickReportApi.QuickReportPageReq) {
  return requestClient.download('/admin-api/psychology/quick-report/export-excel', {
    params,
  });
}

/** 导出上报统计报告 */
export function exportReportStatistics(startTime: Date, endTime: Date) {
  return requestClient.download('/admin-api/psychology/quick-report/export-statistics', {
    params: { startTime, endTime },
  });
}
