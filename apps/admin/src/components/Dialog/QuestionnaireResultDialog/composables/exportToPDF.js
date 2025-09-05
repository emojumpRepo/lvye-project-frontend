import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import pdfMake from 'pdfmake/build/pdfmake';

import * as vfs_fonts from '../../../../static/fonts/vfs_fonts';

const fonts = {
  AlibabaPuHuiTi: {
    bold: 'Alibaba-PuHuiTi-Medium.ttf',
    normal: 'Alibaba-PuHuiTi-Regular.ttf',
  },
};

pdfMake.vfs = vfs_fonts;
pdfMake.fonts = fonts;

/**
 * 导出问卷报告和答题记录为 PDF
 * @param {object} params 参数对象
 * @param {Array<any>} params.questionnaireResult 问卷结果数据
 * @param {Array<any>} params.questionnaireAnswer 答题记录数据
 * @param {string|number|Date} params.completedTime 完成时间
 * @param {string} params.studentName 学生姓名
 * @param {string} params.questionnaireName 问卷名称
 */
export async function exportQuestionnaireReportToPDF({
  questionnaireResult,
  questionnaireAnswer,
  completedTime,
  studentName,
  questionnaireName,
}) {
  try {
    // 格式化完成时间
    const completedTimeStr = dayjs(completedTime).format(
      'YYYY年MM月DD日 HH:mm:ss',
    );

    // 生成文件名
    // const defaultFilename = `${questionnaireName}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
    const finalFilename = `${questionnaireName}_${studentName}.pdf`;

    // 定义文档内容
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: 'AlibabaPuHuiTi',
        fontSize: 12,
        lineHeight: 1.5,
      },
      content: [
        // 问卷标题
        {
          text: `${questionnaireName}报告`,
          style: 'header',
        },
        // 问卷信息
        {
          text: `作答人：${studentName || '未知'}    完成时间：${completedTimeStr}`,
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        // 维度分析结果
        {
          text: '一、维度分析结果',
          style: 'subheader',
          margin: [0, 0, 0, 10],
        },
        ...generateDimensionResults(questionnaireResult),

        // 答题记录
        {
          text: '二、详细答题记录',
          style: 'subheader',
          margin: [0, 0, 0, 10],
          pageBreak: 'before',
        },
        ...generateAnswerRecords(questionnaireAnswer),
      ],
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          alignment: 'center',
        },
        subheader: {
          fontSize: 16,
          bold: true,
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
          fillColor: '#f0f0f0',
          alignment: 'center',
        },
        tableCell: {
          fontSize: 12,
          alignment: 'center',
        },
        questionText: {
          fontSize: 12,
          bold: true,
          margin: [0, 5, 0, 5],
          lineHeight: 1.4,
        },
        answerText: {
          fontSize: 11,
          margin: [20, 2, 0, 2],
        },
        scoreText: {
          fontSize: 11,
          color: '#1966FF',
          bold: true,
        },
        dimensionHeader: {
          fontSize: 14,
          bold: true,
          color: '#1966FF',
          margin: [0, 5, 0, 5],
        },
        dimensionContent: {
          fontSize: 12,
          margin: [0, 5, 0, 15],
        },
        dimensionStatus: {
          fontSize: 12,
          color: '#666',
          margin: [0, 7, 0, 5],
        },
      },
      footer(currentPage, pageCount) {
        return {
          text: `第 ${currentPage} 页，共 ${pageCount} 页`,
          alignment: 'center',
          fontSize: 10,
          margin: [0, 10, 0, 0],
        };
      },
    };

    // 生成 PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);

    // 下载文件
    pdfDoc.download(finalFilename);

    message.success('PDF 导出成功');
  } catch (error) {
    console.error('PDF 导出失败:', error);
    message.error('PDF 导出失败，请重试');
    throw error;
  }
}

/**
 * 生成维度分析结果内容
 */
function generateDimensionResults(questionnaireResult) {
  if (!questionnaireResult || questionnaireResult.length === 0) {
    return [
      {
        text: '暂无维度分析数据',
        italic: true,
        color: '#666',
        margin: [0, 0, 0, 20],
      },
    ];
  }

  const content = [];

  questionnaireResult.forEach((dimension) => {
    // 创建包含维度信息和状态的表格行
    const dimensionRow = [];

    // 左侧：维度名称和分数
    dimensionRow.push({
      text: `${dimension.dimensionName || '未知维度'}（${dimension.score || 0}分）`,
      style: 'dimensionHeader',
    });

    // 右侧：状态信息
    if (dimension.isAbnormal === 0 || dimension.isAbnormal === 1) {
      dimensionRow.push({
        text: `状态：${dimension.isAbnormal === 1 ? '异常' : '正常'}`,
        style: 'dimensionStatus',
        alignment: 'right',
      });
    } else {
      dimensionRow.push({ text: '', alignment: 'right' });
    }

    content.push({
      table: {
        widths: ['*', 'auto'],
        body: [dimensionRow],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 5],
    });

    if (dimension.studentComment) {
      content.push(
        {
          text: `(1) 学生自评`,
          style: {
            fontSize: 12,
            bold: true,
          },
        },
        {
          text: `${dimension.studentComment}`,
          style: 'dimensionContent',
        },
      );
    }

    if (dimension.teacherComment) {
      content.push(
        {
          text: `(2) 教师评价`,
          style: {
            fontSize: 12,
            bold: true,
          },
        },
        {
          text: `${dimension.teacherComment}`,
          style: 'dimensionContent',
        },
      );
    }

    content.push({
      text: '',
      margin: [0, 0, 0, 10],
    });
  });

  return content;
}

/**
 * 生成答题记录内容
 */
function generateAnswerRecords(questionnaireAnswer) {
  if (!questionnaireAnswer || questionnaireAnswer.length === 0) {
    return [
      {
        text: '暂无答题记录',
        italic: true,
        color: '#666',
        margin: [0, 0, 0, 20],
      },
    ];
  }

  const content = [];

  // 展开新结构：QuestionnaireAnswerItem[] -> Question[]
  const allQuestions = questionnaireAnswer
    .flatMap((qa) => (Array.isArray(qa.answers) ? qa.answers : []))
    .filter(Boolean);

  function getDisplayAnswer(question) {
    if (!question || !question.answer) return '未作答';
    if (question.type === 'checkbox') {
      return (
        question.answer
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => formatAnswer(s))
          .join('，') || '未作答'
      );
    }
    return formatAnswer(question.answer);
  }

  // 统计信息
  const totalScore = allQuestions.reduce(
    (sum, q) => sum + (Number(q.score) || 0),
    0,
  );
  const totalCount = allQuestions.length;
  const answeredCount = allQuestions.filter(
    (q) => typeof q.answer === 'string' && q.answer.trim() !== '',
  ).length;
  const unansweredCount = totalCount - answeredCount;

  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          { text: '总分', style: 'tableHeader' },
          { text: '答题数', style: 'tableHeader' },
          { text: '已答题', style: 'tableHeader' },
          { text: '未答题', style: 'tableHeader' },
        ],
        [
          { text: totalScore.toString(), style: 'tableCell' },
          { text: totalCount.toString(), style: 'tableCell' },
          { text: answeredCount.toString(), style: 'tableCell' },
          { text: unansweredCount.toString(), style: 'tableCell' },
        ],
      ],
    },
    margin: [0, 0, 0, 20],
  });

  // 详细答题记录
  allQuestions.forEach((q, index) => {
    const questionNumber = index + 1;
    const displayAnswer = getDisplayAnswer(q);

    content.push({
      table: {
        widths: ['90%', '10%'],
        body: [
          [
            {
              text: `第${questionNumber}题：${q.title || ''}`,
              style: 'questionText',
              margin: [0, 0, 10, 5],
            },
            {
              text: `得分：${q && q.score ? q.score : 0}`,
              style: 'scoreText',
              margin: [0, 0, 0, 10],
              alignment: 'right',
            },
          ],
          [
            {
              text: `答案：${displayAnswer}`,
              style: 'answerText',
              colSpan: 2,
            },
            {},
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 10],
    });
  });

  return content;
}

/**
 * 格式化答案文本用于PDF显示
 */
export function formatAnswer(answer) {
  if (!answer) return '';
  return answer
    .replaceAll('&lt;=', '≤')
    .replaceAll('&gt;=', '≥')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll(/&le;|&leq;/g, '≤')
    .replaceAll(/&ge;|&geq;/g, '≥')
    .replaceAll('&equals;', '=')
    .replaceAll('&#61;', '=');
}
