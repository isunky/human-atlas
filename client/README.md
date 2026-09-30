# 客户端开发

## 目录边界

- `app/`：网页和客户端共用的查看器、场景和模型加载逻辑。
- `client/platform/`：运行环境判断与外部链接桥接。
- `client/i18n/`：界面文案、术语草稿和生成来源。
- `src-tauri/`：原生窗口、权限和安装配置。
- `public/models/`：原始网页资源；客户端构建只打包 gzip 模型，原始文件保持完整。
- `dist/` 与 `dist-client/`：分别为网页和客户端构建产物。

## Windows 构建

需要 Node.js 22.13+、Rust MSVC 工具链、Visual Studio C++ Build Tools 和 Windows SDK。依赖版本由 npm 与 Cargo 锁文件固定。

```powershell
npm ci
npm run client:dev
# 生成当前用户安装的 NSIS 安装包
npm run client:build
```

产物位于 `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`。需要 WebView2；安装程序在缺少运行时时使用联网引导程序。第一次 Rust 构建可能需要数分钟。仅在本机缓存完整且网络不可用时，可以在当前 PowerShell 进程设置 `$env:CARGO_NET_OFFLINE='true'`。

网页命令 `npm run dev` / `npm run build` 继续可用。原生窗口根据屏幕工作区限制初始大小；仅批准来源页面的 HTTPS 外链通过系统浏览器打开。

## 中文术语审校

`terms.zh-CN.json` 包含 5,090 个唯一源名称，覆盖模型零件和复合概念。中文名称是规则生成并补充常见词组的完整草稿，尚未经医学专家审校。源 ID、英文名称和模型归属保持不变。

审校时优先修改 `phrases.json` 的完整短语；词根规则在 `lexicon.txt`。随后运行：

```powershell
node scripts/generate-terms.mjs
npm run validate:locales
```

生成会覆盖术语 JSON，勿只修改生成文件而遗漏来源。`terms.metadata.json` 记录生成方法和草稿状态。切换语言不会重建 Three.js 场景；搜索始终支持中文、英文、源 ID。

## 验证

```powershell
npm run check
npm run validate:locales
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
npm run build
npm run build:client
npm run validate:client
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

Windows CI 执行检查并上传测试安装包，不发布 Release。模型解压兼容原生 DecompressionStream 与 fflate 回退，拒绝截断和错误长度数据。

显隐变化会压紧对应批次的绘制索引，隐藏系统不提交三角形；隔离模式仅提交选中结构，分解视图的点标记也仅绘制可见零件。选中的隐藏系统零件仍按原有规则显示。索引只在批次可见集合变化时更新，分解动画不重复上传索引。为支持恢复显示，每个批次在 CPU 保留一份原始索引；切换系统减少绘制工作，但不释放已加载模型的显存。

CPU 调度按需运行：静止且相机阻尼结束后停止请求动画帧，交互、状态修改、窗口变化和分块加载会唤醒；页面隐藏时暂停。爆炸动画缓存可见零件集合与系统展开方向，仅更新可见零件的位置，选择纹理只在选择/显隐变化时上传。屏幕拾取范围在指针需要时计算并缓存，相机或位置变化后失效。

## 后续平台

macOS 需要在 macOS 上构建 DMG，并配置签名、公证及 Intel/Apple Silicon 验证。Android 需要 JDK、Android SDK/NDK，初始化 Tauri Android 工程，补充手机触控、返回键、生命周期与真实设备性能验证。当前未交付这两个平台安装包。
