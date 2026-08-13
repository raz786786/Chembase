import { Routes, Route } from 'react-router-dom';
import LabAnalyticsDashboard from '../lab-analytics/LabAnalyticsDashboard';
import LabSubjectHub from '../lab-analytics/LabSubjectHub';
import LabWorkspace from '../lab-analytics/LabWorkspace';

export default function LaboratoryAssistantModule() {
  return (
    <div className="h-full w-full">
      <Routes>
        <Route index element={<LabAnalyticsDashboard />} />
        <Route path=":subjectId" element={<LabSubjectHub />} />
        <Route path=":subjectId/workspace" element={<LabWorkspace />} />
      </Routes>
    </div>
  );
}
