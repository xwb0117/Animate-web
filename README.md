# Animesh Studio

AI 角色动画网站原型，包含品牌首页与可交互工作台。

## 启动

```bash
npm install
npm run dev
```

打开终端显示的本地地址。首页点击 **Start creating** 进入工作台。

## 已实现

- 高级暗色品牌首页与案例展示
- 使用本地 FBX / OBJ 数据的 Three.js 交互预览
- 使用从 Blender 导出的带材质槽 GLB 进行网页预览，保留 cloth、skin、shoe、hair 等角色材质分区
- 鼠标旋转、缩放和平移 Mesh
- 拖放或选择新的 FBX / OBJ 文件
- Prompt 输入、快捷提示词与运动参数
- 模拟生成进度及播放控制
- 使用 `fbx_final` 中真实视频的前、后、左、右四视角结果
- 可选择输出模式：默认导出无场景动画 FBX；开启 Include scene 后输出带场景四视角视频
- 示例角色一键切换

工作台初始为空。上传 `public/meshes` 中提取的九个示例 OBJ、输入 Prompt 并点击生成后，才会显示与 Mesh 一一对应的动画结果。

九套后台 Prompt 映射位于 `server/motion-map.json`，不会在前端加载或展示。当前“生成”按钮展示完整产品交互流程；接入 API 后只需替换 `generate` 函数中的模拟进度逻辑，并将返回的 FBX/视频地址更新到结果区。

重新从 `fbx` 提取无动画静态 Mesh：

```bash
npm run extract:meshes
```

网页使用的角色 GLB 位于 `public/models`。它们从 `fbx_final` 的 Blender 文件中导出，包含角色骨骼、动画和材质槽；原始 FBX 继续作为无场景动画的下载格式。

## 部署为公开网址

项目已经包含生产服务和 Render 配置。生产模式下，一个 Node 服务会同时提供网页、FBX/视频资源和 `/api/generate` 接口。

本地验证生产版本：

```bash
npm run build
npm start
```

浏览器打开 `http://localhost:3000`。

部署到 Render：

1. 将项目提交并推送到 GitHub 仓库。
2. 登录 Render，选择 **New → Blueprint**。
3. 连接该 GitHub 仓库。
4. Render 会读取根目录的 `render.yaml`，自动执行 `npm ci && npm run build` 和 `npm start`。
5. 部署完成后会获得 `https://animesh-studio-xxxx.onrender.com` 形式的公开网址。

`fbx_final` 原始渲染目录体积很大，已排除在 Git 上传之外；网站使用的是 `public/media` 中压缩后的网页视频。
