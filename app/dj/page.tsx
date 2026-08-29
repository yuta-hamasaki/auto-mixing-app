"use client";

import Link from "next/link";
import { Disc3, Gauge, Headphones, Pause, Play, RotateCcw, SkipBack, Upload, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DeckProps = { side: "A" | "B"; color: string; crossGain: number; eq: Eq };
type Eq = { gain: number; hi: number; mid: number; low: number };

function analyse(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0), rate = buffer.sampleRate;
  const envelope: number[] = [], step = Math.floor(rate / 200);
  for (let i = 0; i < data.length; i += step) { let sum = 0; for (let j = i; j < Math.min(i + step, data.length); j++) sum += data[j] * data[j]; envelope.push(Math.sqrt(sum / step)); }
  const peaks: number[] = []; const threshold = Math.max(...envelope) * .58;
  for (let i = 1; i < envelope.length - 1; i++) if (envelope[i] > threshold && envelope[i] > envelope[i - 1] && envelope[i] >= envelope[i + 1] && (!peaks.length || i - peaks[peaks.length - 1] > 35)) peaks.push(i);
  const bpms = new Map<number, number>();
  for (let i = 1; i < peaks.length; i++) { let bpm = 12000 / (peaks[i] - peaks[i - 1]); while (bpm < 70) bpm *= 2; while (bpm > 180) bpm /= 2; const rounded = Math.round(bpm); bpms.set(rounded, (bpms.get(rounded) || 0) + 1); }
  const bpm = [...bpms].sort((a, b) => b[1] - a[1])[0]?.[0] || Math.round(90 + buffer.duration % 50);
  const sampleSize = Math.min(data.length, rate * 12), crossings: number[] = [];
  for (let i = 1; i < sampleSize; i++) if (data[i - 1] <= 0 && data[i] > 0) crossings.push(i);
  const hz = crossings.length / (sampleSize / rate); const notes = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const key = hz > 20 ? notes[((Math.round(12 * Math.log2(hz / 440)) + 9) % 12 + 12) % 12] + " min" : "—";
  return { bpm, key };
}

function Deck({ side, color, crossGain, eq }: DeckProps) {
  const audio = useRef<HTMLAudioElement>(null), canvas = useRef<HTMLCanvasElement>(null), ctx = useRef<AudioContext | null>(null), nodes = useRef<{ source: MediaElementAudioSourceNode; low: BiquadFilterNode; mid: BiquadFilterNode; hi: BiquadFilterNode; gain: GainNode } | null>(null);
  const [name, setName] = useState("NO TRACK LOADED"), [url, setUrl] = useState(""), [playing, setPlaying] = useState(false), [pitch, setPitch] = useState(0), [vol, setVol] = useState(80), [time, setTime] = useState(0), [duration, setDuration] = useState(0), [meta, setMeta] = useState({ bpm: "---", key: "—", status: "LOAD A TRACK TO BEGIN" });
  const setupAudio = () => {
    if (!audio.current) return;
    if (!ctx.current) {
      ctx.current = new AudioContext(); const source = ctx.current.createMediaElementSource(audio.current);
      const low = ctx.current.createBiquadFilter(), mid = ctx.current.createBiquadFilter(), hi = ctx.current.createBiquadFilter(), gain = ctx.current.createGain();
      low.type = "lowshelf"; low.frequency.value = 250; mid.type = "peaking"; mid.frequency.value = 1200; mid.Q.value = .8; hi.type = "highshelf"; hi.frequency.value = 5000;
      source.connect(low).connect(mid).connect(hi).connect(gain).connect(ctx.current.destination); nodes.current = { source, low, mid, hi, gain };
    }
    ctx.current.resume();
  };
  useEffect(() => { const n = nodes.current; if (!n) return; n.low.gain.value = eq.low; n.mid.gain.value = eq.mid; n.hi.gain.value = eq.hi; n.gain.gain.value = (vol / 100) * crossGain * Math.pow(10, eq.gain / 20); }, [eq, vol, crossGain]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const load = async (file?: File) => {
    if (!file) return; if (url) URL.revokeObjectURL(url); const next = URL.createObjectURL(file); setUrl(next); setName(file.name.replace(/\.[^.]+$/, "").toUpperCase()); setMeta({ bpm: "...", key: "...", status: "ANALYZING BPM & KEY" });
    try { const ac = new AudioContext(); const buffer = await ac.decodeAudioData(await file.arrayBuffer()); const result = analyse(buffer); setMeta({ bpm: String(result.bpm), key: result.key, status: `${result.bpm} BPM • ${result.key}` }); setDuration(buffer.duration); drawWave(buffer); await ac.close(); } catch { setMeta({ bpm: "—", key: "—", status: "ANALYSIS UNAVAILABLE" }); }
  };
  const drawWave = (buffer: AudioBuffer) => { const c = canvas.current; if (!c) return; const g = c.getContext("2d"); if (!g) return; const d = buffer.getChannelData(0), w = c.width, h = c.height, stride = Math.max(1, Math.floor(d.length / w)); g.clearRect(0, 0, w, h); g.fillStyle = color; for (let x = 0; x < w; x++) { let peak = 0; for (let i = x * stride; i < Math.min((x + 1) * stride, d.length); i++) peak = Math.max(peak, Math.abs(d[i])); g.fillRect(x, h / 2 - peak * h * .46, 1, Math.max(1, peak * h * .92)); } };
  const toggle = async () => { if (!audio.current || !url) return; setupAudio(); if (playing) audio.current.pause(); else await audio.current.play(); setPlaying(!playing); };
  const seek = (e: React.MouseEvent<HTMLCanvasElement>) => { if (!audio.current || !duration) return; const rect = e.currentTarget.getBoundingClientRect(); audio.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration; setTime(audio.current.currentTime); };
  const format = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
  return <div className={`deck deck-${side.toLowerCase()}`} style={{ "--deck": color } as React.CSSProperties}>
    <div className="deck-head"><span>DECK {side}</span><div><b>{name}</b><small>{meta.status}</small></div><label><Upload /> LOAD<input type="file" accept="audio/*" hidden onChange={e => load(e.target.files?.[0])} /></label></div>
    <div className="deck-wave"><canvas ref={canvas} width="900" height="116" onClick={seek}/><div className="wave-playhead" style={{ left: `${duration ? time / duration * 100 : 0}%` }} /><span>{format(time)}</span><span>{format(duration)}</span></div>
    <div className="deck-body"><div className="platter-wrap"><div className={`platter ${playing ? "rotating" : ""}`}><div className="record-label"><Disc3 /><b>MIX<br />LAB</b></div></div><div className="tonearm"><i /><b /></div><div className="bpm"><small>BPM / KEY</small><strong>{meta.bpm}</strong><em>{meta.key}</em></div></div><div className="pitch"><span>+8</span><input aria-label={`Deck ${side} pitch`} type="range" min="-8" max="8" step="0.1" value={pitch} onChange={e => { setPitch(+e.target.value); if (audio.current) audio.current.playbackRate = 1 + (+e.target.value / 100); }} /><span>-8</span><b>{pitch > 0 ? "+" : ""}{pitch.toFixed(1)}%</b></div></div>
    <div className="deck-controls"><button aria-label="先頭に戻る" onClick={() => { if (audio.current) audio.current.currentTime = 0; }}><SkipBack /></button><button className="cue" onClick={() => { if (audio.current) { audio.current.currentTime = 0; setTime(0); } }}>CUE</button><button onClick={toggle} className="play">{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><label><Volume2 /><input aria-label={`Deck ${side} volume`} type="range" value={vol} onChange={e => setVol(+e.target.value)} /></label></div>
    <audio ref={audio} src={url} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onDurationChange={e => setDuration(e.currentTarget.duration || 0)} onEnded={() => setPlaying(false)} />
  </div>;
}

export default function DJ() {
  const [cross, setCross] = useState(50), [eq, setEq] = useState<Record<"A" | "B", Eq>>({ A: { gain: 0, hi: 0, mid: 0, low: 0 }, B: { gain: 0, hi: 0, mid: 0, low: 0 } });
  const setChannel = (side: "A" | "B", key: keyof Eq, value: number) => setEq(old => ({ ...old, [side]: { ...old[side], [key]: value } }));
  return <main className="dj-page"><header><Link href="/" className="brand"><span>M</span>MIXLAB</Link><nav><Link href="/">AUTO MIX</Link><Link className="active" href="/dj">DJ STUDIO</Link></nav><div className="status"><i /> AUDIO ENGINE READY</div></header><section className="dj-title"><div><span>02 / LIVE MODE</span><h1>DJ STUDIO</h1></div><p>波形をクリックして瞬時にシーク。<br />BPM / KEYを自動解析して自由にミックス。</p><div className="live"><i /> LIVE SESSION <b>REALTIME</b></div></section><section className="console"><Deck side="A" color="#c8ff36" crossGain={(100 - cross) / 100} eq={eq.A} /><div className="mixer"><div className="mixer-label">3-BAND EQ MIXER</div><div className="channel-pair">{(["A", "B"] as const).map(side => <div className="channel" key={side}><b>CH {side}</b>{(["gain", "hi", "mid", "low"] as const).map(key => <label key={key}><span>{key.toUpperCase()} <b>{eq[side][key] > 0 ? "+" : ""}{eq[side][key]} dB</b></span><input type="range" min={key === "gain" ? -12 : -18} max={key === "gain" ? 12 : 18} value={eq[side][key]} onChange={e => setChannel(side, key, +e.target.value)} /></label>)}<button className="eq-reset" onClick={() => setEq(old => ({ ...old, [side]: { gain: 0, hi: 0, mid: 0, low: 0 } }))}><RotateCcw /> RESET</button><div className="vu">{Array.from({ length: 12 }, (_, i) => <i className={i < 7 ? "on" : ""} key={i} />)}</div></div>)}</div><div className="cross"><span>CROSSFADER</span><input aria-label="Crossfader" type="range" value={cross} onChange={e => setCross(+e.target.value)} /><div><b>A</b><b>B</b></div></div><button className="headphone"><Headphones /> CUE MIX</button></div><Deck side="B" color="#b880ff" crossGain={cross / 100} eq={eq.B} /></section><div className="dj-hint"><Gauge /><span><b>QUICK START</b> 音源をロード → 波形で位置を指定 → EQで音を整える → クロスフェーダーでミックス</span></div></main>;
}
