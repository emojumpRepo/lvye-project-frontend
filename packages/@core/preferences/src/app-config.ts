import type { Preferences } from './types';

// 应用配置接口
interface AppConfig {
  defaultHomePath: string;
  logo?: string;
  name: string;
  theme?: {
    mode?: 'dark' | 'light';
    primaryColor?: string;
  };
}

// 不同应用的配置映射
const appConfigs: Record<string, AppConfig> = {
  admin: {
    name: 'Admin管理后台',
    defaultHomePath: '/analytics',
    logo: 'https://6d65-mentor-3gyob3y3bdbc2bdb-1305613707.tcb.qcloud.la/lvye/logo.png',
    theme: {
      primaryColor: 'hsl(144 57% 58%)',
      mode: 'dark',
    },
  },
  web: {
    name: 'Web前台',
    defaultHomePath: '/home',
    logo: 'https://6d65-mentor-3gyob3y3bdbc2bdb-1305613707.tcb.qcloud.la/lvye/logo.png',
    theme: {
      primaryColor: 'hsl(144 57% 58%)',
      mode: 'light',
    },
  }
};

// 获取当前应用类型
export function getCurrentAppType(): string {
  return import.meta.env.VITE_APP_TYPE || 'admin';
}

// 获取当前应用配置
export function getCurrentAppConfig(): AppConfig {
  const appType = getCurrentAppType();
  return (appConfigs[appType] as AppConfig) || appConfigs.admin;
}

// 根据应用类型生成偏好设置
export function createAppPreferences(): Preferences {
  const appConfig = getCurrentAppConfig();

  return {
    app: {
      accessMode: 'frontend',
      authPageLayout: 'panel-right',
      checkUpdatesInterval: 1,
      colorGrayMode: false,
      colorWeakMode: false,
      compact: false,
      contentCompact: 'wide',
      contentCompactWidth: 1200,
      contentPadding: 0,
      contentPaddingBottom: 0,
      contentPaddingLeft: 0,
      contentPaddingRight: 0,
      contentPaddingTop: 0,
      defaultAvatar:
        'https://unpkg.com/@vbenjs/static-source@0.1.7/source/avatar-v1.webp',
      defaultHomePath: appConfig.defaultHomePath,
      dynamicTitle: true,
      enableCheckUpdates: true,
      enablePreferences: true,
      enableRefreshToken: false,
      isMobile: false,
      layout: 'sidebar-nav',
      locale: 'zh-CN',
      loginExpiredMode: 'page',
      name: appConfig.name,
      preferencesButtonPosition: 'auto',
      watermark: false,
      zIndex: 200,
    },
    breadcrumb: {
      enable: true,
      hideOnlyOne: false,
      showHome: false,
      showIcon: true,
      styleType: 'normal',
    },
    copyright: {
      companyName: 'Vben',
      companySiteLink: 'https://www.vben.pro',
      date: '2024',
      enable: true,
      icp: '',
      icpLink: '',
      settingShow: true,
    },
    footer: {
      enable: false,
      fixed: false,
      height: 32,
    },
    header: {
      enable: true,
      height: 50,
      hidden: false,
      menuAlign: 'start',
      mode: 'fixed',
    },
    logo: {
      enable: true,
      fit: 'contain',
      source:
        appConfig.logo ||
        'https://6d65-mentor-3gyob3y3bdbc2bdb-1305613707.tcb.qcloud.la/static/logo/lvye_logo.png',
    },
    navigation: {
      accordion: true,
      split: true,
      styleType: 'rounded',
    },
    shortcutKeys: {
      enable: true,
      globalLockScreen: true,
      globalLogout: true,
      globalPreferences: true,
      globalSearch: true,
    },
    sidebar: {
      autoActivateChild: false,
      bottomCustomHeight: 0,
      collapsed: false,
      collapsedButton: true,
      collapsedShowTitle: false,
      collapseWidth: 60,
      neverCollapse: false,
      enable: true,
      expandOnHover: true,
      extraCollapse: false,
      extraCollapsedWidth: 60,
      fixedButton: true,
      hidden: false,
      middleCustomHeight: 0,
      mixedWidth: 80,
      topCustomHeight: 0,
      width: 224,
    },
    tabbar: {
      draggable: true,
      enable: true,
      height: 38,
      keepAlive: true,
      maxCount: 0,
      middleClickToClose: false,
      persist: true,
      showIcon: true,
      showMaximize: true,
      showMore: true,
      styleType: 'chrome',
      wheelable: true,
    },
    theme: {
      builtinType: 'default',
      colorDestructive: 'hsl(348 100% 61%)',
      colorPrimary: appConfig.theme?.primaryColor || 'hsl(212 100% 45%)',
      colorSuccess: 'hsl(144 57% 58%)',
      colorWarning: 'hsl(42 84% 61%)',
      mode: appConfig.theme?.mode || 'dark',
      radius: '0.5',
      semiDarkHeader: false,
      semiDarkSidebar: false,
    },
    transition: {
      enable: true,
      loading: true,
      name: 'fade-slide',
      progress: true,
    },
    widget: {
      fullscreen: true,
      globalSearch: true,
      languageToggle: true,
      lockScreen: true,
      notification: true,
      refresh: true,
      sidebarToggle: true,
      themeToggle: true,
    },
  };
}
