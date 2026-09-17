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
- 自由填写中文 Prompt 与运动参数；工作台不展示示例 Mesh 或 Prompt 提示
- 模拟生成进度及播放控制
- 使用 `fbx_final` 中真实视频的前、后、左、右四视角结果
- 可选择输出模式：原有角色默认导出无场景动画 FBX；开启 Include scene 后输出带场景四视角视频。URDF 示例的开关控制预览环境，并可录制当前视角 WebM
- 基于宇树官方 URDF 的 G1（29 个可动关节）、B1（12 个可动关节）和基于 PartNet-Mobility 40417 URDF 的组合柜（6 个可动关节）示例
- 简短中文动作描述：G1 支持太极、跑步、波比跳、挥手、深蹲；B1 支持慢走、小跑、坐下、俯身、抬右前爪；组合柜支持抽屉和柜门的组合开合

工作台初始为空。点击首页案例只会打开空白工作台，不会预加载 Mesh。请从本地手动选择 GLB / OBJ / FBX，拖入 **Source mesh**，自行填写对应的中文 Prompt，再点击 **Generate motion**。工作台不提供示例文件下载或动作提示。项目中的三个 URDF 输入 GLB 位于：

- [`AETHR-G1.glb`](public/input-models/AETHR-G1.glb)：打太极、跑步、波比跳、挥手、深蹲（也可输入“下蹲”）
- [`AETHR-B1.glb`](public/input-models/AETHR-B1.glb)：慢走、小跑、坐下、俯身、抬右前爪
- [`AETHR-Cabinet.glb`](public/input-models/AETHR-Cabinet.glb)：抽屉与柜门的组合开合

网站通过 GLB 中的 URDF 关节节点识别这三个输入，改文件名仍可识别。PartNet 40417 的旧版 `glb/c000_t000.glb` 也可拖入并映射到新版组合柜；其他任意 GLB 目前只能预览，不能自动获得关节动画。

G1 和 B1 的关节树、轴、限位及可视化 Mesh 来自 [Unitree 官方 `unitree_ros`](https://github.com/unitreerobotics/unitree_ros/tree/master/robots) 中的 `g1_29dof_mode_15.urdf` 和 `b1.urdf`；柜体来自本地 PartNet-Mobility `raw_dataset/40417/mobility.urdf`。网页输入 GLB 位于 `public/input-models/`，关节元数据和海报位于 `public/unitree/`，URDF 快照位于 `assets/urdf/`。柜体有 2 个抽屉、4 扇门；“左侧门”控制左侧两扇门。关节体结果可交互切换四视角，导出每秒 30 帧的关节曲线 JSON，并使用浏览器录制当前视角的 WebM 视频；当前并不生成 FBX 或预渲染 MP4。G1/B1 动作是遵循 URDF 关节限位的网页运动演示，没有经过动力学、平衡和真实机器人安全验证，不能直接下发到硬件。

当前支持的 Mesh 与中文 Prompt 一一对应如下（这些词只在说明文档和后端，不在工作台提示）：

| 输入 Mesh | Prompt |
| --- | --- |
| 武僧@Lv1 | 合掌 |
| 武僧@Lv2 | 扫腿 |
| 武僧@Lv3 | 直拳 |
| 叶问@Lv1 | 摊手 |
| 叶问@Lv2 | 连环拳 |
| 叶问@Lv3 | 肘击 |
| 虎头少女@Lv1 | 跳舞 |
| 虎头少女@Lv2 | 格挡出拳 |
| 虎头少女@Lv3 | 旋转踢 |
| 宇树 G1 | 打太极、跑步、波比跳、挥手、下蹲 |
| 宇树 B1 | 慢走、小跑、坐下、俯身、抬右前爪 |
| 组合柜 | 上方左边的抽屉打开，左侧门打开；抽屉全部打开，门全部打开；抽屉全部闭合，门全部打开 |

九套角色动作匹配位于 `server/motion-catalog.json`，URDF 示例中文指令解析位于 `server/match-motion.mjs`，关节动画曲线位于 `src/urdf-motion.js`。当前是针对已有角色动作和 URDF 示例的演示流程，不是开放式文本生成模型。

如需重新生成 URDF 示例资产，先取得 Unitree 官方 `unitree_ros` 仓库及 PartNet-Mobility 40417 数据，再安装 Python `trimesh`、`numpy`、`pycollada`，运行：

```bash
python scripts/build_unitree_models.py --source /path/to/unitree_ros --cabinet-urdf /path/to/40417/mobility.urdf --output public/unitree
```

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
