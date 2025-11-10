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
  Wallet,
  Layers,
  Users,
  UserCheck,
  LogOut,
  User,
  ChevronDown,
  Menu,
  CreditCard,
  X,
} from 'lucide-react'

// Components
import PaymentForm from '@/components/PaymentForm'
import WalletTransactions from '@/components/AdminComponents/WalletTransactions'
import ManageSubvendor from '@/components/AggregatorComponent/ManageSubvendor'
import ManageDataPlans from '@/components/AggregatorComponent/ManageDataPlans'
import CustomerList from '@/components/AdminComponents/CustomerList'
import Profile from '@/components/AggregatorComponent/Profile'

// Helper: Format large numbers
const formatCurrency = (amount) => {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(2)}K`
  return `₦${amount.toFixed(2)}`
}

export default function AggregatorDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const dropdownRef = useRef(null)
  const router = useRouter()
  const { logout, user } = useAuth()

  const aggregatorId =
    typeof window !== 'undefined' ? localStorage.getItem('aggregatorId') : null

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch wallet transactions
  const { data: fetchedTxns, mutate: mutateWallet } = useSWR(
    aggregatorId ? ['aggregator_txns', aggregatorId] : null,
    async () => {
      const data = await api.listWalletTransactions(aggregatorId)
      if (!Array.isArray(data)) return []
      return data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    },
    { refreshInterval: 10000 }
  )

  useEffect(() => {
    if (fetchedTxns && fetchedTxns.length > 0) {
      const latestSuccessTxn = fetchedTxns.find((t) => t.status === 'SUCCESS')
      setWalletBalance(latestSuccessTxn?.balanceAfter || 0)
      setTransactions(fetchedTxns)
    } else {
      setWalletBalance(0)
      setTransactions([])
    }
  }, [fetchedTxns])

  // Fetch other data
  const { data: subvendors } = useSWR(
    aggregatorId ? ['subvendors', aggregatorId] : null,
    () => api.listSubvendors(aggregatorId)
  )
  const { data: dataPlans } = useSWR(
    aggregatorId ? ['dataPlans', aggregatorId] : null,
    () => api.listDataPlans(aggregatorId)
  )
  const { data: customers } = useSWR(
    aggregatorId ? ['customers', aggregatorId] : null,
    () => api.listCustomers(aggregatorId)
  )

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const tabs = [
    { name: 'Dashboard', icon: <Home className="w-4 h-4 mr-2" /> },
    { name: 'Fund Wallet', icon: <CreditCard className="w-4 h-4 mr-2" /> },
    { name: 'WalletTransactions', icon: <Wallet className="w-4 h-4 mr-2" /> },
    { name: 'Subvendors', icon: <UserCheck className="w-4 h-4 mr-2" /> },
    { name: 'DataPlans', icon: <Layers className="w-4 h-4 mr-2" /> },
    { name: 'Customers', icon: <Users className="w-4 h-4 mr-2" /> },
    { name: 'Profile', icon: <User className="w-4 h-4 mr-2" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'Fund Wallet':
        return <PaymentForm onWalletUpdate={setWalletBalance} />
      case 'WalletTransactions':
        return (
          <WalletTransactions
            walletBalance={walletBalance}
            transactions={transactions}
            mutateWallet={mutateWallet}
          />
        )
      case 'Subvendors':
        return <ManageSubvendor />
      case 'DataPlans':
        return <ManageDataPlans />
      case 'Customers':
        return <CustomerList />
      case 'Profile':
        return <Profile />
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-2">Aggregator Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {/* Wallet */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Wallet className="text-orange-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold break-words"
                  title={`₦${Number(walletBalance).toLocaleString()}`}
                >
                  {formatCurrency(walletBalance)}
                </div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Wallet Balance</div>
              </div>

              {/* Transactions */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Wallet className="text-green-600 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  {transactions?.length || 0}
                </div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Wallet Transactions</div>
              </div>

              {/* Subvendors */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <UserCheck className="text-purple-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  {subvendors?.length || 0}
                </div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Subvendors</div>
              </div>

              {/* Data Plans */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Layers className="text-indigo-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  {dataPlans?.length || 0}
                </div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Data Plans</div>
              </div>

              {/* Customers */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Users className="text-pink-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  {customers?.length || 0}
                </div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Customers</div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed md:relative z-50 inset-y-0 left-0 w-64 bg-white border-r p-3 flex flex-col space-y-2 transform transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile header */}
          <div className="flex justify-between items-center md:hidden mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

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
                <span>Aggregator</span>
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

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between bg-white p-4 border-b">
            <h1 className="text-lg font-semibold">Aggregator Dashboard</h1>
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-800">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <main className="flex-grow p-4 md:p-6 bg-gray-100 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
