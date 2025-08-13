<script lang="ts" setup>
import { useVbenDrawer } from '@vben/common-ui';
import { Divider, Tabs } from 'ant-design-vue';

const [Drawer] = useVbenDrawer({
  class: 'w-[800px]',
  contentClass: 'bg-gray-50 p-0',
  showCancelButton: false,
  showConfirmButton: false,
});
</script>

<template>
  <Drawer title="已毕业学生档案">
    <div class="flex h-full flex-col gap-3">
      <div class="bg-white px-4 pb-3 pt-6">
        <div class="flex items-center gap-2.5">
          <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
          <span class="font-bold">基础信息</span>
        </div>
        <div class="mt-3 text-xs text-[#979899]">展示已毕业学生的基础信息与毕业时间、去向等。</div>
      </div>
      <div class="flex-1 overflow-x-hidden bg-white pb-5 pt-2">
        <Tabs :tab-bar-gutter="24">
          <Tabs.TabPane tab="档案信息" key="profile">
            <div class="p-4 text-xs text-[#979899]">展示历史测评、咨询记录的简要归档。</div>
          </Tabs.TabPane>
          <Tabs.TabPane tab="附件/证明" key="attachments">
            <div class="p-4 text-xs text-[#979899]">展示毕业相关附件/证明。</div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  </Drawer>
</template>


