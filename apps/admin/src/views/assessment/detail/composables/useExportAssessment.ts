import type { Ref } from 'vue';

import type { AssessmentResultVO, ExportProgress } from '@vben/types';

import type { TabItem } from '../types';

import type { PsychologyAssessmentApi } from '#/api/psychology/assessment/index';

import { reactive, ref } from 'vue';

import { message } from 'ant-design-vue';
import JSZip from 'jszip';

import { getAssessmentResult } from '#/api/psychology/assessment/index';
import { exportQuestionnaireReportToPDF } from '#/components/Dialog/QuestionnaireResultDialog/composables/exportToPDF';
import { exportAssessmentParticipantsToExcel } from '#/utils/export';

// ======================== 类型定义 ========================
export interface StudentAssessmentResultVO extends AssessmentResultVO {
  studentName: string; // 学生姓名
  studentNo: string; // 学号
  className: string; // 班级名称
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

// ======================== 常量配置 ========================
/** 获取测评结果时，每批并发请求数量 */
const ASSESSMENT_RESULT_BATCH_SIZE = 10;

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

  // 是否正在导出测评报告（PDF）
  const isExportingReports = ref(false);

  // 是否正在导出完成情况（Excel）
  const isExportingCompletionStatus = ref(false);

  // 是否取消导出
  const isCancelled = ref(false);

  // 进度状态
  const progress = reactive<ExportProgress>({
    currentStep: 'fetching',
    fileType: 'xlsx',
    exportFileName: '导出文件',
    totalCount: 0,
    fetchedCount: 0,
    currentGenerateCount: 0,
    totalGenerateCount: 0,
    packagingProgress: 0,
    failureList: [],
    startTime: 0,
    errorMessage: '',
    downloadUrl: '',
  });

  /**
   * 重置进度
   */
  function resetProgress() {
    progress.currentStep = 'fetching';
    progress.fileType = 'xlsx';
    progress.exportFileName = '导出文件';
    progress.totalCount = 0;
    progress.fetchedCount = 0;
    progress.currentGenerateCount = 0;
    progress.totalGenerateCount = 0;
    progress.packagingProgress = 0;
    progress.failureList = [];
    progress.startTime = 0;
    progress.errorMessage = '';
    progress.downloadUrl = '';
  }

  /**
   * 记录失败信息的辅助函数
   */
  function recordFailure(
    student: {
      className?: string;
      name?: string;
      studentNo?: string;
    },
    failedStep: 'fetching' | 'generating',
    errorMessage: string,
  ) {
    progress.failureList.push({
      studentName: student.name || '未知',
      className: student.className || '未知',
      studentNo: student.studentNo || '未知',
      failedStep,
      errorMessage,
    });
  }

  /**
   * 获取学生基本信息
   */
  function getStudentInfo(
    student: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes,
  ) {
    return {
      name: student.name || '未知',
      studentNo: student.studentNo || '未知',
      className: student.className || '未知',
    };
  }

  /**
   * 获取待导出的学生
   */
  async function getStudentsToExport() {
    if (selectedRowKeys.value.length > 0) {
      progress.totalCount = selectedRowKeys.value.length;
      // 场景A: 用户勾选了学生，仅导出所选学生
      return gridApi.grid.getCheckboxRecords();
    }

    // 场景B: 用户未勾选，导出所有筛选结果下的学生
    const pageSize = 100;
    const totalPages = Math.ceil(loadTotal.value / pageSize);

    // 串行请求所有分页数据
    const results = [];
    for (let i = 0; i < totalPages; i++) {
      if (isCancelled.value) return [];

      const data = await loadStudentData(
        { currentPage: i + 1, pageSize },
        searchRef.value?.assessmentDetailSearchParams,
      );
      results.push(data);
    }

    return results.flatMap((data) => data.list);
  }

  /**
   * 获取单个学生的测评结果
   */
  async function fetchSingleAssessmentResult(
    student: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes,
  ): Promise<null | StudentAssessmentResultVO> {
    const studentInfo = getStudentInfo(student);

    try {
      // 验证学生ID
      if (!student.id) {
        recordFailure(studentInfo, 'fetching', '学生ID不存在');
        return null;
      }

      // 获取测评结果
      const response = await getAssessmentResult(String(student.id));
      if (!response) {
        recordFailure(studentInfo, 'fetching', '获取测评结果失败');
        return null;
      }

      // 更新进度
      progress.fetchedCount++;

      // 返回完整的学生测评结果
      return {
        ...response,
        className: student.className,
        studentName: student.name,
        studentNo: student.studentNo,
      } as StudentAssessmentResultVO;
    } catch (error: any) {
      console.error('获取测评结果失败', error);
      recordFailure(
        studentInfo,
        'fetching',
        error?.message || '获取测评结果失败',
      );
      return null;
    }
  }

  /**
   * 批量获取所有学生的测评结果
   */
  async function fetchAllAssessmentResults(
    completedStudents: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes[],
  ): Promise<StudentAssessmentResultVO[]> {
    const allResults: StudentAssessmentResultVO[] = [];
    const totalBatches = Math.ceil(
      completedStudents.length / ASSESSMENT_RESULT_BATCH_SIZE,
    );

    // 分批处理，每批之间检查取消状态
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // 检查是否取消
      if (isCancelled.value) {
        return allResults;
      }

      // 获取当前批次的学生
      const start = batchIndex * ASSESSMENT_RESULT_BATCH_SIZE;
      const end = Math.min(
        start + ASSESSMENT_RESULT_BATCH_SIZE,
        completedStudents.length,
      );
      const batch = completedStudents.slice(start, end);

      // 并发处理当前批次
      const batchPromises = batch.map((student) =>
        fetchSingleAssessmentResult(student),
      );

      // 等待当前批次完成并过滤掉失败的结果
      const batchResults = await Promise.all(batchPromises);
      allResults.push(
        ...batchResults.filter(
          (result): result is StudentAssessmentResultVO => result !== null,
        ),
      );
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
   * 取消导出
   */
  function cancelExport() {
    isCancelled.value = true;
    progress.currentStep = 'cancelled';
  }

  /**
   * 导出完成情况（Excel）
   */
  async function exportCompletionStatus(activeTab: TabItem) {
    if (loadTotal.value === 0) {
      message.warning('暂无学生数据可导出');
      return;
    }

    isExportingCompletionStatus.value = true;
    try {
      const studentsToProcess = await getStudentsToExport();

      await exportAssessmentParticipantsToExcel(studentsToProcess, activeTab);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    } finally {
      isExportingCompletionStatus.value = false;
    }
  }

  /**
   * 导出测评报告（PDF）
   */
  async function exportAssessmentReports(questionnairesTabs: TabItem[]) {
    if (loadTotal.value === 0) {
      message.warning('暂无学生数据可导出');
      return;
    }

    // 重置并初始化进度
    resetProgress();
    progress.fileType = 'pdf';
    progress.exportFileName = '学生测评报告';
    progress.startTime = Date.now();
    progress.totalCount = loadTotal.value;

    // 重置取消标志
    isCancelled.value = false;

    // 更新导出状态
    isExportingReports.value = true;

    // 打开进度弹窗
    modalApi
      .setData({
        title: '正在导出学生测评报告',
        fileType: progress.fileType,
        exportFileName: progress.exportFileName,
      })
      .open();

    const zip = new JSZip(); // JSZip实例

    try {
      // 步骤1: 准备工作 - 获取学生数据
      progress.currentStep = 'fetching';

      const studentsToProcess = await getStudentsToExport();
      if (isCancelled.value) return;

      // 筛选出已完成的测评
      const completedStudents = studentsToProcess.filter(
        (item: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes) =>
          item.status === 1,
      );

      if (completedStudents.length === 0) {
        progress.currentStep = 'error';
        progress.errorMessage = '学生未完成测评，无法导出';
        return;
      }

      // 更新进度
      progress.totalGenerateCount = completedStudents.length;

      // 获取所有学生的测评结果
      const assessmentResults =
        await fetchAllAssessmentResults(completedStudents);
      if (isCancelled.value) return;

      if (assessmentResults.length === 0) {
        progress.currentStep = 'error';
        progress.errorMessage = '未获取到有效的测评结果';
        return;
      }

      // 排序问卷（内存操作，快速完成）
      if (questionnairesTabs) {
        const tabOrderMap = new Map(
          questionnairesTabs.map((tab, index) => [tab.key, index]),
        );

        assessmentResults.forEach((assessment) => {
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
      progress.totalGenerateCount = assessmentResults.length;

      // 为每个学生生成 PDF 并添加到 ZIP
      for (const assessment of assessmentResults) {
        // 检查是否取消
        if (isCancelled.value) return;

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

          if (result?.blob && result?.filename) {
            zip.file(result.filename, result.blob);
            progress.currentGenerateCount++;
          } else {
            recordFailure(assessment, 'generating', 'PDF生成失败');
          }
        } catch (error: any) {
          console.error(
            `导出学生 ${assessment.studentName} 的报告失败:`,
            error,
          );
          recordFailure(
            assessment,
            'generating',
            error?.message || 'PDF生成失败',
          );
        }
      }

      // 检查是否有成功生成的PDF
      if (isCancelled.value) return;

      if (progress.currentGenerateCount === 0) {
        progress.currentStep = 'error';
        progress.errorMessage = '所有学生报告导出失败';
        return;
      }

      // 步骤3: 打包压缩
      progress.currentStep = 'packaging';
      progress.packagingProgress = 50;

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      if (isCancelled.value) return;

      const downloadUrl = URL.createObjectURL(zipBlob);
      progress.downloadUrl = downloadUrl;
      progress.packagingProgress = 100;

      // 完成
      progress.currentStep = 'completed';
    } catch (error: any) {
      console.error('导出失败:', error);
      progress.currentStep = 'error';
      message.error('导出失败，请重试');
    } finally {
      isExportingReports.value = false;
    }
  }

  return {
    progress,
    isExportingReports,
    isExportingCompletionStatus,
    cancelExport,
    exportCompletionStatus,
    exportAssessmentReports,
  };
}
