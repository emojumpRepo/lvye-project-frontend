import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Home',
    path: '/home',
    component: () => import('#/views/home/index.vue'),
    meta: {
      icon: 'lucide:home',
      order: 1,
      title: '首页',
    },
  },
];

export default routes;
