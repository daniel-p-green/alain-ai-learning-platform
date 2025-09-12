"use client";

function createWorker(ts: boolean) {
  const lines = [
    "self.console={log:(...a)=>self.postMessage({type:'log',data:a.join(' ')})};",
    "onmessage=async(e)=>{",
    " try{",
    "  let code=e.data;",
    ts ? "  try{code = code.replace(/:\\s*[A-Za-z_][A-Za-z0-9_<>?,\\s\\[\\]]*/g,'').replace(/<[^>]+>/g,'');}catch{}" : "",
    "  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;",
    "  const fn = new AsyncFunction(code);",
    "  const res = await fn();",
    "  self.postMessage({type:'done',stdout: res===undefined?'':String(res)});",
    " }catch(err){ self.postMessage({type:'err',stderr:String(err&&err.message||err)}) }",
    "}" 
  ].join('\n');
  const ***REMOVED*** = new Blob([lines], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(***REMOVED***));
}

export function runJS(code: string, ts = false): Promise<{ stdout: string; stderr?: string }>{
  return new Promise((resolve) => {
    const w = createWorker(ts);
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { stderr = 'Timeout'; try{w.terminate();}catch{} resolve({ stdout, stderr }); }, 8000);
    w.onmessage = (ev: MessageEvent) => {
      const m: any = ev.data;
      if (m.type === 'log') stdout += (stdout? '\n':'') + String(m.data || '');
      if (m.type === 'done') { clearTimeout(timer); resolve({ stdout: stdout || m.stdout || '' }); try{w.terminate();}catch{} }
      if (m.type === 'err') { clearTimeout(timer); resolve({ stdout, stderr: m.stderr || 'Error' }); try{w.terminate();}catch{} }
    };
    w.postMessage(code);
  });
}

