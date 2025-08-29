import { appRequestClient } from '#/api/request';

export namespace StudentProfileApi {
  export interface FamilyChildrenInfoVO {
    isOnlyChild?: number;
    childrenCount?: number;
    birthOrder?: number;
    ageGapToSecond?: number;
  }

  export interface StudentProfileBasicInfoUpdateReqVO {
    id: number;
    sex?: number;
    ethnicity?: number;
    actualAge?: number;
    birthDate?: string; // yyyy-MM-dd
    height?: number; // cm
    weight?: number; // kg
    familyChildrenInfo?: FamilyChildrenInfoVO;
  }

  export interface StudentProfileCompletenessRespVO {
    isComplete: boolean;
    studentNo?: string;
    missingFields?: string[];
  }
}

export function updateMyBasicInfo(
  data: StudentProfileApi.StudentProfileBasicInfoUpdateReqVO,
) {
  return appRequestClient.put<boolean>(
    '/psychology/student-profile/update-basic-info',
    data,
  );
}

export function checkMyProfileCompleteness() {
  return appRequestClient.get<StudentProfileApi.StudentProfileCompletenessRespVO>(
    '/psychology/student-profile/check-completeness',
  );
}
