import BottomNav from "./BottomNav";
import TopHeader from "./TopHeader";

// AppShell is a layout component - no need for "use client"
// Children that need client features declare it themselves
export default function AppShell({
    children,
    title,
    showSearch,
    showBack,
    backHref,
    headerRight,
}) {
    return (
        <div className="min-h-screen" style={{ background: "#F8F5EE" }}>
            <TopHeader
                title={title}
                showSearch={showSearch}
                showBack={showBack}
                backHref={backHref}
                right={headerRight}
            />
            <main className="max-w-2xl mx-auto pb-nav">{children}</main>
            <BottomNav />
        </div>
    );
}
