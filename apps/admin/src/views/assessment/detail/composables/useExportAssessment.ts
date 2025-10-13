import type { Ref } from 'vue';

import type { AssessmentResultVO } from '@vben/types';

import type { TabItem } from '../types';

import type { PsychologyAssessmentApi } from '#/api/psychology/assessment/index';

import { reactive, readonly } from 'vue';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import JSZip from 'jszip';

import { getAssessmentResult } from '#/api/psychology/assessment/index';
import { exportQuestionnaireReportToPDF } from '#/components/Dialog/QuestionnaireResultDialog/composables/exportToPDF';
import { exportAssessmentParticipantsToExcel } from '#/utils/export';

// ======================== 类型定义 ========================

/** 导出失败项 */
export interface ExportFailureItem {
  studentName: string; // 学生姓名
  studentNo: string; // 学号
  className: string; // 班级名称
  failedStep: 'fetching' | 'generating' | 'packaging'; // 失败步骤
  errorMessage: string; // 错误信息
}

/** 导出进度 */
export interface ExportProgress {
  currentStep: 'completed' | 'error' | 'fetching' | 'generating' | 'packaging';
  fileType: 'pdf' | 'xlsx';
  exportFileName: string;
  totalCount: number; // 学生总数
  fetchedCount: number; // 已获取数据的学生数
  generateProgress: number; // 生成文件进度（0-100）
  packagingProgress: number; // 打包进度（0-100）
  successCount: number; // 成功数量
  failureList: ExportFailureItem[]; // 失败列表
  startTime: number; // 开始时间戳
}

/** 导出选项 - 完成情况 */
export interface ExportCompletionOptions {
  taskNo: string;
  questionnaireId?: number;
  activeTab?: TabItem;
}

/** 导出选项 - 测评报告 */
export interface ExportReportsOptions {
  taskNo: string;
  taskName?: string;
  questionnairesTabs?: TabItem[];
}

/** 组合式函数选项 */
export interface UseExportAssessmentOptions {
  modalApi: any; // 进度弹窗的API，用于更新进度
  gridApi: any; // 表格API，用于获取选中的行
  searchRef: Ref<any>; // 搜索参数引用
  loadTotal: Ref<number>; // 学生总数
  selectedRowKeys: Ref<number[]>; // 选中的行键
  loadStudentData: (
    page: { currentPage: number; pageSize: number },
    formValues: any,
  ) => Promise<{ list: any[]; total: number }>; // 加载学生数据的函数
}

// ======================== 组合式函数 ========================

export function useExportAssessment(options: UseExportAssessmentOptions) {
  const {
    modalApi,
    gridApi,
    searchRef,
    loadTotal,
    selectedRowKeys,
    loadStudentData,
  } = options;

  // 进度状态
  const progress = reactive<ExportProgress>({
    currentStep: 'fetching',
    fileType: 'xlsx',
    exportFileName: '导出文件',
    totalCount: 0,
    fetchedCount: 0,
    generateProgress: 0,
    packagingProgress: 0,
    successCount: 0,
    failureList: [],
    startTime: 0,
  });

  // 是否正在导出
  const isExporting = reactive({ value: false });

  /**
   * 更新进度弹窗
   */
  function updateProgress() {
    const exportDuration = progress.startTime
      ? Math.floor((Date.now() - progress.startTime) / 1000)
      : 0;

    modalApi.setData({
      currentStep: progress.currentStep,
      fileType: progress.fileType,
      exportFileName: progress.exportFileName,
      totalCount: progress.totalCount,
      fetchedCount: progress.fetchedCount,
      generateProgress: progress.generateProgress,
      packagingProgress: progress.packagingProgress,
      completedStatus: {
        exportDuration,
        successCount: progress.successCount,
        failureList: progress.failureList,
      },
    });
  }

  /**
   * 重置进度
   */
  function resetProgress() {
    progress.currentStep = 'fetching';
    progress.fileType = 'xlsx';
    progress.exportFileName = '导出文件';
    progress.totalCount = 0;
    progress.fetchedCount = 0;
    progress.generateProgress = 0;
    progress.packagingProgress = 0;
    progress.successCount = 0;
    progress.failureList = [];
    progress.startTime = 0;
  }

  /**
   * 获取待导出的学生
   */
  async function getStudentsToExport() {
    if (selectedRowKeys.value.length > 0) {
      // 场景A: 用户勾选了学生，仅导出所选学生
      return gridApi.grid.getCheckboxRecords();
    }

    // 场景B: 用户未勾选，导出所有筛选结果下的学生
    const pageSize = 100;
    const totalPages = Math.ceil(loadTotal.value / pageSize);

    // 创建所有分页请求的 Promise 数组
    const pagePromises = Array.from({ length: totalPages }, (_, i) =>
      loadStudentData(
        { currentPage: i + 1, pageSize },
        searchRef.value?.assessmentDetailSearchParams,
      ),
    );

    const results = await Promise.all(pagePromises);
    return results.flatMap((data) => data.list);
  }

  /**
   * 批量获取所有学生的测评结果
   */
  async function fetchAllAssessmentResults(
    completedStudents: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes[],
  ): Promise<
    (
      | (AssessmentResultVO & {
          className: string;
          studentName: string;
          studentNo: string;
        })
      | null
    )[]
  > {
    const BATCH_SIZE = 30; // 每批处理30个
    const allResults: (
      | (AssessmentResultVO & {
          className: string;
          studentName: string;
          studentNo: string;
        })
      | null
    )[] = [];

    // 计算总批次数
    const totalBatches = Math.ceil(completedStudents.length / BATCH_SIZE);

    // 分批处理
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, completedStudents.length);
      const batch = completedStudents.slice(start, end);

      // 并发处理当前批次
      const batchPromises = batch.map(
        async (
          student: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes,
        ) => {
          try {
            if (!student.id) {
              return null;
            }
            const response = await getAssessmentResult(String(student.id));
            if (!response) {
              return null;
            }

            return {
              ...response,
              className: student.className,
              studentName: student.name,
              studentNo: student.studentNo,
            } as AssessmentResultVO & {
              className: string;
              studentName: string;
              studentNo: string;
            };
          } catch (error: any) {
            console.error('获取测评结果失败', error);

            // 记录失败信息
            progress.failureList.push({
              studentName: student.name || '未知',
              studentNo: student.studentNo || '未知',
              className: student.className || '未知',
              failedStep: 'fetching',
              errorMessage: error?.message || '获取测评结果失败',
            });

            return null;
          }
        },
      );

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);

      // 更新进度
      progress.fetchedCount = Math.min(end, completedStudents.length);
      updateProgress();
    }

    return allResults;
  }

  /**
   * 获取所有问卷答案
   */
  function getQuestionnaireAnswers(
    assessmentResults: AssessmentResultVO[],
  ): any[] {
    return assessmentResults.flatMap((result) => {
      const questionnaireAnswers = result.questionnaireResults || [];

      return questionnaireAnswers.map((q) => {
        return {
          questionnaireName: q.questionnaireName,
          questionnaireId: q.questionnaireId,
          answers: JSON.parse(q.answers),
        };
      });
    });
  }

  /**
   * 导出完成情况（Excel）
   */
  async function exportCompletionStatus(options: ExportCompletionOptions) {
    if (loadTotal.value === 0) {
      message.warning('暂无学生数据可导出');
      return;
    }

    // 重置并初始化进度
    resetProgress();
    progress.fileType = 'xlsx';
    progress.exportFileName = '学生完成情况';
    progress.startTime = Date.now();
    progress.totalCount = loadTotal.value;

    // 打开进度弹窗
    modalApi.open();
    isExporting.value = true;

    try {
      // 步骤1: 准备工作 - 获取学生数据
      progress.currentStep = 'fetching';
      updateProgress();

      const studentsToProcess = await getStudentsToExport();
      progress.fetchedCount = studentsToProcess.length;
      progress.totalCount = studentsToProcess.length;
      updateProgress();

      // 步骤2: 生成文件
      progress.currentStep = 'generating';
      progress.generateProgress = 0;
      updateProgress();

      // 模拟生成进度（因为 Excel 导出是同步的，我们模拟进度）
      progress.generateProgress = 50;
      updateProgress();

      await exportAssessmentParticipantsToExcel(
        studentsToProcess,
        options.activeTab || { key: '', label: '全部问卷' },
      );

      progress.generateProgress = 100;
      progress.successCount = studentsToProcess.length;
      updateProgress();

      // 完成
      progress.currentStep = 'completed';
      updateProgress();

      message.success(`成功导出 ${studentsToProcess.length} 条学生完成情况`);
    } catch (error: any) {
      console.error('导出失败:', error);
      progress.currentStep = 'error';
      updateProgress();
      message.error('导出失败，请重试');
    } finally {
      isExporting.value = false;
    }
  }

  /**
   * 导出测评报告（PDF）
   */
  async function exportAssessmentReports(options: ExportReportsOptions) {
    if (loadTotal.value === 0) {
      message.warning('暂无学生数据可导出');
      return;
    }

    // 重置并初始化进度
    resetProgress();
    progress.fileType = 'pdf';
    progress.exportFileName = '测评报告';
    progress.startTime = Date.now();
    progress.totalCount = loadTotal.value;

    // 打开进度弹窗
    modalApi.open();
    isExporting.value = true;

    try {
      // 步骤1: 准备工作 - 获取学生数据
      progress.currentStep = 'fetching';
      updateProgress();

      const studentsToProcess = await getStudentsToExport();
      progress.totalCount = studentsToProcess.length;

      // 筛选出已完成的测评
      const completedStudents = studentsToProcess.filter(
        (item: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes) =>
          item.status === 1,
      );

      if (completedStudents.length === 0) {
        message.warning('学生未完成测评，无法导出');
        modalApi.close();
        return;
      }

      progress.totalCount = completedStudents.length;
      progress.fetchedCount = 0;
      updateProgress();

      // 获取所有学生的测评结果
      const assessmentResults =
        await fetchAllAssessmentResults(completedStudents);

      const validAssessmentResults = assessmentResults.filter(
        (
          result,
        ): result is AssessmentResultVO & {
          className: string;
          studentName: string;
          studentNo: string;
        } => result !== null,
      );

      if (validAssessmentResults.length === 0) {
        message.warning('未获取到有效的测评结果');
        modalApi.close();
        return;
      }

      // 排序问卷
      if (options.questionnairesTabs) {
        const tabOrderMap = new Map(
          options.questionnairesTabs.map((tab, index) => [tab.key, index]),
        );

        validAssessmentResults.forEach((assessment) => {
          if (assessment && assessment.questionnaireResults) {
            assessment.questionnaireResults.sort((a, b) => {
              const orderA =
                tabOrderMap.get(String(a.questionnaireId)) ?? Infinity;
              const orderB =
                tabOrderMap.get(String(b.questionnaireId)) ?? Infinity;
              return orderA - orderB;
            });
          }
        });
      }

      // 步骤2: 生成文件 - 为每个学生生成 PDF
      progress.currentStep = 'generating';
      progress.generateProgress = 0;
      updateProgress();

      const zip = new JSZip();
      let successCount = 0;

      // 为每个学生生成 PDF 并添加到 ZIP
      for (let i = 0; i < validAssessmentResults.length; i++) {
        const assessment = validAssessmentResults[i];
        if (!assessment) {
          continue;
        }

        try {
          const studentQuestionnaireAnswers = getQuestionnaireAnswers([
            assessment,
          ]);

          const result = await exportQuestionnaireReportToPDF({
            assessmentSummary: assessment.riskLevelIntervention,
            questionnaireResult: assessment.questionnaireResults || [],
            questionnaireAnswer: studentQuestionnaireAnswers || [],
            completedTime: assessment.updateTime,
            studentName: assessment.studentName || '',
            scenarioName: assessment.scenarioName || '',
            returnBlob: true,
          });

          if (result && result.blob && result.filename) {
            zip.file(result.filename, result.blob);
            successCount++;
          }
        } catch (error: any) {
          console.error(
            `导出学生 ${assessment.studentName} 的报告失败:`,
            error,
          );

          // 记录失败信息
          progress.failureList.push({
            studentName: assessment.studentName || '未知',
            studentNo: assessment.studentNo || '未知',
            className: assessment.className || '未知',
            failedStep: 'generating',
            errorMessage: error?.message || 'PDF生成失败',
          });
        }

        // 更新生成进度
        progress.generateProgress = Math.floor(
          ((i + 1) / validAssessmentResults.length) * 100,
        );
        progress.successCount = successCount;
        updateProgress();
      }

      if (successCount === 0) {
        message.error('所有学生报告导出失败');
        progress.currentStep = 'error';
        updateProgress();
        return;
      }

      // 步骤3: 打包压缩
      progress.currentStep = 'packaging';
      progress.packagingProgress = 0;
      updateProgress();

      // 模拟打包进度
      progress.packagingProgress = 50;
      updateProgress();

      const zipBlob = await zip.generateAsync({ type: 'blob' });

      progress.packagingProgress = 100;
      updateProgress();

      // 下载 ZIP 文件
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const timestamp = dayjs().format('YYYYMMDDHHmmss');
      link.download = `测评报告_${timestamp}.zip`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      // 完成
      progress.currentStep = 'completed';
      progress.successCount = successCount;
      updateProgress();

      const failCount = progress.failureList.length;
      if (failCount > 0) {
        message.warning(
          `导出完成！成功 ${successCount} 个，失败 ${failCount} 个`,
        );
      } else {
        message.success(`成功导出 ${successCount} 个学生的测评报告`);
      }
    } catch (error: any) {
      console.error('导出失败:', error);
      progress.currentStep = 'error';
      updateProgress();
      message.error('导出失败，请重试');
    } finally {
      isExporting.value = false;
    }
  }

  return {
    progress: readonly(progress),
    isExporting: readonly(isExporting),
    exportCompletionStatus,
    exportAssessmentReports,
  };
}
