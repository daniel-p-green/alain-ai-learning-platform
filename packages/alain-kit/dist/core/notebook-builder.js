/**
 * ALAIN-Kit Notebook Builder
 *
 * Assembles final Jupyter notebooks from outline and sections.
 * Ensures proper structure and Colab compatibility.
 */
import { createLogger, trackEvent } from './obs.js';
export class NotebookBuilder {
    constructor() {
        this.log = createLogger('NotebookBuilder');
    }
    /**
     * Build complete Jupyter notebook from outline and sections
     */
    buildNotebook(outline, sections) {
        const started = Date.now();
        // Validate inputs
        if (!outline?.title || !outline.overview) {
            throw new Error('Invalid outline: missing title or overview');
        }
        if (!Array.isArray(sections)) {
            throw new Error('Sections must be an array');
        }
        const cells = [];
        // ALAIN branding (expanded name) – show first
        cells.push(this.createBrandingCell());
        // Environment detection cell (Colab compatibility)
        cells.push(this.createEnvironmentCell());
        // Secret management primer + .env loader/creator
        cells.push(this.createEnvDocsCell());
        cells.push(this.createDotenvCell());
        // Provider setup (Poe-friendly OpenAI-compatible client)
        cells.push(this.createProviderSetupCell());
        // Quick provider smoke test
        cells.push(this.createProviderSmokeCell());
        // Surface a concise runtime checklist so exported notebooks stand on their own.
        cells.push(this.createTransformerRuntimeCell());
        // Title and overview
        cells.push(this.createTitleCell(outline.title, outline.overview));
        // Learning objectives
        cells.push(this.createObjectivesCell(outline.objectives));
        // Prerequisites
        if (outline.prerequisites?.length > 0) {
            cells.push(this.createPrerequisitesCell(outline.prerequisites));
        }
        // Setup section
        if (outline.setup) {
            const setupCells = this.createSetupCells(outline.setup);
            setupCells.forEach(cell => cells.push(cell));
        }
        // Ensure ipywidgets is available for interactive MCQs
        cells.push({
            cell_type: 'code',
            metadata: {},
            source: [
                "# Ensure ipywidgets is installed for interactive MCQs\n",
                "try:\n",
                "    import ipywidgets  # type: ignore\n",
                "    print('ipywidgets available')\n",
                "except Exception:\n",
                "    import sys, subprocess\n",
                "    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'ipywidgets>=8.0.0'])\n"
            ],
            execution_count: null,
            outputs: [],
        });
        const pendingAssessments = Array.isArray(outline.assessments) ? outline.assessments.slice() : [];
        let assessmentIntroInserted = false;
        // Generated sections
        sections.forEach((section, index) => {
            section.content.forEach(cell => {
                const source = this.formatCellSource(cell.source);
                if (cell.cell_type === 'code') {
                    const codeCell = {
                        cell_type: 'code',
                        metadata: {},
                        source,
                        execution_count: null,
                        outputs: [],
                    };
                    cells.push(codeCell);
                }
                else {
                    const markdownCell = {
                        cell_type: 'markdown',
                        metadata: {},
                        source,
                    };
                    cells.push(markdownCell);
                }
            });
            if (pendingAssessments.length) {
                if (!assessmentIntroInserted) {
                    this.createAssessmentIntroCells().forEach(cell => cells.push(cell));
                    assessmentIntroInserted = true;
                }
                const header = this.createAssessmentSectionHeader(section.title || `Step ${index + 1}`);
                if (header)
                    cells.push(header);
                const remainingSections = sections.length - index;
                const perSection = Math.max(1, Math.ceil(pendingAssessments.length / remainingSections));
                for (let q = 0; q < perSection && pendingAssessments.length; q++) {
                    const nextAssessment = pendingAssessments.shift();
                    if (!nextAssessment)
                        break;
                    const assessmentCell = this.createAssessmentQuestionCell(nextAssessment);
                    if (assessmentCell)
                        cells.push(assessmentCell);
                }
            }
        });
        if (pendingAssessments.length) {
            if (!assessmentIntroInserted) {
                this.createAssessmentIntroCells().forEach(cell => cells.push(cell));
                assessmentIntroInserted = true;
            }
            const header = this.createAssessmentSectionHeader('Bonus Knowledge Checks');
            if (header)
                cells.push(header);
            while (pendingAssessments.length) {
                const nextAssessment = pendingAssessments.shift();
                if (!nextAssessment)
                    break;
                const assessmentCell = this.createAssessmentQuestionCell(nextAssessment);
                if (assessmentCell)
                    cells.push(assessmentCell);
            }
        }
        // Troubleshooting guide
        cells.push(this.createTroubleshootingCell());
        const createdAt = new Date().toISOString();
        const nb = {
            cells,
            metadata: {
                kernelspec: {
                    display_name: "Python 3",
                    language: "python",
                    name: "python3"
                },
                language_info: {
                    name: "python",
                    version: "3"
                },
                alain: {
                    schemaVersion: "1.0.0",
                    createdAt,
                    title: outline.title,
                    builder: { name: "alain-kit", version: "0.2.0" }
                }
            },
            nbformat: 4,
            nbformat_minor: 4
        };
        const dur = Date.now() - started;
        try {
            trackEvent('alain_notebook_built', { cells: cells.length, sections: sections.length, duration_ms: dur });
        }
        catch { }
        this.log.info('timing', { op: 'buildNotebook', duration_ms: dur, cells: cells.length, sections: sections.length });
        return nb;
    }
    createBrandingCell() {
        const createdAt = new Date().toISOString().split('T')[0];
        return {
            cell_type: "markdown",
            metadata: {},
            source: [
                `> Generated by ALAIN (Applied Learning AI Notebooks) — ${createdAt}.\n`
            ]
        };
    }
    createEnvironmentCell() {
        return {
            cell_type: 'code',
            metadata: {},
            source: [
                "# 🔧 Environment Detection and Setup\n",
                "import sys\n",
                "import os\n",
                "\n",
                "# Detect environment\n",
                "IN_COLAB = 'google.colab' in sys.modules\n",
                "env_label = 'Google Colab' if IN_COLAB else 'Local'\n",
                "print(f'Environment: {env_label}')\n",
                "\n",
                "# Setup environment-specific configurations\n",
                "if IN_COLAB:\n",
                "    print('📝 Colab-specific optimizations enabled')\n",
                "    try:\n",
                "        from google.colab import output\n",
                "        output.enable_custom_widget_manager()\n",
                "    except Exception:\n",
                "        pass\n"
            ],
            execution_count: null,
            outputs: [],
        };
    }
    createEnvDocsCell() {
        return {
            cell_type: "markdown",
            metadata: {},
            source: [
                "## API Keys and .env Files\n",
                "\n",
                "Many providers require API keys. Do not hardcode secrets in notebooks. Use a local .env file that the notebook loads at runtime.\n",
                "\n",
                "- Why .env? Keeps secrets out of source control and tutorials.\n",
                "- Where? Place `.env.local` (preferred) or `.env` in the same folder as this notebook. `.env.local` overrides `.env`.\n",
                "- What keys? Common: `POE_API_KEY` (Poe-compatible servers), `OPENAI_API_KEY` (OpenAI-compatible), `HF_TOKEN` (Hugging Face).\n",
                "- Find your keys:\n",
                "  - Poe-compatible providers: see your provider's dashboard for an API key.\n",
                "  - Hugging Face: create a token at https://huggingface.co/settings/tokens (read scope is usually enough).\n",
                "  - Local servers: you may not need a key; set `OPENAI_BASE_URL` instead (e.g., http://localhost:1234/v1).\n",
                "\n",
                "The next cell will: load `.env.local`/`.env`, prompt for missing keys, and optionally write `.env.local` with secure permissions so future runs just work.\n"
            ]
        };
    }
    createDotenvCell() {
        return {
            cell_type: 'code',
            metadata: {},
            source: [
                "# 🔐 Load and manage secrets from .env\\n",
                "# This cell will: (1) load .env.local/.env, (2) prompt for missing keys, (3) optionally write .env.local (0600).\\n",
                "# Location: place your .env files next to this notebook (recommended) or at project root.\\n",
                "# Disable writing: set SAVE_TO_ENV = False below.\\n",
                "import os, pathlib\\n",
                "from getpass import getpass\\n",
                "\\n",
                "# Install python-dotenv if missing\\n",
                "try:\\n",
                "    import dotenv  # type: ignore\\n",
                "except Exception:\\n",
                "    import sys, subprocess\\n",
                "    if 'IN_COLAB' in globals() and IN_COLAB:\\n",
                "        try:\\n",
                "            import IPython\\n",
                "            ip = IPython.get_ipython()\\n",
                "            if ip is not None:\\n",
                "                ip.run_line_magic('pip', 'install -q python-dotenv>=1.0.0')\\n",
                "            else:\\n",
                "                subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'python-dotenv>=1.0.0'])\\n",
                "        except Exception as colab_exc:\\n",
                "            print('⚠️ Colab pip fallback failed:', colab_exc)\\n",
                "            raise\\n",
                "    else:\\n",
                "        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'python-dotenv>=1.0.0'])\\n",
                "    import dotenv  # type: ignore\\n",
                "\\n",
                "# Prefer .env.local over .env\\n",
                "cwd = pathlib.Path.cwd()\\n",
                "env_local = cwd / '.env.local'\\n",
                "env_file = cwd / '.env'\\n",
                "chosen = env_local if env_local.exists() else (env_file if env_file.exists() else None)\\n",
                "if chosen:\\n",
                "    dotenv.load_dotenv(dotenv_path=str(chosen))\\n",
                "    print(f'Loaded env from {chosen.name}')\\n",
                "else:\\n",
                "    print('No .env.local or .env found; will prompt for keys.')\\n",
                "\\n",
                "# Keys we might use in this notebook\\n",
                "keys = ['POE_API_KEY', 'OPENAI_API_KEY', 'HF_TOKEN']\\n",
                "missing = [k for k in keys if not os.environ.get(k)]\\n",
                "for k in missing:\\n",
                "    val = getpass(f'Enter {k} (hidden, press Enter to skip): ')\\n",
                "    if val:\\n",
                "        os.environ[k] = val\\n",
                "\\n",
                "# Decide whether to persist to .env.local for convenience\\n",
                "SAVE_TO_ENV = True  # set False to disable writing\\n",
                "if SAVE_TO_ENV:\\n",
                "    target = env_local\\n",
                "    existing = {}\\n",
                "    if target.exists():\\n",
                "        try:\\n",
                "            for line in target.read_text().splitlines():\\n",
                "                if not line.strip() or line.strip().startswith('#') or '=' not in line:\\n",
                "                    continue\\n",
                "                k,v = line.split('=',1)\\n",
                "                existing[k.strip()] = v.strip()\\n",
                "        except Exception:\\n",
                "            pass\\n",
                "    for k in keys:\\n",
                "        v = os.environ.get(k)\\n",
                "        if v:\\n",
                "            existing[k] = v\\n",
                "    lines = []\\n",
                "    for k,v in existing.items():\\n",
                "        # Always quote; escape backslashes and double quotes for safety\\n",
                "        escaped = v.replace(\"\\\\\", \"\\\\\\\\\")\\n",
                "        escaped = escaped.replace(\"\\\"\", \"\\\\\"\")\\n",
                "        vv = f'\"{escaped}\"'\\n",
                "        lines.append(f\"{k}={vv}\")\\n",
                "    target.write_text('\\\\n'.join(lines) + '\\\\n')\\n",
                "    try:\\n",
                "        target.chmod(0o600)  # 600\\n",
                "    except Exception:\\n",
                "        pass\\n",
                "    print(f'🔏 Wrote secrets to {target.name} (permissions 600)')\\n",
                "\\n",
                "# Simple recap (masked)\\n",
                "def mask(v):\\n",
                "    if not v: return '∅'\\n",
                "    return v[:3] + '…' + v[-2:] if len(v) > 6 else '•••'\\n",
                "for k in keys:\\n",
                "    print(f'{k}:', mask(os.environ.get(k)))\\n"
            ],
            execution_count: null,
            outputs: [],
        };
    }
    createProviderSetupCell() {
        return {
            cell_type: 'code',
            metadata: {},
            source: [
                "# 🌐 ALAIN Provider Setup (Poe/OpenAI-compatible)\n",
                "# About keys: If you have POE_API_KEY, this cell maps it to OPENAI_API_KEY and sets OPENAI_BASE_URL to Poe.\n",
                "# Otherwise, set OPENAI_API_KEY (and optionally OPENAI_BASE_URL for local/self-hosted servers).\n",
                "import os\n",
                "try:\n",
                "    # Prefer Poe; fall back to OPENAI_API_KEY if set\n",
                "    poe = os.environ.get('POE_API_KEY')\n",
                "    if poe:\n",
                "        os.environ.setdefault('OPENAI_BASE_URL', 'https://api.poe.com/v1')\n",
                "        os.environ.setdefault('OPENAI_API_KEY', poe)\n",
                "    # Prompt if no key present\n",
                "    if not os.environ.get('OPENAI_API_KEY'):\n",
                "        from getpass import getpass\n",
                "        os.environ['OPENAI_API_KEY'] = getpass('Enter POE_API_KEY (input hidden): ')\n",
                "        os.environ.setdefault('OPENAI_BASE_URL', 'https://api.poe.com/v1')\n",
                "    # Ensure openai client is installed\n",
                "    try:\n",
                "        from openai import OpenAI  # type: ignore\n",
                "    except Exception:\n",
                "        import sys, subprocess\n",
                "        if 'IN_COLAB' in globals() and IN_COLAB:\n",
                "            try:\n",
                "                import IPython\n",
                "                ip = IPython.get_ipython()\n",
                "                if ip is not None:\n",
                "                    ip.run_line_magic('pip', 'install -q openai>=1.34.0')\n",
                "                else:\n",
                "                    subprocess.check_call([sys.executable, '-m', '\'pip\'', '\'install\'', '\'-q\'', '\'openai>=1.34.0\'])\n",
                "            except Exception as colab_exc:\n",
                "                print('⚠️ Colab pip fallback failed:', colab_exc)\n",
                "                raise\n",
                "        else:\n",
                "            subprocess.check_call([sys.executable, '-m', '\'pip\'', '\'install\'', '\'-q\'', '\'openai>=1.34.0\'])\n",
                "        from openai import OpenAI  # type: ignore\n",
                "    # Create client\n",
                "    from openai import OpenAI\n",
                "    client = OpenAI(base_url=os.environ['OPENAI_BASE_URL'], api_key=os.environ['OPENAI_API_KEY'])\n",
                "    print('✅ Provider ready:', os.environ.get('OPENAI_BASE_URL'))\n",
                "except Exception as e:\n",
                "    print('⚠️ Provider setup failed:', e)\n"
            ],
            execution_count: null,
            outputs: [],
        };
    }
    createProviderSmokeCell() {
        return {
            cell_type: 'code',
            metadata: {},
            source: [
                "# 🔎 Provider Smoke Test (1-token)\n",
                "import os\n",
                "model = os.environ.get('ALAIN_MODEL') or 'gpt-4o-mini'\n",
                "if 'client' not in globals():\n",
                "    print('⚠️ Provider client not available; skipping smoke test')\n",
                "else:\n",
                "    try:\n",
                "        resp = client.chat.completions.create(model=model, messages=[{\"role\":\"user\",\"content\":\"ping\"}], max_tokens=1)\n",
                "        print('✅ Smoke OK:', resp.choices[0].message.content)\n",
                "    except Exception as e:\n",
                "        print('⚠️ Smoke test failed:', e)\n"
            ],
            execution_count: null,
            outputs: [],
        };
    }
    /**
     * Adds a light-touch runtime recap so learners see the same checklist that lives in the UI/README.
     */
    createTransformerRuntimeCell() {
        return {
            cell_type: 'markdown',
            metadata: {},
            source: [
                "## Local Transformer Runtime Tips\n\n",
                "- Install the optimized stack with `pip install -U transformers kernels accelerate triton` (PyTorch >= 2.8 already bundles Triton 3.4).\n",
                "- Load GPT-OSS with downloadable kernels to compare bf16 vs MXFP4 memory usage:\n",
                "```python\nfrom transformers import AutoModelForCausalLM\n\nmodel = AutoModelForCausalLM.from_pretrained(\n    \"openai/gpt-oss-20b\",\n    dtype=\"auto\",\n    device_map=\"auto\",\n    use_kernels=True,\n)\n```\n",
                "- Hopper GPUs can enable Flash Attention 3 sinks via `attn_implementation=\"kernels-community/vllm-flash-attn3\"`.\n",
                "- If MXFP4 kernels are unavailable, Transformers automatically falls back to bf16; monitor VRAM and throughput to pick the best mode.\n"
            ]
        };
    }
    createTitleCell(title, overview) {
        return {
            cell_type: "markdown",
            metadata: {},
            source: [`# ${title}\n\n${overview}`]
        };
    }
    createObjectivesCell(objectives) {
        return {
            cell_type: "markdown",
            metadata: {},
            source: [
                "## Learning Objectives\n\n",
                "By the end of this tutorial, you will be able to:\n\n",
                ...objectives.map((obj, i) => `${i + 1}. ${obj}\n`)
            ]
        };
    }
    createPrerequisitesCell(prerequisites) {
        return {
            cell_type: "markdown",
            metadata: {},
            source: [
                "## Prerequisites\n\n",
                ...prerequisites.map(prereq => `- ${prereq}\n`)
            ]
        };
    }
    createSetupCells(setup) {
        const cells = [
            {
                cell_type: "markdown",
                metadata: {},
                source: ["## Setup\n\nLet's install the required packages and set up our environment.\n"]
            }
        ];
        if (setup.requirements && setup.requirements.length > 0) {
            cells.push({
                cell_type: "code",
                metadata: {},
                source: [
                    "# Install packages (Colab-compatible)\n",
                    "# Check if we're in Colab\n",
                    "import sys\n",
                    "IN_COLAB = 'google.colab' in sys.modules\n",
                    "\n",
                    "if IN_COLAB:\n",
                    `    !pip install -q ${setup.requirements.join(' ')}\n`,
                    "else:\n",
                    "    import subprocess\n",
                    `    subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + ${JSON.stringify(setup.requirements)})\n`,
                    "\n",
                    "print('✅ Packages installed!')\n"
                ],
                execution_count: null,
                outputs: [],
            });
        }
        return cells;
    }
    createAssessmentIntroCells() {
        return [
            {
                cell_type: 'markdown',
                metadata: {},
                source: [
                    '## Knowledge Check (Interactive)\n\n',
                    'Use the widgets below to select an answer and click Grade to see feedback.\n'
                ]
            },
            {
                cell_type: 'code',
                metadata: {},
                source: [
                    String.raw `# MCQ helper (ipywidgets)
import ipywidgets as widgets
from IPython.display import display, Markdown

def render_mcq(question, options, correct_index, explanation):
    cleaned = []
    for idx, raw in enumerate(options):
        text = str(raw or "").strip()
        prefix = f"{chr(65+idx)}. "
        if not text.lower().startswith(prefix.lower()):
            text = prefix + text
        cleaned.append(text)
    rb = widgets.RadioButtons(options=[(label, idx) for idx, label in enumerate(cleaned)], description="")
    grade_btn = widgets.Button(description='Grade', button_style='primary')
    feedback = widgets.HTML(value='')
    def on_grade(_):
        sel = rb.value
        if sel is None:
            feedback.value = '<p>⚠️ Please select an option.</p>'
            return
        if sel == correct_index:
            feedback.value = '<p>✅ Correct!</p>'
        else:
            feedback.value = f'<p>❌ Incorrect. Correct answer is {chr(65+correct_index)}.</p>'
        feedback.value += f'<div><em>Explanation:</em> {explanation}</div>'
    grade_btn.on_click(on_grade)
    display(Markdown('### ' + question))
    display(rb)
    display(grade_btn)
    display(feedback)
`
                ],
                execution_count: null,
                outputs: []
            }
        ];
    }
    createAssessmentSectionHeader(title) {
        const clean = title?.trim();
        if (!clean)
            return null;
        return {
            cell_type: 'markdown',
            metadata: {},
            source: [`### Knowledge Check – ${clean}\n`]
        };
    }
    createAssessmentQuestionCell(mcq) {
        if (!mcq || !mcq.question || !Array.isArray(mcq.options) || typeof mcq.correct_index !== 'number' || !mcq.explanation) {
            return null;
        }
        if (mcq.correct_index < 0 || mcq.correct_index >= mcq.options.length) {
            return null;
        }
        try {
            const call = `render_mcq(${JSON.stringify(mcq.question)}, ${JSON.stringify(mcq.options)}, ${mcq.correct_index}, ${JSON.stringify(mcq.explanation)})\n`;
            return {
                cell_type: 'code',
                metadata: {},
                source: [call],
                execution_count: null,
                outputs: []
            };
        }
        catch (error) {
            console.warn('Failed to serialize MCQ:', error);
            return null;
        }
    }
    createTroubleshootingCell() {
        return {
            cell_type: "markdown",
            metadata: {},
            source: [
                "## 🔧 Troubleshooting Guide\n\n",
                "### Common Issues:\n\n",
                "1. **Out of Memory Error**\n",
                "   - Enable GPU: Runtime → Change runtime type → GPU\n",
                "   - Restart runtime if needed\n\n",
                "2. **Package Installation Issues**\n",
                "   - Restart runtime after installing packages\n",
                "   - Use `!pip install -q` for quiet installation\n\n",
                "3. **Model Loading Fails**\n",
                "   - Check internet connection\n",
                "   - Verify authentication tokens\n",
                "   - Try CPU-only mode if GPU fails\n"
            ]
        };
    }
    formatCellSource(source) {
        if (Array.isArray(source))
            return source.map(s => (s.endsWith('\n') ? s : s + '\n'));
        return String(source || '').split('\n').map(line => line + '\n');
    }
}
//# sourceMappingURL=notebook-builder.js.map