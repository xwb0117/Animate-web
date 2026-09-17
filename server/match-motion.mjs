import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'server/motion-catalog.json'), 'utf8'));
const robotActions = [
  { key: 'taichi', label: '太极', words: ['太极', '缓慢挥手', '柔和武术'] },
  { key: 'run', label: '跑步', words: ['跑步', '慢跑', '原地跑'] },
  { key: 'burpee', label: '波比跳', words: ['波比跳', '下蹲起跳', '蹲跳'] },
  { key: 'wave', label: '挥手', words: ['挥手', '招手'] },
  { key: 'squat', label: '深蹲', words: ['深蹲', '蹲下再站起'] }
];
const shortPrompts = {
  '武僧': { '合掌': '武僧@Lv1', '扫腿': '武僧@Lv2', '直拳': '武僧@Lv3' },
  '叶问': { '摊手': '叶问@Lv1', '连环拳': '叶问@Lv2', '肘击': '叶问@Lv3' },
  '虎头少女': { '跳舞': '虎头少女@Lv1', '格挡出拳': '虎头少女@Lv2', '旋转踢': '虎头少女@Lv3' }
};

function matchCabinet(prompt) {
  const target = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`joint_${index}`, 0]));
  const starts = { ...target };
  let found = false;
  for (const clause of prompt.split(/[，,；;。\n]+/).map(s => s.trim()).filter(Boolean)) {
    const open = /打开|拉开|开启|展开/.test(clause);
    const close = /关闭|关上|闭合|合上|收回|推回/.test(clause);
    if (open === close) throw new Error(`无法判断“${clause}”是打开还是关闭`);
    const value = open ? 1 : 0;
    let joints = [];
    if (/抽屉/.test(clause)) {
      if (/左/.test(clause)) joints = ['joint_2'];
      else if (/右/.test(clause)) joints = ['joint_3'];
      else joints = ['joint_2', 'joint_3'];
    } else if (/门/.test(clause)) {
      if (/左/.test(clause)) joints = ['joint_4', 'joint_5'];
      else if (/右/.test(clause)) joints = ['joint_0', 'joint_1'];
      else joints = ['joint_0', 'joint_1', 'joint_4', 'joint_5'];
    }
    if (!joints.length) throw new Error(`无法识别“${clause}”对应的柜体部件`);
    for (const joint of joints) { target[joint] = value; starts[joint] = 1 - value; }
    found = true;
  }
  if (!found) throw new Error('请描述要打开或关闭的抽屉、柜门');
  return { type: 'articulated', key: 'cabinet', character: '组合柜', label: '柜体组合动作', targets: target, starts, duration: 3 };
}

export function matchMotion(character, prompt) {
  const text = String(prompt || '').trim();
  if (!text) throw new Error('请输入动作描述');
  if (character === '宇树机器人') {
    const action = robotActions.find(item => item.words.some(word => text.includes(word)));
    if (!action) throw new Error('机器人支持：打太极、跑步、波比跳、挥手、深蹲');
    return { type: 'articulated', key: 'robot', character, action: action.key, label: action.label, duration: action.key === 'burpee' ? 3.2 : 2.4 };
  }
  if (character === '组合柜') return matchCabinet(text);
  const alias = Object.entries(shortPrompts[character] || {}).find(([word]) => text.includes(word));
  if (alias) {
    const item = catalog.find(entry => entry.key === alias[1]);
    return { type: 'catalog', key: item.key, character: item.character, level: item.level };
  }
  const candidates = catalog.filter(item => item.character === character);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim();
  let match = candidates.find(item => item.prompt.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim() === normalized);
  if (!match) {
    const ranked = candidates.map(item => ({ item, score: item.keywords.reduce((sum, word) => sum + (normalized.includes(word.toLowerCase()) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score);
    match = ranked[0]?.score > 0 ? ranked[0].item : null;
  }
  if (!match) throw new Error('该角色没有匹配的动作，请使用对应的中文动作描述');
  return { type: 'catalog', key: match.key, character: match.character, level: match.level };
}
