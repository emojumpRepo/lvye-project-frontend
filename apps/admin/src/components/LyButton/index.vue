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

type ButtonSize = 'large' | 'middle' | 'small';
type ButtonFontSize = 'default' | 'large' | 'small';

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
        customClass.value = 'ly-btn-default';
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

const FONT_SIZE_MAP = {
  default: '14px',
  large: '16px',
  small: '12px',
} as const;

const buttonFontSize = computed(
  () => FONT_SIZE_MAP[props.fontSize] || FONT_SIZE_MAP.default,
);
</script>

<template>
  <AButton
    :type="customType"
    :class="classes"
    :size="size"
    :disabled="disabled"
    :ghost="ghost"
    :loading="loading"
    :block="block"
    :shape="shape"
    :style="{ fontSize: buttonFontSize }"
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
  height: auto;
  padding: 6px 15px;
  border-color: white;
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
