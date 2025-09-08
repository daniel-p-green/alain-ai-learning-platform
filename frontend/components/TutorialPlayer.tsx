import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, AlertCircle, Wifi, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

interface StreamError {
  code: string;
  message: string;
  details?: any;
}

export default function TutorialPlayer() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<StreamError | null>(null);

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
        toast({
          title: "Error",
          description: "Failed to load tutorial. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTutorial();
  }, [id, toast]);

  const handleRun = async () => {
    if (!tutorial || !prompt.trim()) return;

    setIsRunning(true);
    setOutput('');
    setStreamError(null);

    try {
      const step = tutorial.steps[currentStep];
      const messages = [
        { role: 'user' as const, content: prompt }
      ];

      const result = await backend.execution.execute({
        provider: tutorial.provider as "poe" | "openai-compatible",
        model: tutorial.model,
        messages,
        temperature: step.model_params?.temperature,
        top_p: step.model_params?.top_p,
        max_tokens: step.model_params?.max_tokens,
      });

      if (result.success && result.content) {
        setOutput(result.content);
      } else if (result.error) {
        setStreamError(result.error);
        setOutput(`Error: ${result.error.message}`);
        toast({
          title: "Execution Error",
          description: getErrorDescription(result.error),
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setOutput(`Error: ${errorMessage}`);
      setStreamError({
        code: 'network_error',
        message: errorMessage
      });
      
      console.error('Execution error:', err);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the AI service. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const getErrorDescription = (error: StreamError): string => {
    switch (error.code) {
      case 'authentication_failed':
        return 'Authentication failed. Please check the API configuration.';
      case 'model_not_found':
        return 'The AI model is not available. Please try a different model.';
      case 'rate_limited':
        return 'Too many requests. Please wait a moment before trying again.';
      case 'timeout':
        return 'Request timed out. Please try with a shorter prompt.';
      case 'connection_error':
        return 'Unable to connect to the AI provider. Please check your connection.';
      case 'provider_unavailable':
        return 'The AI service is temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'timeout':
        return <Clock className="w-4 h-4" />;
      case 'connection_error':
      case 'provider_unavailable':
        return <Wifi className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
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
                setStreamError(null);
              }}
            >
              Step {index + 1}
            </Button>
          ))}
        </div>
      )}

      {streamError && (
        <Alert variant="destructive">
          {getErrorIcon(streamError.code)}
          <AlertDescription>
            <strong>{streamError.code.replace(/_/g, ' ').toUpperCase()}:</strong>{' '}
            {getErrorDescription(streamError)}
          </AlertDescription>
        </Alert>
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
                disabled={isRunning}
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
