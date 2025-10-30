import { requestClient } from '#/api/request';

export namespace PsychologyStudentParentProfileApi {
  export interface StudentParentProfile {
    id: number;
    studentProfileId: number;
    name: string;
    mobile: string;
    relation: number;
    work: string;
    maritalStatus: number;
    remark: string;
    deleted: number;
    createTime: Date;
    updateTime: Date;
  }

  /** 创建/更新监护人档案请求参数 */
  export interface StudentParentProfilePageReq {
    studentProfileId: number;
    parentList: [
      {
        id?: number;
        maritalStatus: number;
        mobile: string;
        name: string;
        remark?: string;
        work?: string;
      },
      {
        id?: number;
        maritalStatus: number;
        mobile: string;
        name: string;
        remark?: string;
        work?: string;
      },
    ];
  }
}

/** 获取学生监护人档案 */
export function getStudentParentProfile(studentProfileId: number) {
  return requestClient.get<
    PsychologyStudentParentProfileApi.StudentParentProfile[]
  >(`/psychology/student-parent-profile/list`, {
    params: {
      studentProfileId,
    },
  });
}

/** 更新学生监护人档案 */
export function updateStudentParentProfile(
  data: PsychologyStudentParentProfileApi.StudentParentProfilePageReq,
) {
  return requestClient.put<boolean>(
    `/psychology/student-parent-profile/update`,
    data,
  );
}

/** 创建学生监护人档案 */
export function createStudentParentProfile(
  data: PsychologyStudentParentProfileApi.StudentParentProfilePageReq,
) {
  return requestClient.post<boolean>(
    `/psychology/student-parent-profile/create`,
    data,
  );
}
