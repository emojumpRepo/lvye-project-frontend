import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    /** 后端路由模式 */
    accessMode: 'frontend',
    name: import.meta.env.VITE_APP_TITLE,
    enableRefreshToken: true,
    authPageLayout: 'panel-center',
    contentCompact: 'compact',
  },
  breadcrumb: {
    hideOnlyOne: true,
    showIcon: false,
  },
  navigation: {
    accordion: false,
  },
  shortcutKeys: {
    globalLockScreen: false,
    globalSearch: false,
  },
  sidebar: {
    width: 260,
    bottomCustomHeight: 200,
    collapsedButton: false,
    fixedButton: false,
    neverCollapse: true,
  },
  footer: {
    /** 默认关闭 footer 页脚，因为有一定遮挡 */
    enable: false,
    fixed: false,
  },
  tabbar: {
    enable: false,
  },
  theme: {
    mode: 'light',
    builtinType: 'green',
    colorPrimary: 'hsl(161 90% 43%)',
  },
  copyright: {
    companyName: import.meta.env.VITE_APP_TITLE,
    companySiteLink: 'https://gitee.com/yudaocode/yudao-ui-admin-vben',
  },
});
