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
  CreditCard,
  Wallet,
  Layers,
  User,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react'

// Components
import WalletDashboard from '@/components/WalletDashboard'
import PaymentForm from '@/components/PaymentForm'
import Profile from '@/components/RetailerComponent/RetailerProfile'

export default function RetailerDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const dropdownRef = useRef(null)
  const router = useRouter()
  const { logout, user } = useAuth()

  const retailerId =
    typeof window !== 'undefined' ? localStorage.getItem('retailerId') : null
  const subvendorId =
    typeof window !== 'undefined' ? localStorage.getItem('subvendorId') : null
  const userEmail = user?.email || ''

  // --- Handle dropdown close ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // --- Fetch wallet transactions ---
  const { data: fetchedTxns, mutate: mutateWallet } = useSWR(
    retailerId ? ['retailer_txns', retailerId] : null,
    async () => {
      const data = await api.listWalletTransactions(retailerId)
      if (!Array.isArray(data)) return []
      return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },
    { refreshInterval: 10000 }
  )

  useEffect(() => {
    if (fetchedTxns?.length > 0) {
      const latestSuccessTxn = fetchedTxns.find((t) => t.status === 'SUCCESS')
      setWalletBalance(latestSuccessTxn?.balanceAfter || 0)
      setTransactions(fetchedTxns)
    } else {
      setWalletBalance(0)
      setTransactions([])
    }
  }, [fetchedTxns])

  // --- Fetch data plans from subvendor ---
  const { data: dataPlans } = useSWR(
    subvendorId ? ['subvendor_data_plans_for_retailer', subvendorId] : null,
    async () => {
      // Retailer sees subvendor’s plans only
      const data = await api.listSubvendorDataPlans(subvendorId)
      // Remove base/custom price fields
      return data?.map((plan) => ({
        id: plan.id,
        name: plan.name,
        network: plan.network,
        volume: plan.volume,
        validity: plan.validity,
        price: plan.customPrice ?? plan.basePrice, // show the price subvendor set
      })) || []
    }
  )

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // --- Retailer buying plan ---
  const handleBuyPlan = async (plan) => {
    if (!plan || typeof plan.price !== 'number') {
      alert('❌ Invalid plan')
      return
    }

    if (walletBalance < plan.price) {
      alert('❌ Insufficient wallet balance')
      return
    }

    try {
      const token = getToken()
      if (!token) throw new Error('Authentication token missing. Please login again.')

      const res = await fetch('/api/wallet/debit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: retailerId,
          email: userEmail,
          amount: plan.price,
          role: 'RETAILER',
          purpose: `Purchased ${plan.name} Data Plan`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || res.statusText)

      const newBalance = Number((walletBalance - plan.price).toFixed(2))
      setWalletBalance(newBalance)

      const newTxn = {
        id: data.id || `txn_${Date.now()}`,
        txnType: 'DEBIT',
        amount: plan.price,
        balanceAfter: newBalance,
        reference: data.reference || 'N/A',
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      }

      setTransactions((prev) => [newTxn, ...(prev || [])])
      mutateWallet()
      alert(`✅ Purchased ${plan.name} successfully! Wallet debited ₦${plan.price}`)
    } catch (err) {
      console.error('Failed to purchase plan:', err)
      alert(`❌ Failed to purchase plan: ${err?.message || err}`)
    }
  }

  // --- Main Tab Renderer ---
  const renderContent = () => {
    switch (activeTab) {
      case 'WalletBalance':
        return (
          <WalletDashboard walletBalance={walletBalance} transactions={transactions} />
        )
      case 'Fund Wallet':
        return <PaymentForm onWalletUpdate={setWalletBalance} />
      case 'DataPlans':
        return (
          <RetailerDataPlan
            walletBalance={walletBalance}
            onBuyPlan={handleBuyPlan}
            dataPlans={dataPlans || []}
          />
        )
      case 'Profile':
        return <Profile />
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Retailer Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Wallet */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Wallet className="text-orange-500 mb-2" />
                <div className="text-3xl font-bold">
                  ₦{Number(walletBalance || 0).toFixed(2)}
                </div>
                <div className="text-gray-500 mt-2 text-center">Wallet Balance</div>
              </div>

              {/* Transactions */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <CreditCard className="text-green-600 mb-2" />
                <div className="text-3xl font-bold">{transactions?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-center">Transactions</div>
              </div>

              {/* Data Plans */}
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <Layers className="text-indigo-500 mb-2" />
                <div className="text-3xl font-bold">{dataPlans?.length || 0}</div>
                <div className="text-gray-500 mt-2 text-center">Available Plans</div>
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
    { name: 'DataPlans', icon: <Layers className="w-4 h-4 mr-2" /> },
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
                <span>Retailer</span>
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
            <h1 className="text-lg font-semibold">Retailer Dashboard</h1>
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
