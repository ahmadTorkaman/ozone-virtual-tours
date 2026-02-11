import { Routes, Route } from 'react-router-dom';
import { Lobby } from './pages/Lobby';
import { SceneViewer } from './pages/SceneViewer';
import { PanoramaViewer } from './pages/PanoramaViewer';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/scene/:sceneId" element={<SceneViewer />} />
      <Route path="/panorama/:panoramaId" element={<PanoramaViewer />} />
    </Routes>
  );
}
