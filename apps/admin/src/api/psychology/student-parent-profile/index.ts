import { requestClient } from '#/api/request';

export namespace PsychologyStudentParentProfileApi {
  export interface StudentParentProfile {
    id: number;
    studentProfileId: number;
    name: string;
    mobile: string;
    relationship: number;
    remark: string;
    deleted: number;
    createTime: Date;
    updateTime: Date;
  }

  export interface StudentParentProfilePageReq {
    studentProfileId: number;
    parentList: [
      {
        id: number;
        mobile: string;
        name: string;
        relationship: string;
        remark: string;
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
  data: PsychologyStudentParentProfileApi.StudentParentProfile,
) {
  return requestClient.put<PsychologyStudentParentProfileApi.StudentParentProfilePageReq>(
    `/psychology/student-parent-profile/update`,
    data,
  );
}
