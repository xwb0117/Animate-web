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

当前支持的 Mesh 与中文 Prompt 一一对应如下（完整角色描述只在说明文档和后端，不在工作台提示）。角色动作会匹配已有片段，不是即时生成全新动作：

| 输入 Mesh | Prompt |
| --- | --- |
| 武僧@Lv1 | 固定机位，全身镜头。武僧从侧身开掌起势，双臂先在胸前交叉；一手经面前绕至头顶，另一手向下展开。随后转向正面张开双臂，再于胸前合掌，分掌后回到侧身开掌。动作缓慢流畅，双脚基本保持原地，整套重复三次。 |
| 武僧@Lv2 | 固定机位，全身镜头。武僧从格斗守势迅速降低重心，完成一次贴地旋转扫腿；借势起身腾空转体，伸腿踢出高位一脚。收腿稳定落地，双臂交叉收势，向前跨步伸掌，最后回到最初守势。严格按扫腿、腾空、高踢、落地、伸掌的顺序，整套重复三次。 |
| 武僧@Lv3 | 固定机位，全身镜头。武僧从开掌守势向斜前方跨步蓄力，双脚交叉换位后快速转身，落入弓步，朝镜头打出一记有力直拳；随后收拳并恢复开掌守势。动作连贯有力，只做一次，不踢腿、不跳跃。 |
| 叶问@Lv1 | 固定机位，全身镜头。叶问保持窄步稳站，双手护住身体中线，左右交替做摊手、护手与短距离日字冲拳；上身轻微转动卸力，最后收回问手守势。动作克制精准，脚步只做小幅重心转移，整套重复三次。 |
| 叶问@Lv2 | 固定机位，全身镜头。叶问从咏春守势连续打出沿中线的快速连环拳，中途用拍手拨开来招，转身以膀手防守；随后短步向前压进，一手出拳、一手护住中线，再后撤半步回到守势。拳路紧凑有节奏，整套重复三次。 |
| 叶问@Lv3 | 固定机位，全身镜头。叶问从正面问手守势开始，侧身格挡后立刻用后手直拳反击，接续拍手、数记日字冲拳与一次近身肘击；向斜前方踏步定势，再收手回到守势。动作迅速紧凑，只完成一次。 |
| 虎头少女@Lv1 | 固定机位，全身镜头。虎头少女从侧身放松站姿开始，随节奏摆动双臂，向侧方踏步并抬起一侧膝盖；换脚后轻巧转身，落地张开双臂，配合俏皮的肩部与头部摆动，最后回到起始姿势。动作轻快活泼，基本保持原地，整套重复三次。 |
| 虎头少女@Lv2 | 固定机位，全身镜头。虎头少女从防守站姿下沉为宽步，向左右斜前方交替出拳；随后向前跨步转身，以前臂横向格挡，再回身打出一记有力直拳。双脚收回并恢复最初守势，动作连贯有力，整套重复三次。 |
| 虎头少女@Lv3 | 固定机位，全身镜头。虎头少女从侧身格斗姿势蓄力，抬膝后快速转髋，伸直攻击腿完成一次水平旋转踢；随即收腿稳稳落地，双臂抬起护住上身，回到最初守势。动作干净有爆发力，只踢一次，不追加第二脚。 |
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
