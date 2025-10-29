<script lang="ts" setup>
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { computed, onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Form as AForm,
  Select as ASelect,
  Table as ATable,
  Textarea as ATextarea,
  message,
} from 'ant-design-vue';

import { studentClassTransfer } from '#/api/psychology';
import LyLabel from '#/components/LyLabel/index.vue';
import { getDeptListCache } from '#/utils/transformDeptToTree';

interface DeptOption {
  value: number;
  label: string;
  children?: { label: string; value: number }[];
}

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

// ============= 数据 =============
const selectedStudents = ref<PsychologyStudentProfileApi.StudentProfile[]>([]);
const formRef = ref();

const columns = [
  {
    title: '学生姓名',
    dataIndex: 'name',
    key: 'name',
    width: 120,
  },
  {
    title: '学号',
    dataIndex: 'studentNo',
    key: 'studentNo',
  },
  {
    title: '当前班级',
    dataIndex: 'className',
    key: 'className',
  },
  {
    title: '操作',
    key: 'action',
  },
];

const transferForm = ref({
  gradeDeptId: undefined,
  classDeptId: undefined,
  reason: '',
  remark: '',
});

const rules = ref({
  gradeDeptId: [{ required: true, message: '请选择目标年级' }],
  classDeptId: [{ required: true, message: '请选择目标班级' }],
  reason: [{ required: true, message: '请输入换班理由' }],
});

const deptList = ref<DeptOption[]>([]);
const classList = computed(() => {
  return (
    deptList.value.find((dept) => dept.value === transferForm.value.gradeDeptId)
      ?.children || []
  );
});

// =================== 事件 ===================
const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[720px]',
  destroyOnClose: true,
  closeOnClickModal: false,
  confirmText: '确认换班',
  onOpenChange: async () => {
    const data = await drawerApi.getData();
    if (data.selectedStudents.length > 0) {
      selectedStudents.value = data.selectedStudents;
    }
  },
  onConfirm: () => {
    formRef.value.validate().then(async () => {
      if (selectedStudents.value.length === 0) {
        message.error('请选择学生');
        return;
      }

      if (!transferForm.value.classDeptId) {
        message.error('请选择目标年级');
        return;
      }
      if (!transferForm.value.gradeDeptId) {
        message.error('请选择目标班级');
        return;
      }
      if (!transferForm.value.reason) {
        message.error('请输入换班理由');
        return;
      }

      try {
        drawerApi.lock();
        const response = await studentClassTransfer({
          classDeptId: transferForm.value.classDeptId,
          gradeDeptId: transferForm.value.gradeDeptId,
          reason: transferForm.value.reason,
          studentProfileIds: selectedStudents.value.map(
            (student) => student.id as number,
          ),
        });
        emit('refresh');
        message.success(`${response}名学生换班成功`);
        drawerApi.close();
      } catch (error: any) {
        console.error('换班失败', error);
        message.error(error.message || '换班失败，请重新操作');
      } finally {
        drawerApi.unlock();
      }
    });
  },
});

/** 移除学生 */
function handleRemoveStudent(
  record: PsychologyStudentProfileApi.StudentProfile,
) {
  selectedStudents.value = selectedStudents.value.filter(
    (student) => student.studentNo !== record.studentNo,
  );
}

/** 年级选择变化 */
function handleGradeChange() {
  transferForm.value.classDeptId = undefined;
}

onMounted(async () => {
  deptList.value = await getDeptListCache();
});
</script>

<template>
  <Drawer title="批量换班学生">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/transfer_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">批量换班学生</span>
      </div>
    </template>

    <div class="mx-1">
      <!-- 已选择学生标题 -->
      <div class="mt-2 font-bold">
        <span>已选择学生</span>
        <span>（{{ selectedStudents.length }}名）</span>
      </div>

      <!-- 已选择学生表格 -->
      <div
        class="mt-4 overflow-hidden rounded-xl border border-solid border-[#EAEBED]"
      >
        <ATable
          :columns="columns"
          :data-source="selectedStudents"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <span
                class="cursor-pointer text-sm text-[#1966FF]"
                @click="
                  handleRemoveStudent(
                    record as PsychologyStudentProfileApi.StudentProfile,
                  )
                "
              >
                移除
              </span>
            </template>
          </template>
        </ATable>
      </div>

      <!-- 换班表单 -->
      <div class="mt-6">
        <AForm ref="formRef" :model="transferForm" :rules="rules">
          <div>
            <LyLabel
              title="目标年级"
              required
              custom-title-class="font-normal"
            />
            <AForm.Item name="gradeDeptId">
              <ASelect
                v-model:value="transferForm.gradeDeptId"
                placeholder="请选择目标年级"
                :options="deptList"
                @change="handleGradeChange"
              />
            </AForm.Item>
          </div>

          <div>
            <LyLabel
              title="目标班级"
              required
              custom-title-class="font-normal"
            />
            <AForm.Item name="classDeptId">
              <ASelect
                v-model:value="transferForm.classDeptId"
                placeholder="请选择目标班级"
                :options="classList"
              />
            </AForm.Item>
          </div>

          <div>
            <LyLabel
              title="换班理由"
              required
              custom-title-class="font-normal"
            />
            <AForm.Item name="reason">
              <ATextarea
                v-model:value="transferForm.reason"
                placeholder="请输入换班理由"
              />
            </AForm.Item>
          </div>

          <!-- <div>
            <LyLabel title="备注说明" custom-title-class="font-normal" />
            <AForm.Item name="remark">
              <ATextarea
                v-model:value="transferForm.remark"
                placeholder="请输入备注说明"
              />
            </AForm.Item>
          </div> -->
        </AForm>
      </div>
    </div>
  </Drawer>
</template>

<style lang="scss" scoped>
:deep(.ant-table-cell::before) {
  display: none !important;
}

:deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none !important;
}
</style>
