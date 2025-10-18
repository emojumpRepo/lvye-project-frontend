import type { QuestionnaireAnswerDataVO } from '@vben/types';

import type {
  AssessmentResult,
  QuestionnaireTemplate,
  TabItem,
} from '../types';

import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

/**
 * 导出测评答题记录为 Excel
 * @param assessmentResults 测评结果数组
 * @param questionnaireTabs 问卷标签列表，用于指定问卷排序
 * @returns 返回下载链接，失败返回 null
 */
export async function exportAssessmentAnswersToExcel(
  assessmentResults: AssessmentResult[],
  questionnaireTabs?: TabItem[],
): Promise<null | string> {
  try {
    if (!assessmentResults || assessmentResults.length === 0) {
      console.warn('没有数据可导出');
      return null;
    }

    // 步骤1: 收集所有问卷信息并构建问卷模板
    const questionnaireTemplates = collectQuestionnaireTemplates(
      assessmentResults,
      questionnaireTabs,
    );

    // 步骤2: 构建动态表头
    const headers = buildHeaders(questionnaireTemplates);

    // 步骤3: 填充数据行
    const rows = fillDataRows(assessmentResults, questionnaireTemplates);

    // 步骤4: 生成 Excel 文件
    const downloadUrl = generateExcelFile(headers, rows);

    // 下载excel文件到本地
    // const fileName = `答题记录汇总_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
    // downloadFile(downloadUrl, fileName);

    return downloadUrl;
  } catch (error) {
    console.error('导出Excel失败:', error);
    return null;
  }
}

/**
 * 收集所有问卷信息并构建问卷模板
 * 每个问卷取题目数最多的那个作为模板
 */
function collectQuestionnaireTemplates(
  assessmentResults: AssessmentResult[],
  questionnaireTabs?: TabItem[],
): QuestionnaireTemplate[] {
  const questionnaireMap = new Map<number, QuestionnaireTemplate>();

  // 遍历所有学生的所有问卷结果
  for (const result of assessmentResults) {
    for (const qResult of result.questionnaireResults) {
      const existingTemplate = questionnaireMap.get(qResult.questionnaireId);

      // 如果该问卷还没有模板，或者当前问卷的题目数更多，则更新模板
      if (
        !existingTemplate ||
        qResult.answers.length > existingTemplate.answers.length
      ) {
        questionnaireMap.set(qResult.questionnaireId, {
          questionnaireId: qResult.questionnaireId,
          questionnaireName: qResult.questionnaireName,
          answers: qResult.answers,
        });
      }
    }
  }

  // 转换为数组
  const templates = [...questionnaireMap.values()];

  // 如果提供了 questionnaireTabs，按照其顺序排序
  if (questionnaireTabs && questionnaireTabs.length > 0) {
    const tabOrderMap = new Map(
      questionnaireTabs.map((tab, index) => [Number(tab.key), index]),
    );

    return templates.sort((a, b) => {
      const orderA =
        tabOrderMap.get(a.questionnaireId) ?? Number.POSITIVE_INFINITY;
      const orderB =
        tabOrderMap.get(b.questionnaireId) ?? Number.POSITIVE_INFINITY;
      return orderA - orderB;
    });
  }

  // 默认按问卷ID排序（保持顺序一致性）
  return templates;
}

/**
 * 构建动态表头
 * 格式：学生姓名 | 学号 | 班级 | 问卷1名称 | 1.题目1 | 2.题目2 | ... | 总分 | 完成时间 | 问卷2名称 | ...
 */
function buildHeaders(
  questionnaireTemplates: QuestionnaireTemplate[],
): string[] {
  const headers: string[] = ['学生姓名', '学号', '班级'];

  for (const template of questionnaireTemplates) {
    // 问卷名称列
    headers.push(template.questionnaireName);

    // 题目列
    for (const answer of template.answers) {
      headers.push(`${answer.index}.${answer.title}`);
    }

    // 总分和完成时间列
    headers.push('总分', '完成时间');
  }

  return headers;
}

/**
 * 填充数据行
 */
function fillDataRows(
  assessmentResults: AssessmentResult[],
  questionnaireTemplates: QuestionnaireTemplate[],
): any[][] {
  const rows: any[][] = [];

  for (const result of assessmentResults) {
    const row: any[] = [];

    // 基本信息
    row.push(
      result.studentName || '',
      result.studentNo || '',
      result.className || '',
    );

    // 为每个问卷填充数据
    for (const template of questionnaireTemplates) {
      // 查找学生是否完成了该问卷
      const studentQResult = result.questionnaireResults.find(
        (qr) => qr.questionnaireId === template.questionnaireId,
      );

      // 问卷名称列
      row.push(template.questionnaireName);

      if (studentQResult) {
        // 学生完成了该问卷，填充答案
        // 创建答案映射，方便按index查找
        const answerMap = new Map<number, QuestionnaireAnswerDataVO>();
        for (const answer of studentQResult.answers) {
          answerMap.set(answer.index, answer);
        }

        // 按模板题目顺序填充
        for (const templateAnswer of template.answers) {
          const studentAnswer = answerMap.get(templateAnswer.index);
          if (studentAnswer) {
            if (studentAnswer.answer.trim()) {
              // 格式：答案（分数）
              row.push(`${studentAnswer.answer}（${studentAnswer.score}）`);
            } else {
              row.push('未作答/无需作答');
            }
          } else {
            // 该题没有答案
            row.push('');
          }
        }

        // 总分和完成时间
        row.push(
          studentQResult.totalScore || 0,
          studentQResult.completedTime
            ? dayjs(studentQResult.completedTime).format('YYYY-MM-DD HH:mm:ss')
            : '',
        );
      } else {
        // 学生未完成该问卷，所有列留空
        // 题目列 + 总分 + 完成时间列
        const emptyColumns = Array.from(
          { length: template.answers.length + 2 },
          () => '',
        );
        row.push(...emptyColumns);
      }
    }

    rows.push(row);
  }

  return rows;
}

/**
 * 下载文件到本地
 * @param url 文件URL
 * @param fileName 文件名
 */
// function downloadFile(url: string, fileName: string): void {
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = fileName;
//   link.style.display = 'none';
//   document.body.append(link);
//   link.click();
//   link.remove();
//   // 延迟释放 URL 对象，确保下载完成
//   setTimeout(() => {
//     URL.revokeObjectURL(url);
//   }, 100);
// }

/**
 * 生成 Excel 文件并返回下载链接
 */
function generateExcelFile(headers: string[], rows: any[][]): string {
  // 创建工作簿
  const workbook = XLSX.utils.book_new();

  // 合并表头和数据行
  const data = [headers, ...rows];

  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 设置列宽
  const columnWidths = headers.map((header, index) => {
    // 前三列（学生姓名、学号、班级）固定宽度
    if (index < 3) {
      return { wch: 20 };
    }
    // 总分、完成时间列
    if (header === '总分') {
      return { wch: 10 };
    }
    if (header === '完成时间') {
      return { wch: 20 };
    }
    // 题目列（以"数字."开头）
    // if (/^\d+\./.test(header)) {
    //   return { wch: 30 };
    // }
    // 其他列为问卷名称列
    return { wch: 30 };
  });

  worksheet['!cols'] = columnWidths;

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '答题记录汇总');

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
}
