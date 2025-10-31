import type { TabItem } from '../types';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { getDictLabel } from '#/utils';

/**
 * 将测评任务中选中的学生问卷结果导出为 Excel
 * @param params 导出参数
 * @param params.data 学生问卷结果数据（来自测评任务列表勾选项）
 * @param params.activeTab 包含当前选项信息
 * @param params.activeTab.key 选项键，用于区分是否为具体问卷
 * @param params.activeTab.label 选项名称，作为问卷名称展示
 * @param params.questionnaireTabs 问卷标签列表
 * @returns 返回下载链接，如果失败返回 null
 */
export async function exportCompletedToXLSX(params: {
  activeTab: { key: string; label: string };
  data: any[];
  questionnaireTabs: TabItem[];
}): Promise<null | string> {
  const { data, activeTab, questionnaireTabs } = params;
  try {
    const formattedData = data.map((item) => {
      const rowData: Record<string, any> = {
        测评任务编号: item.taskNo || '--',
      };

      if (activeTab.key) {
        rowData['问卷名称'] = activeTab.label || '--';
      }

      Object.assign(rowData, {
        学生姓名: item.name || '--',
        学号: item.studentNo || '--',
        班级: item.className || '--',
        完成状态: item.status === 1 ? '已完成' : '未完成',
      });

      if (activeTab.key) {
        const isHealthAssessment =
          item.questionnaireName &&
          item.questionnaireName.includes('心理健康评估');

        if (isHealthAssessment) {
          rowData['测评结果'] = item.riskLevel
            ? getDictLabel('questionnaire_result_risk_level', item.riskLevel)
            : '--';
        } else {
          rowData['测评结果'] = item.level || '--';
        }
      } else {
        rowData['总评风险'] = item.riskLevel
          ? getDictLabel('questionnaire_result_risk_level', item.riskLevel)
          : '--';
      }

      rowData['完成时间'] = item.finishTime
        ? dayjs(item.finishTime).format('YYYY-MM-DD HH:mm:ss')
        : '--';

      // 动态添加问卷及其维度列
      questionnaireTabs
        .filter((tab) => tab.key)
        .forEach((tab) => {
          const qResult = item.questionnaireResults?.find(
            (q: any) => q.questionnaireId === Number(tab.key),
          );
          // 如果问卷没有维度，则跳过
          if (!qResult?.dimensions || qResult.dimensions.length === 0) {
            return;
          }
          // 如果 activeTab.key 为空，添加问卷名称列
          if (!activeTab.key) {
            rowData[tab.label] = qResult?.questionnaireName || '';
          }
          // 添加维度列
          qResult.dimensions.forEach((dim: any) => {
            rowData[dim.name] =
              dim.level && dim.score !== undefined
                ? `${dim.level}（${dim.score}）`
                : '';
          });
        });

      return rowData;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 构建基础列宽
    const colWidths = activeTab.key
      ? [
          { wch: 30 }, // 测评任务编号
          { wch: 30 }, // 问卷名称
          { wch: 15 }, // 学生姓名
          { wch: 30 }, // 学号
          { wch: 20 }, // 班级
          { wch: 20 }, // 完成状态
          { wch: 30 }, // 测评结果
          { wch: 35 }, // 完成时间
        ]
      : [
          { wch: 30 }, // 测评任务编号
          { wch: 15 }, // 学生姓名
          { wch: 30 }, // 学号
          { wch: 20 }, // 班级
          { wch: 20 }, // 完成状态
          { wch: 30 }, // 总评风险
          { wch: 35 }, // 完成时间
        ];

    // 添加动态列宽（问卷及维度列）
    questionnaireTabs
      .filter((tab) => tab.key)
      .forEach((tab) => {
        // 维度列（从第一条数据获取维度数量）
        const sampleResult = data[0]?.questionnaireResults?.find(
          (q: any) => q.questionnaireId === Number(tab.key),
        );
        // 如果问卷没有维度，则跳过
        if (!sampleResult?.dimensions || sampleResult.dimensions.length === 0) {
          return;
        }
        // 如果 activeTab.key 为空，添加问卷名称列宽
        if (!activeTab.key) {
          colWidths.push({ wch: 30 });
        }
        sampleResult.dimensions.forEach(() => {
          colWidths.push({ wch: 20 });
        });
      });

    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, '测评结果汇总');

    // 生成 Blob
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // 创建下载链接
    const downloadUrl = URL.createObjectURL(blob);

    return downloadUrl;
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败，请重试');
    return null;
  }
}
