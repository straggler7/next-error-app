"use client";

export default function LogoutPage() {
  const handleLogin = () => {
    // const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4003';
    // const loginUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const loginUrl = window.location.origin;
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Logout
        </h1>
        
        <p className="text-gray-600 mb-6">
          You have been logged out of the ERA
        </p>
        
        <button
          onClick={handleLogin}
          className="w-[200px] bg-[#0f507e] text-white py-2 px-4 rounded-lg hover:bg-[#0d4469] transition-colors duration-200 font-medium"
        >
          ERA Login
        </button>
      </div>
    </div>
  );
}
