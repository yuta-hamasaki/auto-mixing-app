"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, Download, Headphones, Music2, Pause, Play, RotateCcw, SlidersHorizontal, Sparkles, Upload, WandSparkles, X } from "lucide-react";

type Track = { name: string; size: string; url: string };
type StemName = "beat" | "vocal" | "adlib";
const stemLabels: Record<StemName,string> = { beat:"BEAT / INSTRUMENTAL", vocal:"MAIN VOCAL", adlib:"AD-LIB / BACKING" };

const presets = [
  { name: "Modern Trap", desc: "ワイドでパンチのある現代的な質感", color: "lime" },
  { name: "90s Boom Bap", desc: "温かくダスティーなクラシックサウンド", color: "orange" },
  { name: "Melodic Rap", desc: "透明感のあるボーカルと広い空間", color: "purple" },
];

function Header() { return <header><Link href="/" className="brand"><span>M</span>MIXLAB</Link><nav><Link className="active" href="/">AUTO MIX</Link><Link href="/dj">DJ STUDIO</Link></nav><div className="status"><i /> AUDIO ENGINE READY</div></header> }

export default function Home() {
  const input = useRef<HTMLInputElement>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [preset, setPreset] = useState(0);
  const [mixing, setMixing] = useState(false);
  const [done, setDone] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [stems, setStems] = useState<Partial<Record<StemName, Track>>>({});
  const [stemGain, setStemGain] = useState<Record<StemName, number>>({beat:80,vocal:80,adlib:65});
  const [previewing, setPreviewing] = useState(false);
  const previewAudios = useRef<HTMLAudioElement[]>([]);
  const [values, setValues] = useState({ comp: 62, tune: 35, clarity: 54, space: 28, bass: 67, width: 45 });
  const addFile = (file?: File) => { if (!file) return; setTrack({ name: file.name, size: `${(file.size/1024/1024).toFixed(1)} MB`, url: URL.createObjectURL(file) }); setDone(false); };
  const start = () => { if ((!track && !Object.keys(stems).length) || mixing) return; setMixing(true); setDone(false); setTimeout(() => { setMixing(false); setDone(true); }, 2200); };
  const addStem=(kind:StemName,file?:File)=>{if(!file)return;const old=stems[kind];if(old)URL.revokeObjectURL(old.url);setStems(s=>({...s,[kind]:{name:file.name,size:`${(file.size/1024/1024).toFixed(1)} MB`,url:URL.createObjectURL(file)}}));setDone(false)};
  const togglePreview=()=>{const sources=Object.entries(stems) as [StemName,Track][];if(!sources.length&&track)sources.push(["beat",track]);if(previewing){previewAudios.current.forEach(a=>a.pause());previewAudios.current=[];setPreviewing(false);return}previewAudios.current=sources.map(([kind,t])=>{const a=new Audio(t.url);a.volume=stemGain[kind]/100;a.onended=()=>setPreviewing(false);a.play();return a});setPreviewing(true)};
  const updateStemGain=(kind:StemName,value:number)=>{setStemGain(g=>({...g,[kind]:value}));const activeStems=(["beat","vocal","adlib"] as StemName[]).filter(k=>stems[k]||(k==="beat"&&track));const audio=previewAudios.current[activeStems.indexOf(kind)];if(audio)audio.volume=value/100};
  const download=async()=>{const sources=Object.entries(stems) as [StemName,Track][];if(!sources.length&&track)sources.push(["beat",track]);if(!sources.length)return;const context=new AudioContext();const decoded=await Promise.all(sources.map(async([kind,t])=>({kind,buffer:await context.decodeAudioData(await(await fetch(t.url)).arrayBuffer())})));const rate=decoded[0].buffer.sampleRate,length=Math.max(...decoded.map(x=>x.buffer.length));const offline=new OfflineAudioContext(2,length,rate);decoded.forEach(({kind,buffer})=>{const src=offline.createBufferSource(),gain=offline.createGain();src.buffer=buffer;gain.gain.value=stemGain[kind]/100;src.connect(gain).connect(offline.destination);src.start()});const rendered=await offline.startRendering();const wav=toWav(rendered),a=document.createElement("a");a.href=URL.createObjectURL(wav);a.download="mixlab-mix.wav";a.click();URL.revokeObjectURL(a.href);await context.close()};
  return <main><Header /><section className="hero"><div className="eyebrow"><Sparkles size={13}/> AI-ASSISTED AUDIO ENGINE</div><h1>YOUR SOUND.<br/><em>PERFECTLY MIXED.</em></h1><p>ヒップホップに特化した自動ミキシング。<br/>トラックをアップロードするだけで、プロ品質のサウンドへ。</p><div className="hero-scroll">SCROLL TO CREATE <ChevronDown size={14}/></div></section>

  <section className="studio" id="studio"><div className="section-heading"><span>01</span><div><h2>DROP YOUR TRACK</h2><p>ボーカルとビートをまとめた音源、またはステムを書き出してアップロード</p></div></div>
    {!track ? <button className="dropzone" onClick={() => input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFile(e.dataTransfer.files[0])}}><div className="upload-icon"><Upload/></div><b>ここに音源をドロップ</b><small>またはクリックしてファイルを選択</small><label>WAV, MP3, AIFF • 最大 500MB</label></button> : <div className="file-card"><button className="mini-play"><Play fill="currentColor"/></button><div className="waveform">{Array.from({length: 64},(_,i)=><i key={i} style={{height:`${18+Math.abs(Math.sin(i*1.9))*42}px`}} />)}</div><div className="file-info"><b>{track.name}</b><small>{track.size} • READY</small></div><button className="remove" onClick={()=>setTrack(null)}><X/></button><audio controls src={track.url}/></div>}
    <input ref={input} hidden type="file" accept="audio/*" onChange={e=>addFile(e.target.files?.[0])}/>
    <div className="stem-intro"><div><b>STEM MIXING</b><span>ビート・メインボーカル・アドリブを別々に読み込むと、聴きながらバランスを調整できます。</span></div><label className="monitor"><button onClick={togglePreview} disabled={!track&&!Object.keys(stems).length}>{previewing?<Pause/>:<Headphones/>}{previewing?"STOP MONITOR":"LIVE PREVIEW"}</button></label></div>
    <div className="stem-grid">{(["beat","vocal","adlib"] as StemName[]).map(kind=><div className={`stem-card ${stems[kind]?"loaded":""}`} key={kind}><div><i>{kind.slice(0,2).toUpperCase()}</i><span><b>{stemLabels[kind]}</b><small>{stems[kind]?.name||"音源を選択"}</small></span><label><Upload/> <input hidden type="file" accept="audio/*" onChange={e=>addStem(kind,e.target.files?.[0])}/></label></div><div className="stem-level"><span>LEVEL</span><input type="range" value={stemGain[kind]} onChange={e=>updateStemGain(kind,+e.target.value)}/><b>{stemGain[kind]}%</b></div></div>)}</div>
  </section>

  <section className="studio preset-section"><div className="section-heading"><span>02</span><div><h2>CHOOSE YOUR VIBE</h2><p>サウンドの方向性を選択。細かな調整は後から変更できます。</p></div></div><div className="preset-grid">{presets.map((p,i)=><button key={p.name} className={`preset ${preset===i?"selected":""} ${p.color}`} onClick={()=>setPreset(i)}><div className="preset-top"><Music2/><i>{preset===i?"SELECTED":"0"+(i+1)}</i></div><h3>{p.name}</h3><p>{p.desc}</p><div className="mini-wave">{Array.from({length: 18},(_,n)=><i key={n} style={{height:8+((n*13)%18)}}/>)}</div></button>)}</div></section>

  <section className="studio"><div className="section-heading"><span>03</span><div><h2>FINE TUNE</h2><p>AIの設定を自分好みにカスタマイズ</p></div></div><button className="advanced-toggle" onClick={()=>setAdvanced(!advanced)}><span><SlidersHorizontal/> 詳細設定</span><small>{advanced?"設定を閉じる":"6項目を調整"} <ChevronDown className={advanced?"up":""}/></small></button>{advanced&&<div className="controls">{Object.entries(values).map(([k,v])=><label key={k}><span>{({comp:"COMPRESSION",tune:"AUTO-TUNE",clarity:"VOCAL CLARITY",space:"SPACE / REVERB",bass:"LOW END",width:"STEREO WIDTH"} as Record<string,string>)[k]} <b>{v}%</b></span><input type="range" value={v} onChange={e=>setValues({...values,[k]:+e.target.value})}/></label>)}</div>}</section>

  <section className="render"><div className="render-copy"><WandSparkles/><div><h2>{done?"YOUR MIX IS READY":"READY TO MAKE IT HIT?"}</h2><p>{done?"LIVE PREVIEWで確認しながらレベルを調整し、WAVで保存できます。":"AIがあなたのトラックを解析し、最適なミックスを作成します。"}</p></div></div><div className="render-actions">{done&&<button onClick={togglePreview} className="preview-button">{previewing?<Pause/>:<Play/>} {previewing?"STOP":"PREVIEW"}</button>}<button disabled={(!track&&!Object.keys(stems).length)||mixing} onClick={done?download:start} className="render-button">{mixing?<><RotateCcw className="spin"/> MIXING...</>:done?<><Download/> DOWNLOAD WAV</>:<>START AUTO MIX <ArrowRight/></>}</button></div></section>

  <footer><div className="brand"><span>M</span>MIXLAB</div><p>MAKE NOISE. SOUND BETTER.</p><Link href="/dj"><Headphones/> OPEN DJ STUDIO <ArrowRight/></Link></footer>
  </main>;
}

function toWav(buffer:AudioBuffer){const channels=buffer.numberOfChannels,length=buffer.length*channels*2+44,out=new ArrayBuffer(length),view=new DataView(out);const write=(offset:number,value:string)=>[...value].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));write(0,"RIFF");view.setUint32(4,length-8,true);write(8,"WAVEfmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);write(36,"data");view.setUint32(40,length-44,true);let offset=44;for(let i=0;i<buffer.length;i++)for(let ch=0;ch<channels;ch++){const sample=Math.max(-1,Math.min(1,buffer.getChannelData(ch)[i]));view.setInt16(offset,sample<0?sample*0x8000:sample*0x7fff,true);offset+=2}return new Blob([out],{type:"audio/wav"})}
