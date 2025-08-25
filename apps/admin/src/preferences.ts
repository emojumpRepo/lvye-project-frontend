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
    authPageLayout: 'panel-center',
    layout: 'header-sidebar-nav',
    accessMode: 'backend',
    name: import.meta.env.VITE_APP_TITLE,
    enableRefreshToken: true,
  },
  footer: {
    enable: false,
    fixed: false,
  },
  copyright: {
    companyName: '曼心科技有限公司',
    companySiteLink: 'www.lvye.com',
    date: '2025',
  },
  theme: {
    builtinType: 'green',
    colorPrimary: 'hsla(150, 96%, 44%, 1)',
    mode: 'light',
  },
  widget: {
    languageToggle: false,
    lockScreen: false,
    themeToggle: false,
  },
  tabbar: {
    enable: false,
  },
  sidebar: {
    bottomCustomHeight: 40,
  },
});
