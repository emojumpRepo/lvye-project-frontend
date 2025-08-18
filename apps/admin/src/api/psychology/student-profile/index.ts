import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PsychologyStudentProfileApi {
  /** 学生档案信息 */
  export interface StudentProfile {
    id?: number;
    userId?: number;
    studentNo: string;
    name: string;
    birthDate?: Date;
    homeAddress?: string;
    sex?: number;
    mobile?: string;
    gradeDeptId?: number;
    classDeptId?: number;
    graduationStatus?: number;
    psychologicalStatus?: number;
    riskLevel?: number;
    isMark?: number;
    specialMarks?: string;
    remark?: string;
    createTime?: Date;
    updateTime?: Date;
    // 关联字段
    gradeName?: string;
    className?: string;
  }

  /** 学生档案分页查询参数 */
  export interface StudentProfilePageReq extends PageParam {
    studentNo?: string;
    name?: string;
    sex?: number;
    gradeDeptId?: number;
    classDeptId?: number;
    graduationStatus?: number;
    psychologicalStatus?: number;
    riskLevel?: number;
  }

  /** 学生档案创建/更新请求 */
  export interface StudentProfileSaveReq {
    id?: number;
    userId?: number;
    studentNo: string;
    name: string;
    birthDate?: Date;
    homeAddress?: string;
    sex?: number;
    mobile?: string;
    birthDate?: string;
    gradeDeptId?: number;
    classDeptId?: number;
    graduationStatus?: number;
    psychologicalStatus?: number;
    homeAddress?: string;
    isMark?: number;
    specialMarks?: string;
    riskLevel?: number;
    specialMarks?: string;
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
  return requestClient.put('/psychology/student-profile/update', data);
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

/** 导出学生档案 */
export function exportStudentProfile(
  params: PsychologyStudentProfileApi.StudentProfilePageReq,
) {
  return requestClient.download('/psychology/student-profile/export-excel', {
    params,
  });
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

/** 下载学生档案导入模板 */
export function downloadStudentProfileTemplate() {
  return requestClient.download('/psychology/student-profile/import-template');
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
    '/system/dept/simple-list',
  );
}
