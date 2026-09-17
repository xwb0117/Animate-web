# AETHR Studio

AETHR 动画网站原型，包含品牌首页、角色动画工作台，以及可交互的关节体示例。

## 启动

```bash
npm install
npm run dev
```

打开终端显示的本地地址。首页点击 **Start creating** 进入工作台。

## 已实现

- 高级暗色品牌首页与案例展示
- 使用本地 FBX / OBJ / GLB 数据的 Three.js 交互预览
- 使用从 Blender 导出的带材质槽 GLB 进行网页预览，保留 cloth、skin、shoe、hair 等角色材质分区
- 鼠标旋转、缩放和平移 Mesh
- 拖放或选择新的 FBX / OBJ / GLB 文件
- Prompt 输入、快捷提示词与运动参数
- 模拟生成进度及播放控制
- 使用 `fbx_final` 中真实视频的前、后、左、右四视角结果
- 可选择输出模式：默认导出无场景动画 FBX；开启 Include scene 后输出带场景四视角视频
- 示例角色一键切换
- 宇树机器人与六关节组合柜示例，可在首页进入，也可从工作台加载示例 Mesh
- 用简短中文控制机器人的太极、跑步、波比跳、挥手、深蹲，或组合柜的抽屉/柜门开合

工作台初始为空。上传角色示例 Mesh 或加载关节体示例、输入 Prompt 并点击生成后，才会显示对应的动画结果。也可直接拖入上述两个数据集的 `glb/c000_t000.glb`，网站会匹配其关节分件与定义；其他任意 GLB 目前只能预览，不能自动获得关节动画。

关节体示例的 Mesh 来自 `HumanoidRobot/000_total12` 与 `StorageFurniture/40417/000_total06` 的 GLB 零件；关节轴与限位来自同目录的 `joint_dict_glb.json`。这两个样本目录没有独立的 `.urdf` 文件，因此当前实现根据导出的关节数据还原运动。机器人只有 12 个可动俯仰关节，跑步是原地跑示意，波比跳是限位内的下蹲与起跳示意，并非经动力学验证的完整动作。柜体有 2 个抽屉、4 扇门；“左侧门”控制左侧两扇门。关节体结果可交互切换四视角，导出每秒 30 帧的关节曲线 JSON，并使用浏览器录制当前视角的 WebM 视频；目前没有为这两类示例生成 FBX 或预渲染 MP4。

可输入的简短中文示例：

```text
宇树机器人：打太极 / 跑步 / 波比跳 / 挥手 / 深蹲
组合柜：上方左边的抽屉打开，左侧门打开
组合柜：抽屉全部打开，门全部打开
组合柜：抽屉全部闭合，门全部打开
```

九套角色动作匹配位于 `server/motion-catalog.json`，关节体中文指令解析位于 `server/match-motion.mjs`。当前是针对已有角色动作和新关节体的演示流程，不是开放式文本生成模型。

运行测试：

```bash
npm test
```

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
