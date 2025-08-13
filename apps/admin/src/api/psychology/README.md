# 心理健康管理系统 API 接口文档

## 概述

本目录包含了心理健康管理系统（`yudao-module-psychology`）的所有前端API接口定义，按功能模块进行了合理划分，提供了完整的TypeScript类型定义和统一的调用方式。

## 模块结构

```
psychology/
├── index.ts                 # 统一导出文件
├── student-profile/         # 学生档案管理
├── assessment/             # 测评管理
├── consultation/           # 咨询管理
├── notification/           # 通知系统
├── timeline/              # 时间线管理
├── quick-report/          # 快速上报
├── config/                # 系统配置
└── README.md              # 本文档
```

## 模块详细说明

### 1. 学生档案管理 (`student-profile`)
**功能**：学生心理档案的CRUD操作、批量导入导出、心理状态管理

### 2. 测评管理 (`assessment`)
**功能**：心理测评任务管理、参与者管理、结果分析

### 3. 咨询管理 (`consultation`)
**功能**：心理咨询记录管理、危机干预事件处理

### 4. 通知系统 (`notification`)
**功能**：通知发送、模板管理、发送记录查询

### 5. 时间线管理 (`timeline`)
**功能**：学生档案时间线记录、事件追踪、趋势分析

### 6. 快速上报 (`quick-report`)
**功能**：任课老师快速上报异常情况、处理流程管理

### 7. 系统配置 (`config`)
**功能**：基础数据管理（年级、班级、教师、字典等）

## 使用方式

### 统一导入
```typescript
// 导入所有API
import * as PsychologyAPI from '#/api/psychology';

// 导入特定模块
import { 
  getStudentProfilePage,
  createAssessmentTask,
  sendNotification 
} from '#/api/psychology';

// 导入类型定义
import type { 
  PsychologyStudentProfileApi,
  PsychologyAssessmentApi 
} from '#/api/psychology';
```

### 在Vue组件中使用
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  getStudentProfilePage, 
  type PsychologyStudentProfileApi 
} from '#/api/psychology';

const loading = ref(false);
const dataSource = ref<PsychologyStudentProfileApi.StudentProfile[]>([]);

async function loadData() {
  try {
    loading.value = true;
    const response = await getStudentProfilePage({
      pageNo: 1,
      pageSize: 10,
    });
    dataSource.value = response.list || [];
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
```

## 错误处理

所有API调用都应该包含适当的错误处理：

```typescript
import { message } from 'ant-design-vue';

try {
  const result = await getStudentProfilePage(params);
  // 处理成功结果
} catch (error) {
  console.error('API调用失败:', error);
  message.error('操作失败，请重试');
}
```

## 常用枚举

系统提供了常用的枚举定义：

```typescript
import { 
  GenderEnum, 
  RiskLevelEnum, 
  PsychologicalStatusEnum,
  getGenderText,
  getRiskLevelInfo 
} from '#/api/psychology';

// 使用枚举
const gender = GenderEnum.MALE;
const riskLevel = RiskLevelEnum.HIGH;

// 使用工具函数
const genderText = getGenderText(gender); // '男'
const riskInfo = getRiskLevelInfo(riskLevel); // { text: '高风险', color: 'red' }
```

## 注意事项

1. **统一的请求客户端**：所有API都使用项目统一的 `requestClient`
2. **错误处理**：建议在组件中统一处理API错误
3. **类型安全**：充分利用TypeScript类型定义
4. **按需导入**：根据实际需要选择合适的导入方式
5. **接口路径**：所有接口都基于 `/psychology/` 路径，`requestClient` 会自动添加 `/admin-api` 前缀

## 接口覆盖

**总计接口数量**: 100+ 个API接口

**主要接口类型**:
- 📊 **分页查询接口**: 7个主要业务模块的分页查询
- 🔧 **CRUD操作接口**: 完整的增删改查操作
- 📈 **统计分析接口**: 各模块的统计和趋势分析
- 📤 **导入导出接口**: 数据导入导出功能
- 🔔 **通知推送接口**: 各种场景的通知发送
- ⚙️ **配置管理接口**: 系统基础数据管理

## 更新日志

- **v1.0.0** - 初始版本，包含所有基础功能模块
- **v1.0.1** - 修正API路径，移除 `/admin-api` 前缀（由 `requestClient` 自动添加）
