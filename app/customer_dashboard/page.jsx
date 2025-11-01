'use client'

import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthProvider'
import api from '@/lib/api'

// Icons
import {
  Home,
  CreditCard,
  Wallet,
  Layers,
  Users,
  User,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react'

import PaymentForm from '@/components/PaymentForm'
import WalletDashboard from '@/components/WalletDashboard'
import CustomerProfile from '@/components/CustomerProfile' // ✅ NEW IMPORT

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const dropdownRef = useRef(null)
  const router = useRouter()
  const { logout, user } = useAuth()

  const userEmail = user?.email || ''
  const userRole = user?.role || 'CUSTOMER'

  // ✅ Fetch wallet balance & transactions
  const { data: fetchedTxns, mutate: refreshTxns } = useSWR(
    userEmail ? ['wallet_txns', userEmail] : null,
    async () => {
      const txns = await api.listWalletTransactions(userEmail)
      return Array.isArray(txns)
        ? txns.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        : []
    },
    { refreshInterval: 10000 }
  )

  const { data: fetchedBalance } = useSWR(
    userEmail ? ['wallet_balance', userEmail] : null,
    async () => {
      const res = await api.getWalletBalance(userEmail, userRole)
      return res?.balance || 0
    },
    { refreshInterval: 10000 }
  )

  useEffect(() => {
    if (fetchedTxns) setTransactions(fetchedTxns)
    if (fetchedBalance !== undefined) setWalletBalance(fetchedBalance)
  }, [fetchedTxns, fetchedBalance])

  // ✅ Handle logout
  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // ✅ Render content by tab
  const renderContent = () => {
    switch (activeTab) {
      case 'WalletBalance':
        return (
          <WalletDashboard
            walletBalance={walletBalance}
            transactions={transactions}
          />
        )
      case 'Fund Wallet':
        return (
          <PaymentForm
            onWalletUpdate={() => {
              refreshTxns()
            }}
          />
        )
      case 'Profile':
        return <CustomerProfile /> // ✅ Replaced with live customer profile
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Customer Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Wallet Balance */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Wallet className="text-orange-500 mb-2" />
                <div className="text-3xl font-bold">
                  ₦{Number(walletBalance || 0).toFixed(2)}
                </div>
                <div className="text-gray-500 mt-2 text-center">
                  Wallet Balance
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <CreditCard className="text-green-600 mb-2" />
                <div className="text-3xl font-bold">{transactions?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-center">Transactions</div>
              </div>

              {/* Example Placeholder: Offers */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Users className="text-blue-600 mb-2" />
                <div className="text-3xl font-bold">5</div>
                <div className="text-gray-500 mt-2 text-center">Active Offers</div>
              </div>

              {/* Example Placeholder: Subscriptions */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Layers className="text-indigo-500 mb-2" />
                <div className="text-3xl font-bold">3</div>
                <div className="text-gray-500 mt-2 text-center">
                  Subscriptions
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  const tabs = [
    { name: 'Dashboard', icon: <Home className="w-4 h-4 mr-2" /> },
    { name: 'Fund Wallet', icon: <CreditCard className="w-4 h-4 mr-2" /> },
    { name: 'WalletBalance', icon: <Wallet className="w-4 h-4 mr-2" /> },
    { name: 'Profile', icon: <User className="w-4 h-4 mr-2" /> },
  ]

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r p-4 flex-col space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                activeTab === tab.name ? 'bg-gray-200 font-medium' : ''
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}

          {/* Dropdown */}
          <div className="relative mt-auto" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 mt-4 bg-gray-100 rounded hover:bg-gray-200"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span>{user?.fullName || 'Customer'}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white border rounded shadow-md z-10">
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    setActiveTab('Profile')
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="md:hidden flex items-center justify-between bg-white p-4 border-b">
            <h1 className="text-lg font-semibold">Customer Dashboard</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <main className="flex-grow p-6 bg-gray-100 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
