<script lang="ts" setup>
import type { CategoryCard } from '@vben/types';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Select as ASelect, message } from 'ant-design-vue';

import {
  crisisInterventionSystemSetting,
  getCrisisInterventionSystemSetting,
} from '#/api/psychology/crisis';
import { getUserRoleList } from '#/api/system/user';
import LyCategoryCard from '#/components/LyCategoryCard/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

import CrisisModeAutoIcon from '../../../static/icons/crisis/crisis_mode_auto_icon.png';
import CrisisModeManualIcon from '../../../static/icons/crisis/crisis_mode_manual_icon.png';

interface SelectOption {
  label: string;
  value: number;
}

type ModeKey = 'auto-head-teacher' | 'auto-psychology' | 'manual';

const currentModeKey = ref<ModeKey | undefined>();
const defaultPsychologyId = ref<number | undefined>(undefined);
const teacherUserList = ref<SelectOption[]>([]);

const allocationModes = ref<CategoryCard[]>([
  {
    title: '手动分配模式',
    description:
      '新增事件保持 "待分配" 状态, 由年级管理员手动选择最合适的处理人员',
    text: '灵活性高:可根据事件性质、人员负荷等因素灵活分配',
    icon: CrisisModeManualIcon,
    key: 'manual',
  },
  {
    title: '自动分配模式-心理老师',
    description:
      '系统跟据学生档案中的责任心理老师自动分配, 无绑定时分配给默认老师',
    text: '推荐: 响应迅速, 减少人工干预',
    icon: CrisisModeAutoIcon,
    key: 'auto-psychology',
  },
  {
    title: '自动分配模式-班主任',
    description: '系统跟据学生档案中的班主任自动分配, 无绑定时分配给默认老师',
    text: '推荐: 响应迅速, 减少人工干预',
    icon: CrisisModeAutoIcon,
    key: 'auto-head-teacher',
  },
]);

const [CrisisInterventionSettingDrawer, crisisInterventionSettingDrawerApi] =
  useVbenDrawer({
    class: 'w-[720px]',
    destroyOnClose: true,
    onOpenChange: async () => {
      crisisInterventionSettingDrawerApi.lock();
      try {
        const response = await getCrisisInterventionSystemSetting();
        await loadTeacherUserList();
        if (response) {
          currentModeKey.value = response.mode as ModeKey;
          defaultPsychologyId.value = response.defaultPsychologyId;
        }
      } catch (error) {
        console.error('获取分配模式失败', error);
        message.error('获取分配模式失败');
      } finally {
        crisisInterventionSettingDrawerApi.unlock();
      }
    },
    onConfirm: async () => {
      if (!currentModeKey.value) {
        message.warning('请选择分配模式');
        return;
      }
      if (
        currentModeKey.value === 'auto-psychology' &&
        !defaultPsychologyId.value
      ) {
        message.warning('请选择默认心理老师');
        return;
      }

      try {
        crisisInterventionSettingDrawerApi.lock();
        const response = await crisisInterventionSystemSetting({
          mode: currentModeKey.value,
          defaultPsychologyId:
            currentModeKey.value === 'auto-psychology'
              ? defaultPsychologyId.value
              : undefined,
        });
        if (response) {
          message.success('分配成功');
          crisisInterventionSettingDrawerApi.close();
        } else {
          message.error('分配失败');
        }
      } catch (error) {
        console.error('分配失败', error);
        message.error('分配失败');
      } finally {
        crisisInterventionSettingDrawerApi.unlock();
        crisisInterventionSettingDrawerApi.close();
      }
    },
  });

/** 获取用户列表 */
async function loadTeacherUserList() {
  const response = await getUserRoleList();
  if (response) {
    teacherUserList.value = response.map((item) => ({
      label: item.nickname as string,
      value: item.id,
    })) as SelectOption[];
  }
}
</script>
<template>
  <CrisisInterventionSettingDrawer title="危机干预系统设置">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/crisis/crisis_intervention_setting_icon.png"
          class="w-5"
        />
        <span class="text-lg font-bold">危机干预系统设置</span>
      </div>
    </template>

    <div class="space-y-6">
      <!-- 分配模式 -->
      <div class="px-2 py-4">
        <div class="space-y-6">
          <div class="space-y-1">
            <LyLabel title="危机事件分配模式" has-indicator />
            <div class="text-xs text-[#979899]">
              选择新增危机事件的分配方式,设置后立即对新创建的事件生效
            </div>
          </div>
          <div
            v-for="mode in allocationModes"
            :key="mode.key"
            class="space-y-4"
          >
            <LyCategoryCard
              :category="mode"
              v-model:current-category-key="currentModeKey"
            />
          </div>
        </div>
      </div>

      <!-- 默认心理老师 -->
      <div v-if="currentModeKey === 'auto-psychology'" class="space-y-4 px-2">
        <div class="space-y-6">
          <div class="space-y-1">
            <LyLabel title="默认心理老师" has-indicator />
            <div class="text-xs text-[#979899]">
              当学生档案中未绑定责任心理老师时,自动分配给默认老师
            </div>
          </div>
        </div>

        <div>
          <ASelect
            v-model:value="defaultPsychologyId"
            placeholder="请选择"
            class="w-full"
            :options="teacherUserList"
          />
        </div>
      </div>
    </div>
  </CrisisInterventionSettingDrawer>
</template>
