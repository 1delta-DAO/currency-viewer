import React from "react";

export default function Input({ value, onChange, placeholder }: any) {
  return (
    <input
      className="border p-2 rounded w-full"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}