<script setup lang="ts">
import { computed, markRaw, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Menu as AMenu,
  MenuItem as AMenuItem,
  SubMenu as ASubMenu,
} from 'ant-design-vue';

import { getInterventionTemplateList } from '#/api/psychology';
import LyButton from '#/components/LyButton/index.vue';

import InterventionManage from './components/InterventionManage.vue';
import InterventionTemplate from './components/InterventionTemplate.vue';
import OperationLog from './components/OperationLog.vue';
import SchoolPersonal from './components/SchoolPersonal.vue';
import StudentPassword from './components/StudentPassword.vue';

interface MenuItem {
  id?: number;
  type?: 'group' | 'item';
  key: string;
  label: string;
  description?: string;
  component?: any;
  children?: MenuItem[];
}

const menuList = ref<MenuItem[]>([
  {
    key: 'school',
    label: '学校个性化配置',
    description: '学校基本信息和组织架构配置',
    component: markRaw(SchoolPersonal),
  },
  {
    key: 'intervention',
    label: '干预管理设置',
    description: '干预管理流程的核心参数配置',
    component: markRaw(InterventionManage),
  },
  {
    key: 'operationLog',
    label: '操作日志管理',
    description: '系统配置操作的完整记录和查询',
    component: markRaw(OperationLog),
  },
  {
    key: 'password',
    label: '学生密码管理',
    description: '学生账户密码策略和登录验证配置',
    component: markRaw(StudentPassword),
  },
  {
    type: 'group',
    key: 'interventionTemplate',
    label: '干预模板',
    component: markRaw(InterventionTemplate),
    children: [],
  },
]);

// 响应式数据
const selectedKeys = ref(['school']);
const contentRef = ref<InstanceType<typeof SchoolPersonal>>();

/** 内容标题 */
const contentTitle = computed(() => {
  return menuList.value.find((item) => item.key === selectedKeys.value[0])
    ?.label;
});

/** 内容描述 */
const contentDescription = computed(() => {
  return menuList.value.find((item) => item.key === selectedKeys.value[0])
    ?.description;
});

/** 判断选中的菜单项是否是干预模板子项 */
const isInterventionTemplateChild = computed(() => {
  if (selectedKeys.value.length === 0) return false;

  const selectedKey = selectedKeys.value[0];
  const interventionTemplateItem = menuList.value.find(
    (item) => item.key === 'interventionTemplate',
  );

  return (
    interventionTemplateItem?.children?.some(
      (child) => child.key === selectedKey,
    ) || false
  );
});

/** 获取选中的组件 */
const getSelectedComponent = computed(() => {
  if (selectedKeys.value.length === 0) return null;

  const selectedKey = selectedKeys.value[0];

  // 遍历所有菜单项
  for (const item of menuList.value) {
    // 如果是直接匹配的菜单项
    if (item.key === selectedKey) {
      return item.component;
    }

    // 如果是分组菜单，检查子项
    if (item.children) {
      const child = item.children.find((child) => child.key === selectedKey);
      if (child) {
        return child.component || item.component;
      }
    }
  }

  return null;
});

/** 获取选中的干预模板ID */
const templateId = computed(() => {
  if (!isInterventionTemplateChild.value) return null;

  const interventionTemplateItem = menuList.value.find(
    (item) => item.key === 'interventionTemplate',
  );
  return interventionTemplateItem?.children?.find(
    (child) => child.key === selectedKeys.value[0],
  )?.id;
});

/** 恢复默认 */
function handleReset() {
  if (contentRef.value) {
    contentRef.value.handleReset();
  }
}

/** 保存配置 */
function handleSave() {
  if (contentRef.value) {
    contentRef.value.handleSave();
  }
}

/** 添加干预模板 */
function handleAddInterventionTemplate() {
  const interventionTemplateItem = menuList.value.find(
    (item) => item.key === 'interventionTemplate',
  );
  const newKey = `new-${Date.now()}`;
  if (interventionTemplateItem) {
    interventionTemplateItem.children?.push({
      id: undefined,
      key: newKey,
      label: '新的干预模板',
    });
  }

  selectedKeys.value = [newKey];
}

/** 获取模板列表 */
async function loadTemplateList() {
  try {
    const response = await getInterventionTemplateList();
    if (response) {
      const interventionTemplateItem = menuList.value.find(
        (item) => item.key === 'interventionTemplate',
      );
      if (interventionTemplateItem) {
        interventionTemplateItem.children = response.map((item) => ({
          id: item.id,
          key: String(item.id),
          label: item.title,
        }));
      }
    }
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  await loadTemplateList();
});
</script>

<template>
  <div class="m-6 flex min-h-[calc(100vh-98px)] rounded-[12px] bg-[#FFFFFF]">
    <!-- 左侧导航栏 -->
    <div
      class="rounded-lt-[12px] w-[228px] flex-shrink-0 border-r border-[#f2f3f5]"
    >
      <div class="border-b border-[#f2f3f5] px-6 py-4">
        <span class="m-0 font-semibold"> 业务规则配置 </span>
      </div>
      <AMenu
        v-model:selected-keys="selectedKeys"
        mode="inline"
        class="config-menu"
      >
        <template v-for="(item, index) in menuList" :key="index">
          <AMenuItem v-if="item.type !== 'group'" :key="item.key">
            <div class="relative flex items-center justify-between">
              <span>{{ item.label }}</span>
            </div>
          </AMenuItem>
          <ASubMenu v-else :key="index" :title="item.label">
            <AMenuItem v-for="child in item.children" :key="child.key">
              <div class="relative flex items-center justify-between">
                <span>{{ child.label }}</span>
              </div>
            </AMenuItem>
            <div
              class="flex-center absolute -bottom-7 left-12 size-5 cursor-pointer rounded-md border border-solid border-[#979899] text-[#979899] hover:border-[#04dc70] hover:!text-[#04dc70]"
              @click="handleAddInterventionTemplate"
            >
              <IconifyIcon icon="material-symbols:add-rounded" />
            </div>
          </ASubMenu>
        </template>
      </AMenu>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex min-w-0 flex-1 flex-col p-[24px_0px_40px_37px]">
      <div
        v-if="contentTitle"
        class="mb-[30px] flex shrink-0 flex-col gap-[12px] transition-all"
      >
        <span class="text-[20px] font-semibold leading-[20px] text-black">
          {{ contentTitle }}
        </span>
        <span class="m-0 text-[13px] leading-[13px] text-[#979899]">
          {{ contentDescription }}
        </span>
      </div>

      <!-- 内容区域 -->
      <div class="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <KeepAlive>
          <Transition name="fade" mode="out-in">
            <component
              ref="contentRef"
              :is="getSelectedComponent"
              v-model:selected-keys="selectedKeys"
              :template-id="templateId"
              @refresh="loadTemplateList"
            />
          </Transition>
        </KeepAlive>
      </div>

      <!-- 操作按钮区域 -->
      <Transition name="fade" mode="out-in" appear>
        <div
          class="flex shrink-0 justify-end gap-4 pr-6"
          v-if="
            !['operationLog'].includes(selectedKeys[0] ?? '') &&
            !isInterventionTemplateChild
          "
        >
          <LyButton size="middle" @click="handleReset"> 恢复默认 </LyButton>
          <LyButton type="success" size="middle" @click="handleSave">
            保存配置
          </LyButton>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

:deep(.ant-form-item) {
  margin-right: 24px;
}

:deep(.ant-menu-submenu) {
  position: relative;
  border-radius: 0 !important;
}

:deep(.ant-menu-submenu-title) {
  margin: 0 !important;
  color: #979899;
}

:deep(.ant-menu-inline) {
  background: none !important;
}
</style>
