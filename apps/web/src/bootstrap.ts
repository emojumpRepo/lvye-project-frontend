import { createApp, watchEffect } from 'vue';
import VueDOMPurifyHTML from 'vue-dompurify-html';

import { registerAccessDirective } from '@vben/access';
import { registerLoadingDirective } from '@vben/common-ui/es/loading';
import { preferences } from '@vben/preferences';
import { initStores } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/antd';

import { useTitle } from '@vueuse/core';

import { $t, setupI18n } from '#/locales';
import { setupFormCreate } from '#/plugins/form-create';

import { initComponentAdapter } from './adapter/component';
import { initSetupVbenForm } from './adapter/form';
import App from './app.vue';
import { router } from './router';
import versionInfo from '../../../version.json';

async function bootstrap(namespace: string) {
  // 显示 Mindtrip 版本信息
  const version = versionInfo.version || import.meta.env.VITE_APP_VERSION || '0.0.5';
  
  // 获取北京时间的构建时间
  const getBuildTime = () => {
    // 优先使用 version.json 中的构建时间
    if (versionInfo.buildTime) {
      // 如果只有日期没有时间，添加默认时间 00:00
      if (versionInfo.buildTime.length === 10) {
        return `${versionInfo.buildTime} 00:00`;
      }
      return versionInfo.buildTime;
    }
    // 否则使用当前北京时间
    return new Date().toLocaleString('zh-CN', { 
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };
  const buildTime = getBuildTime();
  
  console.log(
    `%c╔════════════════════════════════════════╗
║  MINDTRIP WEB PORTAL v${version.padEnd(16, ' ')}║
╚════════════════════════════════════════╝
%c构建时间: ${buildTime}
状态: 系统已初始化 ✓`,
    'color: #64748b; font-family: monospace; font-size: 12px; line-height: 1.2',
    'color: #94a3b8; font-size: 11px'
  );

  // 初始化组件适配器
  await initComponentAdapter();

  // 初始化表单组件
  await initSetupVbenForm();

  // // 设置弹窗的默认配置
  // setDefaultModalProps({
  //   fullscreenButton: false,
  // });
  // // 设置抽屉的默认配置
  // setDefaultDrawerProps({
  //   zIndex: 1020,
  // });

  const app = createApp(App);

  // 注册v-loading指令
  registerLoadingDirective(app, {
    loading: 'loading', // 在这里可以自定义指令名称，也可以明确提供false表示不注册这个指令
    spinning: 'spinning',
  });

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-store
  await initStores(app, { namespace });

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化 tippy
  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);

  // 配置路由及路由守卫
  app.use(router);

  // formCreate
  setupFormCreate(app);

  // vue-dompurify-html
  // TODO @dhb52：VueDOMPurifyHTML 是不是不用引入哈？
  app.use(VueDOMPurifyHTML);

  // 配置Motion插件
  const { MotionPlugin } = await import('@vben/plugins/motion');
  app.use(MotionPlugin);

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
