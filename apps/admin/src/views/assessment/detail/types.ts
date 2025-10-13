// 评测详情页面的共享类型定义

export type ActiveType = 'all' | 'class' | 'grade';

/** 标签项 */
export interface TabItem {
  key: string;
  label: string;
}

/** 任务信息 */
export interface TaskInfo {
  taskNo: string;
  taskName: string;
  status: number;
  startline: number;
  deadline: number;
  questionnairesTabs: TabItem[];
}

/** 风险等级配置 */
export interface RiskLevelConfig {
  level: number;
  color: string;
}

/** 导出失败项 */
export interface ExportFailureItem {
  studentName: string; // 学生姓名
  studentNo: string; // 学号
  className: string; // 班级名称
  failedStep: 'fetching' | 'generating' | 'packaging'; // 失败步骤
  errorMessage: string; // 错误信息
}

/** 导出进度 */
export interface ExportProgress {
  currentStep: 'completed' | 'error' | 'fetching' | 'generating' | 'packaging';
  fileType: 'pdf' | 'xlsx';
  exportFileName: string;
  totalCount: number; // 学生总数
  fetchedCount: number; // 已获取数据的学生数
  generateProgress: number; // 生成文件进度（0-100）
  packagingProgress: number; // 打包进度（0-100）
  successCount: number; // 成功数量
  failureList: ExportFailureItem[]; // 失败列表
  startTime: number; // 开始时间戳
}

/** 导出选项 - 完成情况 */
export interface ExportCompletionOptions {
  taskNo: string;
  questionnaireId?: number;
  activeTab?: TabItem;
}

/** 导出选项 - 测评报告 */
export interface ExportReportsOptions {
  taskNo: string;
  taskName?: string;
  questionnairesTabs?: TabItem[];
}

/** 组合式函数选项 */
export interface UseExportAssessmentOptions {
  modalApi: any; // 进度弹窗的API，用于更新进度
  gridApi: any; // 表格API，用于获取选中的行
  searchRef: Ref<any>; // 搜索参数引用
  loadTotal: Ref<number>; // 学生总数
  selectedRowKeys: Ref<number[]>; // 选中的行键
  loadStudentData: (
    page: { currentPage: number; pageSize: number },
    formValues: any,
  ) => Promise<{ list: any[]; total: number }>; // 加载学生数据的函数
}
