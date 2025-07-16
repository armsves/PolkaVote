import { Link } from "react-router-dom";

export default function NoirPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Noir ZK Page</h1>
      <p className="mb-4">This page will showcase Zero-Knowledge proofs using Noir.</p>
      <Link to="/" className="text-blue-500 underline hover:text-blue-700">
        ← Back to Home
      </Link>
    </div>
  );
}
