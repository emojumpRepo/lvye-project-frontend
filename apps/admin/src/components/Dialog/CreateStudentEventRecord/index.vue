<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { Form, Input, Upload } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

const [CreateStudentEventRecord] = useVbenModal({
  fullscreenButton: false,
  confirmText: '提交',
  class: '!w-[620px]',
});
</script>

<template>
  <CreateStudentEventRecord title="新建记录">
    <div class="p-2">
      <Form>
        <Form.Item name="eventName">
          <LyLabel title="事件名称" custom-title-class="font-normal" />
          <Input />
        </Form.Item>

        <Form.Item>
          <LyLabel title="上传附件" custom-title-class="font-normal" />
          <div class="flex items-center gap-4">
            <Upload>
              <LyButton type="success" size="large">选择文件</LyButton>
            </Upload>
            <span class="text-xs text-[#969997]">
              支持DOC、DOCX、PDF格式, 最大10MB
            </span>
          </div>
        </Form.Item>

        <Form.Item>
          <LyLabel title="事件描述" custom-title-class="font-normal" />
          <Input.TextArea
            placeholder="请输入内容"
            :maxlength="1000"
            :rows="5"
            show-count
          />
        </Form.Item>
      </Form>
    </div>
  </CreateStudentEventRecord>
</template>

<style scoped lang="scss">
textarea {
  resize: none;
}
</style>
