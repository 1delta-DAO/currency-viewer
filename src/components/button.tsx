import React from "react";

export default function Button({ children, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center gap-1"
    >
      {children}
    </button>
  );
}