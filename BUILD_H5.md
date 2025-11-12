# H5 应用构建指南

## 快速构建（推荐）

从项目根目录运行以下命令，即可完成 H5 应用的构建：

```bash
pnpm install
pnpm run build:h5
```

## 命令说明

### `pnpm run build:h5`

这个命令会：

1. **自动更新版本信息**（通过 `prebuild:h5` 钩子）
2. **自动构建所有依赖的 workspace 包**（通过 Turbo 的依赖分析）
   - `@vben-core/typings`
   - `@vben-core/icons`
   - `@vben-core/shared`
   - 以及其他被 student-h5 依赖的包
3. **构建 H5 应用**

### 构建优势

- ✅ **开箱即用**：首次克隆项目的开发者只需运行 `pnpm install` 和 `pnpm run build:h5`
- ✅ **智能缓存**：Turbo 会缓存已构建的包，避免重复构建
- ✅ **自动依赖**：自动按正确顺序构建所有依赖包
- ✅ **并行构建**：Turbo 会并行构建独立的包，提高构建速度

## 构建输出

构建成功后，产物位于：

```
apps/student-h5/dist/build/h5/
├── assets/       # 编译后的 JS 和 CSS
├── static/       # 静态资源
└── index.html    # 入口文件
```

## 其他构建命令

### 开发模式

```bash
pnpm run dev:h5
```

### 不同环境构建

在 `apps/student-h5` 目录下：

```bash
# 测试环境
pnpm run build:h5:test

# 生产环境（默认）
pnpm run build:h5:prod
```

## 故障排除

### 如果构建失败

1. **清理缓存并重新安装**：
   ```bash
   pnpm clean
   pnpm install
   ```

2. **手动清理 dist 目录**：
   ```bash
   # Windows
   rd /s /q apps\student-h5\dist

   # Linux/Mac
   rm -rf apps/student-h5/dist
   ```

3. **重新构建**：
   ```bash
   pnpm run build:h5
   ```

### 常见问题

**Q: 提示 workspace 包找不到？**
A: 运行 `pnpm install` 确保所有依赖已安装

**Q: 构建报错 "Could not resolve entry for package"？**
A: 使用 `pnpm run build:h5`（从根目录），不要单独在 `apps/student-h5` 目录运行构建

**Q: 修改了 workspace 包代码，如何重新构建？**
A: 删除对应包的 `dist` 目录，然后重新运行 `pnpm run build:h5`，Turbo 会自动重新构建

## 技术细节

### 为什么需要构建依赖包？

本项目是一个 Monorepo，使用了以下 workspace 包：

- `@vben-core/*`: 核心 UI 组件和工具库
- `@vben/*`: 业务组件和工具库

这些包需要先构建（生成 `dist` 目录），H5 应用才能正确引用它们。

### Turbo 的作用

Turbo 是一个高性能的构建系统，它会：

1. 分析包之间的依赖关系
2. 按正确的拓扑顺序构建包
3. 并行构建没有依赖关系的包
4. 缓存构建结果，避免重复构建

### package.json 配置

根目录的 `package.json` 中的相关配置：

```json
{
  "scripts": {
    "prebuild:h5": "node ./scripts/update-version.mjs",
    "build:h5": "pnpm run build --filter=@mindtrip/student-h5"
  }
}
```

- `prebuild:h5`: 构建前的钩子，更新版本信息
- `build:h5`: 使用 Turbo 构建，`--filter` 参数指定只构建 student-h5 及其依赖

## 持续集成（CI）

在 CI 环境中，推荐使用以下流程：

```bash
# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 构建
pnpm run build:h5

# 3. 部署
# 将 apps/student-h5/dist/build/h5/ 目录部署到服务器
```
