import { appRequestClient } from '#/api/request';

export namespace SystemDictDataApi {
  /** 字典数据 */
  export type DictData = {
    colorType: string;
    createTime: Date;
    cssClass: string;
    dictType: string;
    id?: number;
    label: string;
    remark: string;
    sort?: number;
    status: number;
    value: string;
  };
}

// 查询字典数据（精简)列表
/**
 * 获取简单字典数据列表
 * 该函数用于从服务器获取简化的字典数据列表，通常用于下拉框或选择器等场景
 * @returns {Promise} 返回一个Promise对象，包含从服务器获取的简单字典数据列表
 */
export function getSimpleDictDataList() {
  // 使用appRequestClient发送GET请求到'/system/dict-data/simple-list'接口
  return appRequestClient.get('/system/dict-data/simple-list');
}
