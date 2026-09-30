# 核心代码与 CI

## 模块职责

| 位置 | 职责 |
| --- | --- |
| `web/main.tsx` | React 入口与全局样式 |
| `app/page.tsx` | 页面、图层/搜索/详情状态与客户端桥接 |
| `app/scene.tsx` | Three.js 场景初始化、加载、相机、按需帧调度与清理 |
| `app/core/anatomy.ts` | 数据模型、系统定义、默认图层和解释 |
| `app/core/explosion-layout.ts` | 可见零件的分解布局 |
| `app/core/pointer-tap.ts` | 点击、拖动、多指和取消状态 |
| `app/core/model-download.ts` | 模型响应与 gzip 解压 |
| `app/core/agent-tools.ts` | 搜索/检查工具契约 |
| `app/rendering/materials.ts` | 系统材质、位置/选择纹理和着色器 |
| `app/rendering/draw-batches.ts` | 可见索引压紧和绘制范围 |
| `client/` | 中英文与平台桥接 |
| `src-tauri/` | 原生窗口、权限与打包 |

数据与交互模块不创建 WebGL 上下文。渲染模块不管理 React 状态；资源由场景创建并统一释放。模型 ID、源数据和已有 UI 保持不变。模型转换、压缩与检查脚本继续放在 `scripts/`。

## 统一检查入口

Node.js 22.18+，安装锁文件依赖后执行：

```sh
npm ci
npm run ci:check
```

入口 `scripts/ci-check.mjs` 依次执行下列已有检查和构建，任何一步失败立即返回非零退出码。使用 npm 的 JavaScript 入口启动子进程，兼容 Windows/Linux，无需 shell 拼接。

1. `check`：TypeScript。
2. `validate:locales`：术语覆盖、文案、双语搜索和语言存储。
3. `validate:atlas`：模型映射与二进制数据。
4. `validate:interactions`：布局与交互契约。
5. `build`：网页构建。
6. `build:client`：客户端前端构建。
7. `validate:client`：解压异常、打包资产和 Windows 配置。

## GitHub Actions

`.github/workflows/ci.yml` 在 main 推送、PR 和手动启动时运行：

- `checks`（Ubuntu）：`npm ci` → `npm run ci:check`。
- `windows`（Windows，依赖 checks 成功）：安装 Node/Rust 和锁文件依赖 → Rust 格式检查 → NSIS 构建 → 上传安装包 artifact。

同分支旧运行会被取消；仓库权限仅为读取；工作流不发布 Release。原有 Windows 工作流由此文件替代，避免重复运行检查。CI 不包含真实设备操作或性能测量。
