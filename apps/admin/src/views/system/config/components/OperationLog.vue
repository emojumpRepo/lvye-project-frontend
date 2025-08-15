<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Descriptions as ADescriptions } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportOperateLog, getOperateLogPage } from '#/api/system/operate-log';
import { getSimpleUserList } from '#/api/system/user';
import LyButton from '#/components/LyButton/index.vue';
import { getRangePickerDefaultProps } from '#/utils';

// ============= 表格 =============
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    // 自适应高度，随容器变化
    height: 'auto',
    rowConfig: { keyField: 'id' },
    columnConfig: { resizable: true },
    showOverflow: true,
    pagerConfig: {
      align: 'right',
      pageSize: 10,
      pageSizes: [10, 20, 50, 100],
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
    },
    columns: [
      {
        field: 'createTime',
        title: '操作时间',
        width: 180,
        showOverflow: 'tooltip',
        slots: { default: 'createTime' },
      },
      {
        field: 'userName',
        title: '操作人员',
        width: 120,
        showOverflow: 'tooltip',
      },
      {
        field: 'action',
        title: '操作描述',
        minWidth: 200,
        showOverflow: 'tooltip',
      },
      {
        field: 'type',
        title: '配置分类',
        width: 160,
        showOverflow: 'tooltip',
      },
      {
        field: 'sensitive',
        title: '敏感标识',
        width: 100,
        align: 'center',
        slots: { default: 'sensitive' },
      },
      {
        field: 'actions',
        title: '操作',
        width: 120,
        fixed: 'right',
        align: 'center',
        resizable: false,
        slots: { default: 'actions' },
      },
    ],
    toolbarConfig: {
      refresh: false,
      search: false,
      custom: false,
      zoom: false,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getOperateLogPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
  } as VxeTableGridOptions<SystemOperateLogApi.OperateLog>,
});

// ============= 搜索表单 =============
const [SearchForm, formApi] = useVbenForm({
  layout: 'horizontal',
  wrapperClass:
    'lg:grid-cols-[minmax(200px,360px)_minmax(100px,200px)_minmax(100px,200px)_minmax(100px,200px)] md:grid-cols-2 grid-cols-1 gap-3',
  commonConfig: {
    componentProps: { class: 'w-full h-[40px] rounded-[6px]' },
    hideLabel: true,
  },
  showDefaultActions: false,
  schema: [
    {
      fieldName: 'createTime',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        showTime: true,
        placeholder: ['开始日期', '结束日期'],
      },
      formItemClass: 'h-full',
    },
    {
      fieldName: 'userId',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
        allowClear: true,
        placeholder: '请选择操作人员',
      },
    },
    {
      fieldName: 'type',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请选择功能模块',
      },
    },
    {
      fieldName: 'subType',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请选择操作类型',
      },
    },
  ],
  handleSubmit: (values) => {
    handleSearch(values);
  },
});

// ============= 日志详情弹窗 =============
const [Modal, modalApi] = useVbenModal({
  title: '操作日志详情',
  cancelText: '关闭',
  showConfirmButton: false,
  class: 'w-[800px] h-[600px]',
});

// 详情数据
const detailData = ref<SystemOperateLogApi.OperateLog>();

// 监听弹窗打开，加载详情数据
watch(
  () => modalApi.getData<SystemOperateLogApi.OperateLog>(),
  (data) => {
    detailData.value = data || undefined;
  },
  { immediate: true },
);

async function handleExport() {
  try {
    const formValues = await formApi.getValues();
    const data = await exportOperateLog(formValues);
    downloadFileFromBlobPart({ fileName: '操作日志.xls', source: data });
  } catch (error) {
    console.error('导出失败:', error);
  }
}

function handleSearch(values: Record<string, any>) {
  gridApi.query({ ...values, pageNo: 1 });
}

function handleResetClick() {
  // 清空表单数据
  formApi.resetForm();
  // 重新请求数据
  gridApi.query({ pageNo: 1 });
}

function handleShowSensitive() {
  // 这里可以根据实际需求实现敏感日志的筛选逻辑
  // 由于 API 接口中没有 sensitive 字段，暂时显示所有日志
  gridApi.query({ pageNo: 1 });
}

function handleDetail(row: SystemOperateLogApi.OperateLog) {
  console.warn('Opening detail for row:', row);
  detailData.value = row;
  modalApi.open();
}
</script>

<template>
  <Page auto-content-height :height-offset="240" class="custom-page">
    <div class="flex h-full w-full flex-col">
      <!-- 搜索表单 -->
      <div class="mb-4 flex shrink-0 flex-wrap items-center justify-between">
        <SearchForm class="mb-2" />
        <div class="mb-2 flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <LyButton
            size="middle"
            class="h-10 w-20 text-[13px]"
            @click="handleResetClick"
          >
            重置
          </LyButton>
          <LyButton
            size="middle"
            class="h-10 w-20 text-[13px]"
            @click="handleShowSensitive"
          >
            显示敏感
          </LyButton>
          <LyButton
            size="middle"
            class="h-10 w-20 text-[13px]"
            @click="handleExport"
          >
            导出日志
          </LyButton>
          <LyButton
            type="success"
            size="middle"
            class="h-10 w-20 text-[13px]"
            @click="formApi.submitForm()"
          >
            查询
          </LyButton>
        </div>
      </div>

      <div class="flex-1 overflow-hidden">
        <div class="h-[calc(100%-8px)] w-full">
          <Grid>
            <template #createTime="{ row }">
              {{ dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss') }}
            </template>
            <template #sensitive="{ row }">
              <span
                v-if="row?.sensitive"
                class="rounded bg-[#FF083114] px-[8px] py-[4px] text-[12px] font-medium text-[#FF0831]"
              >
                敏感
              </span>
              <span v-else class="text-[12px] text-[#B0B1B2]">—</span>
            </template>
            <template #actions="{ row }">
              <LyButton type="link" @click="handleDetail(row)">详情</LyButton>
            </template>
          </Grid>
        </div>
      </div>
    </div>
    <Modal>
      <div class="p-6">
        <div class="space-y-6">
          <!-- 基本信息 -->
          <div>
            <h3 class="mb-4 text-lg font-semibold text-gray-800">基本信息</h3>
            <ADescriptions :column="2" bordered size="small">
              <ADescriptions.Item label="日志编号">
                {{ detailData?.id || '—' }}
              </ADescriptions.Item>
              <ADescriptions.Item label="操作时间">
                {{ detailData?.createTime || '—' }}
              </ADescriptions.Item>
              <ADescriptions.Item label="操作人员">
                {{ detailData?.userName || '—' }}
              </ADescriptions.Item>
              <ADescriptions.Item label="操作IP">
                {{ detailData?.userIp || '—' }}
              </ADescriptions.Item>
            </ADescriptions>
          </div>

          <!-- 操作信息 -->
          <div>
            <h3 class="mb-4 text-lg font-semibold text-gray-800">操作信息</h3>
            <ADescriptions :column="2" bordered size="small">
              <ADescriptions.Item label="操作模块">
                {{ detailData?.type || '—' }}
              </ADescriptions.Item>
              <ADescriptions.Item label="操作名">
                {{ detailData?.subType || '—' }}
              </ADescriptions.Item>
              <ADescriptions.Item label="操作内容" :span="2">
                {{ detailData?.action || '—' }}
              </ADescriptions.Item>
            </ADescriptions>
          </div>

          <!-- 请求信息 -->
          <div>
            <h3 class="mb-4 text-lg font-semibold text-gray-800">请求信息</h3>
            <ADescriptions :column="2" bordered size="small">
              <ADescriptions.Item label="请求方法">
                {{ detailData?.requestMethod || '—' }}
              </ADescriptions.Item>
              <ADescriptions.Item label="业务编号">
                {{ detailData?.bizId || '—' }}
              </ADescriptions.Item>
              <ADescriptions.Item label="请求URL" :span="2">
                <div class="break-all">{{ detailData?.requestUrl || '—' }}</div>
              </ADescriptions.Item>
            </ADescriptions>
          </div>

          <!-- 扩展信息 -->
          <div v-if="detailData?.extra">
            <h3 class="mb-4 text-lg font-semibold text-gray-800">扩展信息</h3>
            <ADescriptions :column="1" bordered size="small">
              <ADescriptions.Item label="操作拓展参数">
                <div class="break-all rounded bg-gray-50 p-2">
                  {{ detailData.extra }}
                </div>
              </ADescriptions.Item>
            </ADescriptions>
          </div>

          <!-- 用户代理信息 -->
          <div v-if="detailData?.userAgent">
            <h3 class="mb-4 text-lg font-semibold text-gray-800">用户代理</h3>
            <ADescriptions :column="1" bordered size="small">
              <ADescriptions.Item label="User Agent">
                <div class="break-all rounded bg-gray-50 p-2 text-xs">
                  {{ detailData.userAgent }}
                </div>
              </ADescriptions.Item>
            </ADescriptions>
          </div>
        </div>
      </div>
    </Modal>
  </Page>
</template>
<style scoped lang="scss">
.custom-page {
  :deep(> div) {
    padding: 0;
    padding-right: 20px;
  }

  :deep(.ant-select-selector) {
    height: 40px !important;
    border-radius: 6px !important;
  }

  :deep(.ant-select-selection-placeholder) {
    line-height: 40px !important;
  }

  :deep(.ant-select-selection-item) {
    line-height: 40px !important;
  }

  :deep(.form-item) {
    padding: 0 !important;
  }

  :deep(.vxe-grid) {
    padding: 0 !important;
  }

  /* 强制分页器右对齐 */
  :deep(.vxe-pager--wrapper) {
    justify-content: flex-end !important;
  }

  :deep(.vxe-pager .vxe-pager--sizes) {
    margin-right: 0 !important;
  }
}
</style>
