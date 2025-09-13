export type RiskLevel = 'concern' | 'critical' | 'none' | 'observe' | 'severe';

interface RiskOption {
  desc: string;
  dot: string;
  key: RiskLevel;
  title: string;
}

export const riskOptions: RiskOption[] = [
  {
    key: 'observe',
    title: '持续观察',
    desc: '需要持续观察和检测',
    dot: '#1966FF',
  },
  {
    key: 'concern',
    title: '一般关注（一类）',
    desc: '需要适当关注和指导',
    dot: '#F6EA05',
  },
  {
    key: 'severe',
    title: '严重风险（二类）',
    desc: '需要定期咨询和跟踪',
    dot: '#FF9C05',
  },
  {
    key: 'critical',
    title: '重大风险（三类）',
    desc: '需要立即干预或密切关注',
    dot: '#FF0831',
  },
];

export interface CoreAssessmentType {
  issues: string[];
  recommendations: string;
  riskLevel: '' | RiskLevel;
}

export interface DetailedAssessmentType {
  report?: string;
  file?: File;
}
