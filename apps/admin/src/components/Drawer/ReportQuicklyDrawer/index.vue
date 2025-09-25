<script lang="ts" setup>
import type { SearchStudentProfileVO } from '@vben/types';

import { reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Select as ASelect,
  Spin as ASpin,
  Tag as ATag,
  Textarea as ATextarea,
  message,
} from 'ant-design-vue';

import { searchStudentProfile } from '#/api/psychology/student-profile';
import LyCategoryCard from '#/components/LyCategoryCard/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import LyUpload from '#/components/LyUpload/index.vue';

interface Option {
  label: string;
  value: number;
}

interface State {
  studentList: SearchStudentProfileVO[];
  value: Option[];
  selectedStudent: null | Option;
  fetching: boolean;
}

const eventDescription = ref(''); // 事件描述
const fileList = ref([]); // 附件列表
const state = reactive<State>({
  studentList: [],
  value: [],
  selectedStudent: null,
  fetching: false,
});

const eventForm = ref({
  studentProfileId: '',
  title: '',
  description: '',
  eventTime: undefined,
  location: '',
  riskLevel: undefined,
  priority: undefined,
  urgencyLevel: undefined,
  attachmentUrls: [],
  sourceType: 1,
});

const criticalLevel = ref([
  {
    title: '高优先级',
    description: '建议2小时内响应（涉及自伤、伤人、严重心理危机等）',
    color: '#FF0831',
    key: 1,
  },
  {
    title: '中优先级',
    description: '建议24小时内响应（情绪异常、行为改变、适应困难等）',
    color: '#FF9C05',
    key: 2,
  },
  {
    title: '低优先级',
    description: '建议一周内响应（一般关注事项、预防性关怀等）',
    color: '#04DC70',
    key: 3,
  },
]);

const [SelectHandleMethodDrawer, seletedHandleMethodDrawerApi] = useVbenDrawer({
  class: 'w-[720px]',
  destroyOnClose: true,
});

/** 关闭学生信息标签 */
function handleCloseTag() {
  state.value = [];
}

/** 查找学生 */
async function fetchUser(value: string) {
  try {
    state.fetching = true;
    const studentList = await searchStudentProfile({ name: value });
    if (studentList.length > 0) {
      state.studentList = studentList.map((student) => ({
        label: `${student.name}（${student.className}）学号：${student.studentNo}`,
        value: student.id,
        ...student,
      }));
    }
  } catch (error) {
    console.error('查询学生失败', error);
    message.error('查询学生失败');
  } finally {
    state.fetching = false;
  }
}

/** 选择学生回调 */
function handleSelect(value: any) {
  console.log('value', value);
  state.selectedStudent = value;
  state.value = [];
}
</script>

<template>
  <SelectHandleMethodDrawer title="快速上报学生异常情况">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/crisis/crisis_intervention_setting_icon.png"
          class="w-5"
        />
        <span class="text-lg font-bold">快速上报学生异常情况</span>
      </div>
    </template>

    <div class="p-2">
      <div class="mb-6 text-sm text-[#FF9C05]">
        温馨提示：请详细填写学生异常行为信息, 我们将及时处理并通知相关负责人
      </div>

      <div class="space-y-7">
        <!-- 事件描述 -->
        <div class="flex flex-col">
          <LyLabel
            title="学生信息"
            required
            custom-title-class="font-normal text-sm"
          />
          <ATag
            v-if="state.selectedStudent"
            closable
            :bordered="false"
            @close="handleCloseTag"
            color="#04DC7014"
            class="mb-3 !inline-flex items-center gap-2 p-2"
          >
            <template #closeIcon>
              <IconifyIcon
                icon="carbon:close-filled"
                color="#00000033"
                class="size-4"
              />
            </template>
            <div class="text-sm text-black">
              {{ state.selectedStudent?.label }}
            </div>
          </ATag>
          <ASelect
            v-model:value="state.value"
            style="width: 100%"
            placeholder="输入学生姓名或学号进行搜索"
            mode="multiple"
            auto-clear-search-value
            label-in-value
            :not-found-content="state.fetching ? undefined : null"
            :filter-option="false"
            :options="state.studentList"
            @search="fetchUser"
            @select="handleSelect"
          >
            <template v-if="state.fetching" #notFoundContent>
              <ASpin size="small" />
            </template>
          </ASelect>
        </div>

        <!-- 事件描述 -->
        <div>
          <LyLabel
            title="事件描述"
            required
            custom-title-class="font-normal text-sm"
          />
          <ATextarea
            v-model:value="eventDescription"
            placeholder="请详细描述学生的异常行为、发生时间、具体表现等..."
            :maxlength="500"
            show-count
          />
        </div>

        <!-- 紧急程度 -->
        <div>
          <LyLabel
            title="紧急程度"
            required
            custom-title-class="font-normal text-sm"
          />

          <div class="space-y-5">
            <LyCategoryCard
              v-for="item in criticalLevel"
              :key="item.key"
              :category="item"
              v-model:current-category-key="eventForm.urgencyLevel"
            />
          </div>
        </div>

        <!-- 附件上传 -->
        <div>
          <LyLabel title="附件上传" custom-title-class="font-normal text-sm" />
          <LyUpload v-model:file-list="fileList" />
        </div>
      </div>
    </div>
  </SelectHandleMethodDrawer>
</template>

<style lang="scss" scoped>
:deep(.ant-tag-close-icon) {
  margin-inline-start: 0 !important;
}
</style>
