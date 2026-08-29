"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, Download, Headphones, Music2, Play, RotateCcw, SlidersHorizontal, Sparkles, Upload, WandSparkles, X } from "lucide-react";

type Track = { name: string; size: string; url: string };

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
  const [values, setValues] = useState({ comp: 62, tune: 35, clarity: 54, space: 28, bass: 67, width: 45 });
  const addFile = (file?: File) => { if (!file) return; setTrack({ name: file.name, size: `${(file.size/1024/1024).toFixed(1)} MB`, url: URL.createObjectURL(file) }); setDone(false); };
  const start = () => { if (!track || mixing) return; setMixing(true); setDone(false); setTimeout(() => { setMixing(false); setDone(true); }, 2200); };
  return <main><Header /><section className="hero"><div className="eyebrow"><Sparkles size={13}/> AI-ASSISTED AUDIO ENGINE</div><h1>YOUR SOUND.<br/><em>PERFECTLY MIXED.</em></h1><p>ヒップホップに特化した自動ミキシング。<br/>トラックをアップロードするだけで、プロ品質のサウンドへ。</p><div className="hero-scroll">SCROLL TO CREATE <ChevronDown size={14}/></div></section>

  <section className="studio" id="studio"><div className="section-heading"><span>01</span><div><h2>DROP YOUR TRACK</h2><p>ボーカルとビートをまとめた音源、またはステムを書き出してアップロード</p></div></div>
    {!track ? <button className="dropzone" onClick={() => input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFile(e.dataTransfer.files[0])}}><div className="upload-icon"><Upload/></div><b>ここに音源をドロップ</b><small>またはクリックしてファイルを選択</small><label>WAV, MP3, AIFF • 最大 500MB</label></button> : <div className="file-card"><button className="mini-play"><Play fill="currentColor"/></button><div className="waveform">{Array.from({length: 64},(_,i)=><i key={i} style={{height:`${18+Math.abs(Math.sin(i*1.9))*42}px`}} />)}</div><div className="file-info"><b>{track.name}</b><small>{track.size} • READY</small></div><button className="remove" onClick={()=>setTrack(null)}><X/></button><audio controls src={track.url}/></div>}
    <input ref={input} hidden type="file" accept="audio/*" onChange={e=>addFile(e.target.files?.[0])}/>
  </section>

  <section className="studio preset-section"><div className="section-heading"><span>02</span><div><h2>CHOOSE YOUR VIBE</h2><p>サウンドの方向性を選択。細かな調整は後から変更できます。</p></div></div><div className="preset-grid">{presets.map((p,i)=><button key={p.name} className={`preset ${preset===i?"selected":""} ${p.color}`} onClick={()=>setPreset(i)}><div className="preset-top"><Music2/><i>{preset===i?"SELECTED":"0"+(i+1)}</i></div><h3>{p.name}</h3><p>{p.desc}</p><div className="mini-wave">{Array.from({length: 18},(_,n)=><i key={n} style={{height:8+((n*13)%18)}}/>)}</div></button>)}</div></section>

  <section className="studio"><div className="section-heading"><span>03</span><div><h2>FINE TUNE</h2><p>AIの設定を自分好みにカスタマイズ</p></div></div><button className="advanced-toggle" onClick={()=>setAdvanced(!advanced)}><span><SlidersHorizontal/> 詳細設定</span><small>{advanced?"設定を閉じる":"6項目を調整"} <ChevronDown className={advanced?"up":""}/></small></button>{advanced&&<div className="controls">{Object.entries(values).map(([k,v])=><label key={k}><span>{({comp:"COMPRESSION",tune:"AUTO-TUNE",clarity:"VOCAL CLARITY",space:"SPACE / REVERB",bass:"LOW END",width:"STEREO WIDTH"} as Record<string,string>)[k]} <b>{v}%</b></span><input type="range" value={v} onChange={e=>setValues({...values,[k]:+e.target.value})}/></label>)}</div>}</section>

  <section className="render"><div className="render-copy"><WandSparkles/><div><h2>{done?"YOUR MIX IS READY":"READY TO MAKE IT HIT?"}</h2><p>{done?"処理が完了しました。音源をダウンロードできます。":"AIがあなたのトラックを解析し、最適なミックスを作成します。"}</p></div></div><button disabled={!track||mixing} onClick={start} className="render-button">{mixing?<><RotateCcw className="spin"/> MIXING...</>:done?<><Download/> DOWNLOAD MIX</>:<>START AUTO MIX <ArrowRight/></>}</button></section>

  <footer><div className="brand"><span>M</span>MIXLAB</div><p>MAKE NOISE. SOUND BETTER.</p><Link href="/dj"><Headphones/> OPEN DJ STUDIO <ArrowRight/></Link></footer>
  </main>;
}
