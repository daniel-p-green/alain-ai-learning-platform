"use client";

function createWorker() {
  const lines = [
    "self.console={log:(...a)=>self.postMessage({type:'log',data:a.join(' ')})};",
    "onmessage=async(e)=>{",
    " try{",
    "  const payload = typeof e.data === 'object' && e.data !== null ? e.data : { code: String(e.data||'') };",
    "  const { code, lang } = payload;",
    "  if (typeof code !== 'string' || code.trim().length === 0){ throw new Error('No code to execute'); }",
    "  if (lang === 'ts'){ self.postMessage({type:'err',stderr:'TypeScript execution is not supported in this preview. Please switch to JavaScript.'}); return; }",
    "  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;",
    "  const fn = new AsyncFunction(code);",
    "  const res = await fn();",
    "  self.postMessage({type:'done',stdout: res===undefined?'':String(res)});",
    " }catch(err){ self.postMessage({type:'err',stderr:String(err&&err.message||err)}) }",
    "}" 
  ].join('\n');
  const workerBlob = new Blob([lines], { type: 'application/javascript' });
  const url = URL.createObjectURL(workerBlob);
  const worker = new Worker(url);
  return { worker, url };
}

export function runJS(code: string, ts = false): Promise<{ stdout: string; stderr?: string }>{
  return new Promise((resolve) => {
    const { worker: w, url } = createWorker();
    let stdout = '';
    let stderr = '';
    const cleanup = () => {
      try { w.terminate(); } catch {}
      URL.revokeObjectURL(url);
    };
    const timer = setTimeout(() => {
      stderr = 'Timeout';
      cleanup();
      resolve({ stdout, stderr });
    }, 8000);
    w.onmessage = (ev: MessageEvent) => {
      const m: any = ev.data;
      if (m.type === 'log') stdout += (stdout? '\n':'') + String(m.data || '');
      if (m.type === 'done') {
        clearTimeout(timer);
        cleanup();
        resolve({ stdout: stdout || m.stdout || '' });
      }
      if (m.type === 'err') {
        clearTimeout(timer);
        cleanup();
        resolve({ stdout, stderr: m.stderr || 'Error' });
      }
    };
    w.postMessage({ code, lang: ts ? 'ts' : 'js' });
  });
}
