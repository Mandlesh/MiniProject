import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { useApp } from '../context/AppContext'
import { t } from '../i18n'
import { getUserProfile, logoutUser } from '../services/api'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { language, userName, setUserName, logoutLocal } = useApp()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile() {
    setLoading(true)
    const response = await getUserProfile()
    if (response.success && response.data) {
      setUserName(response.data.name || 'User')
      setEmail(response.data.email || '')
    }
    setLoading(false)
  }

  async function signOut() {
    const confirmed = window.confirm('Are you sure you want to sign out?')
    if (!confirmed) return

    await logoutUser()
    logoutLocal()
    navigate('/login', { replace: true })
  }

  return (
    <MainLayout title={t(language, 'profile')} onRefresh={loadProfile} headerMode="center">
      <section className="card mt-4 p-6 text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-brand/20 p-1">
          <img
            className="h-full w-full rounded-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3tixK1ZF8ATdgor-ygW2XP4lLEQvbyK9ZGMxG28Tn4BwIuIHwqelC1OyyXSXYMwza9lVn6TuCL1jKmqPp4saXI4sQGn_u7gQgY2HkfZgPkPNnIBffiQtVZZe-TlDlFOHrP7zH85lqGqDN9_KUDvYR8UHnTWsr6ipEm-8ajY9BHHc_GN84SyGv63YBYrPYHOJsM3BHt4_gOiSMQBzmmqaj-90Yl_V3DxlYT7fmE3P1sYhUaeXlMG98iWd3C1AZYr5SsLpKMuXzUByr"
            alt="profile"
          />
        </div>
        <h2 className="mt-4 text-2xl font-bold">{loading ? 'Loading...' : userName}</h2>
        <p className="text-sm text-slate-500">{email}</p>
      </section>

      <section className="card mt-4 divide-y divide-slate-100 p-1 dark:divide-slate-700">
        <MenuItem label="Manage Account" icon="🧾" onClick={() => navigate('/profile/edit')} />
        <MenuItem label="Notifications" icon="🔔" onClick={() => navigate('/profile/notifications')} />
        <MenuItem label="Settings" icon="⚙" onClick={() => navigate('/profile/settings')} />
      </section>

      <button
        className="mt-5 w-full rounded-xl border-2 border-brand/40 py-3 font-bold text-brand"
        onClick={signOut}
      >
        {t(language, 'logout')}
      </button>

      <p className="py-6 text-center text-xs text-slate-400">v1.4.2 (Build 209)</p>
    </MainLayout>
  )
}

function MenuItem({ label, icon, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50">
      <span className="rounded-xl bg-slate-100 px-3 py-2 text-lg dark:bg-slate-700">{icon}</span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <span className="text-slate-400">›</span>
    </button>
  )
}
