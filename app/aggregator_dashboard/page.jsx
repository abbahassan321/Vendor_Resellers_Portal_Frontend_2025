'use client'

import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthProvider'
import api, { getToken } from '@/lib/api'

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
} from 'lucide-react'

// Components
import PaymentForm from '@/components/PaymentForm'
import WalletTransactions from '@/components/AdminComponents/WalletTransactions'
import ManageSubvendor from '@/components/AggregatorComponent/ManageSubvendor'
import ManageDataPlans from '@/components/AdminComponents/ManageDataPlans'
import CustomerList from '@/components/AdminComponents/CustomerList'
import Profile from '@/components/AggregatorComponent/Profile'

export default function AggregatorDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const router = useRouter()
  const { logout, user } = useAuth()
  const dropdownRef = useRef(null)

  // aggregatorId stored in localStorage on client-side
  const aggregatorId = typeof window !== 'undefined' ? localStorage.getItem('aggregatorId') : null
  const userEmail = user?.email || ''

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch wallet transactions and keep local state in sync (only when aggregatorId exists)
  const { data: fetchedTxns, mutate: mutateWallet } = useSWR(
    aggregatorId ? ['aggregator_txns', aggregatorId] : null,
    async () => {
      const data = await api.listWalletTransactions(aggregatorId)
      if (!Array.isArray(data)) return []
      // newest first
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    { refreshInterval: 10000 }
  )

  useEffect(() => {
    if (Array.isArray(fetchedTxns) && fetchedTxns.length > 0) {
      const latestSuccessTxn = fetchedTxns.find((t) => t.status === 'SUCCESS')
      setWalletBalance(latestSuccessTxn?.balanceAfter || 0)
      setTransactions(fetchedTxns)
    } else if (Array.isArray(fetchedTxns)) {
      setWalletBalance(0)
      setTransactions([])
    }
  }, [fetchedTxns])

  // Fetch other lists (conditionally keyed by aggregatorId so we don't fetch on server or before id available)
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

  // If you later want to allow aggregator to debit/credit wallets from UI, you can
  // add handlers that use getToken() and call your /api/wallet endpoints and then
  // optimistically update setWalletBalance and setTransactions and call mutateWallet().

  // Render main content per tab
  const renderContent = () => {
    switch (activeTab) {
      case 'Fund Wallet':
        // pass updater so PaymentForm can update balance optimistically / on success
        return <PaymentForm onWalletUpdate={setWalletBalance} />
      case 'WalletTransactions':
        return (
          <WalletTransactions
            walletBalance={walletBalance}
            transactions={transactions}
            // pass mutate so child can revalidate if it performs actions
            mutateWallet={mutateWallet}
          />
        )
      case 'Subvendors':
        return <ManageSubvendor />
      case 'DataPlans':
      case 'DataPlans':
        return <ManageDataPlans />
      case 'Customers':
        return <CustomerList />
      case 'Profile':
        return <Profile />
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Wallet className="text-orange-400 mb-2" />
                <div className="text-3xl font-bold">₦{Number(walletBalance || 0).toFixed(2)}</div>
                <div className="text-gray-500 mt-2 text-center">Wallet Balance</div>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Wallet className="text-orange-500 mb-2" />
                <div className="text-3xl font-bold">{(transactions?.length) || 0}</div>
                <div className="text-gray-500 mt-2 text-center">Wallet Transactions</div>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <UserCheck className="text-purple-500 mb-2" />
                <div className="text-3xl font-bold">{subvendors?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-center">Subvendors</div>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Layers className="text-indigo-500 mb-2" />
                <div className="text-3xl font-bold">{dataPlans?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-center">Data Plans</div>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Users className="text-pink-500 mb-2" />
                <div className="text-3xl font-bold">{customers?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-center">Customers</div>
              </div>
              
            </div>
          </div>
        )
    }
  }

  const tabs = [
    { name: 'Dashboard', icon: <Home className="w-4 h-4 mr-2" /> },
    { name: 'WalletTransactions', icon: <Wallet className="w-4 h-4 mr-2" /> },
    { name: 'Subvendors', icon: <UserCheck className="w-4 h-4 mr-2" /> },
    { name: 'DataPlans', icon: <Layers className="w-4 h-4 mr-2" /> },
    { name: 'Customers', icon: <Users className="w-4 h-4 mr-2" /> },
    { name: 'Profile', icon: <User className="w-4 h-4 mr-2" /> },
  ]

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
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

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-64 bg-white border-r p-4 flex flex-col space-y-2">
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
                  {tab.name === 'WalletTransactions' ? 'Wallet Transactions' : tab.name}
                </button>
              ))}
              <div className="border-t mt-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('Profile')
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between bg-white p-4 border-b">
            <h1 className="text-lg font-semibold">Aggregator Dashboard</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <main className="flex-grow p-6 bg-gray-100 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}