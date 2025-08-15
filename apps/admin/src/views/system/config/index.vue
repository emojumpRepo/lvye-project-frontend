<script setup lang="ts">
import { computed, ref } from 'vue';

import { Menu as AMenu, MenuItem as AMenuItem } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

import InterventionManage from './components/InterventionManage.vue';
import OperationLog from './components/OperationLog.vue';
import SchoolPersonal from './components/SchoolPersonal.vue';
import StudentPassword from './components/StudentPassword.vue';

const menuList = [
  {
    key: 'school',
    label: '学校个性化配置',
    description: '学校基本信息和组织架构配置',
    component: SchoolPersonal,
  },
  {
    key: 'intervention',
    label: '干预管理设置',
    description: '干预管理流程的核心参数配置',
    component: InterventionManage,
  },
  {
    key: 'operationLog',
    label: '操作日志管理',
    description: '系统配置操作的完整记录和查询',
    component: OperationLog,
  },
  {
    key: 'password',
    label: '学生密码管理',
    description: '学生账户密码策略和登录验证配置',
    component: StudentPassword,
  },
];

// 响应式数据
const selectedKeys = ref(['school']);

const contentTitle = computed(() => {
  return menuList.find((item) => item.key === selectedKeys.value[0])?.label;
});

const contentDescription = computed(() => {
  return menuList.find((item) => item.key === selectedKeys.value[0])
    ?.description;
});

const contentRef = ref<InstanceType<typeof SchoolPersonal>>();

function handleReset() {
  if (contentRef.value) {
    contentRef.value.handleReset();
  }
}

function handleSave() {
  if (contentRef.value) {
    contentRef.value.handleSave();
  }
}
</script>

<template>
  <div class="m-6 flex min-h-[calc(100vh-98px)] rounded-[12px] bg-[#FFFFFF]">
    <!-- 左侧导航栏 -->
    <div
      class="rounded-lt-[12px] w-[228px] flex-shrink-0 border-r border-[#f2f3f5]"
    >
      <div class="border-b border-[#f2f3f5] p-6">
        <span class="m-0 text-[16px] font-semibold text-black"
          >业务规则配置</span
        >
      </div>
      <AMenu
        v-model:selected-keys="selectedKeys"
        mode="inline"
        class="config-menu"
      >
        <template v-for="item in menuList" :key="item.key">
          <AMenuItem>
            <div class="relative flex items-center justify-between">
              <span>{{ item.label }}</span>
            </div>
          </AMenuItem>
        </template>
      </AMenu>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex min-w-0 flex-1 flex-col p-[24px_0px_40px_37px]">
      <div class="mb-[30px] flex shrink-0 flex-col gap-[12px] transition-all">
        <span class="text-[20px] font-semibold leading-[20px] text-black">
          {{ contentTitle }}
        </span>
        <span class="m-0 text-[13px] leading-[13px] text-[#979899]">{{
          contentDescription
        }}</span>
      </div>

      <!-- 内容区域 -->
      <div class="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <KeepAlive>
          <Transition name="fade" mode="out-in">
            <component
              :is="
                menuList.find((item) => item.key === selectedKeys[0])?.component
              "
              ref="contentRef"
            />
          </Transition>
        </KeepAlive>
      </div>

      <!-- 操作按钮区域 -->
      <div
        class="flex shrink-0 justify-end gap-4 pr-6"
        v-if="!['operationLog'].includes(selectedKeys[0] ?? '')"
      >
        <LyButton class="h-[42px] w-[100px]" size="middle" @click="handleReset">
          恢复默认
        </LyButton>
        <LyButton
          type="success"
          class="h-[42px] w-[100px]"
          size="middle"
          @click="handleSave"
        >
          保存配置
        </LyButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-menu {
  margin-top: 28px;
  border-inline-end: 0 !important;
}

.config-menu :deep(.ant-menu-item) {
  width: 100%;
  height: 40px;
  padding: 0 24px;
  margin: 0;
  font-size: 14px;
  line-height: 40px;
  color: #979899;
  border-radius: 0;
}

.config-menu :deep(.ant-menu-item::after) {
  width: 3px;
  height: 100%;
  background-color: #04dc70;
}

.config-menu :deep(.ant-menu-item-selected) {
  font-weight: 600;
  color: #04dc70;
  background: #04dc7014;
}

/* 右侧内容区域样式 */
.content-area {
  flex: 1;
  padding: 24px 67px 50px 37px;
  background: linear-gradient(
    180deg,
    #ffffff4d 0%,
    #f7f8fa 22.19%,
    #f7f8fa 100%
  );
}

.content-header {
  margin-bottom: 29px;
}

.header-indicator {
  width: 2px;
  height: 14px;
  margin-bottom: 10px;
  background: #04dc70;
}

.content-header h2 {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  line-height: 20px;
  color: #000;
}

.header-description {
  margin: 0;
  font-size: 13px;
  line-height: 13px;
  color: #979899;
}

.config-form {
  padding: 0;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
}

.section-title {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 24px;
  margin: 0;
}

.title-indicator {
  width: 2px;
  height: 14px;
  background: #04dc70;
}

.section-title span {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.school-form {
  padding: 0 24px 36px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-item {
  margin-bottom: 12px;
}

.form-item :deep(.ant-form-item-label) {
  padding-bottom: 8px;
}

.form-item :deep(.ant-form-item-label > label) {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.form-input {
  height: 40px;
  font-size: 14px;
  border: 1px solid #00000026;
  border-radius: 4px;
}

.form-description {
  margin-bottom: 24px;
}

.description-text {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 12px;
  color: #979899;
}

.impact-scope {
  display: flex;
  gap: 6px;
  align-items: center;
}

.impact-label {
  font-size: 12px;
  color: #979899;
}

.impact-text {
  font-size: 12px;
  color: #979899;
}

.divider {
  height: 2px;
  margin: 24px 0;
  background: #e9e9e9;
}

.action-buttons {
  display: flex;
  gap: 19px;
  justify-content: center;
  padding: 24px;
  margin-top: 260px;
}

.reset-button {
  width: 100px;
  height: 40px;
  font-size: 13px;
  color: #121413;
  border: 1px solid #eaebed;
  border-radius: 6px;
}

.save-button {
  width: 100px;
  height: 40px;
  font-size: 13px;
  color: #fff;
  background: #14e77e;
  border: none;
  border-radius: 6px;
}

.save-button:hover {
  background: #12d171 !important;
}
</style>
