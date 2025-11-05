import type { Dayjs } from 'dayjs';

import type { PageResult } from '@vben/request';
import type { SearchStudentProfileVO } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace PsychologyStudentProfileApi {
  /** 学生档案信息 */
  export interface StudentProfile {
    id: number;
    userId: number;
    studentNo: string;
    name: string;
    birthDate?: string;
    homeAddress?: string;
    sex?: number;
    mobile?: string;
    gradeDeptId?: number;
    classDeptId?: number;
    graduationStatus?: number;
    psychologicalStatus?: number;
    riskLevel?: number;
    idCard?: string; // 身份证
    enrollmentYear?: number; // 届别
    isMark?: number;
    specialMarks?: string;
    remark?: string;
    updater?: string;
    count?: number;
    createTime?: Date;
    updateTime?: Date;
    // 关联字段
    gradeName?: string;
    className?: string;
    assessmentRiskLevel?: number;
  }

  /** 学生档案分页查询参数 */
  export interface StudentProfilePageReq {
    studentNo?: string;
    name?: string;
    sex?: number;
    gradeDeptId?: number;
    classDeptId?: number;
    graduationStatus?: number;
    psychologicalStatus?: number;
    riskLevel?: number;
    pageNo?: number;
    pageSize?: number;
  }

  /** 学生档案创建/更新请求 */
  export interface StudentProfileSaveReq {
    id?: number;
    userId?: number;
    studentNo?: string;
    name?: string;
    birthDate?: Dayjs | string;
    homeAddress?: string;
    idCard?: string;
    sex?: number;
    mobile?: string;
    gradeDeptId?: number;
    classDeptId?: number;
    graduationStatus?: number;
    psychologicalStatus?: number;
    enrollmentYear?: number;
    isMark?: number;
    specialMarks?: string;
    riskLevel?: number;
    remark?: string;
  }

  /** 学生档案导入响应 */
  export interface StudentProfileImportResp {
    createStudentNames: string[];
    updateStudentNames: string[];
    failureStudentNames: Record<string, string>;
  }

  /** 部门精简信息列表 */
  export interface DeptSimpleListResp {
    id: number;
    name: string;
    parentId: number;
    count: number;
    sort: number;
  }

  /** 部门树形结构 */
  export interface DeptTree {
    value: number;
    label: string;
    children?: DeptTree[];
    sort: number;
    count: number;
    parentId?: number;
    isGrade?: boolean;
    isClass?: boolean;
    isDept?: boolean;
  }

  /** 学生档案时间线 */
  export interface StudentProfileTimeline {
    id: number;
    studentProfileId: number;
    eventType: number;
    title: string;
    content: string;
    bizId: string;
    operator: string;
    createTime: number;
    updateTime: number;
    meta: {
      action: string;
      description: string;
      isParent: number;
      questionnaireCount: number;
      questionnaireIds: number[];
      scenarioId: number;
      studentId: number;
      studentName: string;
      studentNo: string;
      targetAudience: number;
      taskId: number;
      taskName: string;
      taskNo: string;
    };
  }

  /** 学生测评历史 */
  export interface StudentAssessmentHistory {
    taskId: string;
    taskResultId: number;
    taskNo: string;
    taskName: string;
    targetAudience: number;
    status: number;
    riskLevel: number;
    evaluate: string;
    suggestions: string;
    startline: number;
    deadline: number;
  }
}

/** 查询学生档案分页列表 */
export function getStudentProfilePage(
  params: PsychologyStudentProfileApi.StudentProfilePageReq,
) {
  return requestClient.get<
    PageResult<PsychologyStudentProfileApi.StudentProfile>
  >('/psychology/student-profile/page', { params });
}

/** 查询学生档案详情 */
export function getStudentProfile(id: number) {
  return requestClient.get<PsychologyStudentProfileApi.StudentProfile>(
    `/psychology/student-profile/get?id=${id}`,
  );
}

/** 新增学生档案 */
export function createStudentProfile(
  data: PsychologyStudentProfileApi.StudentProfileSaveReq,
) {
  return requestClient.post('/psychology/student-profile/create', data);
}

/** 修改学生档案 */
export function updateStudentProfile(
  data: PsychologyStudentProfileApi.StudentProfileSaveReq,
) {
  return requestClient.post('/psychology/student-profile/update', data);
}

/** 删除学生档案 */
export function deleteStudentProfile(id: number) {
  return requestClient.delete(`/psychology/student-profile/delete/${id}`);
}

/** 批量删除学生档案 */
export function deleteStudentProfileList(ids: number[]) {
  return requestClient.delete(
    `/psychology/student-profile/delete-list?ids=${ids.join(',')}`,
  );
}

/** 批量导入学生档案 */
export function importStudentProfile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<PsychologyStudentProfileApi.StudentProfileImportResp>(
    '/psychology/student-profile/import',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

/** 单个导入学生档案 */
export function importStudentProfileSingle(
  data: PsychologyStudentProfileApi.StudentProfileSaveReq,
) {
  return requestClient.post<{
    id: number;
    message: string;
    success: boolean;
  }>('/psychology/student-profile/import-single', data);
}

/** 更新学生心理状态 */
export function updateStudentPsychologicalStatus(
  id: number,
  psychologicalStatus: number,
  riskLevel: number,
) {
  return requestClient.put(
    `/psychology/student-profile/psychological-status/${id}`,
    null,
    {
      params: {
        psychologicalStatus,
        riskLevel,
      },
    },
  );
}

/** 获取学生档案精简列表 */
export function getStudentProfileSimpleList(
  params: PsychologyStudentProfileApi.StudentProfilePageReq,
) {
  return requestClient.get<PsychologyStudentProfileApi.StudentProfile[]>(
    '/psychology/student-profile/simple-list',
    { params },
  );
}

/** 获取部门精简信息列表 */
export function getDeptSimpleList() {
  return requestClient.get<PsychologyStudentProfileApi.DeptSimpleListResp[]>(
    '/common/dept/simple-list',
  );
}

/** 获取特定部门 */
export function getDeptById(id: number) {
  return requestClient.get<PsychologyStudentProfileApi.DeptSimpleListResp>(
    '/system/dept/get',
    {
      params: {
        id,
      },
    },
  );
}

/** 获取学生时间线列表 */
export function getStudentProfileTimeline(studentProfileId: number) {
  return requestClient.get<
    PsychologyStudentProfileApi.StudentProfileTimeline[]
  >('/psychology/student-profile/timeline-list', {
    params: { studentProfileId },
  });
}

/** 获取学生测评历史列表 */
export function getStudentAssessmentHistory(studentProfileId: number) {
  return requestClient.get<
    PsychologyStudentProfileApi.StudentAssessmentHistory[]
  >('/psychology/student-profile/student-task-list', {
    params: { studentProfileId },
  });
}

/** 搜索学生档案 */
export function searchStudentProfile({
  studentNo,
  name,
}: {
  name?: string;
  studentNo?: string;
}) {
  return requestClient.get<SearchStudentProfileVO[]>(
    '/psychology/student-profile/search',
    { params: { studentNo, name } },
  );
}

/** 验证学生是否是心理老师负责的学生 */
export function verifyCounselor(params: {
  counselorUserId: number;
  studentProfileId: number;
}) {
  return requestClient.get<boolean>(
    '/psychology/student-profile/verify-counselor',
    {
      params,
    },
  );
}

/** 批量毕业学生 */
export function batchGraduateStudents(params: {
  enrollmentYear: number;
  extraIds: number[];
  gradeDeptId: number;
  graduationYear: number;
}) {
  return requestClient.put<number>(
    '/psychology/student-profile/batch-graduate',
    params,
  );
}

/** 检查毕业年级中心理状态异常的学生 */
export function checkGraduateStudents(params: {
  enrollmentYear: number;
  gradeDeptId: number;
}) {
  return requestClient.get<PsychologyStudentProfileApi.StudentProfile[]>(
    '/psychology/student-profile/check-abnormal-graduating-students',
    {
      params,
    },
  );
}

/** 学生换班 */
export function studentClassTransfer(params: {
  classDeptId: number;
  gradeDeptId: number;
  reason: string;
  studentProfileIds: number[];
}) {
  return requestClient.put<number>(
    '/psychology/student-profile/batch-transfer-class',
    params,
  );
}

/** 获取学生档案操作日志 */
export function getStudentProfileOperationLog(bizId: number) {
  return requestClient.get<
    PsychologyStudentProfileApi.StudentProfileTimeline[]
  >('/psychology/student-profile/timeline-by-bizid', {
    params: { bizId: `intervention_plan_${bizId}` },
  });
}
