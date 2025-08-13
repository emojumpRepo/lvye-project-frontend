import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/assessment',
    component: () => import('#/views/assessment/index.vue'),
    name: 'Assessment',
    meta: {
      title: '测评',
      icon: 'carbon:checkbox-checked',
      hideInMenu: false,
    },
    children: [
      {
        path: '/assessment/questionnaire',
        component: () => import('#/views/assessment/questionnaire/index.vue'),
        name: 'AssessmentQuestionnaire',
        meta: {
          title: '问卷详情',
          icon: 'lucide:file-text',
          hideInMenu: false,
        },
      },
      {
        path: '/assessment/assessment-manage',
        component: () =>
          import('#/views/assessment/assessment-manage/index.vue'),
        name: 'AssessmentManage',
        meta: {
          title: '测评管理',
          icon: 'lucide:file-text',
          hideInMenu: false,
        },
      },
    ],
  },
];

export default routes;
