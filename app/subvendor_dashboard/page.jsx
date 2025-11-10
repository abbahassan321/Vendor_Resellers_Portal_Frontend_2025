'use client'

import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthProvider'
import api, { getToken } from '@/lib/api'

// Icons
import { Home, CreditCard, Wallet, Layers, Users, User, LogOut, ChevronDown, Menu, X } from 'lucide-react'

// Components
import WalletDashboard from '@/components/WalletDashboard'
import PaymentForm from '@/components/PaymentForm'
import SubvendorDataPlan from '@/components/SubvendorComponents/SubvendorDataPlan'
import Profile from '@/components/SubvendorComponents/Profile'
import ManageRetailer from '@/components/SubvendorComponents/ManageRetailer'

// Helper: Format large numbers
const formatCurrency = (amount) => {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(2)}K`
  return `₦${amount.toFixed(2)}`
}

export default function SubvendorDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const dropdownRef = useRef(null)
  const router = useRouter()
  const { logout, user } = useAuth()

  const subvendorId = typeof window !== 'undefined' ? localStorage.getItem('subvendorId') : null
  const userEmail = user?.email || ''

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
    subvendorId ? ['subvendor_txns', subvendorId] : null,
    async () => {
      const data = await api.listWalletTransactions(subvendorId)
      if (!Array.isArray(data)) return []
      return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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

  // Fetch retailers and data plans
  const { data: retailers } = useSWR(
    subvendorId ? ['subvendor_retailers', subvendorId] : null,
    () => api.listRetailers(subvendorId)
  )
  const { data: dataPlans, mutate: mutatePlans } = useSWR(
    subvendorId ? ['subvendor_data_plans', subvendorId] : null,
    () => api.listSubvendorDataPlans(subvendorId)
  )

  // Logout handler
  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Purchase data plan
  const handleBuyPlan = async (plan) => {
    if (!plan || typeof plan.customPrice !== 'number') {
      alert('❌ Invalid plan')
      return
    }

    if (walletBalance < plan.customPrice) {
      alert('❌ Insufficient wallet balance')
      return
    }

    try {
      const token = getToken()
      if (!token) throw new Error('Authentication token missing. Please login again.')

      const res = await fetch('/api/wallet/debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: subvendorId,
          email: userEmail,
          amount: plan.customPrice,
          role: 'SUBVENDOR',
          purpose: `Purchased ${plan.name} Data Plan`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || res.statusText)

      const newBalance = Number((walletBalance - plan.customPrice).toFixed(2))
      setWalletBalance(newBalance)

      const newTxn = {
        id: data.id || `txn_${Date.now()}`,
        txnType: 'DEBIT',
        amount: plan.customPrice,
        balanceAfter: newBalance,
        reference: data.reference || 'N/A',
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      }

      setTransactions((prev) => [newTxn, ...(prev || [])])
      mutateWallet()
      mutatePlans()
      alert(`✅ Plan purchased successfully! Wallet debited ₦${plan.customPrice}`)
    } catch (err) {
      console.error('Failed to purchase plan:', err)
      alert(`❌ Failed to purchase plan: ${err?.message || err}`)
    }
  }

  // Render content
  const renderContent = () => {
    switch (activeTab) {
      case 'WalletBalance':
        return <WalletDashboard walletBalance={walletBalance} transactions={transactions} />
      case 'Fund Wallet':
        return <PaymentForm onWalletUpdate={setWalletBalance} />
      case 'Retailers':
        return <ManageRetailer retailers={retailers || []} subvendorId={subvendorId} />
      case 'DataPlans':
        return <SubvendorDataPlan walletBalance={walletBalance} onBuyPlan={handleBuyPlan} />
      case 'Profile':
        return <Profile />
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-2">Subvendor Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                <CreditCard className="text-green-600 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{transactions?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Transactions</div>
              </div>

              {/* Retailers */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Users className="text-blue-600 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{retailers?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Retailers</div>
              </div>

              {/* Data Plans */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
                <Layers className="text-indigo-500 mb-2 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{dataPlans?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-sm sm:text-base">Data Plans</div>
              </div>
            </div>
          </div>
        )
    }
  }

  const tabs = [
    { name: 'Dashboard', icon: <Home className="w-4 h-4 mr-2" /> },
    { name: 'Fund Wallet', icon: <CreditCard className="w-4 h-4 mr-2" /> },
    { name: 'Retailers', icon: <Users className="w-4 h-4 mr-2" /> },
    { name: 'WalletRecord', icon: <Wallet className="w-4 h-4 mr-2" /> },
    { name: 'DataPlans', icon: <Layers className="w-4 h-4 mr-2" /> },
    { name: 'Profile', icon: <User className="w-4 h-4 mr-2" /> },
  ]

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
                <span>Subvendor</span>
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
            <h1 className="text-lg font-semibold">Subvendor Dashboard</h1>
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
