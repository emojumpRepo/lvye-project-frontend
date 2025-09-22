# 心之旅心理健康管理平台前端

## 🌟 项目简介

心之旅（Mindtrip）心理健康管理平台前端项目，为学校和教育机构提供专业的心理健康管理解决方案。

本项目基于现代前端技术栈构建，提供管理后台和用户前台两个应用，支持多角色权限管理、心理测评、咨询管理等功能。

## 🚀 快速开始

### 环境要求

- Node.js >= 20.10.0
- pnpm >= 10.10.0（强制使用 pnpm）

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动管理后台
pnpm dev:admin

# 启动用户前台
pnpm dev:web
```

### 构建打包

```bash
# 构建管理后台
pnpm build:admin

# 构建用户前台
pnpm build:web

# 构建所有应用
pnpm build
```

## 📁 项目结构

```
mindtrip-frontend/
├── apps/
│   ├── admin/          # 管理后台应用
│   └── web/            # 用户前台应用
├── packages/           # 共享包
│   ├── @vben/          # 框架核心包
│   └── locales/        # 国际化
├── script/             # 构建脚本
└── version.json        # 版本信息
```

## 🛠 技术栈

| 框架 | 说明 | 版本 |
| --- | --- | --- |
| [Vue](https://vuejs.org/) | 渐进式 JavaScript 框架 | 3.5.13 |
| [Vite](https://cn.vitejs.dev/) | 下一代前端构建工具 | 6.2.5 |
| [Ant Design Vue](https://www.antdv.com/) | 企业级 UI 组件库 | 4.2.6 |
| [TypeScript](https://www.typescriptlang.org/) | JavaScript 的超集 | 5.8.3 |
| [Pinia](https://pinia.vuejs.org/) | Vue 状态管理 | 2.3.1 |
| [Vue Router](https://router.vuejs.org/) | Vue 路由管理 | 4.x |

## ✨ 特性

- **🎨 主题系统**：提供多套主题配色方案，支持自定义主题
- **🌐 国际化**：内置完善的国际化方案，支持多语言切换
- **🔐 权限管理**：基于 RBAC 的动态路由权限管理
- **📦 组件库**：二次封装的业务组件，开箱即用
- **📊 数据可视化**：集成 ECharts 等图表库
- **🔧 工程化**：完善的代码规范、提交规范、自动化测试

## 📋 功能模块

### 管理后台（Admin）
- 用户管理
- 角色权限
- 心理测评管理
- 咨询预约管理
- 学生档案
- 数据统计
- 系统设置

### 用户前台（Web）
- 心理测评
- 在线咨询
- 预约管理
- 个人中心
- 测评报告
- 知识库

## 🔨 开发指南

### 代码规范

项目使用 ESLint + Prettier 进行代码格式化：

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### Git 提交规范

提交信息遵循 Conventional Commits 规范：

```bash
# 使用 commitizen
pnpm commit
```

### 版本发布

```bash
# 发布新版本
pnpm release
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- 邮箱：admin@mindtrip.com
- GitHub：[https://github.com/mindtrip/mindtrip-frontend](https://github.com/mindtrip/mindtrip-frontend)

---

心之旅团队 ❤️ 用心守护心理健康