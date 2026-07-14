import React from "react";

const Header = () => {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-700">
          YT Automate
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
          AI script generation
        </h1>
      </div>
    </header>
  );
};

export default Header;
