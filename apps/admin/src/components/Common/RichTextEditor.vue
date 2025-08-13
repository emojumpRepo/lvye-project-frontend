<script lang="ts" setup>
import { ref, watch } from 'vue';

import Editor from '@tinymce/tinymce-vue';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    height?: number;
    menubar?: boolean | string;
    modelValue?: string;
    placeholder?: string;
    toolbar?: string;
  }>(),
  {
    modelValue: '',
    height: 260,
    placeholder: '',
    menubar: false,
    toolbar:
      'undo redo | blocks | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link table | removeformat code',
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'change', v: string): void;
  (e: 'blur', v: string): void;
}>();

const valueRef = ref<string>(props.modelValue);

watch(
  () => props.modelValue,
  (v) => {
    if (v !== valueRef.value) valueRef.value = v || '';
  },
);

function handleUpdate(v: string) {
  valueRef.value = v || '';
  emit('update:modelValue', valueRef.value);
}

function handleChange() {
  emit('change', valueRef.value || '');
}

function handleBlur() {
  emit('blur', valueRef.value || '');
}

const initOptions = {
  height: props.height,
  menubar: props.menubar,
  placeholder: props.placeholder,
  toolbar: props.toolbar,
  plugins: 'link lists table code wordcount',
  branding: false,
  language: 'zh_CN',
  base_url: '/tinymce',
};
</script>

<template>
  <Editor
    v-model="valueRef"
    :init="initOptions"
    :disabled="props.disabled"
    tinymce-script-src="/tinymce/tinymce.min.js"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @blur="handleBlur"
  />
  <!-- 注：/tinymce 目录及 tinymce.min.js 已在 public 中提供 -->
</template>
