import test from 'node:test';
import assert from 'node:assert/strict';
import { matchMotion } from './match-motion.mjs';

test('robot Chinese prompts select different motions', () => {
  assert.equal(matchMotion('宇树机器人', '打太极').action, 'taichi');
  assert.equal(matchMotion('宇树机器人', '跑步').action, 'run');
  assert.equal(matchMotion('宇树机器人', '波比跳').action, 'burpee');
  assert.throws(() => matchMotion('宇树机器人', '跳舞'));
});

test('existing characters also accept short Chinese prompts', () => {
  assert.equal(matchMotion('武僧', '扫腿').key, '武僧@Lv2');
  assert.equal(matchMotion('叶问', '连环拳').key, '叶问@Lv2');
  assert.equal(matchMotion('虎头少女', '跳舞').key, '虎头少女@Lv1');
});

test('cabinet parses left drawer and left doors independently', () => {
  const result = matchMotion('组合柜', '上方左边的抽屉打开，左侧门打开');
  assert.deepEqual(result.targets, { joint_0:0, joint_1:0, joint_2:1, joint_3:0, joint_4:1, joint_5:1 });
});

test('cabinet combines closing drawers with opening doors', () => {
  const result = matchMotion('组合柜', '抽屉全部闭合，门全部打开');
  assert.equal(result.starts.joint_2, 1);
  assert.equal(result.starts.joint_3, 1);
  assert.equal(result.targets.joint_2, 0);
  assert.equal(result.targets.joint_3, 0);
  for (const name of ['joint_0','joint_1','joint_4','joint_5']) assert.equal(result.targets[name], 1);
});

test('unsupported cabinet instructions fail instead of silently selecting another animation', () => {
  assert.throws(() => matchMotion('组合柜', '让柜子旋转'));
});
