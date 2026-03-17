import { useState } from 'react';
import { Dashboard } from '@/components/lms/Dashboard';
import { SampleDetail } from '@/components/lms/SampleDetail';

const Index = () => {
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  if (selectedSampleId) {
    return (
      <SampleDetail
        sampleId={selectedSampleId}
        onBack={() => setSelectedSampleId(null)}
      />
    );
  }

  return <Dashboard onSelectSample={setSelectedSampleId} />;
};

export default Index;
