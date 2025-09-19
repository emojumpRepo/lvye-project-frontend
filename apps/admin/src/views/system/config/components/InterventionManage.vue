<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Form as AForm,
  Select as ASelect,
  Upload as AUpload,
  message,
} from 'ant-design-vue';

import { createConfig, getConfigPage, updateConfig } from '#/api/infra/config';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

type InterventionConfigKeys = 'intervention.reportExpireTime';

interface InterventionManageState {
  reportExpireTime: number;
}

const [ConfirmModal, confirmModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

const reportExpireTimeOptions = [
  { label: '24小时（适合专职心理老师，能及时处理）', value: 24 },
  { label: '48小时（适合兼职心理老师，给予充足时间）', value: 48 },
  { label: '72小时（适合访谈量大的学校，缓解时间压力）', value: 72 },
];

const form = reactive<InterventionManageState>({
  reportExpireTime: 24,
});

const initialSnapshot = ref<InterventionManageState | null>(null);
const loading = ref(false);
const fileList = ref<UploadProps['fileList']>([]);

// 默认值
const DEFAULT_REPORT_EXPIRE_TIME = 24;

async function fetchKeyValue(
  key: InterventionConfigKeys,
): Promise<{ id?: number; value: string }> {
  // 并行策略：先取值，再尝试查找 id
  const page = await getConfigPage({ pageNo: 1, pageSize: 10, key }).catch(
    () => undefined as any,
  );
  const id = page?.list?.find?.((it: any) => it?.key === key)?.id;
  const value = page?.list?.find?.((it: any) => it?.key === key)?.value;
  return { id, value: typeof value === 'string' ? value : String(value ?? '') };
}

async function upsertConfig(
  key: InterventionConfigKeys,
  value: string,
  meta: { category: string; name: string; remark?: string },
) {
  // 通过分页查询尝试拿到 id；拿不到则创建
  const page = await getConfigPage({ pageNo: 1, pageSize: 10, key }).catch(
    () => undefined as any,
  );
  const exist = page?.list?.find?.((it: any) => it?.key === key);
  const payload = {
    id: exist?.id,
    key,
    value,
    category: meta.category,
    name: meta.name,
    type: 1,
    visible: true,
    remark: meta.remark ?? '',
  } as any;
  await (exist?.id ? updateConfig(payload) : createConfig(payload));
}

async function load() {
  loading.value = true;
  try {
    const { value: reportExpireTime } = await fetchKeyValue(
      'intervention.reportExpireTime',
    );
    form.reportExpireTime =
      Number.parseInt(reportExpireTime) || DEFAULT_REPORT_EXPIRE_TIME;
    initialSnapshot.value = { ...form };
  } finally {
    loading.value = false;
  }
}

async function handleSaveConfirm() {
  try {
    loading.value = true;

    await upsertConfig(
      'intervention.reportExpireTime',
      form.reportExpireTime.toString(),
      {
        category: 'intervention',
        name: '评估报告逾期时间',
        remark: '心理访谈评估的时效性要求和逾期提醒',
      },
    );

    initialSnapshot.value = { ...form };
    confirmModalApi.close();
    message.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

function handleSave() {
  confirmModalApi
    .setData({
      title: '此设置影响所有未完成的评估任务时限',
    })
    .open();
}

function handleReset() {
  if (initialSnapshot.value) {
    Object.assign(form, initialSnapshot.value);
  }
}

function handleRemove(file: any) {
  fileList.value = fileList.value?.filter((item) => item.uid !== file.uid);
}

onMounted(() => {
  load();
});

defineExpose({
  handleSave,
  handleReset,
});
</script>

<template>
  <div class="h-full w-full">
    <div>
      <LyLabel
        title="时效管理"
        has-indicator
        custom-title-class="text-[16px] font-semibold"
        custom-gap-class="gap-3"
        custom-indicator-class="h-[14px] w-[2px]"
        margin-bottom-class="mb-5"
      />

      <section>
        <AForm layout="vertical" :disabled="loading">
          <!-- 评估报告逾期时间 -->
          <AForm.Item>
            <LyLabel
              title="评估报告逾期时间"
              custom-title-class="text-[14px] font-semibold"
            />
            <ASelect
              v-model:value="form.reportExpireTime"
              placeholder="请选择评估报告逾期时间"
              class="mb-1 max-w-[448px] rounded-[4px]"
              :options="reportExpireTimeOptions"
            />
            <div class="input-description">
              心理访谈评估的时效性要求和逾期提醒
            </div>
            <div class="input-description">
              <span class="mr-1 inline-block">影响范围：</span>
              心理访谈评估报告的时效控制
            </div>
          </AForm.Item>
        </AForm>
      </section>
    </div>

    <div>
      <LyLabel
        title="评估模板管理"
        has-indicator
        custom-title-class="text-[16px] font-semibold"
        custom-gap-class="gap-3"
        custom-indicator-class="h-[14px] w-[2px]"
        margin-bottom-class="mb-5"
      />

      <section>
        <div class="w-[700px] space-y-3">
          <div
            class="flex items-center justify-between rounded-xl border border-solid border-[#EAEBED] px-8 py-5"
          >
            <div class="flex flex-col gap-2">
              <span class="font-bold">请上传规定要求的心理评估模板</span>
              <span class="whitespace-nowrap text-sm text-[#979899]">
                根据教育局或本校要求，上传规定的模板,用于心理老师评估后上传
              </span>
              <span class="text-sm text-[#C9CBCC]">
                支持格式为：doc, docx, 大小不超过 1MB
              </span>
            </div>

            <AUpload
              v-model:file-list="fileList"
              name="file"
              :show-upload-list="false"
            >
              <LyButton type="success" size="large">点击上传</LyButton>
            </AUpload>
          </div>

          <!-- 上传列表 -->
          <div class="space-y-3">
            <div
              v-for="file in fileList"
              :key="file.uid"
              class="flex items-center justify-between rounded-lg bg-[#F7F8FA] px-4 py-2"
            >
              <div class="flex items-center gap-2">
                <IconifyIcon icon="icon-park-outline:link" color="#333333" />
                <span class="text-sm text-[#979899]">{{ file.name }}</span>
              </div>
              <IconifyIcon
                icon="lucide:trash-2"
                color="#FF0831"
                class="cursor-pointer"
                @click="handleRemove(file)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <ConfirmModal @confirm="handleSaveConfirm" />
  </div>
</template>

<style scoped lang="scss">
.input-description {
  @apply mt-2 text-[12px] leading-[12px] text-[#979899];
}

:deep(.ant-select-selector) {
  height: 40px !important;
  border-radius: 4px;
}

:deep(.ant-select-selection-item) {
  line-height: 40px !important;
}
</style>
