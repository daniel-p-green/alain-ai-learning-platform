import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ALAINLogo from './ALAINLogo';

interface NavigationProps {
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
}

export default function Navigation({ showBack = false, backTo = '/', backLabel = 'Back to Home' }: NavigationProps) {
  const navigate = useNavigate();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(backTo)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            )}
            <Link to="/" className="flex items-center">
              <ALAINLogo size="sm" />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/tutorials" className="text-sm font-medium hover:text-primary transition-colors">
              Tutorials
            </Link>
            <Link to="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link to="#about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate('/tutorials')}>
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
