import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Evaluation',
    path: '/evaluation/junior',
    component: () => import('#/views/evaluation/junior/index.vue'),
    meta: {
      icon: 'lucide:map',
      order: 1,
      title: '测评',
      hideInMenu: true,
      openInNewWindow: true,
      noBasicLayout: true,
    },
    children: [
      {
        name: 'EvaluationJuniorMap',
        path: 'map',
        component: () => import('#/views/evaluation/junior/map/index.vue'),
      },
      {
        name: 'EvaluationJuniorQuestionnaire',
        path: 'questionnaire',
        component: () =>
          import('#/views/evaluation/junior/questionnaire/index.vue'),
      },
    ],
  },
];

export default routes;
