'use client'

import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthProvider'
import api from '@/lib/api'

// ✅ Icons
import {
  Home,
  CreditCard,
  Wallet,
  Layers,
  Users,
  UserCheck,
  LogOut,
  User,
  ChevronDown,
  Menu,
} from 'lucide-react'

// ✅ Admin Components
import WalletTransactions from '@/components/AdminComponents/WalletTransactions'
import ManageDataPlans from '@/components/AdminComponents/ManageDataPlans'
import SubvendorList from '@/components/AdminComponents/SubvendorList'
import ManageAggregetors from '@/components/AdminComponents/ManageAggregetors'
import CustomerList from '@/components/AdminComponents/CustomerList'
import SuperAdminProfile from '@/components/AdminComponents/Profile'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()
  const dropdownRef = useRef(null)

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ✅ Fetch counts
  const { data: payments } = useSWR('payments', api.listPayments)
  const { data: txns } = useSWR('txns', api.listWalletTransactions)
  const { data: customers } = useSWR('customers', api.listCustomers)
  const { data: subvendors } = useSWR('subvendors', api.listSubvendors)
  const { data: aggregators } = useSWR('aggregators', api.listAggregators)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Render dashboard content
  const renderContent = () => {
    switch (activeTab) {
      case 'WalletTransactions':
        return <WalletTransactions />
      case 'DataPlans':
        return <ManageDataPlans />
      case 'Subvendors':
        return <SubvendorList />
      case 'Aggregators':
        return <ManageAggregetors />
      case 'Customers':
        return <CustomerList />
        case 'Profile':
        return <SuperAdminProfile />
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {/* Customers */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Users className="text-blue-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{customers?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Customers</div>
              </div>
              {/* Transactions */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <CreditCard className="text-green-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{payments?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Transactions</div>
              </div>
              {/* Subvendors */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <UserCheck className="text-purple-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{subvendors?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Subvendors</div>
              </div>
              {/* Wallet Transactions */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Wallet className="text-orange-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{txns?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Wallet Transactions</div>
              </div>
              {/* Aggregators */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Layers className="text-red-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{aggregators?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Aggregators</div>
              </div>
            </div>
          </div>
        )
    }
  }

  const tabs = [
    { name: 'Dashboard', icon: <Home className="w-4 h-4 mr-2" /> },
    { name: 'Payments', icon: <CreditCard className="w-4 h-4 mr-2" /> },
    { name: 'WalletTransactions', icon: <Wallet className="w-4 h-4 mr-2" /> },
    { name: 'DataPlans', icon: <Layers className="w-4 h-4 mr-2" /> },
    { name: 'Subvendors', icon: <UserCheck className="w-4 h-4 mr-2" /> },
    { name: 'Aggregators', icon: <Users className="w-4 h-4 mr-2" /> },
    { name: 'Customers', icon: <Users className="w-4 h-4 mr-2" /> },
  ]

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* ===== Desktop Sidebar ===== */}
        <aside className="hidden md:flex w-64 bg-white border-r p-3 flex flex-col space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                activeTab === tab.name ? 'bg-gray-200 font-medium' : ''
              }`}
            >
              {tab.icon}
              {tab.name === 'WalletTransactions' ? 'Wallet Transactions' : tab.name}
            </button>
          ))}

          {/* Profile Dropdown */}
          <div className="relative mt-auto" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 mt-4 bg-gray-100 rounded hover:bg-gray-200"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span>Admin</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white border rounded shadow-md z-10">
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    router.push('/admin/profile')
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-2 text-gray-500" /> View Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ===== Mobile Sidebar ===== */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div className="relative w-64 bg-white border-r p-3 flex flex-col space-y-2">
              <button
                className="self-end mb-4 text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(false)}
              >
                ✕
              </button>
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => {
                    setActiveTab(tab.name)
                    setSidebarOpen(false)
                  }}
                  className={`flex items-center w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    activeTab === tab.name ? 'bg-gray-200 font-medium' : ''
                  }`}
                >
                  {tab.icon}
                  {tab.name === 'WalletTransactions'
                    ? 'Wallet Transactions'
                    : tab.name}
                </button>
              ))}
              <div className="border-t mt-3 pt-2">
                <button
                  onClick={() => {
                    router.push('/admin/profile')
                    setSidebarOpen(false)
                  }}
                  className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-2" /> View Profile
                </button>
                <button
                  onClick={() => {
                    handleLogout()
                    setSidebarOpen(false)
                  }}
                  className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Main Content ===== */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between bg-white p-4 border-b">
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <main className="flex-grow p-4 md:p-6 bg-gray-100 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
