"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2">
          Företagarna Ljungby
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Logga in för att se kalendern
        </p>
        <form action={formAction}>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Lösenord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          {state?.error && (
            <p className="text-red-600 text-sm mb-4">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Loggar in..." : "Logga in"}
          </button>
        </form>
      </div>
    </div>
  );
}
