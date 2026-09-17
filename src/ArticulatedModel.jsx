import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import robotJoints from './robot-joints.json';
import cabinetJoints from './cabinet-joints.json';

const robotNames = Object.entries(robotJoints).filter(([, joint]) => joint.type !== 'fixed').map(([name]) => name);
const cabinetNames = Object.entries(cabinetJoints).filter(([, joint]) => joint.type !== 'fixed').map(([name]) => name);
const robotInitial = { left_knee_joint: .12, right_knee_joint: .12, left_elbow_joint: .58, right_elbow_joint: .58 };

function robotPose(action, time) {
  const q = { ...robotInitial };
  if (action === 'taichi') {
    const phase = time * Math.PI * 2 / 2.4;
    q.left_shoulder_pitch_joint = .4 * Math.sin(phase);
    q.right_shoulder_pitch_joint = -.4 * Math.sin(phase);
    q.left_elbow_joint = .55 + .25 * Math.cos(phase);
    q.right_elbow_joint = .55 - .25 * Math.cos(phase);
    q.left_wrist_pitch_joint = .2 * Math.sin(phase + .5);
    q.right_wrist_pitch_joint = -.2 * Math.sin(phase + .5);
    q.left_hip_pitch_joint = .1 * Math.sin(phase);
    q.right_hip_pitch_joint = -.1 * Math.sin(phase);
    return { q, bob: .015 * Math.sin(phase) };
  }
  if (action === 'run') {
    const phase = time * Math.PI * 2 / .8;
    q.left_hip_pitch_joint = .24 * Math.sin(phase);
    q.right_hip_pitch_joint = -.24 * Math.sin(phase);
    q.left_knee_joint = .12 + .48 * Math.max(0, Math.sin(phase));
    q.right_knee_joint = .12 + .48 * Math.max(0, -Math.sin(phase));
    q.left_ankle_pitch_joint = -.16 * Math.sin(phase);
    q.right_ankle_pitch_joint = .16 * Math.sin(phase);
    q.left_shoulder_pitch_joint = -.43 * Math.sin(phase);
    q.right_shoulder_pitch_joint = .43 * Math.sin(phase);
    return { q, bob: .06 * (1 - Math.cos(phase * 2)) };
  }
  if (action === 'burpee') {
    const phase = (time % 3.2) / 3.2;
    const crouch = phase < .22 ? phase / .22 : phase < .44 ? 1 : phase < .62 ? 1 - (phase - .44) / .18 : 0;
    const jump = phase >= .62 && phase <= .92 ? Math.sin(Math.PI * (phase - .62) / .3) : 0;
    q.left_hip_pitch_joint = q.right_hip_pitch_joint = .33 * crouch;
    q.left_knee_joint = q.right_knee_joint = .12 + .5 * crouch;
    q.left_shoulder_pitch_joint = q.right_shoulder_pitch_joint = .5 * (crouch - jump);
    q.left_elbow_joint = q.right_elbow_joint = .58 + .23 * crouch;
    return { q, bob: -.22 * crouch + .23 * jump };
  }
  if (action === 'wave') {
    const phase = time * Math.PI * 2 / 1.2;
    q.right_shoulder_pitch_joint = -.4;
    q.right_elbow_joint = .65 + .17 * Math.sin(phase);
    q.right_wrist_pitch_joint = .2 * Math.sin(phase);
    return { q, bob: 0 };
  }
  if (action === 'squat') {
    const phase = time * Math.PI * 2 / 2.4;
    const bend = .5 * (1 - Math.cos(phase));
    q.left_hip_pitch_joint = q.right_hip_pitch_joint = .32 * bend;
    q.left_knee_joint = q.right_knee_joint = .12 + .5 * bend;
    q.left_shoulder_pitch_joint = q.right_shoulder_pitch_joint = .2 * bend;
    return { q, bob: -.22 * bend };
  }
  return { q, bob: 0 };
}

function jointParent(name) {
  if (name.includes('elbow')) return name.replace('elbow', 'shoulder_pitch');
  if (name.includes('wrist')) return name.replace('wrist', 'elbow');
  if (name.includes('knee')) return name.replace('knee', 'hip_pitch');
  if (name.includes('ankle')) return name.replace('ankle', 'knee');
  return null;
}

function cabinetPose(motion, time) {
  const duration = motion.duration || 3;
  const phase = (time % duration) / duration;
  const blend = phase < .4 ? phase / .4 : phase < .68 ? 1 : Math.max(0, 1 - (phase - .68) / .32);
  const smooth = blend * blend * (3 - 2 * blend);
  return Object.fromEntries(cabinetNames.map(name => {
    const start = motion.starts?.[name] || 0;
    const end = motion.targets?.[name] || 0;
    return [name, (start + (end - start) * smooth) * cabinetJoints[name].limit[1]];
  }));
}

export function sampleArticulatedFrames(motion) {
  const count = Math.ceil(motion.duration * 30);
  return Array.from({ length: count + 1 }, (_, frame) => {
    const time = Math.min(frame / 30, motion.duration - .0001);
    if (motion.key === 'robot') {
      const pose = robotPose(motion.action, time);
      return { frame, time: Number(time.toFixed(4)), joint_qpos: pose.q, root_y: pose.bob };
    }
    return { frame, time: Number(time.toFixed(4)), joint_qpos: cabinetPose(motion, time), root_y: 0 };
  });
}

export default function ArticulatedModel({ kind, motion, playing = true, onReady, resetToken }) {
  const names = kind === 'robot' ? robotNames : cabinetNames;
  const definitions = kind === 'robot' ? robotJoints : cabinetJoints;
  const urls = useMemo(() => [
    `/articulated/${kind}/static.glb`,
    ...names.map(name => `/articulated/${kind}/part_${name}.glb`)
  ], [kind, names]);
  const sources = useLoader(GLTFLoader, urls);
  const clock = useRef(0);
  const setup = useMemo(() => {
    const root = new THREE.Group();
    const bounds = new THREE.Box3();
    sources.forEach(source => bounds.expandByObject(source.scene));
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.7 / Math.max(size.x, size.y, size.z, .001);
    root.add(sources[0].scene.clone(true));
    const pivots = {};
    for (let index = 0; index < names.length; index++) {
      const name = names[index];
      const joint = definitions[name];
      const pivot = new THREE.Group();
      pivot.name = name;
      const origin = new THREE.Vector3(...joint.origin_glb);
      const part = sources[index + 1].scene.clone(true);
      part.position.sub(origin);
      part.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
      pivot.add(part);
      pivots[name] = { object: pivot, origin, axis: new THREE.Vector3(...joint.axis_glb).normalize(), joint };
    }
    for (const name of names) {
      const node = pivots[name];
      const parentName = kind === 'robot' ? jointParent(name) : null;
      const parent = parentName && pivots[parentName];
      node.object.position.copy(node.origin).sub(parent ? parent.origin : new THREE.Vector3());
      (parent?.object || root).add(node.object);
    }
    return { root, pivots, scale, position: [-center.x * scale, -1.12 - bounds.min.y * scale, -center.z * scale] };
  }, [sources, kind, definitions, names]);

  useEffect(() => { clock.current = 0; onReady?.(); }, [motion, onReady, resetToken]);
  useFrame((_, delta) => {
    if (playing && motion) clock.current += Math.min(delta, .1);
    if (kind === 'robot') {
      const pose = robotPose(motion?.action, clock.current);
      setup.root.position.y = pose.bob;
      for (const name of names) {
        const node = setup.pivots[name];
        const value = (pose.q[name] || 0) - (robotInitial[name] || 0);
        node.object.quaternion.setFromAxisAngle(node.axis, value);
      }
    } else {
      setup.root.position.y = 0;
      const pose = motion ? cabinetPose(motion, clock.current) : null;
      for (const name of names) {
        const node = setup.pivots[name];
        const amount = pose?.[name] || 0;
        if (node.joint.type === 'prismatic') node.object.position.copy(node.origin).addScaledVector(node.axis, amount);
        else node.object.quaternion.setFromAxisAngle(node.axis, amount);
      }
    }
  });
  return <group scale={setup.scale} position={setup.position}><primitive object={setup.root}/></group>;
}
