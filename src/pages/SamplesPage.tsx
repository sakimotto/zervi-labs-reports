import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dashboard } from '@/components/lms/Dashboard';
import { SampleDetail } from '@/components/lms/SampleDetail';
import { SampleIntakeForm } from '@/components/lms/SampleIntakeForm';

export default function SamplesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [mode, setMode] = useState<'list' | 'new'>(id ? 'list' : 'list');

  if (id) {
    return (
      <SampleDetail
        sampleId={id}
        onBack={() => navigate('/samples')}
      />
    );
  }

  if (mode === 'new') {
    return (
      <SampleIntakeForm
        onBack={() => setMode('list')}
        onCreated={(newId) => navigate(`/samples/${newId}`)}
      />
    );
  }

  return (
    <Dashboard
      onSelectSample={(sId) => navigate(`/samples/${sId}`)}
      onNewSample={() => setMode('new')}
    />
  );
}
