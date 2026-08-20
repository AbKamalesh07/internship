import { Link } from "react-router-dom";

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-gray-800">403 — Not authorized</h1>
        <p className="text-gray-500">You don't have permission to view this page.</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
