import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { useApp } from '../context/AppContext'
import { updateUserProfile, getUserProfile, logoutUser } from '../services/api'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { language, logoutLocal, setUserName } = useApp()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    age: '',
    mobile: '',
    height: '',
    weight: '',
    email: '',
  })

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile() {
    setLoading(true)
    const result = await getUserProfile()
    if (result.success && result.data) {
      const data = result.data
      setForm({
        name: data.name || '',
        age: data.age ? String(data.age) : '',
        mobile: data.mobile || '',
        height: data.height ? String(data.height) : '',
        weight: data.weight ? String(data.weight) : '',
        email: data.email || '',
      })
    }
    setLoading(false)
  }

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function saveProfile() {
    setSaving(true)
    const result = await updateUserProfile({
      name: form.name || undefined,
      age: form.age ? Number(form.age) : undefined,
      height: form.height ? Number(form.height) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      mobile: form.mobile || undefined,
    })
    setSaving(false)

    if (!result.success) {
      alert(result.message || 'Failed to update profile')
      return
    }

    setUserName(form.name || 'User')
    alert('Profile updated successfully')
  }

  async function handleLogout() {
    await logoutUser()
    logoutLocal()
    navigate('/login', { replace: true })
  }

  return (
    <MainLayout
      title={language === 'Hindi' ? 'व्यक्तिगत डेटा' : language === 'Marathi' ? 'वैयक्तिक डेटा' : 'Personal Data'}
      back
      headerMode="back"
    >
      {loading ? (
        <div className="card mt-4 p-10 text-center text-sm text-slate-500">Loading profile...</div>
      ) : (
        <>
          <section className="mt-4 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-brand/20 p-1">
              <img
                className="h-full w-full rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3tixK1ZF8ATdgor-ygW2XP4lLEQvbyK9ZGMxG28Tn4BwIuIHwqelC1OyyXSXYMwza9lVn6TuCL1jKmqPp4saXI4sQGn_u7gQgY2HkfZgPkPNnIBffiQtVZZe-TlDlFOHrP7zH85lqGqDN9_KUDvYR8UHnTWsr6ipEm-8ajY9BHHc_GN84SyGv63YBYrPYHOJsM3BHt4_gOiSMQBzmmqaj-90Yl_V3DxlYT7fmE3P1sYhUaeXlMG98iWd3C1AZYr5SsLpKMuXzUByr"
                alt="profile"
              />
            </div>
            <p className="mt-4 text-sm text-slate-500">Update your personal details for accurate health tracking</p>
          </section>

          <section className="mt-6 space-y-4">
            <Field label="Full Name" value={form.name} onChange={(value) => update('name', value)} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Age" value={form.age} onChange={(value) => update('age', value)} type="number" />
              <Field label="Mobile Number" value={form.mobile} onChange={(value) => update('mobile', value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Height (cm)" value={form.height} onChange={(value) => update('height', value)} type="number" />
              <Field label="Weight (kg)" value={form.weight} onChange={(value) => update('weight', value)} type="number" />
            </div>

            <Field label="Email Address" value={form.email} onChange={() => {}} disabled />
          </section>

          <section className="mt-8 space-y-3 pb-6">
            <button
              className="w-full rounded-full bg-brand py-3 font-bold text-white disabled:opacity-60"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="w-full rounded-full border border-slate-300 py-3 font-semibold text-slate-600" onClick={handleLogout}>
              Logout
            </button>
          </section>
        </>
      )}
    </MainLayout>
  )
}

function Field({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <label className="block text-sm font-semibold">
      <span className="mb-1 block text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:disabled:bg-slate-700"
      />
    </label>
  )
}
