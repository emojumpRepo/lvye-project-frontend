<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { SearchStudentProfileVO } from '@vben/types';

import type { ReportCrisisEventReqVO } from '#/api/psychology';

import { onMounted, reactive, ref } from 'vue';

import { confirm, useVbenDrawer } from '@vben/common-ui';

import { useDebounceFn } from '@vueuse/core';
import {
  DatePicker as ADatePicker,
  Form as AForm,
  Select as ASelect,
  Spin as ASpin,
  Textarea as ATextarea,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  checkDuplicateReportEvent,
  reportCrisisEvent,
} from '#/api/psychology/index';
import { searchStudentProfile } from '#/api/psychology/student-profile';
import LyButton from '#/components/LyButton/index.vue';
import LyCategoryCard from '#/components/LyCategoryCard/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { FileUpload } from '#/components/upload';
import { getDictLabel, getDictOptions } from '#/utils/dict';

interface State {
  studentList: SearchStudentProfileVO[];
  value: any[];
  fetching: boolean;
}

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const riskLevelOptions = ref<{ label: string; value: number }[]>([]);
const fileList = ref([]); // 附件列表
const accept = ref([
  'png',
  'jpg',
  'jpeg',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
  'zip',
  'rar',
  '7z',
]);
const eventFormRef = ref();
const state = reactive<State>({
  studentList: [],
  value: [],
  fetching: false,
});

const eventForm = ref<ReportCrisisEventReqVO>({
  studentProfileId: undefined as any,
  title: '',
  description: '',
  eventTime: undefined,
  location: '',
  riskLevel: undefined as any,
  priority: 2,
  sourceType: 1,
});

const rules: Record<string, Rule[]> = {
  studentProfileId: [
    {
      required: true,
      message: '未找到该学生，请从列表中选择或检查输入信息',
      trigger: 'blur',
    },
  ],
  title: [{ required: true, message: '请填写事件标题', trigger: 'blur' }],
  eventTime: [
    { required: true, message: '请选择事件发生时间', trigger: 'blur' },
  ],
  location: [
    { required: true, message: '请填写事件发生地点', trigger: 'blur' },
  ],
  description: [{ required: true, message: '请填写事件描述', trigger: 'blur' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择紧急程度', trigger: 'blur' }],
};

const riskPriority = ref([
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

const [SelectHandleMethodDrawer, selectedHandleMethodDrawerApi] = useVbenDrawer(
  {
    class: 'w-[720px]',
    destroyOnClose: true,
    onOpenChange: (open) => {
      if (open) {
        const draft = localStorage.getItem('report_crisis_event_draft');
        if (draft) {
          selectedHandleMethodDrawerApi.lock();
          confirm({
            beforeClose: async ({ isConfirm }) => {
              if (isConfirm) {
                const draftData = JSON.parse(draft);
                eventForm.value = {
                  ...draftData.eventForm,
                  eventTime:
                    draftData.eventForm.eventTime &&
                    dayjs(draftData.eventForm.eventTime),
                };
                state.value = draftData.state;
                localStorage.removeItem('report_crisis_event_draft');
              }
              return true;
            },
            confirmText: '确认',
            content: '检测到草稿，是否恢复？（确认后将清除草稿）',
            icon: 'success',
          }).then(() => {
            selectedHandleMethodDrawerApi.unlock();
          });
        }
      }
    },
    onConfirm() {
      eventFormRef.value.validate().then(async () => {
        try {
          selectedHandleMethodDrawerApi.lock();

          if (!eventForm.value.studentProfileId) {
            return message.error('请选择学生');
          }

          const isDuplicate = await checkDuplicateReportEvent(
            eventForm.value.studentProfileId,
          );
          if (isDuplicate) {
            confirm({
              beforeClose: async ({ isConfirm }) => {
                if (isConfirm) {
                  await handleReport();
                }
                return true;
              },
              content: '该学生24小时内已被您上报过，是否继续？',
              icon: 'warning',
            });
          } else {
            confirm({
              beforeClose: async ({ isConfirm }) => {
                if (isConfirm) {
                  await handleReport();
                }
                return true;
              },
              content: `${state.value[0]?.label}\n\n风险等级：${getDictLabel('questionnaire_result_risk_level', eventForm.value.riskLevel)}\n\n紧急程度：${getDictLabel('crisis_event_priority', eventForm.value.priority)}`,
              cancelText: '返回修改',
              confirmText: '确认上报',
              title: '信息确认',
              icon: 'success',
            });
          }
        } catch (error) {
          console.error('上报危机事件失败', error);
          message.error('上报失败');
        } finally {
          selectedHandleMethodDrawerApi.unlock();
        }
      });
    },
  },
);

/** 上报事件 */
async function handleReport() {
  try {
    const eventId = await reportCrisisEvent({
      ...eventForm.value,
      attachmentUrls: fileList.value || [],
    });
    if (!eventId) return message.error('上报危机事件失败');
    message.success('上报成功');
    selectedHandleMethodDrawerApi.close();
    emit('refresh');
  } catch (error) {
    console.error('上报危机事件失败', error);
    message.error('上报失败');
  }
}

/** 查找学生 */
const fetchUser = useDebounceFn(async (value: string) => {
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
}, 500);

/** 选择学生回调 */
function handleSelect(value: any) {
  state.value = [value];
  eventForm.value.studentProfileId = value.value;
}

/** 存草稿 */
function handleSaveDraft() {
  localStorage.setItem(
    'report_crisis_event_draft',
    JSON.stringify({ eventForm: eventForm.value, state: state.value }),
  );
  message.success('草稿已保存');
}

onMounted(() => {
  riskLevelOptions.value = getDictOptions('crisis_level', 'number').map(
    (item) => ({
      value: item.value,
      label: item.label,
    }),
  );
});
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

    <template #center-footer>
      <LyButton type="default" @click="handleSaveDraft">保存草稿</LyButton>
    </template>

    <div class="p-2">
      <div class="mb-6 text-sm text-[#FF9C05]">
        温馨提示：请详细填写学生异常行为信息, 我们将及时处理并通知相关负责人
      </div>

      <AForm ref="eventFormRef" :model="eventForm" :rules="rules">
        <!-- 学生信息 -->
        <AForm.Item name="studentProfileId">
          <div class="flex flex-col">
            <LyLabel
              title="学生信息"
              required
              custom-title-class="font-normal text-sm"
            />
            <ASelect
              v-model:value="state.value"
              style="width: 100%"
              placeholder="输入学生姓名或学号进行搜索"
              mode="multiple"
              label-in-value
              auto-clear-search-value
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
        </AForm.Item>

        <!-- 事件标题 -->
        <AForm.Item name="title">
          <LyLabel
            title="事件标题"
            required
            custom-title-class="font-normal text-sm"
          />
          <AInput
            v-model:value="eventForm.title"
            placeholder="请填写事件标题"
          />
        </AForm.Item>

        <!-- 事件发生时间 -->
        <AForm.Item name="eventTime">
          <LyLabel
            title="发生时间"
            required
            custom-title-class="font-normal text-sm"
          />
          <ADatePicker
            class="w-full"
            input-read-only
            v-model:value="eventForm.eventTime"
            placeholder="请选择事件发生时间"
            show-time
          />
        </AForm.Item>

        <!-- 事件发生地点 -->
        <AForm.Item name="location">
          <LyLabel
            title="发生地点"
            required
            custom-title-class="font-normal text-sm"
          />
          <AInput
            v-model:value="eventForm.location"
            placeholder="请填写事件发生地点"
          />
        </AForm.Item>

        <!-- 事件描述 -->
        <AForm.Item name="description">
          <div>
            <LyLabel
              title="事件描述"
              required
              custom-title-class="font-normal text-sm"
            />
            <ATextarea
              v-model:value="eventForm.description"
              placeholder="请详细描述学生的异常行为、发生时间、具体表现等..."
              :maxlength="500"
              show-count
            />
          </div>
        </AForm.Item>

        <!-- 风险等级 -->
        <AForm.Item name="riskLevel">
          <LyLabel
            title="危机事件等级"
            required
            custom-title-class="font-normal text-sm"
          />
          <ASelect
            v-model:value="eventForm.riskLevel"
            placeholder="请选择危机事件等级"
            :options="riskLevelOptions"
          />
        </AForm.Item>

        <!-- 紧急程度 -->
        <AForm.Item name="priority">
          <div>
            <LyLabel
              title="紧急程度"
              required
              custom-title-class="font-normal text-sm"
            />

            <div class="space-y-5">
              <LyCategoryCard
                v-for="item in riskPriority"
                :key="item.key"
                :category="item"
                v-model:current-category-key="eventForm.priority"
              />
            </div>
          </div>
        </AForm.Item>

        <!-- 附件上传 -->
        <div>
          <LyLabel title="附件上传" custom-title-class="font-normal text-sm" />
          <FileUpload
            v-model:value="fileList"
            :accept="accept"
            :max-size="5"
            :max-number="3"
          >
            <template #upload-text-desc>
              支持图片、文件、压缩包类型文件，最大1MB，最多3个文件
            </template>
          </FileUpload>
        </div>
      </AForm>
    </div>
  </SelectHandleMethodDrawer>
</template>

<style lang="scss" scoped>
:deep(.ant-tag-close-icon) {
  margin-inline-start: 0 !important;
}
</style>
