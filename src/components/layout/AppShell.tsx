import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_40%,#fdf2f8_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Navbar />

        <main>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}