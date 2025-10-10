// Polyfill for Chrome 86 compatibility
import 'core-js/actual/array/at';

import { initPreferences } from '@vben/preferences';
import { unmountGlobalLoading } from '@vben/utils';

import { overridesPreferences } from './preferences';

// 检查更新
import { h } from 'vue';

import { Button, notification } from 'ant-design-vue';
import { createVersionPolling } from 'version-polling';

createVersionPolling({
  silent: import.meta.env.MODE === 'development', // 开发环境下不检测
  onUpdate: (self) => {
    const key = `open${Date.now()}`;
    notification.info({
      message: '提示',
      description: '检测到网页有更新, 是否刷新页面加载最新版本？',
      btn: () =>
        h(
          Button,
          {
            type: 'primary',
            size: 'small',
            onClick: () => {
              notification.close(key);
              self.onRefresh();
            },
          },
          { default: () => '刷新' },
        ),
      key,
      duration: null,
      placement: 'bottomRight',
    });
  },
});

/**
 * 应用初始化完成之后再进行页面加载渲染
 */
async function initApplication() {
  // name用于指定项目唯一标识
  // 用于区分不同项目的偏好设置以及存储数据的key前缀以及其他一些需要隔离的数据
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  // app偏好设置初始化
  await initPreferences({
    namespace,
    overrides: overridesPreferences,
  });

  // 启动应用并挂载
  // vue应用主要逻辑及视图
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  // 移除并销毁loading
  unmountGlobalLoading();
}

initApplication();
