<!-- 8097e0f0-7959-4db7-970a-cae65d7e7b8b 9d11ff86-11fc-4498-922d-47d3dc61f7bd -->
# 导出功能组合式函数重构方案

## 概述

将 `AssessmentDetailList.vue` 中的导出相关方法抽离到 `composables/useExportAssessment.ts`，集成进度弹窗更新和全面的错误追踪。

## 实施步骤

### 1. 创建核心组合式函数文件

**文件位置**: `apps/admin/src/views/assessment/detail/composables/useExportAssessment.ts`

**核心接口定义**:

```typescript
interface ExportFailureItem {
  studentName: string;    // 学生姓名
  studentNo: string;      // 学号
  className: string;      // 班级名称
  failedStep: 'fetching' | 'generating' | 'packaging';  // 失败步骤
  errorMessage: string;   // 错误信息
}

interface ExportProgress {
  currentStep: 'fetching' | 'generating' | 'packaging' | 'completed' | 'error';
  totalCount: number;         // 学生总数
  fetchedCount: number;       // 已获取数据的学生数
  generateProgress: number;   // 生成文件进度（0-100）
  packagingProgress: number;  // 打包进度（0-100）
  successCount: number;       // 成功数量
  failureList: ExportFailureItem[];  // 失败列表
  startTime: number;          // 开始时间戳
}
```

**需要抽离的主要函数**:

- `getStudentsToExport()` - 获取待导出的学生（选中的或筛选后的）
- `exportCompletionStatus()` - 导出完成情况（Excel格式）
- `exportAssessmentReports()` - 导出测评报告（PDF打包成ZIP）
- `fetchAllAssessmentResults()` - 批量获取测评结果，带进度追踪
- `getQuestionnaireAnswers()` - 解析问卷答案数据

**组合式函数结构**:

```typescript
export function useExportAssessment(options: {
  modalApi: any;          // 进度弹窗的API，用于更新进度
  gridApi: any;           // 表格API，用于获取选中的行
  searchRef: any;         // 搜索参数引用
  loadTotal: Ref<number>; // 学生总数
}) {
  const progress = reactive<ExportProgress>({...});
  
  // 更新进度弹窗
  const updateProgress = () => {
    modalApi.setData({
      currentStep: progress.currentStep,
      fileType: ...,
      ...
    });
  };
  
  return {
    progress: readonly(progress),
    exportCompletionStatus,
    exportAssessmentReports,
  };
}
```

### 2. 实现进度追踪

**步骤一：准备工作 (fetching)**:

- 更新 `fetchAllAssessmentResults()` 函数以追踪进度
- 每批处理后：`progress.fetchedCount += batchSize`
- 每批完成后调用 `updateProgress()` 更新弹窗
- 捕获单个学生获取失败，添加到 `failureList`，设置 step='fetching'

**步骤二：生成文件 (generating)**:

- Excel导出：追踪生成进度（相对简单，单文件）
- PDF导出：追踪每个学生的PDF生成
  - 计算百分比：`(processedCount / totalCount) * 100`
  - 每处理一个学生后更新：`progress.generateProgress = percentage`
- 用 try-catch 包裹每个生成操作，失败时记录到 `failureList`，设置 step='generating'

**步骤三：打包压缩 (packaging)** - 仅PDF导出:

- 追踪ZIP文件生成进度
- 更新 `progress.packagingProgress`
- 捕获打包失败，设置 step='packaging'

### 3. 增强错误处理

为每个关键操作添加错误追踪：

```typescript
// 在 fetchAllAssessmentResults 中
try {
  const response = await getAssessmentResult(student.id);
} catch (error) {
  progress.failureList.push({
    studentName: student.name,
    studentNo: student.studentNo,
    className: student.className,
    failedStep: 'fetching',
    errorMessage: error.message || '获取测评结果失败',
  });
}

// 在 PDF 生成循环中
try {
  const result = await exportQuestionnaireReportToPDF({...});
} catch (error) {
  progress.failureList.push({
    studentName: assessment.studentName,
    studentNo: assessment.studentNo,
    className: assessment.className,
    failedStep: 'generating',
    errorMessage: error.message || 'PDF生成失败',
  });
}
```

### 4. 更新组件集成

**在 `AssessmentDetailList.vue` 中**:

```typescript
// 使用组合式函数替换现有导出代码：
const { progress, exportCompletionStatus, exportAssessmentReports } = 
  useExportAssessment({
    modalApi: exportStudentCompleteModalApi,
    gridApi,
    searchRef,
    loadTotal,
  });

// 更新按钮处理函数，调用组合式函数的方法
function handleExportCompletedStatus() {
  exportCompletionStatus({
    taskNo: props.taskNo,
    questionnaireId: queryParams.value.questionnaireId,
    activeTab: activeTab.value,
  });
}

function handleExportAssessmentResults() {
  exportAssessmentReports({
    taskNo: props.taskNo,
    taskName: props.taskName,
    questionnairesTabs: props.questionnairesTabs,
  });
}
```

### 5. 更新进度弹窗

**在 `ExportStudentCompletedStatusDialog/index.vue` 中**:

确保弹窗能正确显示失败列表：

```vue
<!-- 在完成状态区域中添加 -->
<div v-if="completedStatus.failureList?.length > 0">
  <div class="mt-4 max-h-40 overflow-y-auto">
    <div class="text-sm font-medium text-[#FF0831] mb-2">失败详情：</div>
    <div v-for="(item, index) in completedStatus.failureList" :key="index"
         class="text-xs text-gray-600 mb-1">
      {{ item.studentName }}({{ item.className }}) - 
      {{ item.failedStep }} - {{ item.errorMessage }}
    </div>
  </div>
</div>
```

### 6. 类型定义

根据需要添加类型到 `types.ts`，或保留在组合式函数文件中：

```typescript
export interface ExportOptions {
  taskNo: string;
  taskName?: string;
  questionnaireId?: number;
  activeTab?: TabItem;
  questionnairesTabs?: TabItem[];
}
```

## 修改的文件清单

1. **新建**: `apps/admin/src/views/assessment/detail/composables/useExportAssessment.ts` (约400行)
2. **修改**: `apps/admin/src/views/assessment/detail/components/AssessmentDetailList.vue` (删除约300行导出逻辑，新增约50行组合式函数集成代码)
3. **修改**: `apps/admin/src/components/Dialog/ExportStudentCompletedStatusDialog/index.vue` (添加失败列表展示)

## 方案优势

- ✅ 关注点分离（UI与业务逻辑解耦）
- ✅ 导出逻辑可在多个组件中复用
- ✅ 实时进度反馈，提升用户体验
- ✅ 全面的错误追踪，每个学生每个步骤
- ✅ 更好的可测试性
- ✅ 更易于维护和调试

### To-dos

- [ ] Create useExportAssessment.ts composable with interfaces and core structure
- [ ] Extract and refactor helper functions (getStudentsToExport, fetchAllAssessmentResults, getQuestionnaireAnswers)
- [ ] Implement exportCompletionStatus with progress tracking and error handling
- [ ] Implement exportAssessmentReports with step-by-step progress and error tracking
- [ ] Update AssessmentDetailList.vue to use the composable and remove old export code
- [ ] Update ExportStudentCompletedStatusDialog to display detailed failure information
- [ ] Test both export flows with various scenarios (all students, selected students, with errors)