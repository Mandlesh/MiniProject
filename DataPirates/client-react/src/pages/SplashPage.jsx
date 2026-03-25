import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoIcon from '../components/LogoIcon'
import { requestNotificationPermissions, scheduleEveningHealthCheck } from '../services/notificationService'

export default function SplashPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0.2)

  useEffect(() => {
    let timer
    let interval

    const boot = async () => {
      await requestNotificationPermissions()
      const cancelSchedule = scheduleEveningHealthCheck()

      interval = setInterval(() => {
        setProgress((value) => (value >= 1 ? value : value + 0.07))
      }, 120)

      timer = setTimeout(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        navigate(isLoggedIn ? '/dashboard' : '/register', { replace: true })
      }, 2000)

      return cancelSchedule
    }

    const cleanupPromise = boot()

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 dark:bg-appBgDark">
      <LogoIcon size={140} />
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">SwasthSetu</h1>
      <p className="mt-2 text-sm text-slate-500">Your vital insights, simplified.</p>

      <div className="mt-14 h-1.5 w-72 rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-brand transition-all duration-200"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
    </div>
  )
}
