import { useSelector, useDispatch } from 'react-redux'
import { closeMobileSidebar } from '../store/slices/themeSlice'
import Sidebar from '../components/ui/Sidebar'
import Navbar from '../components/ui/Navbar'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  const dispatch = useDispatch()
  const { sidebarOpen, sidebarPosition, compactMode, mobileSidebarOpen } = useSelector((state) => state.theme)

  let contentMargin = 'lg:ml-20'
  if (sidebarPosition === 'right') {
    contentMargin = sidebarOpen
      ? (compactMode ? 'lg:mr-48 lg:ml-0' : 'lg:mr-64 lg:ml-0')
      : 'lg:mr-20 lg:ml-0'
  } else {
    contentMargin = sidebarOpen
      ? (compactMode ? 'lg:ml-48 lg:mr-0' : 'lg:ml-64 lg:mr-0')
      : 'lg:ml-20 lg:mr-0'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => dispatch(closeMobileSidebar())}
        />
      )}

      <div className={`flex-1 flex flex-col transition-all duration-300 ${contentMargin}`}>
        <Navbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
