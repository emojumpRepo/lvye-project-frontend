import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Evaluation',
    path: '/evaluation',
    component: () => import('#/views/evaluation/index.vue'),
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
        name: 'EvaluationScene',
        path: 'scene',
        meta: {
          title: '测评场景',
        },
        component: () => import('#/views/evaluation/scene.vue'),
      },
      {
        name: 'EvaluationQuestionnaire',
        path: 'questionnaire',
        component: () => import('#/views/evaluation/questionnaire.vue'),
      },
      {
        name: 'EvaluationAssessment',
        path: 'assessment/:id',
        component: () => import('#/views/evaluation/assessment.vue'),
        meta: {
          title: '测评详情',
        },
      },
    ],
  },
];

export default routes;
