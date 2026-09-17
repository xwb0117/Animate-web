import test from 'node:test';
import assert from 'node:assert/strict';
import { matchMotion } from './match-motion.mjs';

test('G1 and B1 Chinese prompts select distinct URDF motions', () => {
  assert.equal(matchMotion('宇树 G1', '打太极').action, 'taichi');
  assert.equal(matchMotion('宇树 G1', '跑步').action, 'run');
  assert.equal(matchMotion('宇树 G1', '波比跳').action, 'burpee');
  assert.equal(matchMotion('宇树 B1', '慢走').action, 'walk');
  assert.equal(matchMotion('宇树 B1', '小跑').action, 'trot');
  assert.equal(matchMotion('宇树 B1', '坐下').action, 'sit');
  assert.throws(() => matchMotion('宇树 B1', '打太极'));
});

test('existing characters also accept short Chinese prompts', () => {
  assert.equal(matchMotion('武僧', '扫腿').key, '武僧@Lv2');
  assert.equal(matchMotion('叶问', '连环拳').key, '叶问@Lv2');
  assert.equal(matchMotion('虎头少女', '跳舞').key, '虎头少女@Lv1');
});

test('cabinet parses left drawer and left doors independently', () => {
  const result = matchMotion('组合柜', '上方左边的抽屉打开，左侧门打开');
  assert.deepEqual(result.targets, { joint_0:1, joint_1:1, joint_2:0, joint_3:1, joint_4:0, joint_5:0 });
});

test('cabinet combines closing drawers with opening doors', () => {
  const result = matchMotion('组合柜', '抽屉全部闭合，门全部打开');
  assert.equal(result.starts.joint_2, 1);
  assert.equal(result.starts.joint_3, 1);
  assert.equal(result.targets.joint_2, 0);
  assert.equal(result.targets.joint_3, 0);
  for (const name of ['joint_0','joint_1','joint_4','joint_5']) assert.equal(result.targets[name], 1);
});

test('cabinet maps right drawer and right doors to their URDF joints', () => {
  const result = matchMotion('组合柜', '右边抽屉打开，右侧门打开');
  assert.deepEqual(result.targets, { joint_0:0, joint_1:0, joint_2:1, joint_3:0, joint_4:1, joint_5:1 });
});

test('unsupported cabinet instructions fail instead of silently selecting another animation', () => {
  assert.throws(() => matchMotion('组合柜', '让柜子旋转'));
});
