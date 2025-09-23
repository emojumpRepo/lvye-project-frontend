import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'AiHealing',
    path: '/ai-healing',
    component: () => import('#/views/ai-healing/index.vue'),
    meta: {
      icon: 'lucide:heart-handshake',
      order: 3,
      title: '心之旅疗愈室',
      hideInMenu: true,
    },
  },
];

export default routes;
