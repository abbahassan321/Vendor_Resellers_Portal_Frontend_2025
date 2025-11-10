'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import useSWR from 'swr'
import PaymentForm from '@/components/PaymentForm'
import {
  Menu,
  X,
  Wallet,
  CreditCard,
  LogOut,
  Home,
  List,
  PlusCircle
} from 'lucide-react'

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const email = user?.email
  const role = user?.role || 'CUSTOMER'

  // 🔁 Fetch wallet balance
  const { data: walletBalance, mutate: mutateWallet } = useSWR(
    email ? ['/api/wallet_transactions/balance', email, role] : null,
    () => api.getWalletBalance(email, role),
    { refreshInterval: 10000 }
  )

  // 🔁 Fetch wallet transactions
  const { data: transactions, mutate: mutateTxns } = useSWR(
    email ? ['/api/wallet_transactions/user', email, role] : null,
    () => api.getUserTransactions(email, role),
    { refreshInterval: 15000 }
  )

  // 🧠 Listen for wallet updates
  useEffect(() => {
    const handleWalletUpdated = () => {
      mutateWallet()
      mutateTxns()
    }
    window.addEventListener('walletUpdated', handleWalletUpdated)
    return () => window.removeEventListener('walletUpdated', handleWalletUpdated)
  }, [mutateWallet, mutateTxns])

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 💰 Format currency nicely
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₦0.00'
    const num = parseFloat(amount)
    if (num >= 1_000_000_000) return `₦${(num / 1_000_000_000).toFixed(1)}B`
    if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `₦${(num / 1_000).toFixed(1)}K`
    return `₦${num.toFixed(2)}`
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { key: 'walletrecord', label: '', icon: <List className="w-4 h-4" /> },
    { key: 'fundwallet', label: 'FundWallet', icon: <Wallet className="w-4 h-4" /> },
  ]

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed md:relative z-40 inset-y-0 left-0 w-64 bg-white border-r flex flex-col space-y-1 p-4 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-bold text-gray-800">Customer</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSidebarOpen(false)
                }}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition ${
                  activeTab === tab.key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2 text-gray-600">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {user?.username || 'Customer'}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border z-50">
                  <button
                    onClick={() => router.push('/customer/profile')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      router.push('/')
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Dashboard Body */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Wallet Balance</p>
                    <p className="text-xl font-bold text-gray-800">
                      {walletBalance ? formatCurrency(walletBalance.balance) : '₦0.00'}
                    </p>
                  </div>
                  <Wallet className="w-6 h-6 text-indigo-600" />
                </div>

                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Transactions</p>
                    <p className="text-xl font-bold text-gray-800">
                      {transactions ? transactions.length : 0}
                    </p>
                  </div>
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>

                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Fund Wallet</p>
                    <button
                      onClick={() => setActiveTab('wallet')}
                      className="flex items-center text-indigo-600 font-medium hover:underline"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" /> Add Funds
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
                {transactions && transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-600">
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-left py-2">Reference</th>
                          <th className="text-left py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn) => (
                          <tr key={txn.id} className="border-b hover:bg-gray-50">
                            <td className="py-2">{formatCurrency(txn.amount)}</td>
                            <td className="py-2 capitalize">{txn.type}</td>
                            <td className="py-2">{txn.reference || '-'}</td>
                            <td className="py-2">{new Date(txn.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No transactions found.</p>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-3">Fund Wallet</h3>
                <PaymentForm
                  email={email}
                  role={role}
                  onSuccess={() => {
                    mutateWallet()
                    mutateTxns()
                    window.dispatchEvent(new Event('walletUpdated'))
                  }}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
