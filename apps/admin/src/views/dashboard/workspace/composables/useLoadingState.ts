import type { Ref } from 'vue';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

/**
 * API 函数期望返回的结构
 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
}

/**
 * @param apiFn 异步函数，返回一个 { list: T[], total: number } 结构的对象
 * @param options.initialData - 数据的初始值，必须是 { list: [], total: 0 }
 */
export function useLoadingState<T, P extends any[] = any[]>(
  apiFn: (...args: P) => Promise<PaginatedData<T>>,
  options: {
    errorMessage: string;
    initialData: PaginatedData<T>;
  },
) {
  const { initialData, errorMessage } = options;

  const loading = ref(false);
  const data = ref(initialData.list) as Ref<T[]>;
  const total = ref(initialData.total);

  const load = async (...args: P) => {
    loading.value = true;
    try {
      // apiFn 返回 { list, total }
      const result = await apiFn(...args);

      // 分别更新 data 和 total
      data.value = result.list;
      total.value = result.total;
    } catch (error) {
      console.error(errorMessage, error);
      message.error(errorMessage);
      // 出错时也要重置
      data.value = initialData.list;
      total.value = initialData.total;
    } finally {
      loading.value = false;
    }
  };

  return {
    data, // 列表数据
    total,
    loading, // 加载状态
    load, // 执行函数
  };
}
