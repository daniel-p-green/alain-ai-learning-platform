"use client";

declare global {
  interface Window {
    loadPyodide?: any;
  }
}

let pyodidePromise: Promise<any> | null = null;

async function ensurePyodide() {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise(async (resolve, reject) => {
    try {
      if (typeof window === 'undefined') return reject(new Error('no window'));
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = async () => {
          try {
            const py = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
            resolve(py);
          } catch (e) { reject(e); }
        };
        script.onerror = reject as any;
        document.head.appendChild(script);
      } else {
        const py = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
        resolve(py);
      }
    } catch (e) {
      reject(e);
    }
  });
  return pyodidePromise;
}

export async function runPython(code: string): Promise<{ stdout: string; stderr?: string }> {
  const py = await ensurePyodide();
  try {
    const wrapper = "import sys, io\n_buf = io.StringIO()\nsys_stdout = sys.stdout\nsys.stdout = _buf\ntry:\n exec(compile(" + JSON.stringify(code) + ", '<cell>', 'exec'))\nfinally:\n sys.stdout = sys_stdout\n_buf.getvalue()";
    const out = await py.runPythonAsync(wrapper);
    return { stdout: String(out || '') };
  } catch (e: any) {
    return { stdout: '', stderr: String(e?.message || e) };
  }
}

