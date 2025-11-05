/** 卡片类型 */
export interface CategoryCard {
  title: string;
  description: string;
  text?: string;
  icon?: string;
  key: number | string;
  color?: string;
}

/** 学生页面数据 */
export interface StudentInterventionItem {
  studentProfileId: number;
  interventionPlanId: number;
  studentName: string;
  studentNumber: string;
  className: string;
  gender: number;
  currentRiskLevel: number;
  studyStatus: number;
  counselorName: string;
  lastUpdateTime: number;
  lastAssessmentTime: number;
  lastConsultationTime: number;
  crisisEventCount: number;
  consultationCount: number;
  tags: string[];
}

/** 学生页面数据 */
export interface StudentPageItem {
  list: StudentInterventionItem[];
  total: number;
}

/** 等级数据详情 */
export interface LevelDetail {
  count: number;
  change: number;
  percentage: number;
}

/** 五级干预看板统计数据 */
export interface CrisisBoardData {
  type: string;
  label: string;
  dictValue: number;
  count: number;
  studentPage: StudentPageItem;
}

/** 危机处理事件记录 */
export interface CrisisEventRecord {
  id: number;
  eventId: number;
  taskResultId?: number;
  assessmentId?: number;
  operatorName?: string;
  operateTime?: number;
  action: string;
  content?: string;
  reason?: string;
  attachmentIds?: number[];
}

/** 评估记录 */
export interface AssessmentRecord {
  id: number;
  assessorUserId: number;
  assessorName: string;
  assessorType: number;
  riskLevel: number;
  riskLevelName: string;
  problemTypes: string[];
  followUpSuggestion: number;
  followUpSuggestionName: string;
  content: string;
  hasMedicalVisit: boolean;
  medicalVisitRecord: string;
  observationRecord: string;
  attachmentIds: number[];
  createTime: number;
}

/** 危机评估任务 */
export interface CrisisAssessmentTask {
  status: number;
  taskId: number;
  taskName: string;
  taskNo: string;
  riskLevel: number;
  startline: number;
  deadline: number;
  submitTime: number;
}

/** 危机事件详情 */
export interface CrisisEvent {
  id: number;
  eventId: string;
  studentProfileId: number;
  studentName: string;
  studentNumber: string;
  className: string;
  studentUserId: number;
  title: string;
  description: string;
  riskLevel: number;
  status: number;
  processStatus: number;
  handlerUserId: number;
  handlerName: string;
  handleAt: number;
  sourceType: number;
  reporterUserId: number;
  reporterName: string;
  reportedAt: number;
  priority: number;
  location: string;
  processMethod: number;
  processReason: string;
  closureSummary: string;
  progress: number;
  closed: boolean;
  autoAssigned: boolean;
  createTime: number;
  updateTime: number;
  processHistory: CrisisEventRecord[];
  pendingAssessmentTask: {
    status: number;
    taskId: number;
    taskName: string;
    taskNo: string;
  };
  latestAssessments: AssessmentRecord[];
  allAssessmentRecords: AssessmentRecord[];
}

/** 打开危机事件参数 */
export interface CrisisEventOpParams {
  id: number;
  title: string;
  eventId?: string;
}

/** 上报异常参数 */
export interface ReportAbnormalParams {
  className: string;
  id: number;
  name: string;
  studentNo: string;
}

/** 按来源类型分组获取学生已结案的危机事件 */
export interface StudentCrisisEventsBySourceType {
  sourceType: number;
  sourceTypeName: string;
  count: number;
  events: CrisisEvent[];
}
