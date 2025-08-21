import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/assessment',
    name: 'Assessment',
    meta: {
      title: '测评中心',
      icon: 'carbon:checkbox-checked',
      activePath: '/assessment/list',
      keepAlive: false,
      hideInMenu: true,
    },
    children: [
      {
        path: '/assessment/list',
        component: () => import('#/views/assessment/list/index.vue'),
        name: 'AssessmentManage',
        meta: {
          title: '测评管理',
          icon: 'lucide:file-text',
          hideInMenu: true,
        },
      },
      {
        path: '/assessment/detail/:taskNo',
        component: () => import('#/views/assessment/detail/index.vue'),
        name: 'AssessmentDetail',
        meta: {
          title: '测评详情',
          icon: 'lucide:file-text',
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
