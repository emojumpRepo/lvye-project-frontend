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
export interface StudentPageItem {
  studentProfileId: number;
  studentName: string;
  studentNumber: string;
  className: string;
  gender: number;
  currentRiskLevel: number;
  studyStatus: number;
  counselorName: string;
  lastAssessmentTime: number;
  lastConsultationTime: number;
  crisisEventCount: number;
  consultationCount: number;
  tags: string[];
}

/** 等级数据详情 */
export interface LevelDetail {
  count: number;
  change: number;
  percentage: number;
}

/** 等级数据类型 */
type LevelDetails = Record<
  'general' | 'major' | 'normal' | 'observation' | 'pending' | 'severe',
  LevelDetail
>;

/** 五级干预看板统计数据 */
export interface CrisisBoardData {
  majorCount: number;
  severeCount: number;
  generalCount: number;
  observationCount: number;
  normalCount: number;
  pendingAssessmentCount: number;
  totalCount: number;
  levelDetails: LevelDetails;
  studentPage: {
    list: StudentPageItem[];
    total: number;
  };
}

/** 危机处理事件记录 */
export interface CrisisEventRecord {
  id?: number;
  eventId?: number;
  operatorUserId?: number;
  operatorName?: string;
  operateTime?: number;
  action?: string;
  content?: string;
  attachments?: string[];
  createTime?: number;
}

/** 危机事件详情 */
export interface CrisisEvent {
  id: number;
  studentProfileId: number;
  studentName: string;
  studentNumber: string;
  className: string;
  title: string;
  description: string;
  riskLevel: number;
  status: number;
  handlerUserId: number;
  handlerName: string;
  sourceType: number;
  reporterUserId: number;
  reporterName: string;
  reportedAt: number;
  urgencyLevel: number;
  priority: number;
  location: string;
  processMethod: number;
  processReason: string;
  closureSummary: string;
  progress: number;
  autoAssigned: boolean;
  createTime: number;
  updateTime: number;
  processHistory: CrisisEventRecord[];
  latestAssessment: {
    assessTime: number;
    followUpSuggestion: number;
    problemTypes: string[];
    riskLevel: number;
  };
}
