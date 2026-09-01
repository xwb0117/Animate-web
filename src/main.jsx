import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, Grid, OrbitControls } from '@react-three/drei';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {
  ArrowRight, Box, ChevronDown, CircleHelp, Clock3, Download, Expand,
  Film, FolderOpen, Gauge, Grid3X3, Layers3, Menu, MousePointer2,
  Pause, Play, Plus, Rotate3d, Sparkles, Upload, WandSparkles, X, Zap
} from 'lucide-react';
import './styles.css';
import './improvements.css';

const sampleNames = ['武僧@Lv1','武僧@Lv2','武僧@Lv3','叶问@Lv1','叶问@Lv2','叶问@Lv3','虎头少女@Lv1','虎头少女@Lv2','虎头少女@Lv3'];
const samples = sampleNames.map((key, index) => ({
  id: key, key, name: key.split('@')[0], level: key.split('@')[1],
  file: `/models/${key}.glb`,
  video: `/media/${key}__${key}_front.mp4`,
  poster: `/media/${key}__${key}_front.jpg`,
  color: ['#dfff5b','#ff7048','#b894ff','#68d5ff','#dfff5b','#ff8a65','#ffca5b','#e885ff','#78e5bd'][index]
}));

function Logo({ onClick }) {
  return <button className="logo" onClick={onClick} aria-label="Animesh home"><span className="logo-mark"><i/><i/><i/></span><span>ANIMESH</span><b>LAB</b></button>;
}

function Landing({ enter }) {
  return <main className="landing">
    <nav className="nav shell">
      <Logo />
      <div className="nav-links"><a href="#showcase">Showcase</a><a href="#workflow">Workflow</a><a href="#about">About</a></div>
      <a className="nav-cta" href="#studio" onClick={enter}>Open Studio <ArrowRight size={15}/></a>
    </nav>

    <section className="hero shell">
      <div className="hero-glow" />
      <div className="eyebrow"><Sparkles size={13}/> Motion, imagined</div>
      <h1>Give your mesh<br/><em>something to feel.</em></h1>
      <p>Turn a static 3D character into expressive animation.<br/>Upload a mesh, describe the motion, and let it move.</p>
      <div className="hero-actions">
        <a className="primary" href="#studio" onClick={enter}>Start creating <ArrowRight size={17}/></a>
        <button className="ghost" onClick={() => document.querySelector('#showcase')?.scrollIntoView({behavior:'smooth'})}><Play size={15} fill="currentColor"/> Watch showcase</button>
      </div>
      <a className="hero-stage cinematic-stage" href="#studio" onClick={enter} aria-label="Open 3D workspace">
        <video src="/media/武僧@Lv2__武僧@Lv2_front.mp4" poster="/media/武僧@Lv2__武僧@Lv2_front.jpg" autoPlay muted loop playsInline/>
        <div className="cinema-shade"/><div className="scan-line"/><div className="frame-corners"/>
        <div className="cinema-top"><span><i/> LIVE MOTION SYNTHESIS</span><b>ANM—02 / MONK</b><em>1920 × 1080</em></div>
        <div className="motion-data data-left"><span>INPUT ANALYSIS</span><b>Humanoid mesh</b><i>Rig detected · 65 joints</i><div><small>BODY</small><strong>98%</strong></div></div>
        <div className="motion-data data-right"><span>MOTION OUTPUT</span><b>Spinning high kick</b><i><span className="live-dot"/> Generated in 2.4s</i><div><small>CONFIDENCE</small><strong>96%</strong></div></div>
        <div className="cinema-timeline"><span>00:00</span><div><i/><b/></div><span>00:02</span></div>
        <div className="cinema-open">ENTER STUDIO <ArrowRight size={14}/></div>
      </a>
      <div className="hero-proof"><span>FBX</span><i/><span>GLB</span><i/><span>TEXT TO MOTION</span><i/><span>4-VIEW RENDER</span><i/><span>EXPORT READY</span></div>
    </section>

    <section className="showcase shell" id="showcase">
      <div><span className="section-no">01 / SHOWCASE</span><h2>From still to <em>alive.</em></h2></div>
      <div className="showcase-grid showcase-nine">
        {samples.map((s, i) => <button key={s.id} className={`show-card card-${i}`} onClick={enter}>
          <video src={s.video} poster={s.poster} autoPlay muted loop playsInline preload="metadata"/>
          <div className="show-overlay"><span>0{i+1}</span><div><b>{s.name} · {s.level}</b><small>AI GENERATED MOTION</small></div><ArrowRight/></div>
        </button>)}
      </div>
    </section>

    <section className="workflow shell" id="workflow">
      <span className="section-no">02 / WORKFLOW</span><h2>Three steps. <em>Infinite motion.</em></h2>
      <div className="steps">
        <div><span>01</span><Upload/><h3>Drop your mesh</h3><p>Upload your character in FBX, OBJ or GLB format.</p></div>
        <div><span>02</span><WandSparkles/><h3>Describe the motion</h3><p>Use natural language to direct pose, energy and style.</p></div>
        <div><span>03</span><Film/><h3>Bring it to life</h3><p>Preview from every angle and export the final animation.</p></div>
      </div>
      <a className="primary final-cta" href="#studio" onClick={enter}>Enter the studio <ArrowRight size={17}/></a>
    </section>
    <footer className="shell"><Logo/><span>© 2026 ANIMESH LAB</span><span>Make every frame matter.</span></footer>
  </main>;
}

function normalizeModel(object) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 2.7 / Math.max(size.x, size.y, size.z, 0.001);
  return {
    scale,
    position: [-center.x * scale, -1.12 - box.min.y * scale, -center.z * scale]
  };
}

function webMaterial(url, meshName, index = 0) {
  const palettes = url.includes('武僧')
    ? ['#729bd0', '#d18a62', '#5b3324', '#25211f']
    : url.includes('叶问')
      ? ['#79a5d6', '#d39a78', '#26354c', '#17191d', '#a66b42', '#587ca8']
      : ['#77a5d8', '#d7a07d', '#26344c', '#1d2026'];
  const nameNumber = Number(String(meshName).match(/\d+/)?.[0] || index);
  const color = palettes[nameNumber % palettes.length];
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color).multiplyScalar(.28),
    emissiveIntensity: .72,
    roughness: .68,
    metalness: .02,
    side: THREE.DoubleSide
  });
}

function FbxModel({ url, onReady, animate = false, playing = true }) {
  const source = useLoader(FBXLoader, url);
  const object = useMemo(() => {
    const cloned = cloneSkeleton(source);
    cloned.animations = source.animations;
    return cloned;
  }, [source]);
  const transform = useMemo(() => normalizeModel(object), [object]);
  const mixer = useMemo(() => animate && object.animations.length ? new THREE.AnimationMixer(object) : null, [object, animate]);
  useEffect(() => {
    let meshIndex = 0;
    object.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true; child.receiveShadow = true;
        child.material = webMaterial(url, child.name, meshIndex++);
      }
    });
    if (mixer && object.animations[0]) mixer.clipAction(object.animations[0]).reset().play();
    onReady?.();
    return () => mixer?.stopAllAction();
  }, [object, onReady, mixer, url]);
  useFrame((_, delta) => mixer?.update(delta));
  useEffect(() => { if (mixer) mixer.timeScale = playing ? 1 : 0; }, [mixer, playing]);
  return <primitive object={object} scale={transform.scale} position={transform.position} />;
}

function ObjModel({ url, onReady }) {
  const object = useLoader(OBJLoader, url);
  const transform = useMemo(() => normalizeModel(object), [object]);
  useEffect(() => object.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true; child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({ color: '#b9c3d2', roughness: .62, metalness: .05 });
    }
  }), [object]);
  useEffect(() => onReady?.(), [object, onReady]);
  return <primitive object={object} scale={transform.scale} position={transform.position}/>;
}

function GltfModel({ url, onReady, animate = false, playing = true }) {
  const gltf = useLoader(GLTFLoader, url);
  const object = useMemo(() => cloneSkeleton(gltf.scene), [gltf.scene]);
  const transform = useMemo(() => normalizeModel(object), [object]);
  const mixer = useMemo(() => animate && gltf.animations.length ? new THREE.AnimationMixer(object) : null, [object, gltf.animations, animate]);
  useEffect(() => {
    object.traverse(child => {
      if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    if (mixer && gltf.animations[0]) mixer.clipAction(gltf.animations[0]).reset().play();
    onReady?.();
    return () => mixer?.stopAllAction();
  }, [object, mixer, gltf.animations, onReady]);
  useEffect(() => { if (mixer) mixer.timeScale = playing ? 1 : 0; }, [mixer, playing]);
  useFrame((_, delta) => mixer?.update(delta));
  return <primitive object={object} scale={transform.scale} position={transform.position}/>;
}

class ViewerErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('3D viewer failed:', error); }
  render() {
    if (this.state.failed) return <div className="viewer-error"><Box/><b>3D preview unavailable</b><span>请检查浏览器是否开启硬件加速，然后刷新页面重试。</span></div>;
    return this.props.children;
  }
}

function Viewer({ url, format, onDrop, animate = false, playing = true }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [url]);
  const ready = React.useCallback(() => setLoaded(true), []);
  return <div className="viewer" onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
    {url && <ViewerErrorBoundary key={url}><Canvas shadows camera={{ position: [3.4, 1.65, 5.2], fov: 38 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Suspense fallback={null}>
        <color attach="background" args={['#101216']}/>
        <ambientLight intensity={1.2}/><hemisphereLight args={['#e7eeff', '#29251f', 1.4]}/><directionalLight castShadow position={[4,7,5]} intensity={3}/><pointLight position={[-4,2,-3]} intensity={4} color="#7058ff"/>
        {format === 'glb' ? <GltfModel url={url} onReady={ready} animate={animate} playing={playing}/> : format === 'obj' ? <ObjModel url={url} onReady={ready}/> : <FbxModel url={url} onReady={ready} animate={animate} playing={playing}/>} 
        <Grid args={[20,20]} cellColor="#30343d" sectionColor="#515866" fadeDistance={18} fadeStrength={1.5} position={[0,-1.2,0]}/>
        <ContactShadows position={[0,-1.18,0]} opacity={0.5} scale={8} blur={2}/>
        <OrbitControls makeDefault enableDamping target={[0,.2,0]} minDistance={2.2} maxDistance={10}/>
      </Suspense>
    </Canvas></ViewerErrorBoundary>}
    {url && !loaded && <div className="mesh-loading"><span/><b>Preparing mesh</b><small>正在解析几何体与骨骼数据…</small></div>}
    {!url && <div className="empty-stage"><div className="empty-cube"><Box/></div><b>Your stage is empty</b><span>Drop a static mesh here or use the upload panel</span><button onClick={() => document.querySelector('.upload-zone')?.click()}><Upload size={14}/> Upload mesh</button></div>}
    <div className="view-axis"><b>Y</b><span>X</span><i>Z</i></div>
  </div>;
}

function Workspace({ home }) {
  const [sample, setSample] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [modelName, setModelName] = useState('');
  const [character, setCharacter] = useState('');
  const [modelFormat, setModelFormat] = useState('fbx');
  const [prompt, setPrompt] = useState('');
  const [playing, setPlaying] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [includeScene, setIncludeScene] = useState(false);
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState('front');
  const inputRef = useRef();
  const videoRef = useRef();

  const acceptFile = file => {
    if (!file) return;
    if (!/\.(fbx|obj)$/i.test(file.name)) return alert('当前可预览 FBX 或 OBJ 格式');
    const key = file.name.replace(/\.(fbx|obj)$/i, '');
    const matched = samples.find(item => item.key === key) || null;
    const detectedCharacter = ['武僧','叶问','虎头少女'].find(name => key.includes(name)) || '';
    setSample(null); setCharacter(detectedCharacter);
    // Known assets use the Blender-exported GLB so all material slots are preserved.
    setModelUrl(matched ? matched.file : URL.createObjectURL(file)); setModelName(file.name);
    setModelFormat(matched ? 'glb' : (file.name.toLowerCase().endsWith('.obj') ? 'obj' : 'fbx'));
    setGenerated(false); setProgress(0); setPlaying(false);
  };
  const generate = async () => {
    if (!modelUrl) return alert('请先上传 Mesh');
    if (!prompt.trim()) return alert('请输入动作描述');
    if (!character) return alert('当前演示只能识别武僧、叶问或虎头少女 Mesh。');
    setGenerated(false); setProgress(0);
    let p = 0; const timer = setInterval(() => { p = Math.min(p + 3, 88); setProgress(p); }, 55);
    try {
      const response = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ character, prompt }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Motion not found');
      const selected = samples.find(item => item.key === result.key);
      setTimeout(() => { clearInterval(timer); setSample(selected); setProgress(100); setGenerated(true); setPlaying(true); setView('front'); }, 650);
    } catch (error) {
      clearInterval(timer); setProgress(0); alert(`${error.message}\n请使用该角色对应的动作 Prompt。`);
    }
  };
  const toggle = () => { const next=!playing; setPlaying(next); if(videoRef.current) next ? videoRef.current.play() : videoRef.current.pause(); };
  const videoUrl = sample ? `/media/${sample.key}__${sample.key}_${view}.mp4` : '';
  const posterUrl = sample ? `/media/${sample.key}__${sample.key}_${view}.jpg` : '';
  const animatedFbxUrl = sample ? `/fbx/${sample.key}.fbx` : '';
  const animatedWebUrl = sample ? `/models/${sample.key}.glb` : '';

  return <main className="studio">
    <header className="studio-head"><Logo onClick={home}/><div className="project-title"><span>My projects</span><i>/</i><b>Untitled motion</b><ChevronDown size={14}/></div><div className="head-actions"><span className="saved"><i/> Saved</span><button><CircleHelp size={17}/></button><button className="avatar">XW</button></div></header>
    <aside className="rail"><button className="active"><WandSparkles/><span>Animate</span></button><button><FolderOpen/><span>Assets</span></button><button><Clock3/><span>History</span></button><div/><button><CircleHelp/></button></aside>
    <section className="controls-panel">
      <div className="panel-head"><div><span className="step-pill">01</span><h2>Source mesh</h2></div><button><X size={17}/></button></div>
      <div className={`upload-zone ${modelUrl?'has-model':''}`} onClick={()=>!modelUrl&&inputRef.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();e.stopPropagation();acceptFile(e.dataTransfer.files[0])}}>
        <input ref={inputRef} type="file" accept=".fbx,.obj" onChange={e=>acceptFile(e.target.files[0])}/>{modelUrl ? <div className="source-preview"><Viewer url={modelUrl} format={modelFormat} onDrop={e=>{e.preventDefault();acceptFile(e.dataTransfer.files[0])}}/><span><Rotate3d size={12}/> Drag to inspect mesh</span></div> : <><Upload/><b>Drop a 3D model</b><span>or click to browse</span><small>FBX · OBJ &nbsp; up to 100MB</small></>}
      </div>
      {modelUrl && <div className="file-chip"><Box size={18}/><div><b>{modelName}</b><span>Static mesh · Ready to animate</span></div><button onClick={()=>inputRef.current.click()}>Replace</button></div>}
      <div className="divider"/>
      <div className="section-title"><span className="step-pill">02</span><h2>Describe motion</h2></div>
      <div className="prompt-box"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe how your character should move..."/><div><span>{prompt.length} / 500</span><button><Sparkles size={14}/> Enhance</button></div></div>
      <div className="prompt-tags"><button onClick={()=>setPrompt('A confident hero landing with powerful impact')}>Hero landing</button><button onClick={()=>setPrompt('A fluid martial arts combo, fast and precise')}>Martial arts</button><button onClick={()=>setPrompt('A relaxed idle breathing loop with subtle movement')}>Idle loop</button></div>
      <label className="setting-label">Motion settings <span>Advanced</span></label>
      <div className="setting-row"><span><Gauge size={16}/> Intensity</span><div className="segmented"><button>Low</button><button className="active">Medium</button><button>High</button></div></div>
      <div className="setting-row"><span><Clock3 size={16}/> Duration</span><button className="select">2 sec <ChevronDown size={13}/></button></div>
      <div className="scene-option"><div><span><Layers3 size={16}/> Include scene</span><small>Add the rendered environment and multi-view video</small></div><button className={includeScene?'on':''} onClick={()=>{setIncludeScene(value=>!value);setGenerated(false);setProgress(0)}} aria-label="Toggle scene"><i/></button></div>
      <button className="generate" onClick={generate} disabled={progress > 0 && progress < 100}>{progress > 0 && progress < 100 ? <><span className="spinner"/>Generating · {progress}%</> : <><Zap size={17} fill="currentColor"/>Generate motion<span>⌘ ↵</span></>}</button>
      <p className="generate-note"><Sparkles size={12}/> Each generation creates one animation</p>
    </section>
    <section className="canvas-area">
      {!generated && !(progress > 0 && progress < 100) ? <div className="motion-stage-empty"><div>{includeScene?<Layers3/>:<Box/>}</div><b>Your motion will appear here</b><span>{includeScene?'Scene render · Four camera views':'Transparent stage · Animated FBX output'}</span></div> : !generated ? <div className="center-generating"><div className="gen-orb"><span/></div><b>Generating motion</b><span>Matching character and movement · {progress}%</span><div><i style={{width:`${progress}%`}}/></div></div> : <>
        {includeScene ? <><div className="motion-preview"><video key={videoUrl} ref={videoRef} src={videoUrl} poster={posterUrl} autoPlay muted loop playsInline/><span className="result-badge"><i/> {sample.key} · SCENE</span></div><div className="center-view-switch">{['front','right','back','left'].map(v=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)}>{v}<small>{v==='front'?'0°':v==='right'?'90°':v==='back'?'180°':'−90°'}</small></button>)}</div></> : <div className="fbx-motion-preview"><Viewer url={animatedWebUrl} format="glb" animate playing={playing}/><span className="result-badge"><i/> {sample.key} · FBX / NO SCENE</span><small><Rotate3d size={12}/> Drag to inspect animated mesh</small></div>}
        <div className="playbar"><button className="play" onClick={toggle}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><span>00:00</span><div className="timeline"><i style={{width: playing?'58%':'34%'}}/><b style={{left: playing?'58%':'34%'}}/></div><span>00:02</span><button>1×</button><button><Expand size={15}/></button></div>
      </>}
    </section>
    <aside className="output-panel">
      <div className="output-head"><div><span className="step-pill">03</span><h2>Motion result</h2></div><button><Download size={17}/></button></div>
      {!generated ? <div className="result-empty"><Film/><b>{progress>0?'Generating…':'No motion yet'}</b><span>{progress>0?'The matched animation will appear in the center.':'Upload a mesh and describe the movement to generate your first animation.'}</span></div> : <>
        <div className="output-mode"><Layers3/><div><span>Output mode</span><b>{includeScene?'Scene render':'Animation only'}</b></div><em>{includeScene?'4-view MP4':'No scene'}</em></div>
        <div className="result-info"><div><span>Animation</span><b>{sample.name} · {sample.level}</b></div><div><span>Duration</span><b>2.0 sec</b></div><div><span>Frames</span><b>33</b></div><div><span>Format</span><b>{includeScene?'MP4':'FBX'}</b></div></div>
        <a className="export" href={includeScene?videoUrl:animatedFbxUrl} download><Download size={16}/> Export {includeScene?'scene video':'animation FBX'} <ChevronDown size={15}/></a>
      </>}
    </aside>
  </main>;
}

function App(){
  const [page,setPage]=useState(location.hash==='#studio'?'studio':'home');
  useEffect(()=>{const sync=()=>setPage(location.hash==='#studio'?'studio':'home');addEventListener('hashchange',sync);return()=>removeEventListener('hashchange',sync)},[]);
  const go=p=>{const hash=p==='studio'?'#studio':'#home';if(location.hash!==hash) location.hash=hash;setPage(p);window.scrollTo(0,0)};
  return page==='home'?<Landing enter={()=>go('studio')}/>:<Workspace home={()=>go('home')}/>
}

createRoot(document.getElementById('root')).render(<App/>);
