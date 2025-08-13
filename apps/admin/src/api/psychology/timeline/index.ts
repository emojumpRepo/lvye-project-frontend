import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PsychologyTimelineApi {
  /** 时间线事件信息 */
  export interface TimelineEvent {
    id?: number;
    studentProfileId: number;
    studentName?: string;
    studentNo?: string;
    eventType: number;
    eventTypeName?: string;
    title: string;
    description: string;
    relatedId?: number;
    relatedType?: string;
    importance: number;
    tags?: string[];
    attachments?: string[];
    operatorUserId?: number;
    operatorName?: string;
    eventTime: Date;
    createTime?: Date;
    // 关联数据
    relatedData?: any;
  }

  /** 时间线事件分页查询参数 */
  export interface TimelineEventPageReq extends PageParam {
    studentProfileId?: number;
    studentName?: string;
    eventType?: number;
    importance?: number;
    tags?: string[];
    eventTime?: Date[];
    createTime?: Date[];
    keyword?: string;
  }

  /** 时间线事件创建请求 */
  export interface TimelineEventCreateReq {
    studentProfileId: number;
    eventType: number;
    title: string;
    description: string;
    relatedId?: number;
    relatedType?: string;
    importance?: number;
    tags?: string[];
    attachments?: string[];
    eventTime?: Date;
  }

  /** 时间线统计信息 */
  export interface TimelineStatistics {
    studentProfileId: number;
    totalEvents: number;
    eventTypeDistribution: Record<string, number>;
    importanceDistribution: Record<string, number>;
    recentActivity: Array<{
      date: string;
      count: number;
    }>;
    keyMilestones: TimelineEvent[];
  }

  /** 时间线导出参数 */
  export interface TimelineExportReq {
    studentProfileId: number;
    eventTypes?: number[];
    startTime?: Date;
    endTime?: Date;
    format?: 'excel' | 'pdf';
  }
}

// ==================== 时间线事件管理 ====================

/** 查询时间线事件分页列表 */
export function getTimelineEventPage(params: PsychologyTimelineApi.TimelineEventPageReq) {
  return requestClient.get<PageResult<PsychologyTimelineApi.TimelineEvent>>(
    '/admin-api/psychology/timeline-event/page',
    { params },
  );
}

/** 查询时间线事件详情 */
export function getTimelineEvent(id: number) {
  return requestClient.get<PsychologyTimelineApi.TimelineEvent>(
    `/admin-api/psychology/timeline-event/get?id=${id}`,
  );
}

/** 创建时间线事件 */
export function createTimelineEvent(data: PsychologyTimelineApi.TimelineEventCreateReq) {
  return requestClient.post('/admin-api/psychology/timeline-event/create', data);
}

/** 获取学生时间线列表 */
export function getStudentTimeline(studentProfileId: number, params?: {
  eventType?: number;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}) {
  return requestClient.get<PsychologyTimelineApi.TimelineEvent[]>(
    `/admin-api/psychology/timeline-event/student-timeline`,
    { 
      params: {
        studentProfileId,
        ...params,
      },
    },
  );
}

/** 获取学生时间线统计 */
export function getStudentTimelineStatistics(studentProfileId: number) {
  return requestClient.get<PsychologyTimelineApi.TimelineStatistics>(
    `/admin-api/psychology/timeline-event/student-statistics?studentProfileId=${studentProfileId}`,
  );
}

/** 批量创建时间线事件 */
export function batchCreateTimelineEvents(events: PsychologyTimelineApi.TimelineEventCreateReq[]) {
  return requestClient.post('/admin-api/psychology/timeline-event/batch-create', { events });
}

// ==================== 系统自动记录 ====================

/** 记录测评完成事件 */
export function recordAssessmentEvent(data: {
  studentProfileId: number;
  taskId: number;
  taskTitle: string;
  score?: number;
  riskLevel?: number;
}) {
  return requestClient.post('/admin-api/psychology/timeline-event/record-assessment', data);
}

/** 记录咨询事件 */
export function recordConsultationEvent(data: {
  studentProfileId: number;
  consultationId: number;
  consultationType: number;
  duration?: number;
}) {
  return requestClient.post('/admin-api/psychology/timeline-event/record-consultation', data);
}

/** 记录危机干预事件 */
export function recordCrisisEvent(data: {
  studentProfileId: number;
  crisisId: number;
  riskLevel: number;
  status: number;
}) {
  return requestClient.post('/admin-api/psychology/timeline-event/record-crisis', data);
}

/** 记录档案变更事件 */
export function recordProfileChangeEvent(data: {
  studentProfileId: number;
  changeType: string;
  oldValue?: any;
  newValue?: any;
  fieldName: string;
}) {
  return requestClient.post('/admin-api/psychology/timeline-event/record-profile-change', data);
}

/** 记录快速上报事件 */
export function recordQuickReportEvent(data: {
  studentProfileId: number;
  reportId: number;
  reportType: number;
  severity: number;
}) {
  return requestClient.post('/admin-api/psychology/timeline-event/record-quick-report', data);
}

// ==================== 时间线分析 ====================

/** 获取时间线趋势分析 */
export function getTimelineTrend(studentProfileId: number, days: number = 30) {
  return requestClient.get<Array<{
    date: string;
    eventCount: number;
    eventTypes: Record<string, number>;
  }>>(`/admin-api/psychology/timeline-event/trend-analysis`, {
    params: { studentProfileId, days },
  });
}

/** 获取关键事件里程碑 */
export function getKeyMilestones(studentProfileId: number) {
  return requestClient.get<PsychologyTimelineApi.TimelineEvent[]>(
    `/admin-api/psychology/timeline-event/key-milestones?studentProfileId=${studentProfileId}`,
  );
}

/** 搜索相关事件 */
export function searchRelatedEvents(studentProfileId: number, keyword: string) {
  return requestClient.get<PsychologyTimelineApi.TimelineEvent[]>(
    `/admin-api/psychology/timeline-event/search-related`,
    { params: { studentProfileId, keyword } },
  );
}

// ==================== 导出功能 ====================

/** 导出学生时间线 */
export function exportStudentTimeline(params: PsychologyTimelineApi.TimelineExportReq) {
  return requestClient.download('/admin-api/psychology/timeline-event/export-timeline', {
    params,
  });
}

/** 导出时间线报告 */
export function exportTimelineReport(studentProfileId: number, format: 'excel' | 'pdf' = 'pdf') {
  return requestClient.download('/admin-api/psychology/timeline-event/export-report', {
    params: { studentProfileId, format },
  });
}

// ==================== 时间线配置 ====================

/** 获取事件类型配置 */
export function getEventTypeConfig() {
  return requestClient.get<Array<{
    code: number;
    name: string;
    description: string;
    color: string;
    icon: string;
    importance: number;
  }>>('/admin-api/psychology/timeline-event/event-types');
}

/** 获取重要性级别配置 */
export function getImportanceLevels() {
  return requestClient.get<Array<{
    level: number;
    name: string;
    color: string;
    description: string;
  }>>('/admin-api/psychology/timeline-event/importance-levels');
}

/** 获取常用标签 */
export function getCommonTags() {
  return requestClient.get<string[]>('/admin-api/psychology/timeline-event/common-tags');
}
