import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import backend from '~backend/client';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export default function TutorialCatalog() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTutorials = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await backend.tutorials.list();
        setTutorials(response.tutorials);
      } catch (err) {
        setError('Failed to load tutorials. Please try again.');
        console.error('Error loading tutorials:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTutorials();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading tutorials...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-destructive">{error}</div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Tutorial Catalog</h2>
        <p className="text-muted-foreground">
          Explore AI tutorials and learn by doing with interactive notebooks.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tutorials.map((tutorial) => (
          <Link key={tutorial.id} to={`/tutorial/${tutorial.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                  <Badge className={getDifficultyColor(tutorial.difficulty)}>
                    {tutorial.difficulty}
                  </Badge>
                </div>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Model:</span> {tutorial.model}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Provider:</span> {tutorial.provider}
                  </div>
                  {tutorial.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tutorial.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {tutorials.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No tutorials available yet.</div>
        </div>
      )}
    </div>
  );
}
