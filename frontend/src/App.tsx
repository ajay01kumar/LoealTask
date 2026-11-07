import React from 'react';
import { ClaimAssessmentWorkbench } from './components/ClaimAssessmentWorkbench';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <ClaimAssessmentWorkbench />
    </div>
  );
};

export default App;
