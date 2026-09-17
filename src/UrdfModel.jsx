import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { urdfDefinitions, urdfPose } from './urdf-motion.js';

export default function UrdfModel({ url, kind, motion, playing = true, onReady, resetToken }) {
  const gltf = useLoader(GLTFLoader, url);
  const clock = useRef(0);
  const setup = useMemo(() => {
    const object = cloneSkeleton(gltf.scene);
    const joints = {};
    const nodesByUrdfName = {};
    object.traverse(node => {
      if (node.userData?.name?.startsWith('joint:')) nodesByUrdfName[node.userData.name] = node;
    });
    for (const [name, definition] of Object.entries(urdfDefinitions[kind].joints)) {
      // GLTFLoader sanitizes ':' from Object3D.name; userData.name keeps the URDF joint name.
      const node = nodesByUrdfName[`joint:${name}`];
      if (!node) throw new Error(`URDF joint missing from ${kind} model: ${name}`);
      joints[name] = {
        node,
        type:definition.type,
        axis:new THREE.Vector3(...definition.axis).normalize(),
        basePosition:node.position.clone(),
        baseQuaternion:node.quaternion.clone()
      };
    }
    object.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        if (material) material.side = THREE.DoubleSide;
      }
    });
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2.7 / Math.max(size.x, size.y, size.z, .001);
    return { object, joints, scale, position:[-center.x * scale, -1.12 - box.min.y * scale, -center.z * scale] };
  }, [gltf.scene, kind]);

  useEffect(() => { clock.current = 0; onReady?.(); }, [motion, onReady, resetToken]);
  useFrame((_, delta) => {
    if (motion && playing) clock.current += Math.min(delta, .1);
    const pose = urdfPose(kind, motion, clock.current);
    setup.object.position.y = pose.rootY;
    for (const [name, item] of Object.entries(setup.joints)) {
      const value = pose.q[name];
      if (item.type === 'prismatic') {
        item.node.position.copy(item.basePosition).addScaledVector(item.axis.clone().applyQuaternion(item.baseQuaternion), value);
      } else {
        item.node.quaternion.copy(item.baseQuaternion).multiply(new THREE.Quaternion().setFromAxisAngle(item.axis, value));
      }
    }
  });
  return <group scale={setup.scale} position={setup.position}><primitive object={setup.object}/></group>;
}
