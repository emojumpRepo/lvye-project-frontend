<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Button as AButton } from 'ant-design-vue';

type ButtonType =
  | 'black'
  | 'cyan'
  | 'default'
  | 'error'
  | 'link'
  | 'primary'
  | 'purple'
  | 'success'
  | 'text'
  | 'warning';

type ButtonSize = 'large' | 'middle' | 'small' | 'mini';
type ButtonFontSize = 'default' | 'large' | 'small' | 'mini';

const props = withDefaults(
  defineProps<{
    block?: boolean;
    disabled?: boolean;
    fontSize?: ButtonFontSize;
    ghost?: boolean;
    icon?: string | undefined;
    loading?: boolean;
    shape?: 'circle' | 'default' | 'round';
    size?: ButtonSize;
    type?: ButtonType;
  }>(),
  {
    type: 'default',
    size: 'small',
    icon: undefined,
    disabled: false,
    ghost: false,
    loading: false,
    block: false,
    shape: 'default',
    fontSize: 'default',
  },
);

// Map to ant type and custom class
const customClass = ref<string>('');
const customType = ref<'default' | 'link' | 'primary' | 'text'>('default');

watch(
  () => props.type,
  (value) => {
    switch (value) {
      case 'black': {
        customClass.value = 'ly-btn-black';
        customType.value = 'default';
        break;
      }
      case 'cyan': {
        customClass.value = 'ly-btn-cyan';
        customType.value = 'default';
        break;
      }
      case 'error': {
        customClass.value = 'ly-btn-error';
        customType.value = 'default';
        break;
      }
      case 'link': {
        customClass.value = '';
        customType.value = 'link';
        break;
      }
      case 'primary': {
        customClass.value = 'ly-btn-primary';
        customType.value = 'primary';
        break;
      }
      case 'purple': {
        customClass.value = 'ly-btn-purple';
        customType.value = 'default';
        break;
      }
      case 'success': {
        customClass.value = 'ly-btn-success';
        customType.value = 'default';
        break;
      }
      case 'text': {
        customClass.value = '';
        customType.value = 'text';
        break;
      }
      case 'warning': {
        customClass.value = 'ly-btn-warning';
        customType.value = 'default';
        break;
      }
      default: {
        customClass.value = '';
        customType.value = 'default';
        break;
      }
    }
  },
  { immediate: true },
);

const isGhost = computed(
  () =>
    props.ghost && customType.value !== 'text' && customType.value !== 'link',
);
const classes = computed(() => [
  customClass.value,
  { 'is-ghost': isGhost.value },
]);

// 参考 Ant Design 和 Element Plus 的按钮尺寸规范
const SIZE_CONFIG = {
  large: {
    height: '40px',
    padding: '11px 20px',
    fontSize: '16px',
    borderRadius: '6px',
  },
  middle: {
    height: '36px', 
    padding: '8px 16px',
    fontSize: '14px',
    borderRadius: '6px',
  },
  small: {
    height: '32px',
    padding: '5px 12px', 
    fontSize: '14px',
    borderRadius: '6px',
  },
  mini: {
    height: '28px',
    padding: '3px 8px',
    fontSize: '12px',
    borderRadius: '4px',
  },
} as const;

// 字体大小映射，可独立于按钮尺寸控制
const FONT_SIZE_MAP = {
  large: '16px',
  default: '14px',
  small: '12px',
  mini: '12px',
} as const;

const sizeConfig = computed(
  () => SIZE_CONFIG[props.size] || SIZE_CONFIG.middle,
);

const buttonFontSize = computed(() => {
  // 如果指定了 fontSize，使用指定的字体大小
  if (props.fontSize && props.fontSize !== 'default') {
    return FONT_SIZE_MAP[props.fontSize];
  }
  // 否则使用对应尺寸的默认字体大小
  return sizeConfig.value.fontSize;
});
</script>

<template>
  <AButton
    :type="customType"
    :class="[...classes, `ly-btn-size-${size}`]"
    :size="size === 'mini' ? 'small' : size"
    :disabled="disabled"
    :ghost="ghost"
    :loading="loading"
    :block="block"
    :shape="shape"
    class="ly-btn transition-all"
  >
    <template v-if="$slots.icon" #icon>
      <slot name="icon"></slot>
    </template>
    <template v-else-if="icon" #icon>
      <component :is="icon" />
    </template>
    <slot></slot>
  </AButton>
</template>

<style scoped>
/* 按钮尺寸样式 - 参考主流UI库规范 */
.ly-btn.ant-btn {
  font-weight: 400;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Large 尺寸 - 40px 高度 */
.ly-btn-size-large.ant-btn {
  height: 40px;
  padding: 6px 20px;
  font-size: 16px;
  line-height: 1.5;
  border-radius: 6px;
}

.ly-btn-size-large.ant-btn.ant-btn-icon-only {
  width: 40px;
  padding: 0;
}

/* Middle 尺寸 - 36px 高度 */
.ly-btn-size-middle.ant-btn {
  height: 36px;
  padding: 4px 16px;
  font-size: 14px;
  line-height: 1.5715;
  border-radius: 6px;
}

.ly-btn-size-middle.ant-btn.ant-btn-icon-only {
  width: 36px;
  padding: 0;
}

/* Small 尺寸 - 32px 高度 */
.ly-btn-size-small.ant-btn {
  height: 32px;
  padding: 4px 12px;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 6px;
}

.ly-btn-size-small.ant-btn.ant-btn-icon-only {
  width: 32px;
  padding: 0;
}

/* Mini 尺寸 - 28px 高度（自定义） */
.ly-btn-size-mini.ant-btn {
  height: 28px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 4px;
}

.ly-btn-size-mini.ant-btn.ant-btn-icon-only {
  width: 28px;
  padding: 0;
}

/* Round 形状调整 */
.ly-btn.ant-btn-round.ly-btn-size-large {
  border-radius: 20px;
  padding: 6px 24px;
}

.ly-btn.ant-btn-round.ly-btn-size-middle {
  border-radius: 18px;
  padding: 4px 20px;
}

.ly-btn.ant-btn-round.ly-btn-size-small {
  border-radius: 16px;
  padding: 4px 16px;
}

.ly-btn.ant-btn-round.ly-btn-size-mini {
  border-radius: 14px;
  padding: 2px 12px;
}

/* Circle 形状确保正圆 */
.ly-btn.ant-btn-circle.ly-btn-size-large {
  width: 40px;
  padding: 0;
}

.ly-btn.ant-btn-circle.ly-btn-size-middle {
  width: 36px;
  padding: 0;
}

.ly-btn.ant-btn-circle.ly-btn-size-small {
  width: 32px;
  padding: 0;
}

.ly-btn.ant-btn-circle.ly-btn-size-mini {
  width: 28px;
  padding: 0;
}

/* Primary: override to ensure brand primary (filled) */
.ly-btn-primary:not(.is-ghost).ant-btn-primary {
  color: #fff;
  background-color: var(--ant-color-primary, #1677ff);
  border-color: var(--ant-color-primary, #1677ff);
}

.ly-btn-primary:not(.is-ghost).ant-btn-primary:hover,
.ly-btn-primary:not(.is-ghost).ant-btn-primary:focus {
  color: #fff;
  background-color: var(--ant-color-primary-hover, #4096ff);
  border-color: var(--ant-color-primary, #1677ff);
}

.ly-btn-primary.ant-btn-primary[disabled] {
  color: rgb(0 0 0 / 25%);
  text-shadow: none;
  background: #f5f5f5;
  border-color: #d9d9d9;
  box-shadow: none;
}

/* Ghost variants: outlined look with color */
.is-ghost.ant-btn,
.is-ghost.ant-btn-default {
  background: transparent;
}

.ly-btn-warning.is-ghost.ant-btn,
.ly-btn-warning.is-ghost.ant-btn-default {
  color: var(--ant-color-warning, #faad14);
  border-color: var(--ant-color-warning, #faad14);
}

.ly-btn-error.is-ghost.ant-btn,
.ly-btn-error.is-ghost.ant-btn-default {
  color: var(--ant-color-error, #ff4d4f);
  border-color: var(--ant-color-error, #ff4d4f);
}

.ly-btn-success.is-ghost.ant-btn,
.ly-btn-success.is-ghost.ant-btn-default {
  color: var(--ant-color-success, #04dc70);
  border-color: var(--ant-color-success, #04dc70);
}

.ly-btn-cyan.is-ghost.ant-btn,
.ly-btn-cyan.is-ghost.ant-btn-default {
  color: var(--ant-color-info, #1677ff);
  border-color: var(--ant-color-info, #1677ff);
}

.ly-btn-black.is-ghost.ant-btn,
.ly-btn-black.is-ghost.ant-btn-default {
  color: #131313;
  border-color: #131313;
}

.ly-btn-purple.is-ghost.ant-btn,
.ly-btn-purple.is-ghost.ant-btn-default {
  color: #b500fe;
  border-color: #b500fe;
}

/* Filled (non-ghost) custom colors using default type */
.ly-btn-warning:not(.is-ghost).ant-btn,
.ly-btn-warning:not(.is-ghost).ant-btn-default {
  color: #fff;
  background-color: var(--ant-color-warning, #faad14);
  border-color: var(--ant-color-warning, #faad14);
}

.ly-btn-warning:not(.is-ghost).ant-btn:hover {
  color: #fff;
  background-color: var(--ant-color-warning-hover, #ffc53d);
  border-color: var(--ant-color-warning, #faad14);
}

.ly-btn-default:not(.is-ghost).ant-btn,
.ly-btn-default:not(.is-ghost).ant-btn-default {
  border-color: #d9d9d9;
}

.ly-btn-default:not(.is-ghost).ant-btn:hover,
.ly-btn-default:not(.is-ghost).ant-btn-default:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

.ly-btn-error:not(.is-ghost).ant-btn,
.ly-btn-error:not(.is-ghost).ant-btn-default {
  color: #fff;
  background-color: var(--ant-color-error, #ff4d4f);
  border-color: var(--ant-color-error, #ff4d4f);
}

.ly-btn-error:not(.is-ghost).ant-btn:hover {
  color: #fff;
  background-color: var(--ant-color-error-hover, #ff7875);
  border-color: var(--ant-color-error, #ff4d4f);
}

.ly-btn-success:not(.is-ghost).ant-btn,
.ly-btn-success:not(.is-ghost).ant-btn-default {
  color: #fff;
  background-color: var(--ant-color-success, #04dc70);
  border-color: var(--ant-color-success, #04dc70);
}

.ly-btn-success:not(.is-ghost).ant-btn:hover {
  color: #fff;
  background-color: var(--ant-color-success-hover, #02c663);
  border-color: var(--ant-color-success-hover, #02c663);
}

.ly-btn-cyan:not(.is-ghost).ant-btn,
.ly-btn-cyan:not(.is-ghost).ant-btn-default {
  color: #fff;
  background-color: var(--ant-color-info, #1677ff);
  border-color: var(--ant-color-info, #1677ff);
}

.ly-btn-cyan:not(.is-ghost).ant-btn:hover {
  color: #fff;
  background-color: var(--ant-color-info-hover, #4096ff);
  border-color: var(--ant-color-info, #1677ff);
}

.ly-btn-black:not(.is-ghost).ant-btn,
.ly-btn-black:not(.is-ghost).ant-btn-default {
  color: #fff;
  background-color: #131313;
  border-color: #131313;
}

.ly-btn-black:not(.is-ghost).ant-btn:hover {
  color: #fff;
  background-color: #313131;
  border-color: #131313;
}

.ly-btn-purple:not(.is-ghost).ant-btn,
.ly-btn-purple:not(.is-ghost).ant-btn-default {
  color: #fff;
  background-color: #b500fe;
  border-color: #b500fe;
}

.ly-btn-purple:not(.is-ghost).ant-btn:hover {
  color: #fff;
  background-color: #c951fa;
  border-color: #b500fe;
}

/* Disabled 状态统一置灰 */
.ant-btn[disabled],
.ant-btn[disabled]:hover,
.ant-btn[disabled]:focus {
  color: rgb(0 0 0 / 25%) !important;
  background-color: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  box-shadow: none !important;
}
</style>
