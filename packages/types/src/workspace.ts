export interface ViewData {
  id?: number | string;
  studentName?: string;
  className?: string;
  rightTopContent?: string;
  tags?: {
    colorType?: string;
    label?: string;
  }[];
  content?: {
    label?: string;
    value?: string;
  }[];
  completionRate?: number;
}
