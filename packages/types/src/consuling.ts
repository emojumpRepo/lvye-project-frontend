/** 评估确认信息 */
export interface StudentInfo {
  className: string;
  studentName: string;
  studentNo: string;
}

export interface ConsultInfo {
  consultant: string;
  consultTime: string;
  consultType: string;
}

export interface AssessmentComfirmInfo {
  studentInfo: StudentInfo;
  consultInfo: ConsultInfo;
}
