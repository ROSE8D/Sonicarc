import { useEffect, useState } from "react";
import { DeveloperDashboard } from "./components/DeveloperDashboard";
import { UserApplication } from "./components/UserApplication";
import { useChordAnalysis } from "./hooks/useChordAnalysis";

export default function App() {
  const analysis = useChordAnalysis();
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handleNavigation = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);
  return path === "/dev" || path.startsWith("/dev/")
    ? <DeveloperDashboard {...analysis} />
    : <UserApplication {...analysis} />;
}
