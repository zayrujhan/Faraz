import { Outlet } from 'react-router-dom'
import SellerSidebar from './SellerSidebar'

export default function SellerLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
