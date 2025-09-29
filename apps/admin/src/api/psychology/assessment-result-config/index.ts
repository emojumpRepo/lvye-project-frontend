import { requestClient } from '#/api/request';

/**
 * 测评结果配置数据对象
 */
export interface AssessmentResultConfigDO {
  id?: number;
  scenarioId: number;
  configName: string;
  ruleType: 0 | 1 | 2; // 0-综合方面规则，1-等级方面规则，2-评语方面规则
  calculateFormula: string; // JSON 规则
  description?: string;
  level?: string;
  suggestions?: string;
  comment?: string;
  status?: 0 | 1; // 状态（0：禁用，1：启用）
  creator?: string;
  createTime?: string;
  updater?: string;
  updateTime?: string;
  deleted?: 0 | 1;
}

/**
 * 创建测评结果配置
 */
export async function createAssessmentResultConfig(
  data: Omit<AssessmentResultConfigDO, 'id'>,
) {
  return requestClient.post<number>(
    '/psychology/assessment-result-config/create',
    data,
  );
}

/**
 * 更新测评结果配置
 */
export async function updateAssessmentResultConfig(
  data: AssessmentResultConfigDO,
) {
  return requestClient.put<boolean>(
    '/psychology/assessment-result-config/update',
    data,
  );
}

/**
 * 删除测评结果配置
 */
export async function deleteAssessmentResultConfig(id: number) {
  return requestClient.delete<boolean>(
    `/psychology/assessment-result-config/delete/${id}`,
  );
}

/**
 * 获取测评结果配置详情
 */
export async function getAssessmentResultConfig(id: number) {
  return requestClient.get<AssessmentResultConfigDO>(
    `/psychology/assessment-result-config/get/${id}`,
  );
}

/**
 * 根据场景ID获取配置列表
 */
export async function getAssessmentResultConfigsByScenarioId(
  scenarioId: number,
) {
  return requestClient.get<AssessmentResultConfigDO[]>(
    `/psychology/assessment-result-config/list-by-scenario/${scenarioId}`,
  );
}

/**
 * 根据场景ID和规则类型获取配置列表
 */
export async function getAssessmentResultConfigsByScenarioIdAndRuleType(
  scenarioId: number,
  ruleType: number,
) {
  return requestClient.get<AssessmentResultConfigDO[]>(
    '/psychology/assessment-result-config/list-by-scenario-and-type',
    {
      params: {
        scenarioId,
        ruleType,
      },
    },
  );
}
