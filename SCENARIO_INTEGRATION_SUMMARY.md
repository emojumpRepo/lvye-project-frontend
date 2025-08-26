# 场景ID集成修改总结

## 🎯 修改目标
在创建测评对话框中集成场景ID功能，确保：
1. 选择场景后能正确传递场景ID到后端
2. 在步骤间回退时能保持场景选择状态
3. 前后端API类型定义一致

## 📝 修改内容

### 1. 后端支持确认 ✅
后端已经完全支持scenarioId参数：
- `AssessmentTaskSaveReqVO` 包含 `scenarioId` 字段
- `AssessmentTaskServiceImpl.createAssessmentTask()` 处理场景校验
- 数据库表 `lvye_assessment_task` 包含 `scenario_id` 字段

### 2. 前端组件修改

#### 2.1 CreateAssessmentDialogContent.vue
**新增场景ID状态管理：**
```typescript
const selectedScenarioId = ref<number | undefined>(undefined);
```

**修改API调用，添加scenarioId参数：**
```typescript
const res = await createAssessmentTask({
  taskName: basicInfoFormData.value.name,
  startline: basicInfoFormData.value.timeRange?.[0].toISOString(),
  deadline: basicInfoFormData.value.timeRange?.[1].toISOString(),
  questionnaireIds: selectedAssessments.value.map((i) => i.id),
  targetAudience: targetSelectData.value.type,
  userIdList: targetSelectData.value.selected.flatMap((i) => i.studentIds),
  scenarioId: selectedScenarioId.value, // ✅ 新增
  isPublish: publish,
});
```

**传递场景ID到子组件：**
```vue
<AssessmentSelect
  ref="assessmentSelectRef"
  v-else-if="props.step === 2"
  v-model:assessments="selectedAssessments"
  v-model:scenario-id="selectedScenarioId" // ✅ 新增双向绑定
/>
```

#### 2.2 AssessmentSelect.vue
**新增场景ID双向绑定：**
```typescript
// 场景ID双向绑定（支持 v-model:scenario-id）
const selectedScenarioId = defineModel<number | undefined>('scenarioId', {
  default: undefined,
});
```

**移除本地场景ID状态（使用父组件传递的）：**
```typescript
// 删除：const selectedScenarioId = ref<number | undefined>(undefined);
// 保留：const selectedScenario = computed(() =>
//   scenarioList.value.find((s) => s.id === selectedScenarioId.value),
// );
```

**在组件挂载时恢复场景插槽状态：**
```typescript
onMounted(async () => {
  start();
  await Promise.all([getAssessmentList(), getScenarios()]);
  await nextTick();
  hasLeftSlot.value = !!document.querySelector('#common-dialog-left-slot');
  
  // ✅ 如果有选中的场景ID，加载对应的插槽信息
  if (selectedScenarioId.value !== undefined) {
    try {
      const slots = await getAssessmentScenarioSlots(selectedScenarioId.value);
      scenarioSlots.value = slots;
    } catch (error) {
      console.error(error);
      scenarioSlots.value = [];
    }
  }
});
```

#### 2.3 API类型定义更新
**apps/admin/src/api/assessment/task/index.ts：**
```typescript
export interface AssessmentTaskSaveReq {
  id?: number;
  taskNo?: string;
  taskName: string;
  questionnaireIds: number[];
  targetAudience: number;
  startline?: Date | string;
  deadline?: Date | string;
  deptIdList?: number[];
  userIdList?: number[];
  scenarioId?: number; // ✅ 新增场景ID字段
  isPublish?: boolean;
}
```

## 🔄 工作流程

### 创建测评时的场景ID传递流程：
1. **步骤2（选择量表）**：用户选择场景 → `selectedScenarioId` 更新
2. **步骤3（选择对象）**：场景ID状态保持
3. **步骤4（确认发布）**：场景ID状态保持
4. **提交时**：`createAssessmentTask()` 包含 `scenarioId` 参数
5. **后端处理**：校验场景有效性，保存到数据库

### 回退时的状态保持：
1. **从步骤3回到步骤2**：`selectedScenarioId` 保持选中状态
2. **AssessmentSelect组件重新挂载**：
   - 恢复场景选择状态
   - 重新加载对应的插槽信息
   - 显示之前选择的场景和插槽配置

## ✅ 预期效果

### 正常流程：
- ✅ 选择场景后，场景ID正确传递到后端
- ✅ 后端校验场景有效性和问卷数量限制
- ✅ 测评任务创建时关联正确的场景

### 回退流程：
- ✅ 从后续步骤回退到"选择量表"时，之前选择的场景保持选中状态
- ✅ 场景对应的插槽信息正确显示
- ✅ 用户可以继续修改场景选择或保持原选择

### 边界情况：
- ✅ 不选择场景时，`scenarioId` 为 `undefined`，后端使用默认场景
- ✅ 选择场景但问卷数量超限时，后端返回校验错误
- ✅ 场景被禁用时，后端返回校验错误

## 🧪 测试建议

### 功能测试：
1. **创建测评 + 选择场景**：
   - 选择场景 → 选择问卷 → 选择对象 → 确认发布
   - 验证后端收到正确的 `scenarioId`

2. **回退测试**：
   - 选择场景 → 下一步 → 上一步
   - 验证场景选择状态保持，插槽信息正确显示

3. **边界测试**：
   - 不选择场景创建测评
   - 选择场景但问卷数量超限
   - 选择已禁用的场景

### 集成测试：
1. **端到端测试**：创建测评 → 发布 → 验证数据库中的 `scenario_id` 字段
2. **API测试**：直接调用 `createAssessmentTask` API，传入 `scenarioId`

## 📋 相关文件清单

### 修改的文件：
- ✅ `apps/admin/src/components/Dialog/CreateAssessmentDialog/CreateAssessmentDialogContent.vue`
- ✅ `apps/admin/src/components/Dialog/CreateAssessmentDialog/components/AssessmentSelect.vue`
- ✅ `apps/admin/src/api/assessment/task/index.ts`

### 相关但未修改的文件：
- `yudao-module-psychology/.../AssessmentTaskSaveReqVO.java` (已支持)
- `yudao-module-psychology/.../AssessmentTaskServiceImpl.java` (已支持)
- `yudao-module-psychology/.../AssessmentTaskDO.java` (已支持)

## 🎉 总结

通过以上修改，创建测评对话框现在完全支持场景ID的传递和状态保持：

1. **✅ 场景ID传递**：从前端组件到后端API的完整链路
2. **✅ 状态保持**：在步骤间回退时保持场景选择状态
3. **✅ 类型安全**：前后端API类型定义一致
4. **✅ 用户体验**：回退时不丢失之前的选择，操作流畅

现在用户可以：
- 在创建测评时选择场景
- 在步骤间自由回退而不丢失场景选择
- 看到场景对应的插槽配置
- 成功创建带有场景信息的测评任务
