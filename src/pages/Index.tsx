import { useState } from 'react';
import { Dashboard } from '@/components/lms/Dashboard';
import { SampleDetail } from '@/components/lms/SampleDetail';
import { SampleIntakeForm } from '@/components/lms/SampleIntakeForm';

type View = { type: 'dashboard' } | { type: 'detail'; id: string } | { type: 'new' };

const Index = () => {
  const [view, setView] = useState<View>({ type: 'dashboard' });

  if (view.type === 'new') {
    return (
      <SampleIntakeForm
        onBack={() => setView({ type: 'dashboard' })}
        onCreated={(id) => setView({ type: 'detail', id })}
      />
    );
  }

  if (view.type === 'detail') {
    return (
      <SampleDetail
        sampleId={view.id}
        onBack={() => setView({ type: 'dashboard' })}
      />
    );
  }

  return (
    <Dashboard
      onSelectSample={(id) => setView({ type: 'detail', id })}
      onNewSample={() => setView({ type: 'new' })}
    />
  );
};

export default Index;
