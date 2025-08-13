import { requestClient } from '#/api/request';

export namespace PsychologyConfigApi {
  /** 年级信息 */
  export interface Grade {
    id: number;
    name: string;
    code?: string;
    sort?: number;
    status: number;
    description?: string;
    classCount?: number;
    studentCount?: number;
  }

  /** 班级信息 */
  export interface Class {
    id: number;
    name: string;
    code?: string;
    gradeId: number;
    gradeName?: string;
    sort?: number;
    status: number;
    headTeacherId?: number;
    headTeacherName?: string;
    studentCount?: number;
    description?: string;
  }

  /** 教师信息 */
  export interface Teacher {
    id: number;
    username: string;
    nickname: string;
    realName?: string;
    mobile?: string;
    email?: string;
    avatar?: string;
    deptId?: number;
    deptName?: string;
    postIds?: number[];
    postNames?: string[];
    roleCode?: string;
    roleName?: string;
    status: number;
  }

  /** 部门信息 */
  export interface Department {
    id: number;
    name: string;
    parentId: number;
    sort: number;
    leaderUserId?: number;
    leaderUserName?: string;
    phone?: string;
    email?: string;
    status: number;
    type?: number;
    children?: Department[];
  }

  /** 字典数据 */
  export interface DictData {
    label: string;
    value: string | number;
    colorType?: string;
    cssClass?: string;
  }

  /** 系统配置 */
  export interface SystemConfig {
    key: string;
    value: string;
    description?: string;
    type?: string;
  }
}

// ==================== 年级班级管理 ====================

/** 获取年级列表 */
export function getGradeList() {
  return requestClient.get<PsychologyConfigApi.Grade[]>(
    '/admin-api/psychology/config/grade-list',
  );
}

/** 获取班级列表 */
export function getClassList(gradeId?: number) {
  return requestClient.get<PsychologyConfigApi.Class[]>(
    '/admin-api/psychology/config/class-list',
    { params: { gradeId } },
  );
}

/** 获取年级班级树形结构 */
export function getGradeClassTree() {
  return requestClient.get<Array<{
    id: number;
    name: string;
    type: 'grade';
    children: Array<{
      id: number;
      name: string;
      type: 'class';
      gradeId: number;
    }>;
  }>>('/admin-api/psychology/config/grade-class-tree');
}

// ==================== 教师管理 ====================

/** 获取教师列表 */
export function getTeacherList(roleCode?: string) {
  return requestClient.get<PsychologyConfigApi.Teacher[]>(
    '/admin-api/psychology/config/teacher-list',
    { params: { roleCode } },
  );
}

/** 获取心理老师列表 */
export function getPsychologyTeacherList() {
  return requestClient.get<PsychologyConfigApi.Teacher[]>(
    '/admin-api/psychology/config/psychology-teacher-list',
  );
}

/** 获取班主任列表 */
export function getHeadTeacherList() {
  return requestClient.get<PsychologyConfigApi.Teacher[]>(
    '/admin-api/psychology/config/head-teacher-list',
  );
}

/** 获取任课老师列表 */
export function getSubjectTeacherList() {
  return requestClient.get<PsychologyConfigApi.Teacher[]>(
    '/admin-api/psychology/config/subject-teacher-list',
  );
}

/** 根据班级获取教师列表 */
export function getTeachersByClass(classId: number) {
  return requestClient.get<PsychologyConfigApi.Teacher[]>(
    `/admin-api/psychology/config/teachers-by-class?classId=${classId}`,
  );
}

// ==================== 部门组织架构 ====================

/** 获取部门树形结构 */
export function getDepartmentTree() {
  return requestClient.get<PsychologyConfigApi.Department[]>(
    '/admin-api/psychology/config/dept-tree',
  );
}

/** 获取部门列表 */
export function getDepartmentList() {
  return requestClient.get<PsychologyConfigApi.Department[]>(
    '/admin-api/psychology/config/dept-list',
  );
}

/** 获取学校组织架构 */
export function getSchoolOrganization() {
  return requestClient.get<{
    school: PsychologyConfigApi.Department;
    grades: Array<PsychologyConfigApi.Department & {
      classes: PsychologyConfigApi.Department[];
    }>;
  }>('/admin-api/psychology/config/school-organization');
}

// ==================== 字典数据 ====================

/** 获取字典数据 */
export function getDictData(dictType: string) {
  return requestClient.get<PsychologyConfigApi.DictData[]>(
    `/admin-api/psychology/config/dict-data?dictType=${dictType}`,
  );
}

/** 获取心理状态字典 */
export function getPsychologicalStatusDict() {
  return getDictData('psychological_status');
}

/** 获取毕业状态字典 */
export function getGraduationStatusDict() {
  return getDictData('graduation_status');
}

/** 获取风险等级字典 */
export function getRiskLevelDict() {
  return getDictData('risk_level');
}

/** 获取测评任务状态字典 */
export function getAssessmentTaskStatusDict() {
  return getDictData('assessment_task_status');
}

/** 获取咨询类型字典 */
export function getConsultationTypeDict() {
  return getDictData('consultation_type');
}

/** 获取咨询方式字典 */
export function getConsultationMethodDict() {
  return getDictData('consultation_method');
}

/** 获取危机干预状态字典 */
export function getInterventionStatusDict() {
  return getDictData('intervention_status');
}

/** 获取通知类型字典 */
export function getNotificationTypeDict() {
  return getDictData('notification_type');
}

/** 获取通知渠道字典 */
export function getNotificationChannelDict() {
  return getDictData('notification_channel');
}

/** 获取时间线事件类型字典 */
export function getTimelineEventTypeDict() {
  return getDictData('timeline_event_type');
}

/** 获取快速上报类型字典 */
export function getQuickReportTypeDict() {
  return getDictData('quick_report_type');
}

/** 获取严重程度字典 */
export function getSeverityLevelDict() {
  return getDictData('severity_level');
}

// ==================== 系统配置 ====================

/** 获取系统配置 */
export function getSystemConfig(key: string) {
  return requestClient.get<string>(
    `/admin-api/psychology/config/system-config?key=${key}`,
  );
}

/** 获取多个系统配置 */
export function getSystemConfigs(keys: string[]) {
  return requestClient.get<Record<string, string>>(
    '/admin-api/psychology/config/system-configs',
    { params: { keys: keys.join(',') } },
  );
}

/** 更新系统配置 */
export function updateSystemConfig(key: string, value: string) {
  return requestClient.put('/admin-api/psychology/config/system-config', {
    key,
    value,
  });
}

/** 批量更新系统配置 */
export function batchUpdateSystemConfigs(configs: Record<string, string>) {
  return requestClient.put('/admin-api/psychology/config/batch-system-configs', configs);
}

// ==================== 常用配置获取 ====================

/** 获取所有常用字典数据 */
export function getAllCommonDicts() {
  return requestClient.get<Record<string, PsychologyConfigApi.DictData[]>>(
    '/admin-api/psychology/config/all-common-dicts',
  );
}

/** 获取用户选择器数据 */
export function getUserSelectorData() {
  return requestClient.get<{
    teachers: PsychologyConfigApi.Teacher[];
    psychologyTeachers: PsychologyConfigApi.Teacher[];
    headTeachers: PsychologyConfigApi.Teacher[];
  }>('/admin-api/psychology/config/user-selector-data');
}

/** 获取组织选择器数据 */
export function getOrgSelectorData() {
  return requestClient.get<{
    grades: PsychologyConfigApi.Grade[];
    classes: PsychologyConfigApi.Class[];
    departments: PsychologyConfigApi.Department[];
  }>('/admin-api/psychology/config/org-selector-data');
}
