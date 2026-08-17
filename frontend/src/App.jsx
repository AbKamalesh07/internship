import { useEffect, useState } from "react";
import api from "./api/axios";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setStatus(res.data.message + " (db: " + res.data.db + ")"))
      .catch(() => setStatus("Could not reach backend"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
        <p className="mt-2 text-gray-500">Backend status: {status}</p>
      </div>
    </div>
  );
}

export default App;
