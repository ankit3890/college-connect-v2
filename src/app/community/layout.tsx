import CommunitySidebar from "@/components/community/CommunitySidebar";
import CommunityHeader from "@/components/community/CommunityHeader";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans">
      <CommunityHeader />
      <div className="flex pt-16 max-w-full">
        <CommunitySidebar />
        <main className="flex-1 max-w-6xl mx-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
