import { RiskLevelEnum } from '@vben/types'

export interface columnConfig {
  label: string
  prop: string
  compareType: '<=' | '>=' | '='
  threshold: RiskLevelEnum
}

export interface groupConfig {
  groupId: number
  dimensions: string[]
  description?: string
  type: COMMENTS_GROUP_TYPE
}

export interface stepConfig {
  total: number
  dimensions: string[]
  props: string
  position: Record<string, number>
}

// 可视化组件类型
export enum COMPONENTS_TYPE {
  GRID = 'grid',
  TABLE = 'table',
  STEP = 'step',
  Sector = 'sector',
}

// 学生端评论展示模式
export enum SHOW_COMMENT_MODE {
  ALL = 'all',
  ONE = 'one',
  GROUP = 'group',
}

// 评论分组展示规则
export enum COMMENTS_GROUP_TYPE {
  MERGE_MAX = 'merge_max',
}

export interface SECTION_PART {
  title: string
  titleAlign: 'center' | 'left' | 'right'
  prop?: string
  components: COMPONENTS_TYPE[]
  showHeaderExtra: boolean
  showComment: boolean
  showCommentMode: SHOW_COMMENT_MODE
  showModuleGuide: boolean
  showTotalLevel: boolean
  columns?: columnConfig[]
  groups?: groupConfig[]
  steps?: stepConfig
}

export interface RESULT_SECTION {
  showHeader: boolean
  title?: string
  titleAlign?: string
  parts: SECTION_PART[]
  showFooter: boolean
}

export const MODULE_RESULT_PAGE_CONFIG = {
  uni_gym: [
    {
      parts: [
        {
          title: '模块评估报告',
          titleAlign: 'left',
          showHeaderExtra: true,
          showTotalLevel: true,
        },
        {
          title: '总体情况',
          titleAlign: 'left',
          components: [COMPONENTS_TYPE.GRID],
        },
        {
          title: '主要结论',
          showComment: true,
          titleAlign: 'left',
          showCommentMode: SHOW_COMMENT_MODE.ONE,
        },
      ],
    },
  ],
  uni_library: [
    {
      parts: [
        {
          title: '模块评估报告',
          titleAlign: 'left',
          showHeaderExtra: true,
          showTotalLevel: true,
        },
        {
          title: '总体情况',
          titleAlign: 'left',
          components: [COMPONENTS_TYPE.TABLE],
          columns: [
            {
              label: '影响较小',
              prop: 'level1',
              compareType: '<=',
              threshold: RiskLevelEnum.Mild,
            },
            {
              label: '有一定影响',
              prop: 'level2',
              compareType: '>=',
              threshold: RiskLevelEnum.MEDIUM,
            },
          ],
        },
        {
          title: '主要结论',
          showComment: true,
          titleAlign: 'left',
          showCommentMode: SHOW_COMMENT_MODE.GROUP,
          groups: [
            {
              groupId: 1,
              dimensions: ['childhood_trauma'],
            },
            {
              groupId: 2,
              dimensions: ['PTSD_symptoms'],
            },
            {
              groupId: 3,
              dimensions: [
                'total_stress_intensity',
                'punishment_stress_intensity',
                'loss_stress_intensity',
                'interpersonal_stress_intensity',
                'study_pressure_stress_intensity',
                'adapt_stress_intensity',
              ],
              description: '生活事件刺激：人们在日常生活中遇到的各种各样的社会生活的变动，个体应对这些事件时的适应反应就是应激。“生活事件刺激”则是评估个体在这一年内发生的各种生活事件的总应激量水平和自我调节能力，以及这些事件对个体的学习、生活造成的影响。',
            },
          ],
        },
      ],
    },
  ],
  uni_hospital: [
    {
      parts: [
        {
          title: '模块评估报告',
          titleAlign: 'left',
          showHeaderExtra: true,
          showTotalLevel: true,
        },
        {
          title: '主要结论',
          showComment: true,
          titleAlign: 'left',
          showCommentMode: SHOW_COMMENT_MODE.GROUP,
          groups: [
            {
              groupId: 1,
              dimensions: ['self_harming_behavior', 'NSSI'],
            },
            {
              groupId: 2,
              dimensions: ['obsessive_symptoms'],
            },
            {
              groupId: 3,
              dimensions: [
                'suicidal_behavior',
                'suicidal_ideation',
                'suicide_attempt',
              ],
              type: 'merge_max',
            },
          ],
        },
      ],
    },
  ],
  uni_dormitory: [
    {
      parts: [
        {
          title: '模块评估报告',
          titleAlign: 'left',
          showHeaderExtra: true,
          showTotalLevel: true,
        },
        {
          title: '总体情况',
          titleAlign: 'left',
          components: [COMPONENTS_TYPE.TABLE, COMPONENTS_TYPE.STEP],
          columns: [
            {
              label: '状态良好',
              prop: 'level1',
              compareType: '<=',
              threshold: RiskLevelEnum.Mild,
            },
            {
              label: '存在一定困扰',
              prop: 'level2',
              compareType: '>=',
              threshold: RiskLevelEnum.MEDIUM,
            },
          ],
          steps: {
            total: 5,
            dimensions: ['circadian_rhythm_types'],
            props: 'level',
            position: {
              绝对夜晚型: 1,
              中度夜晚型: 2,
              中间型: 3,
              中度清晨型: 4,
              绝对清晨型: 5,
            },
          },
        },
        {
          title: '主要结论',
          showComment: true,
          titleAlign: 'left',
          showCommentMode: SHOW_COMMENT_MODE.ALL,
        },
      ],
    },
  ],
  uni_teaching: [
    {
      parts: [
        {
          title: '模块评估报告',
          titleAlign: 'left',
          showHeaderExtra: true,
          showTotalLevel: true,
        },
        {
          title: '总体情况',
          titleAlign: 'left',
          components: [COMPONENTS_TYPE.TABLE],
          columns: [
            {
              label: '基本无成瘾困扰',
              prop: 'level1',
              compareType: '<=',
              threshold: RiskLevelEnum.Mild,
            },
            {
              label: '有一定成瘾困扰',
              prop: 'level2',
              compareType: '>=',
              threshold: RiskLevelEnum.MEDIUM,
            },
          ],
        },
        {
          title: '主要结论',
          showComment: true,
          titleAlign: 'left',
          showCommentMode: SHOW_COMMENT_MODE.ALL,
        },
      ],
    },
  ],
}

// 测评场景最终结果页配置
export const ASSESSMENT_RESULT_PAGE_CONFIG = {
  university_MTUI: [
    {
      showFooter: true,
      parts: [
        {
          title: 'MindTrip身心健康风险评估',
          titleAlign: 'center',
          showTotalLevel: true,
          components: [COMPONENTS_TYPE.Sector],
        },
        {
          title: '主要结论',
          titleAlign: 'left',
          showComment: true,
          prop: 'studentComment',
        },
        {
          title: '小贴士',
          showComment: true,
          titleAlign: 'left',
          prop: 'studentSuggestions',
        },
        {
          title: '模块评估报告',
          showModuleGuide: true,
          titleAlign: 'left',
        },
      ],
    },
  ],
}

// 场景插槽模块结果页配置
// export const MODULE_RESULT_PAGE_CONFIG = {
//   uni_gym: {
//     components: [COMPONENTS_TYPE.GRID],
//     showCommentMode: SHOW_COMMENT_MODE.ONE,
//   },
//   uni_library: {
//     components: [COMPONENTS_TYPE.TABLE],
//     showCommentMode: SHOW_COMMENT_MODE.GROUP,
//     columns: [
//       {
//         label: '影响较小',
//         prop: 'level1',
//         compareType: '<=',
//         threshold: RiskLevelEnum.Mild,
//       },
//       {
//         label: '有一定影响',
//         prop: 'level2',
//         compareType: '>=',
//         threshold: RiskLevelEnum.MEDIUM,
//       },
//     ],
//     groups: [
//       {
//         groupId: 1,
//         dimensions: ['childhood_trauma'],
//       },
//       {
//         groupId: 2,
//         dimensions: ['PTSD_symptoms'],
//       },
//       {
//         groupId: 3,
//         dimensions: [
//           'total_stress_intensity',
//           'punishment_stress_intensity',
//           'loss_stress_intensity',
//           'interpersonal_stress_intensity',
//           'study_pressure_stress_intensity',
//           'adapt_stress_intensity',
//         ],
//         description: '生活事件刺激：人们在日常生活中遇到的各种各样的社会生活的变动，个体应对这些事件时的适应反应就是应激。“生活事件刺激”则是评估个体在这一年内发生的各种生活事件的总应激量水平和自我调节能力，以及这些事件对个体的学习、生活造成的影响。',
//       },
//     ],
//   },
//   uni_hospital: {
//     components: [],
//     showCommentMode: SHOW_COMMENT_MODE.GROUP,
//     groups: [
//       {
//         groupId: 1,
//         dimensions: ['self_harming_behavior', 'NSSI'],
//       },
//       {
//         groupId: 2,
//         dimensions: ['obsessive_symptoms'],
//       },
//       {
//         groupId: 3,
//         dimensions: [
//           'suicidal_behavior',
//           'suicidal_ideation',
//           'suicide_attempt',
//         ],
//         type: 'merge_max',
//       },
//     ],
//   },
//   uni_dormitory: {
//     components: [COMPONENTS_TYPE.TABLE, COMPONENTS_TYPE.STEP],
//     showCommentMode: SHOW_COMMENT_MODE.ALL,
//     columns: [
//       {
//         label: '状态良好',
//         prop: 'level1',
//         compareType: '<=',
//         threshold: RiskLevelEnum.Mild,
//       },
//       {
//         label: '存在一定困扰',
//         prop: 'level2',
//         compareType: '>=',
//         threshold: RiskLevelEnum.MEDIUM,
//       },
//     ],
//     steps: {
//       total: 5,
//       dimensions: ['circadian_rhythm_types'],
//       props: 'level',
//       position: {
//         绝对夜晚型: 1,
//         中度夜晚型: 2,
//         中间型: 3,
//         中度清晨型: 4,
//         绝对清晨型: 5,
//       },
//     },
//   },
//   uni_teaching: {
//     components: [COMPONENTS_TYPE.TABLE],
//     showCommentMode: SHOW_COMMENT_MODE.ALL,
//     columns: [
//       {
//         label: '基本无成瘾困扰',
//         prop: 'level1',
//         compareType: '<=',
//         threshold: RiskLevelEnum.Mild,
//       },
//       {
//         label: '有一定成瘾困扰',
//         prop: 'level2',
//         compareType: '>=',
//         threshold: RiskLevelEnum.MEDIUM,
//       },
//     ],
//   },
// }
