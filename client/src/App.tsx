import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectList, ProjectDetail, SceneEditor, Settings, PanoramaViewerPage, MaterialEditorPage } from '@/pages';
import { SidebarLayout } from '@/components/layout';
import { useLicenseStore } from '@/stores/licenseStore';
import { licenseService } from '@/services/licenseService';

function App() {
  const { setLicense, setStatus, setLoading } = useLicenseStore();

  // Initialize license status on app startup
  useEffect(() => {
    const initLicense = async () => {
      setLoading(true);
      try {
        const [license, status] = await Promise.all([
          licenseService.getLicense(),
          licenseService.getStatus(),
        ]);
        setLicense(license);
        setStatus(status);
      } catch (error) {
        console.error('Failed to load license:', error);
      } finally {
        setLoading(false);
      }
    };

    initLicense();
  }, [setLicense, setStatus, setLoading]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Sidebar pages */}
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<ProjectList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
        </Route>

        {/* Fullscreen pages */}
        <Route path="/projects/:projectId/scenes/:sceneId" element={<SceneEditor />} />
        <Route path="/projects/:projectId/panoramas/:panoramaId" element={<PanoramaViewerPage />} />
        <Route path="/materials" element={<MaterialEditorPage />} />
        <Route path="/materials/:materialId" element={<MaterialEditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
