import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, AlertCircle, Wifi, Clock, Key, Zap, Shield, Server, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Navigation from './Navigation';
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
  recoveryActions?: string[];
  retryAfter?: number;
}

export default function TutorialPlayer() {
  const { id } = useParams<{ id: string, }>();
  const navigate = useNavigate();
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
          title: getErrorTitle(result.error.code),
          description: getErrorDescription(result.error),
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setOutput(`Error: ${errorMessage}`);
      setStreamError({
        code: 'network_error',
        message: errorMessage,
        recoveryActions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ]
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

  const getErrorTitle = (code: string): string => {
    switch (code) {
      case 'authentication_failed':
        return 'Authentication Failed';
      case 'rate_limit_exceeded':
        return 'Rate Limit Exceeded';
      case 'request_timeout':
        return 'Request Timeout';
      case 'network_connectivity_error':
      case 'network_error':
        return 'Network Error';
      case 'model_not_available':
        return 'Model Unavailable';
      case 'provider_server_error':
        return 'Service Unavailable';
      case 'access_forbidden':
        return 'Access Denied';
      case 'invalid_request_parameters':
        return 'Invalid Request';
      case 'configuration_error':
        return 'Configuration Error';
      default:
        return 'Error';
    }
  };

  const getErrorDescription = (error: StreamError): string => {
    let description = error.message;
    
    if (error.retryAfter) {
      description += ` Please wait ${error.retryAfter} seconds before trying again.`;
    }
    
    return description;
  };

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'request_timeout':
        return <Clock className="w-4 h-4" />;
      case 'network_connectivity_error':
      case 'network_error':
      case 'provider_server_error':
        return <Wifi className="w-4 h-4" />;
      case 'authentication_failed':
        return <Key className="w-4 h-4" />;
      case 'rate_limit_exceeded':
        return <Zap className="w-4 h-4" />;
      case 'access_forbidden':
        return <Shield className="w-4 h-4" />;
      case 'model_not_available':
        return <Server className="w-4 h-4" />;
      case 'configuration_error':
      case 'invalid_request_parameters':
        return <Settings className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorVariant = (code: string): "default" | "destructive" => {
    switch (code) {
      case 'rate_limit_exceeded':
      case 'request_timeout':
        return 'default';
      default:
        return 'destructive';
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
    <div className="min-h-screen bg-background">
      <Navigation showBack={true} backTo="/tutorials" backLabel="Back to Tutorials" />

      <div className="container mx-auto px-4 py-8">
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
        <Alert variant={getErrorVariant(streamError.code)}>
          {getErrorIcon(streamError.code)}
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>{getErrorTitle(streamError.code)}:</strong>{' '}
                {getErrorDescription(streamError)}
              </div>
              {streamError.recoveryActions && streamError.recoveryActions.length > 0 && (
                <div>
                  <strong>Suggested actions:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {streamError.recoveryActions.map((action, index) => (
                      <li key={index} className="text-sm">{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
                {streamError && streamError.retryAfter && (
                  <div className="text-sm text-muted-foreground self-center">
                    Retry in {streamError.retryAfter}s
                  </div>
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
    </div>
  );
}