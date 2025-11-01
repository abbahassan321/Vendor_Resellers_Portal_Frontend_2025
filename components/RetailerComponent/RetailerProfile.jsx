"use client"

import { useState, useEffect } from "react"

// ✅ Lightweight fallback components (replace later if you install shadcn/ui)
const Button = ({ children, variant, className, ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 rounded text-white font-medium ${
      variant === "secondary"
        ? "bg-gray-400 hover:bg-gray-500"
        : "bg-blue-600 hover:bg-blue-700"
    } ${className || ""}`}
  >
    {children}
  </button>
)

const Input = (props) => (
  <input
    {...props}
    className={`border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none ${
      props.className || ""
    }`}
  />
)

const Label = ({ children }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    {children}
  </label>
)

const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-xl p-6 ${className || ""}`}>
    {children}
  </div>
)

const CardHeader = ({ children }) => <div className="mb-4">{children}</div>
const CardTitle = ({ children }) => <h2 className="text-xl font-bold">{children}</h2>
const CardContent = ({ children }) => <div>{children}</div>

export default function RetailerProfile() {
  const [retailer, setRetailer] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("glovendor_token")
    if (!token) {
      setError("Please log in first.")
      setLoading(false)
      return
    }

    fetch("http://localhost:8080/api/retailers/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const retailerData = data[0]
          setRetailer(retailerData)
          setFormData({
            name: retailerData.name || "",
            email: retailerData.email || "",
            phone: retailerData.phone || "",
          })
        } else {
          setError("No retailer profile found.")
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSave = async () => {
    const token = localStorage.getItem("glovendor_token")
    if (!retailer) return

    try {
      const res = await fetch(
        `http://localhost:8080/api/retailers/${retailer.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      )
      if (!res.ok) throw new Error(`Failed to update profile (${res.status})`)
      const updated = await res.json()
      setRetailer(updated)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>Loading profile...</CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-red-600 font-medium">⚠️ {error}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Retailer Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input name="email" value={formData.email} disabled />
        </div>

        <div>
          <Label>Phone</Label>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div className="flex gap-2 pt-4">
          {editing ? (
            <>
              <Button onClick={handleSave}>Save</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
