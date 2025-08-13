import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'AiHealing',
    path: '/ai-healing',
    component: () => import('#/views/ai-healing/index.vue'),
    meta: {
      icon: 'tabler:ai',
      order: 3,
      title: '心之旅疗愈室',
    },
  },
];

export default routes;
