import * as React from 'react';

export function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
      {...props}
    >
      {children}
    </button>
  );
}
