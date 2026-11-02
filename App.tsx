import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import SnapScreen from './pages/SnapScreen';
import VaultScreen from './pages/VaultScreen';
import RoadmapScreen from './pages/RoadmapScreen';
import TokenScreen from './pages/TokenScreen';
import SubscriptionsScreen from './pages/SubscriptionsScreen';
import VisionScreen from './pages/VisionScreen';
import FAQScreen from './pages/FAQScreen';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<SnapScreen />} />
            <Route path="/vault" element={<VaultScreen />} />
            <Route path="/roadmap" element={<RoadmapScreen />} />
            <Route path="/token" element={<TokenScreen />} />
            <Route path="/subscriptions" element={<SubscriptionsScreen />} />
            <Route path="/vision" element={<VisionScreen />} />
            <Route path="/faq" element={<FAQScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </QueryClientProvider>
  );
}
