import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Mindfulness',
    path: '/mindfulness',
    component: () => import('#/views/mindfulness/index.vue'),
    meta: {
      icon: 'lucide:headphones',
      order: 2,
      title: '正念冥想',
    },
  },
];

export default routes;
