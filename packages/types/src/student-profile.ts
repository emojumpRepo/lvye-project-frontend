/** 班级、年级、选项 */
export interface DeptGradeClassOption {
  label: string;
  value: number;
  isLeaf?: boolean;
  children?: DeptGradeClassOption[];
}

/** 搜索学生信息 */
export interface SearchStudentProfileVO {
  id: number;
  name: string;
  studentNo: string;
  gradeName: string;
  className: string;
  gradeDeptId: number;
  classDeptId: number;
}
