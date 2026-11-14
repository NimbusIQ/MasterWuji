import React from "react";
import { createRoot } from "react-dom/client";
import { TCMDashboard } from "./components/TCMDashboard";

const App = () => {
  return <TCMDashboard />;
};

createRoot(document.getElementById("root")!).render(<App />);
