'use client';
import { useEffect, useRef } from 'react';

// The liquid glass lens from the loader, tuned green for the Streak screen.
// It drops onto the streak number, wobbles, and drifts; drag it around and it springs back.
const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS = `precision highp float;
uniform sampler2D A;uniform vec2 res,c;uniform float R,t,wob,dpr,mag;
uniform vec3 rimA,rimB,rimC;
vec3 tex(vec2 p){return texture2D(A,clamp(p/res,0.,1.)).rgb;}
void main(){
 vec2 p=gl_FragCoord.xy;vec2 d=p-c;float dist=length(d);float ang=atan(d.y,d.x);
 float r0=R*(1.+wob*(0.035*sin(3.*ang+t*3.1)+0.025*sin(5.*ang-t*2.3)+0.015*sin(2.*ang+t*1.7)));
 vec3 col=tex(p);
 if(dist>r0){float s=exp(-pow((dist-r0)/(0.06*r0+6.*dpr),2.));col*=1.-0.08*s*(0.5+0.5*(-d.y/max(dist,1.)));}
 else{
  float r=dist/r0;float h=sqrt(max(1.-r*r,0.));vec2 dir=d/max(dist,0.001);float edge=1.-h;
  vec2 base=c+d*mag-dir*edge*r0*0.35;float ca=0.03*edge*r0;
  vec3 g=vec3(tex(base+dir*ca).r,tex(base).g,tex(base-dir*ca).b);
  float band=smoothstep(0.72,0.95,r)*(1.-smoothstep(0.97,1.,r)*0.4);float low=0.55+0.45*(-dir.y);
  float s1=0.5+0.5*sin(ang*2.+t*0.9+r*6.);float s2=0.5+0.5*sin(ang*3.-t*0.7);
  g=mix(g,mix(mix(rimA,rimB,s1*0.7),rimC,s2*0.35),clamp(band*low*0.85,0.,1.));
  g+=vec3(1.)*smoothstep(0.32,0.,length(d/r0-vec2(-0.42,0.5)))*0.24;
  g=mix(g,g*0.9,smoothstep(0.985,1.,r));
  col=mix(col,g,smoothstep(r0,r0-1.5*dpr,dist));
 }
 gl_FragColor=vec4(col,1.);
}`;

export function GlassHero({ big, caption, height = 150, replay = 0 }: { big: string; caption: string; height?: number; replay?: number }) {
  const wrap = useRef<HTMLDivElement>(null), cvRef = useRef<HTMLCanvasElement>(null), fallback = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrap.current!, cv = cvRef.current!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = !reduced ? cv.getContext('webgl', { premultipliedAlpha: false }) : null;
    const showFallback = () => { if (fallback.current) fallback.current.style.visibility = 'visible'; cv.style.display = 'none'; };
    if (!gl) { showFallback(); return; }
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!; gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { showFallback(); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U: Record<string, WebGLUniformLocation | null> = {};
    for (const n of ['A', 'res', 'c', 'R', 't', 'wob', 'dpr', 'mag', 'rimA', 'rimB', 'rimC']) U[n] = gl.getUniformLocation(prog, n);
    gl.uniform3f(U.rimA, 0.04, 0.42, 0.31); gl.uniform3f(U.rimB, 0.55, 0.92, 0.72); gl.uniform3f(U.rimC, 0.98, 0.9, 0.55);
    const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx); gl.uniform1i(U.A, 0);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);

    let W = 0, H = 0, dpr = 1, numW = 0;
    const font = getComputedStyle(document.body).fontFamily;
    const paint = () => {
      const r = el.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; gl.viewport(0, 0, cv.width, cv.height);
      const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr; const x = c.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.fillStyle = '#FBF6EC'; x.fillRect(0, 0, W, H);
      const fs = Math.min(132, H * 0.92); x.font = `900 ${fs}px ${font}`; x.letterSpacing = `${-0.06 * fs}px`; x.textBaseline = 'alphabetic';
      x.fillStyle = '#0B6B4F'; x.fillText(big, -fs * 0.02, H * 0.5 + fs * 0.36); numW = x.measureText(big).width;
      x.letterSpacing = '0px'; x.font = `600 20px ${font}`; x.fillStyle = '#121318';
      const cx = Math.min(Math.max(numW + 28, W * 0.42), W * 0.6), maxW = W - cx; const words = caption.split(' '); const lines: string[] = []; let line = '';
      for (const w of words) { const tryL = line ? line + ' ' + w : w; if (x.measureText(tryL).width > maxW && line) { lines.push(line); line = w; } else line = tryL; }
      if (line) lines.push(line);
      const lh = 24, top = H * 0.5 - (lines.length * lh) / 2 + 17; lines.forEach((l, n) => x.fillText(l, cx, top + n * lh));
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    };

    const ease = (x: number) => 1 + 2.9 * Math.pow(x - 1, 3) + 1.9 * Math.pow(x - 1, 2);
    const t0 = performance.now(); let raf = 0, lx = 0, ly = 0, vx = 0, vy = 0, started = false;
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const homeX = Math.min(numW * 0.55, W * 0.3) + 6 * Math.sin(t * 0.6), homeY = H * 0.52 + 4 * Math.cos(t * 0.8);
      if (!started) { lx = homeX; ly = H + 40; started = true; }
      const tx_ = drag.current ? drag.current.x : homeX, ty_ = drag.current ? drag.current.y : homeY;
      // spring towards target
      vx = (vx + (tx_ - lx) * 0.06) * 0.82; vy = (vy + (ty_ - ly) * 0.06) * 0.82; lx += vx; ly += vy;
      const grow = ease(Math.min(1, t / 1.1)), R = Math.max(6, H * 0.42 * grow);
      const wob = 0.45 + 2.4 * Math.exp(-t * 2.2) + Math.min(1.2, Math.hypot(vx, vy) * 0.08);
      gl.uniform2f(U.res, cv.width, cv.height); gl.uniform2f(U.c, lx * dpr, (H - ly) * dpr); gl.uniform1f(U.R, R * dpr);
      gl.uniform1f(U.t, now / 1000); gl.uniform1f(U.wob, wob); gl.uniform1f(U.dpr, dpr); gl.uniform1f(U.mag, 0.62);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    };
    let alive = true;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { if (!alive) return; paint(); raf = requestAnimationFrame(frame); });
    const onResize = () => paint(); addEventListener('resize', onResize);
    return () => { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', onResize); };
  }, [big, caption, replay]);

  const pt = (e: React.PointerEvent) => { const r = wrap.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  return (
    <div ref={wrap} style={{ position: 'relative', height, touchAction: 'pan-y', cursor: 'grab' }}
      onPointerDown={e => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = pt(e); }}
      onPointerMove={e => { if (drag.current) drag.current = pt(e); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <canvas ref={cvRef} aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block' }} />
      <div ref={fallback} className="row" style={{ position: 'absolute', inset: 0, gap: 24, alignItems: 'center', visibility: 'hidden' }}>
        <span className="num" style={{ fontSize: Math.min(132, height * 0.92), color: 'var(--green)' }}>{big}</span>
        <span className="h3" style={{ maxWidth: 200 }}>{caption}</span>
      </div>
      <span className="sr-only">{big} {caption}</span>
    </div>
  );
}
