import React from 'react';

const accents = {
  g1: { floor: '#111b25', stage: '#263846', edge: '#83ddeb', background: '#101a24' },
  b1: { floor: '#203024', stage: '#354635', edge: '#b8d67b', background: '#17251d' },
  cabinet: { floor: '#2b2420', stage: '#645142', edge: '#e7bf89', background: '#241c1a' }
};

function RobotLab({ accent }) {
  return <>
    <mesh position={[0, -1.23, 0]} receiveShadow><cylinderGeometry args={[2.75, 2.9, .18, 72]}/><meshStandardMaterial color={accent.stage} metalness={.65} roughness={.3}/></mesh>
    <mesh position={[0, -1.125, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[2.58, .027, 8, 96]}/><meshStandardMaterial color={accent.edge} emissive={accent.edge} emissiveIntensity={1.35}/></mesh>
    {[3.3, 3.8, 4.3].map((radius, index) => <mesh key={radius} position={[0, -1.265, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[radius, index === 0 ? .012 : .007, 6, 96]}/><meshStandardMaterial color={accent.edge} emissive={accent.edge} emissiveIntensity={index === 0 ? .8 : .35} transparent opacity={.65}/></mesh>)}
    {[[-4.3,-4.3],[4.3,-4.3],[-4.3,4.3],[4.3,4.3]].map(([x,z]) => <group key={`${x}-${z}`} position={[x, -.4, z]}>
      <mesh castShadow><boxGeometry args={[.18, 1.7, .18]}/><meshStandardMaterial color="#293742" metalness={.7} roughness={.27}/></mesh>
      <mesh position={[0,.83,0]}><boxGeometry args={[.22,.055,.22]}/><meshStandardMaterial color={accent.edge} emissive={accent.edge} emissiveIntensity={1.6}/></mesh>
    </group>)}
  </>;
}

function RobotField({ accent }) {
  return <>
    <mesh position={[0, -1.24, 0]} receiveShadow><cylinderGeometry args={[2.8, 2.9, .18, 72]}/><meshStandardMaterial color={accent.stage} roughness={.92}/></mesh>
    <mesh position={[0, -1.13, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[2.64, .025, 8, 96]}/><meshStandardMaterial color={accent.edge} emissive={accent.edge} emissiveIntensity={.45}/></mesh>
    {[[-4.4,3.5,.56],[4.5,3.6,.7],[-4,-4.3,.8],[4.3,-4.1,.5],[-5.5,0,.45],[5.4,.4,.6]].map(([x,z,size], index) => <mesh key={index} position={[x,-1.13,z]} rotation={[0,index * .8,0]} castShadow receiveShadow><dodecahedronGeometry args={[size,0]}/><meshStandardMaterial color={index % 2 ? '#556453' : '#6b705c'} roughness={.96}/></mesh>)}
    {[-4.8,4.8].map(x => <mesh key={x} position={[x,-.98,0]} castShadow><coneGeometry args={[.35,.7,7]}/><meshStandardMaterial color="#547758" roughness={.95}/></mesh>)}
  </>;
}

function CabinetGallery({ accent }) {
  return <>
    <mesh position={[0,-1.22,0]} receiveShadow><boxGeometry args={[5.3,.16,4.3]}/><meshStandardMaterial color={accent.stage} metalness={.05} roughness={.66}/></mesh>
    <mesh position={[0,-1.135,2.08]}><boxGeometry args={[5.3,.018,.055]}/><meshStandardMaterial color={accent.edge} emissive={accent.edge} emissiveIntensity={.9}/></mesh>
    <mesh position={[0,-1.135,-2.08]}><boxGeometry args={[5.3,.018,.055]}/><meshStandardMaterial color={accent.edge} emissive={accent.edge} emissiveIntensity={.9}/></mesh>
    {[-2.58,2.58].map(x => <mesh key={x} position={[x,-1.135,0]}><boxGeometry args={[.055,.018,4.2]}/><meshStandardMaterial color={accent.edge} emissive={accent.edge} emissiveIntensity={.9}/></mesh>)}
    {[[-4.5,-4.5],[4.5,-4.5],[-4.5,4.5],[4.5,4.5]].map(([x,z]) => <group key={`${x}-${z}`} position={[x,-.35,z]}>
      <mesh castShadow><cylinderGeometry args={[.065,.065,1.75,12]}/><meshStandardMaterial color="#5d4e41" metalness={.35} roughness={.48}/></mesh>
      <mesh position={[0,.9,0]}><sphereGeometry args={[.11,12,8]}/><meshStandardMaterial color={accent.edge} emissive={accent.edge} emissiveIntensity={1.2}/></mesh>
    </group>)}
  </>;
}

export default function UrdfScene({ kind }) {
  const accent = accents[kind] || accents.g1;
  return <>
    <fog attach="fog" args={[accent.background, 8, 21]}/>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0,-1.34,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color={accent.floor} roughness={.86} metalness={.04}/></mesh>
    <hemisphereLight args={['#d8e8ff', accent.floor, .85]}/>
    <spotLight position={[-2.5,6,4]} angle={.58} penumbra={.7} intensity={2.4} color={accent.edge} castShadow/>
    {kind === 'g1' ? <RobotLab accent={accent}/> : kind === 'b1' ? <RobotField accent={accent}/> : <CabinetGallery accent={accent}/>}
  </>;
}
