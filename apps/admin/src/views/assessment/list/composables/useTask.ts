import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { computed, readonly, ref } from 'vue';

import { getAssessmentTaskPage } from '#/api/psychology/assessment';

export interface TaskSearchParams {
  pageNo?: number;
  pageSize?: number;
  name?: string;
  status?: number;
  startTime?: Date[];
  createTime?: Date[];
  templateId?: number;
}

export const useTask = (initialParams?: TaskSearchParams) => {
  // 响应式数据
  const loading = ref(false);
  const pageSize = ref(initialParams?.pageSize || 9);
  const current = ref(initialParams?.pageNo || 1);
  const total = ref(0);
  const cards = ref<PsychologyAssessmentApi.AssessmentTask[]>([]);

  // 搜索参数
  // const searchParams = ref<TaskSearchParams>({
  //   title: initialParams?.title || '',
  //   status: initialParams?.status,
  //   startTime: initialParams?.startTime,
  //   createTime: initialParams?.createTime,
  //   templateId: initialParams?.templateId,
  // });

  const searchParams = ref<TaskSearchParams>({
    name: initialParams?.name || '',
    status: initialParams?.status,
    startTime: initialParams?.startTime,
    createTime: initialParams?.createTime,
    templateId: initialParams?.templateId,
  });

  // 计算属性：构建请求参数
  const requestParams = computed(() => ({
    pageNo: current.value,
    pageSize: pageSize.value,
    ...searchParams.value,
  }));

  // 加载数据
  const loadData = async (params?: Partial<TaskSearchParams>) => {
    try {
      loading.value = true;

      // 如果传入了新参数，更新搜索参数
      if (params) {
        Object.assign(searchParams.value, params);
        // 如果传入了新的分页参数，重置到第一页
        if (params.pageNo !== undefined || params.pageSize !== undefined) {
          current.value = params.pageNo || 1;
          if (params.pageSize !== undefined) {
            pageSize.value = params.pageSize;
          }
        }
      }

      const res = await getAssessmentTaskPage(requestParams.value);
      console.log('res', res);

      cards.value = res.list;
      total.value = res.total;
    } catch (error) {
      console.error('Failed to load assessment tasks:', error);
      cards.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  };

  // 搜索功能
  const search = async (params: Partial<TaskSearchParams>) => {
    current.value = 1; // 重置到第一页
    await loadData(params);
  };

  // 重置搜索
  const resetSearch = async () => {
    searchParams.value = {
      name: '',
      status: undefined,
      startTime: undefined,
      createTime: undefined,
      templateId: undefined,
    };
    current.value = 1;
    await loadData();
  };

  // 分页变化
  const handlePageChange = async (page: number, size?: number) => {
    current.value = page;
    if (size !== undefined) {
      pageSize.value = size;
    }
    await loadData();
  };

  // 刷新数据
  const refresh = async () => {
    await loadData();
  };

  // 根据状态筛选任务
  const filterByStatus = async (status: number) => {
    await search({ status });
  };

  // 根据模板筛选任务
  const filterByTemplate = async (templateId: number) => {
    await search({ templateId });
  };

  // 根据时间范围筛选任务
  const filterByTimeRange = async (startTime: Date[], createTime?: Date[]) => {
    await search({ startTime, createTime });
  };

  return {
    // 响应式数据
    loading: readonly(loading),
    pageSize: readonly(pageSize),
    current: readonly(current),
    total: readonly(total),
    cards,
    searchParams: readonly(searchParams),

    // 方法
    loadData,
    search,
    resetSearch,
    handlePageChange,
    refresh,
    filterByStatus,
    filterByTemplate,
    filterByTimeRange,

    // 计算属性
    requestParams: readonly(requestParams),
  };
};
