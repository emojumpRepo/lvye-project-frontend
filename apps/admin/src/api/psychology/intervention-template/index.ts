import { requestClient } from '#/api/request';

interface InterventionTemplateStep {
  id?: number;
  title: string;
  sort: number;
}

export interface InterventionTemplateCreateReqVO {
  id?: number;
  title: string;
  isOfficial: boolean;
  steps: InterventionTemplateStep[];
}

export interface InterventionTemplateResVO {
  id: number;
  title: string;
  isOfficial: boolean;
}

/** 创建模板 */
export function createInterventionTemplate(
  params: InterventionTemplateCreateReqVO,
) {
  return requestClient.post<number>(
    '/psychology/intervention-template/create',
    params,
  );
}

/** 获取模板列表 */
export function getInterventionTemplateList() {
  return requestClient.get<InterventionTemplateResVO[]>(
    '/psychology/intervention-template/get-template-list',
  );
}

/** 获取模板详情 */
export function getInterventionTemplate(id: number) {
  return requestClient.get<InterventionTemplateCreateReqVO>(
    `/psychology/intervention-template/get?id=${id}`,
  );
}

/** 更新模板 */
export function updateInterventionTemplate(
  params: InterventionTemplateCreateReqVO,
) {
  return requestClient.put<boolean>(
    '/psychology/intervention-template/update',
    params,
  );
}

/** 删除模板 */
export function deleteInterventionTemplate(id: number) {
  return requestClient.delete<boolean>(
    `/psychology/intervention-template/delete?id=${id}`,
  );
}
