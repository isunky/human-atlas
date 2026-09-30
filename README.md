# Human Atlas

## Windows 客户端（0.1.0 测试版）

[下载 Windows 测试版安装包](https://github.com/isunky/human-atlas/releases/tag/v0.1.0)。运行 `Human Atlas_0.1.0_x64-setup.exe` 即可安装，支持 Windows x64，按当前用户安装。测试包尚未签名，Windows 可能显示未知发布者提示。

首次打开默认简体中文，可在左上角切换 English，语言设置会保存在本机。可搜索中文、英文和源 ID，查看结构详情、隔离结构、切换图层和分解人体模型。模型随安装包提供，启动和浏览不需要服务器或账号；查看来源链接需要联网。

客户端依赖 Microsoft Edge WebView2。已安装运行时的电脑可以离线安装；缺少运行时的电脑需要联网由安装程序下载。5,090 个中文名称均为待审校草稿，界面保留英文原名便于核对。

安装后可从开始菜单启动 **Human Atlas**。语言等 WebView 数据由 Windows 保存在应用的数据目录，升级安装时不需要重新下载解剖模型。卸载请使用 Windows“已安装的应用”。若窗口空白，先检查 WebView2 和显卡驱动；若模型加载失败，重新启动或重新安装测试包。

构建和目录说明见 [客户端开发文档](client/README.md)。本阶段提供 Windows 安装包；macOS 与 Android 尚未构建和验证。

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference apart into **2,234 individually selectable meshes**, explore **15 anatomical systems**, and search **3,432 named concepts**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Validate

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
npm run build
```

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, and tap-versus-drag handling. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, and 390×844, 320×568, and 844×390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**. It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh. The packaged model contains 2,288,268 triangles and downloads approximately 33 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Visibility changes compact each affected batch's index buffer to submit only visible structures; entirely hidden batches skip drawing. Per-structure GPU textures control translation and selection, while component geometry supports accurate picking. Exploded layouts and point markers include only visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, and the `dist` output directory. It can also be served by a static host.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own CC BY 4.0 license**; preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
