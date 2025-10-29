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

/** 时间线记录 */
export interface RecordInfo {
  id: number;
  title?: string;
  status?: {
    colorType?: string;
    cssClass?: string;
    label: string;
    value: string;
  };
  labelList?: { label: string; value: number | string }[];
  tags?: string[];
  counselorName?: string;
  buttonText?: string;
  showButton?: boolean;
  onClick?: () => void;
}
