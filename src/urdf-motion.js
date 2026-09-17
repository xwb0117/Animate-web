import g1 from './unitree-g1.json';
import b1 from './unitree-b1.json';
import cabinet from './unitree-cabinet.json';

export const urdfDefinitions = { g1, b1, cabinet };

const TAU = Math.PI * 2;
const sin = Math.sin;
const ease = value => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };

function g1Pose(action, time) {
  const q = {};
  let rootY = 0;
  if (action === 'taichi') {
    const p = TAU * time / 2.8;
    q.left_shoulder_pitch_joint = -.8 + .42 * sin(p);
    q.right_shoulder_pitch_joint = -.8 - .42 * sin(p);
    q.left_shoulder_roll_joint = .5 + .25 * sin(p + Math.PI / 2);
    q.right_shoulder_roll_joint = -.5 - .25 * sin(p + Math.PI / 2);
    q.left_elbow_joint = q.right_elbow_joint = .85;
    q.left_wrist_roll_joint = .35 * sin(p);
    q.right_wrist_roll_joint = -.35 * sin(p);
    q.waist_yaw_joint = .24 * sin(p);
    q.left_hip_pitch_joint = -.08 * sin(p);
    q.right_hip_pitch_joint = .08 * sin(p);
  } else if (action === 'run') {
    const p = TAU * time / .86;
    q.left_hip_pitch_joint = -.55 * sin(p);
    q.right_hip_pitch_joint = .55 * sin(p);
    q.left_knee_joint = .12 + .95 * Math.max(0, sin(p));
    q.right_knee_joint = .12 + .95 * Math.max(0, -sin(p));
    q.left_ankle_pitch_joint = -.18 * sin(p);
    q.right_ankle_pitch_joint = .18 * sin(p);
    q.left_shoulder_pitch_joint = .62 * sin(p);
    q.right_shoulder_pitch_joint = -.62 * sin(p);
    q.left_elbow_joint = q.right_elbow_joint = .9;
    rootY = .065 * (1 - Math.cos(2 * p));
  } else if (action === 'burpee') {
    const p = (time % 3.5) / 3.5;
    const crouch = p < .23 ? ease(p / .23) : p < .49 ? 1 : p < .65 ? 1 - ease((p - .49) / .16) : 0;
    const jump = p > .65 && p < .93 ? sin(Math.PI * (p - .65) / .28) : 0;
    q.left_hip_pitch_joint = q.right_hip_pitch_joint = -1.05 * crouch;
    q.left_knee_joint = q.right_knee_joint = 1.75 * crouch;
    q.left_ankle_pitch_joint = q.right_ankle_pitch_joint = -.52 * crouch;
    q.left_shoulder_pitch_joint = q.right_shoulder_pitch_joint = -1.15 * crouch + .9 * jump;
    q.left_elbow_joint = q.right_elbow_joint = .35 * crouch;
    rootY = -.34 * crouch + .22 * jump;
  } else if (action === 'wave') {
    const p = TAU * time / 1.3;
    q.right_shoulder_pitch_joint = -1.1;
    q.right_shoulder_roll_joint = -.58;
    q.right_elbow_joint = 1.1 + .35 * sin(p);
    q.right_wrist_roll_joint = .55 * sin(p);
    q.left_elbow_joint = .25;
  } else if (action === 'squat') {
    const p = TAU * time / 2.5;
    const bend = .5 * (1 - Math.cos(p));
    q.left_hip_pitch_joint = q.right_hip_pitch_joint = -.82 * bend;
    q.left_knee_joint = q.right_knee_joint = 1.48 * bend;
    q.left_ankle_pitch_joint = q.right_ankle_pitch_joint = -.5 * bend;
    q.left_shoulder_pitch_joint = q.right_shoulder_pitch_joint = -.35 * bend;
    rootY = -.27 * bend;
  }
  return { q, rootY };
}

function b1Pose(action, time) {
  const q = {};
  const legs = ['FR', 'FL', 'RR', 'RL'];
  for (const leg of legs) {
    q[`${leg}_hip_joint`] = 0;
    q[`${leg}_thigh_joint`] = .8;
    q[`${leg}_calf_joint`] = -1.5;
  }
  let rootY = 0;
  if (action === 'walk' || action === 'trot') {
    const fast = action === 'trot';
    const p = TAU * time / (fast ? .85 : 1.6);
    const offsets = fast ? { FR:0, RL:0, FL:Math.PI, RR:Math.PI } : { FR:0, RL:Math.PI / 2, FL:Math.PI, RR:3 * Math.PI / 2 };
    for (const leg of legs) {
      const swing = sin(p + offsets[leg]);
      q[`${leg}_thigh_joint`] += (fast ? .48 : .28) * swing;
      q[`${leg}_calf_joint`] += (fast ? .42 : .3) * Math.max(0, swing);
    }
    rootY = fast ? .04 * (1 - Math.cos(2 * p)) : .015 * sin(2 * p);
  } else if (action === 'sit' || action === 'bow') {
    const bend = ease(Math.min(time / .9, 1));
    for (const leg of legs) {
      const front = leg.startsWith('F');
      const folding = action === 'sit' ? !front : front;
      q[`${leg}_thigh_joint`] += (folding ? .95 : -.15) * bend;
      q[`${leg}_calf_joint`] += (folding ? -.7 : .2) * bend;
    }
    rootY = (action === 'sit' ? -.18 : -.1) * bend;
  } else if (action === 'paw') {
    const lift = ease(Math.min(time / .6, 1));
    q.FR_thigh_joint = .8 + .75 * lift;
    q.FR_calf_joint = -1.5 + .55 * lift;
    q.FR_hip_joint = .12 * lift * sin(TAU * time / 1.1);
    rootY = -.03 * lift;
  }
  return { q, rootY };
}

function cabinetPose(motion, time) {
  const p = (time % motion.duration) / motion.duration;
  const blend = p < .42 ? ease(p / .42) : p < .68 ? 1 : 1 - ease((p - .68) / .32);
  const q = {};
  for (const [name, joint] of Object.entries(cabinet.joints)) {
    const start = motion.starts?.[name] || 0;
    const target = motion.targets?.[name] || 0;
    q[name] = joint.limit[0] + (start + (target - start) * blend) * (joint.limit[1] - joint.limit[0]);
  }
  return { q, rootY:0 };
}

export function urdfPose(kind, motion, time) {
  const raw = kind === 'g1' ? g1Pose(motion?.action, time) : kind === 'b1' ? b1Pose(motion?.action, time) : motion ? cabinetPose(motion, time) : { q:{}, rootY:0 };
  const limits = urdfDefinitions[kind].joints;
  const q = Object.fromEntries(Object.entries(limits).map(([name, joint]) => {
    const value = raw.q[name] || 0;
    return [name, Math.max(joint.limit[0], Math.min(joint.limit[1], value))];
  }));
  return { q, rootY:raw.rootY };
}

export function sampleUrdfFrames(motion) {
  const count = Math.ceil(motion.duration * 30);
  return Array.from({ length:count + 1 }, (_, frame) => {
    const time = Math.min(frame / 30, motion.duration - .0001);
    const pose = urdfPose(motion.key, motion, time);
    return { frame, time:Number(time.toFixed(4)), joint_qpos:pose.q, root_y:pose.rootY };
  });
}
