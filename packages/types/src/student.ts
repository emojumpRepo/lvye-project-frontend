export interface DeptGradeClassOption {
  label: string;
  value: number;
  isLeaf?: boolean;
  children?: DeptGradeClassOption[];
}
