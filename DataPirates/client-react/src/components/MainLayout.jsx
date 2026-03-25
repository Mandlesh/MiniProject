import BottomNav from './BottomNav'
import TopHeader from './TopHeader'

export default function MainLayout({
  title,
  children,
  back = false,
  onRefresh,
  headerMode = 'center',
  showGamification = false,
  showBottomNav = true,
}) {
  return (
    <div className="min-h-screen bg-appBg pb-24 dark:bg-appBgDark">
      <div className="mx-auto w-full max-w-[1120px]">
        <TopHeader
          title={title}
          back={back}
          onRefresh={onRefresh}
          mode={headerMode}
          showGamification={showGamification}
        />
        <main className="px-4 pb-6">{children}</main>
      </div>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  )
}
