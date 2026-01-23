'use client';

import Header from '../../components/Header';
import Navigation from '../../components/Navigation';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Main scrollable container */}
      <div className="flex-1 overflow-auto">
        <div className="main-container p-4 mx-auto min-w-fit">
          <div className="grid grid-cols-[250px_1fr] gap-4 h-full min-w-fit">
            {/* Left Navigation */}
            <div className="h-full">
              <Navigation />
            </div>
            
            {/* Main Content */}
            <div className="h-full min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
