"use client";
import { useState } from "react";
import NewIdeaModal from "./NewIdeaModal";
import Sidebar from "./Sidebar";
import Toast from "./Toast";
import Topbar from "./Topbar";

export default function AppShell({ children, showSearch = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  return (
    <div className="flex min-h-screen">
      <Sidebar onNewIdea={openModal} />
      <div className="ml-[245px] max-md:ml-[75px] w-[calc(100%-245px)] max-md:w-[calc(100%-75px)]">
        <Topbar onNewIdea={openModal} showSearch={showSearch} />
        {children}
      </div>
      <NewIdeaModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <Toast />
    </div>
  );
}
