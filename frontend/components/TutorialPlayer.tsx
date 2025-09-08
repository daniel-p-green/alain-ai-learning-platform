import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Square } from 'lucide-react';
import backend from '~backend/client';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: string;
  tags: string[];
  steps: TutorialStep[];
}

interface TutorialStep {
  id: number;
  step_order: number;
  title: string;
  content: string;
  code_template: string | null;
  expected_output: string | null;
  model_params: any;
}

export default function TutorialPlayer() {
  const { id } = useParams<{ id: string }>();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadTutorial = async () => {
      try {
        const tutorialData = await backend.tutorials.get({ id: parseInt(id) });
        setTutorial(tutorialData);
        if (tutorialData.steps.length > 0) {
          setPrompt(tutorialData.steps[0].code_template || '');
        }
      } catch (err) {
        setError('Failed to load tutorial');
        console.error('Error loading tutorial:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTutorial();
  }, [id]);

  const handleRun = async () => {
    if (!tutorial || !prompt.trim()) return;

    setIsRunning(true);
    setOutput('');

    try {
      const step = tutorial.steps[currentStep];
      const messages = [
        { role: 'user' as const, content: prompt }
      ];

      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: tutorial.provider,
          model: tutorial.model,
          messages,
          stream: true,
          ...step.model_params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim() === '[DONE]') {
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  setOutput(prev => prev + parsed.choices[0].delta.content);
                }
                if (parsed.error) {
                  setOutput(prev => prev + `\nError: ${parsed.error.message}`);
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading tutorial...</div>
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">{error || 'Tutorial not found'}</div>
      </div>
    );
  }

  const step = tutorial.steps[currentStep];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{tutorial.title}</h1>
        <p className="text-muted-foreground mt-2">{tutorial.description}</p>
        <div className="flex items-center gap-2 mt-4">
          <Badge>{tutorial.difficulty}</Badge>
          <Badge variant="outline">{tutorial.provider}</Badge>
          <Badge variant="outline">{tutorial.model}</Badge>
        </div>
      </div>

      {tutorial.steps.length > 1 && (
        <div className="flex gap-2">
          {tutorial.steps.map((_, index) => (
            <Button
              key={index}
              variant={index === currentStep ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCurrentStep(index);
                setPrompt(tutorial.steps[index].code_template || '');
                setOutput('');
              }}
            >
              Step {index + 1}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{step.content}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="min-h-32"
              />
              <div className="flex gap-2 mt-4">
                {!isRunning ? (
                  <Button onClick={handleRun} disabled={!prompt.trim()}>
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </Button>
                ) : (
                  <Button onClick={handleStop} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md min-h-64 font-mono text-sm whitespace-pre-wrap">
                {output || (isRunning ? 'Running...' : 'Click "Run" to see the output')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
