/** 干预计划步骤 */
export interface InterventionPlanStep {
  id: number;
  title: string;
  sort: number;
  status: number;
  notes: string;
  attachmentIds: number[];
}

/** 干预计划详情 */
export interface InterventionPlan {
  id: number;
  interventionId: string;
  studentProfileId: number;
  title: string;
  relativeEventIds: number[];
  relativeEvents: {
    bgColor?: string;
    color?: string;
    eventId: string;
    id: number;
    label?: string;
    sourceType: number;
  }[];
  status: number;
  templateId: number;
  createTime: number;
  updateTime: number;
  creatorName: string;
  steps: InterventionPlanStep[];
}
