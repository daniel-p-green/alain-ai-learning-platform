import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Code,
  BookOpen,
  Users,
  Shield,
  Zap,
  ChevronRight,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Target
} from 'lucide-react';
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
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [featuredTutorials, setFeaturedTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedTutorials = async () => {
      try {
        const response = await backend.tutorials.list();
        // Show first 3 tutorials as featured
        setFeaturedTutorials(response.tutorials.slice(0, 3));
      } catch (error) {
        console.error('Error loading tutorials:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTutorials();
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Interactive Learning",
      description: "Learn by doing with real AI models. No theory - just hands-on experience."
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Multiple AI Models",
      description: "Master GPT-OSS-20B, Claude, and other leading AI models through structured tutorials."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Progress Tracking",
      description: "Resume where you left off with detailed progress tracking and completion badges."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Execution",
      description: "Safe, sandboxed environment with no arbitrary code execution - only structured API calls."
    }
  ];

  const stats = [
    { number: "500+", label: "Active Learners" },
    { number: "50+", label: "AI Tutorials" },
    { number: "10+", label: "AI Models" },
    { number: "99%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <Star className="w-3 h-3 mr-1" />
              Learn AI by Doing
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Master AI Through
              <span className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] bg-clip-text text-transparent">
                {" "}Interactive Learning
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience hands-on AI learning with real models. Build prompts, see responses stream in real-time,
              and master GPT-OSS-20B, Claude, and more through structured, interactive tutorials.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/tutorials')}>
                <Play className="w-5 h-5 mr-2" />
                Start Learning Free
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <BookOpen className="w-5 h-5 mr-2" />
                View Tutorials
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No setup required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Real AI models
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
            <div className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] opacity-30"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose ALAIN?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience a revolutionary approach to AI learning that combines theory with practice.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tutorials Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Your AI Learning Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our curated collection of interactive tutorials designed for all skill levels.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-muted-foreground">Loading tutorials...</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredTutorials.map((tutorial) => (
                <Card key={tutorial.id} className="hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => navigate(`/tutorial/${tutorial.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {tutorial.title}
                      </CardTitle>
                      <Badge className={
                        tutorial.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        tutorial.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {tutorial.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Model: {tutorial.model}</span>
                        <span>Provider: {tutorial.provider}</span>
                      </div>
                      {tutorial.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tutorial.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button size="lg" variant="outline" onClick={() => navigate('/tutorials')}>
              View All Tutorials
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--brand-primary)]/5 to-[var(--brand-accent)]/5 border-[var(--brand-primary)]/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Master AI?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of developers who are learning AI through interactive, hands-on experience.
                Start your journey today with our free tutorials.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/tutorials')}>
                  <Zap className="w-5 h-5 mr-2" />
                  Start Learning Now
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  <Users className="w-5 h-5 mr-2" />
                  Join Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">ALAIN</span>
              <span className="text-sm text-muted-foreground">Applied Learning AI Notebooks</span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">GitHub</a>
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Community</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 ALAIN. Open source AI learning platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
