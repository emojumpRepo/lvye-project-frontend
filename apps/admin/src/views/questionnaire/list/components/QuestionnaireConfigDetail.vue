<script setup lang="ts">
import type { QuestionnaireConfigVO } from '#/api/psychology/questionnaire/index';

import { computed } from 'vue';

import { Modal, Tag } from 'ant-design-vue';

import { parseCalculateFormula } from '../utils/formula-parser';

interface Props {
  config: null | QuestionnaireConfigVO;
}

const props = defineProps<Props>();

const open = defineModel<boolean>('open');

// 解析计算公式
const formulaInfo = computed(() => {
  if (!props.config?.calculateFormula || !props.config?.calculateType) {
    return null;
  }
  return parseCalculateFormula(
    props.config.calculateFormula,
    props.config.calculateType,
  );
});

// 格式化题目索引显示
const formattedQuestionIndex = computed(() => {
  if (!props.config?.questionIndex) return '无';

  if (props.config.questionIndex === 'all') {
    return '全部题目';
  }

  return props.config.questionIndex
    .split(',')
    .map((item: string) => `第${item}题`)
    .join('、');
});

// 获取计算类型标签
const calculateTypeLabel = computed(() => {
  const typeMap = {
    1: '分数区间',
    2: '年龄性别与分数区间',
    3: '最多选择',
  };
  return typeMap[props.config?.calculateType as keyof typeof typeMap] || '未知';
});

// 获取异常状态标签
const abnormalLabel = computed(() => {
  return props.config?.isAbnormal ? '异常' : '正常';
});

const abnormalColor = computed(() => {
  return props.config?.isAbnormal ? 'red' : 'green';
});
</script>

<template>
  <Modal
    :open="open"
    title="评分规则详情"
    width="600px"
    :footer="null"
    @update:open="(v: boolean) => (open = v)"
  >
    <div v-if="config" class="config-detail">
      <!-- 基本信息 -->
      <div class="section">
        <h3 class="section-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item col-span-1">
            <span class="label">维度名称：</span>
            <span class="value">{{ config.dimensionName }}</span>
          </div>
          <div class="info-item col-span-1">
            <span class="label">状态：</span>
            <Tag :color="abnormalColor">{{ abnormalLabel }}</Tag>
          </div>
          <div class="info-item col-span-1">
            <span class="label">计算类型：</span>
            <span class="value">{{ calculateTypeLabel }}</span>
          </div>
          <div class="info-item col-span-1">
            <span class="label">题目索引：</span>
            <span class="value">{{ formattedQuestionIndex }}</span>
          </div>
        </div>
      </div>

      <!-- 计算公式详情 -->
      <div v-if="formulaInfo" class="section">
        <h3 class="section-title">计算公式详情</h3>
        <div class="formula-info">
          <div class="formula-type">
            <span class="label">类型：</span>
            <span class="value">{{ formulaInfo.type }}</span>
          </div>
          <div class="formula-description">
            <span class="label">说明：</span>
            <span class="value">{{ formulaInfo.description }}</span>
          </div>

          <!-- 分数区间详情 -->
          <div v-if="formulaInfo.type === '分数区间'" class="formula-detail">
            <div class="detail-item">
              <span class="label">最低分数：</span>
              <span class="value">{{ formulaInfo.config.minScore }} 分</span>
            </div>
            <div class="detail-item">
              <span class="label">最高分数：</span>
              <span class="value">{{ formulaInfo.config.maxScore }} 分</span>
            </div>
          </div>

          <!-- 最多选择详情 -->
          <div v-if="formulaInfo.type === '最多选择'" class="formula-detail">
            <div class="detail-item">
              <span class="label">分数值：</span>
              <span class="value">
                {{ formulaInfo.config.questionScore }} 分
              </span>
            </div>
            <div class="detail-item">
              <span class="label">次数阈值：</span>
              <span class="value">{{ formulaInfo.config.chooseCount }} 次</span>
            </div>
          </div>

          <!-- 年龄性别与分数区间详情 -->
          <div
            v-if="formulaInfo.type === '年龄性别与分数区间'"
            class="formula-detail"
          >
            <div class="rules-list">
              <div
                v-for="(rule, index) in formulaInfo.config.rules"
                :key="index"
                class="rule-item"
              >
                <div class="rule-header">
                  <span class="rule-title">区间 {{ index + 1 }}</span>
                  <Tag :color="rule.sex === '男生' ? 'blue' : 'pink'">
                    {{ rule.sex }}
                  </Tag>
                </div>
                <div class="rule-content">
                  <div class="rule-detail">
                    <span class="label">年龄范围：</span>
                    <span class="value">{{ rule.ageRange }}</span>
                  </div>
                  <div class="rule-detail">
                    <span class="label">分数范围：</span>
                    <span class="value">{{ rule.scoreRange }}</span>
                  </div>
                  <div class="rule-detail">
                    <span class="label">说明：</span>
                    <span class="value">
                      年龄在
                      <span class="text-primary">{{ rule.ageRange }}</span>
                      ，性别为
                      <span class="text-primary">{{ rule.sex }}</span>
                      的用户，问卷分数在
                      <span class="text-primary">{{ rule.scoreRange }}</span>
                      分，会应用此评分规则
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评语信息 -->
      <div class="section">
        <h3 class="section-title">评语信息</h3>
        <div class="comment-info">
          <div class="comment-item">
            <span class="label">教师端评语：</span>
            <div class="comment-content">
              {{ config.teacherComment || '无' }}
            </div>
          </div>
          <div class="comment-item">
            <span class="label">学生端评语：</span>
            <div class="comment-content">
              {{ config.studentComment || '无' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暂无配置信息</p>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.config-detail {
  .section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      padding-bottom: 8px;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 12px;

    .info-item {
      display: flex;
      gap: 8px;
      align-items: center;

      .label {
        min-width: 70px;
        font-size: 14px;
        color: #6b7280;
      }

      .value {
        font-weight: 500;
        color: #1f2937;
      }
    }
  }

  .formula-info {
    .formula-type,
    .formula-description {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-bottom: 12px;

      .label {
        flex-shrink: 0;
        min-width: 60px;
        font-size: 14px;
        color: #6b7280;
      }

      .value {
        font-weight: 500;
        color: #1f2937;
      }
    }

    .formula-detail {
      padding: 12px;
      margin-top: 12px;
      background: #f9fafb;
      border-radius: 8px;

      .detail-item {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          min-width: 80px;
          font-size: 14px;
          color: #6b7280;
        }

        .value {
          font-weight: 500;
          color: #1f2937;
        }
      }
    }

    .rules-list {
      .rule-item {
        padding: 12px;
        margin-bottom: 12px;
        background: #f9fafb;
        border-radius: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .rule-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;

          .rule-title {
            font-weight: 600;
            color: #1f2937;
          }
        }

        .rule-content {
          .rule-detail {
            display: flex;
            gap: 8px;
            margin-bottom: 4px;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              min-width: 50px;
              font-size: 14px;
              color: #6b7280;
            }

            .value {
              font-weight: 500;
              color: #1f2937;
            }
          }
        }
      }
    }
  }

  .comment-info {
    .comment-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        display: block;
        margin-bottom: 4px;
        font-size: 14px;
        color: #6b7280;
      }

      .comment-content {
        min-height: 20px;
        padding: 12px;
        line-height: 1.5;
        color: #1f2937;
        white-space: pre-wrap;
        background: #f9fafb;
        border-radius: 6px;
      }
    }
  }
}

.empty-state {
  padding: 40px 0;
  color: #9ca3af;
  text-align: center;
}
</style>
