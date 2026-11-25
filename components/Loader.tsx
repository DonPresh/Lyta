'use client';
import { useEffect, useRef } from 'react';

const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS = `precision highp float;
uniform sampler2D A,B;uniform vec2 res,c;uniform float R,mixB,fadeA,t,wob,dpr,alpha;
const vec3 cream=vec3(0.984,0.965,0.925);
vec3 bg(vec2 p){return mix(texture2D(A,p/res).rgb,cream,fadeA);}
vec3 inner(vec2 p){vec2 uv=clamp(p/res,0.,1.);return mix(texture2D(A,uv).rgb,texture2D(B,uv).rgb,mixB);}
void main(){
 vec2 p=gl_FragCoord.xy;vec2 d=p-c;float dist=length(d);float ang=atan(d.y,d.x);
 float r0=R*(1.+wob*(0.035*sin(3.*ang+t*3.1)+0.025*sin(5.*ang-t*2.3)+0.015*sin(2.*ang+t*1.7)));
 vec3 col=bg(p);
 if(dist>r0){float s=exp(-pow((dist-r0)/(0.06*r0+6.*dpr),2.));col*=1.-0.07*s*(0.5+0.5*(-d.y/max(dist,1.)));}
 else{
  float r=dist/r0;float h=sqrt(max(1.-r*r,0.));vec2 dir=d/max(dist,0.001);float edge=1.-h;
  vec2 base=c+d*0.68-dir*edge*r0*0.35;float ca=0.025*edge*r0;
  vec3 g=vec3(inner(base+dir*ca).r,inner(base).g,inner(base-dir*ca).b);
  float band=smoothstep(0.72,0.95,r)*(1.-smoothstep(0.97,1.,r)*0.4);float low=0.55+0.45*(-dir.y);
  vec3 cob=vec3(0.11,0.21,0.84),cy=vec3(0.35,0.78,1.),pk=vec3(1.,0.55,0.82);
  float s1=0.5+0.5*sin(ang*2.+t*0.9+r*6.);float s2=0.5+0.5*sin(ang*3.-t*0.7);
  g=mix(g,mix(mix(cob,cy,s1*0.7),pk,s2*0.35),clamp(band*low*0.85,0.,1.));
  g+=vec3(1.)*smoothstep(0.32,0.,length(d/r0-vec2(-0.42,0.5)))*0.22;
  g=mix(g,g*0.9,smoothstep(0.985,1.,r));
  col=mix(col,g,smoothstep(r0,r0-1.5*dpr,dist));
 }
 gl_FragColor=vec4(mix(cream,col,alpha),alpha);
}`;

/** Liquid glass launch animation. Calls onDone when it finishes, or when tapped. */
export function Loader({ onDone }: { onDone: () => void }) {
  const wrap = useRef<HTMLDivElement>(null), cvRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone); doneRef.current = onDone;

  useEffect(() => {
    const el = wrap.current!, cv = cvRef.current!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = cv.getContext('webgl', { premultipliedAlpha: false, alpha: true });
    let finished = false; const finish = () => { if (!finished) { finished = true; doneRef.current(); } };
    if (!gl || reduced) { const t = setTimeout(finish, 900); return () => clearTimeout(t); }

    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!; gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { const t = setTimeout(finish, 600); return () => clearTimeout(t); }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U: Record<string, WebGLUniformLocation | null> = {};
    for (const n of ['A', 'B', 'res', 'c', 'R', 'mixB', 'fadeA', 't', 'wob', 'dpr', 'alpha']) U[n] = gl.getUniformLocation(prog, n);
    const mkTex = (unit: number) => { const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return tx; };
    const tA = mkTex(0), tB = mkTex(1); gl.uniform1i(U.A, 0); gl.uniform1i(U.B, 1);

    let W = 0, H = 0, dpr = 1;
    const font = getComputedStyle(document.body).fontFamily;
    const paint = () => {
      const r = el.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; gl.viewport(0, 0, cv.width, cv.height);
      const make = (which: 'A' | 'B') => { const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr; const x = c.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0);
        x.fillStyle = '#FBF6EC'; x.fillRect(0, 0, W, H); x.textBaseline = 'middle'; x.textAlign = 'center';
        if (which === 'A') { x.fillStyle = '#121318'; const fs = Math.round(W * 0.07); x.font = `600 ${fs}px ${font}`; x.fillText('A kinder way', W / 2, H * 0.42); x.fillText('to get lighter.', W / 2, H * 0.42 + fs * 1.2); }
        else { const fs = Math.round(W * 0.056), r = W * 0.022, gap = W * 0.014; x.font = `900 ${fs}px ${font}`; const tw = x.measureText('lyta').width; const x0 = W / 2 - (2 * r + gap + tw) / 2, cy = H * 0.46;
          x.fillStyle = '#1C35D6'; x.beginPath(); x.arc(x0 + r, cy, r, 0, Math.PI * 2); x.fill();
          x.fillStyle = '#FBF6EC'; x.beginPath(); x.arc(x0 + r * 1.3, cy - r * 0.36, r * 0.31, 0, Math.PI * 2); x.fill();
          x.fillStyle = '#1C35D6'; x.textAlign = 'left'; x.fillText('lyta', x0 + 2 * r + gap, cy + fs * 0.04); }
        return c; };
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tA); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, make('A'));
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tB); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, make('B'));
    };
    paint();

    const ease = (x: number) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const back = (x: number) => 1 + 2.9 * Math.pow(x - 1, 3) + 1.9 * Math.pow(x - 1, 2);
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const t0 = performance.now(); let raf = 0;
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const sx = W / 2, sy = H * 0.82, big = Math.max(W, H) * 0.42, lens = 92 * (W / 390), cy = H * 0.46;
      let R = 4, x = sx, y = sy, mixB = 0, fadeA = 0, wob = 0.3, alpha = 1;
      if (t < 0.35) { R = lerp(4, 60, ease(t / 0.35)); }
      else if (t < 1.55) { const k = ease((t - 0.35) / 1.2); R = lerp(60, big, k); x = lerp(sx, W / 2, k); y = lerp(sy, cy, k); fadeA = Math.min(1, Math.max(0, (t - 0.95) / 0.5)); mixB = t > 1.45 ? 1 : 0; wob = 0.28; }
      else if (t < 2.7) { R = lerp(big, lens, back(Math.min(1, (t - 1.55) / 1.15))); x = W / 2; y = cy; fadeA = 1; mixB = 1; wob = 0.4 + 2.2 * Math.exp(-(t - 1.55) * 2.2); }
      else if (t < 3.4) { R = lens * (1 + 0.02 * Math.sin((t - 2.7) * 3)); x = W / 2; y = cy; fadeA = 1; mixB = 1; wob = 0.45; }
      else { const k = ease(Math.min(1, (t - 3.4) / 0.6)); R = lerp(lens, Math.max(W, H) * 1.3, k); x = W / 2; y = cy; fadeA = 1; mixB = 1; wob = 0.15; alpha = 1 - Math.max(0, (t - 3.7) / 0.3); }
      gl.uniform2f(U.res, cv.width, cv.height); gl.uniform2f(U.c, x * dpr, (H - y) * dpr); gl.uniform1f(U.R, R * dpr);
      gl.uniform1f(U.mixB, mixB); gl.uniform1f(U.fadeA, fadeA); gl.uniform1f(U.t, now / 1000); gl.uniform1f(U.wob, wob); gl.uniform1f(U.dpr, dpr); gl.uniform1f(U.alpha, Math.max(0, alpha));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (t > 4.0) { finish(); return; }
      raf = requestAnimationFrame(frame);
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { paint(); raf = requestAnimationFrame(frame); });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div onClick={() => doneRef.current()} role="img" aria-label="Lyta is loading" style={{ position: 'fixed', inset: 0, background: 'var(--cream)', zIndex: 100 }}>
      <div ref={wrap} style={{ maxWidth: 430, height: '100%', margin: '0 auto' }}>
        <canvas ref={cvRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );
}
