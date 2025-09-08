import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TutorialCatalog from './components/TutorialCatalog';
import TutorialPlayer from './components/TutorialPlayer';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground">
              ALAIN - Applied Learning AI Notebooks
            </h1>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<TutorialCatalog />} />
            <Route path="/tutorial/:id" element={<TutorialPlayer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
