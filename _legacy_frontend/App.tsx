import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import TutorialCatalog from './components/TutorialCatalog';
import TutorialPlayer from './components/TutorialPlayer';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tutorials" element={<TutorialCatalog />} />
        <Route path="/tutorial/:id" element={<TutorialPlayer />} />
      </Routes>
    </Router>
  );
}
