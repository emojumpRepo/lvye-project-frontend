<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { Form, Input, Upload } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

const [CreateStudentEventRecord] = useVbenModal({
  fullscreenButton: false,
});
</script>

<template>
  <CreateStudentEventRecord title="新建记录">
    <Form>
      <Form.Item name="eventName">
        <LyLabel title="事件名称" custom-title-class="font-normal" />
        <Input />
      </Form.Item>

      <Form.Item>
        <LyLabel title="上传附件" custom-title-class="font-normal" />
        <div class="flex items-center gap-2">
          <Upload>
            <LyButton type="success" size="large">选择文件</LyButton>
          </Upload>
          <span class="text-sm text-gray-500">
            支持DOC、DOCX、PDF格式, 最大10MB
          </span>
        </div>
      </Form.Item>
    </Form>
  </CreateStudentEventRecord>
</template>
