'use client';

import Header from '../../components/Header';
import Navigation from '../../components/Navigation';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="main-container p-4 mx-auto h-[calc(100vh-120px)]">
        <div className="grid grid-cols-[250px_1fr] gap-4 h-full">
          {/* Left Navigation */}
          <div className="h-full">
            <Navigation />
          </div>
          
          {/* Main Content */}
          <div className="h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
