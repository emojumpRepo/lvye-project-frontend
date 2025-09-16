/** 班级、年级、选项 */
export interface DeptGradeClassOption {
  label: string;
  value: number;
  isLeaf?: boolean;
  children?: DeptGradeClassOption[];
}
