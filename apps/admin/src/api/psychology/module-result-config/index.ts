import { requestClient } from '#/api/request';

/**
 * 模块结果配置（场景插槽结果配置）VO
 * 对应表：lvye_module_result_config
 */
export interface ModuleResultConfigVO {
  id?: number;
  scenarioSlotId: number;
  configName: string;
  /** 规则类型：0-等级方面规则，1-评语方面规则，2-综合方面规则（预留） */
  ruleType: 0 | 1 | 2;
  /** JSON 规则（字符串化存储） */
  calculateFormula: string;
  /** 配置描述 */
  description?: string;
  /** 评价等级描述 */
  level?: string;
  /** 建议文本 */
  suggestions?: string;
  /** 学生评语（字符串数组JSON格式） */
  comments?: string; // 后端存储为 json 字符串
  /** 状态（0：禁用，1：启用） */
  status?: 0 | 1;
  creator?: string;
  createTime?: string;
  updater?: string;
  updateTime?: string;
  deleted?: 0 | 1;
}

export function getModuleResultConfig(id: number) {
  return requestClient.get<ModuleResultConfigVO>(
    `/psychology/module-result-config/get/${id}`,
  );
}

export function createModuleResultConfig(data: ModuleResultConfigVO) {
  return requestClient.post<number>(
    '/psychology/module-result-config/create',
    data,
  );
}

export function updateModuleResultConfig(data: ModuleResultConfigVO) {
  return requestClient.put<boolean>(
    '/psychology/module-result-config/update',
    data,
  );
}

export function deleteModuleResultConfig(id: number) {
  return requestClient.delete<boolean>(
    `/psychology/module-result-config/delete/${id}`,
  );
}

export function listModuleResultConfigsBySlotId(scenarioSlotId: number) {
  return requestClient.get<ModuleResultConfigVO[]>(
    `/psychology/module-result-config/list-by-slot/${scenarioSlotId}`,
  );
}
