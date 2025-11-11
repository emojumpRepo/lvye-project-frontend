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
      'undo redo | blocks fontsize | bold italic underline forecolor backcolor customcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link table | removeformat code',
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
  custom_colors: true,
  color_cols: 5,
  // 设置编辑器内容的默认样式，包括默认文字颜色
  content_style:
    'body { font-family: Helvetica,Arial,sans-serif; font-size: 16px; color: rgba(45, 62, 80, 1); }',
  color_map: [
    // 深灰蓝色系列（常用）
    '#2D3E50',
    '深灰蓝',
    '#2D3E5066',
    '深灰蓝 40%',
    // 常用颜色
    '#000000',
    '黑色',
    '#00000099',
    '黑色 60%',
    '#0000004D',
    '黑色 30%',
    '#FF0000',
    '红色',
    '#FF000080',
    '红色 50%',
    '#00FF00',
    '绿色',
    '#00FF0080',
    '绿色 50%',
    '#0000FF',
    '蓝色',
    '#0000FF80',
    '蓝色 50%',
    '#FF9C05',
    '橙色',
    '#FF9C0580',
    '橙色 50%',
    '#FFFFFF',
    '白色',
  ],
  setup: (editor: any) => {
    // 添加自定义透明颜色按钮
    editor.ui.registry.addButton('customcolor', {
      text: '透明色',
      tooltip: '设置带透明度的文字颜色',
      onAction: () => {
        // eslint-disable-next-line no-alert
        const colorInput = window.prompt(
          '请输入 RGBA 颜色值（例如: rgba(255, 0, 0, 0.5) 表示50%透明的红色）\n\n常用格式：\nrgba(R, G, B, A)\nR/G/B: 0-255\nA: 0-1 (0=完全透明, 1=完全不透明)',
          'rgba(45, 62, 80, 0.40)',
        );

        if (colorInput) {
          // 验证输入格式
          const rgbaRegex =
            /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i;
          if (rgbaRegex.test(colorInput.trim())) {
            editor.formatter.apply('forecolor', { value: colorInput.trim() });
          } else {
            // eslint-disable-next-line no-alert
            window.alert(
              '格式错误！请使用 rgba(R, G, B, A) 格式，例如: rgba(255, 0, 0, 0.5)',
            );
          }
        }
      },
    });
  },
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
