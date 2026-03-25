import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../components/MainLayout'
import { useApp } from '../context/AppContext'
import { t } from '../i18n'
import { getHealthHistory, syncStravaActivities } from '../services/api'

export default function HistoryPage() {
  const { language } = useApp()
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [days, setDays] = useState(180)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0)
  const [historyData, setHistoryData] = useState([])

  const availableMonths = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }).map((_, index) => new Date(now.getFullYear(), now.getMonth() - index, 1))
  }, [])

  const filteredData = useMemo(() => {
    const selected = availableMonths[selectedMonthIndex]
    if (!selected) return historyData
    return historyData.filter((item) => {
      const d = new Date(item.date)
      return d.getFullYear() === selected.getFullYear() && d.getMonth() === selected.getMonth()
    })
  }, [availableMonths, selectedMonthIndex, historyData])

  useEffect(() => {
    fetchHistory(days)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  async function fetchHistory(nextDays) {
    setLoading(true)
    await syncStravaActivities()

    const response = await getHealthHistory(nextDays)
    if (response.success && response.data) {
      setHistoryData(Array.isArray(response.data.history) ? response.data.history : [])
      setIsOffline(response.cached === true)
    } else {
      setHistoryData([])
    }
    setLoading(false)
  }

  function formatDateLabel(rawDate) {
    const date = new Date(rawDate)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
  }

  return (
    <MainLayout title={t(language, 'healthHistory')} onRefresh={() => fetchHistory(days)} headerMode="center">
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
        {availableMonths.map((month, index) => {
          const active = selectedMonthIndex === index
          return (
            <button
              key={month.toISOString()}
              onClick={() => setSelectedMonthIndex(index)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                active
                  ? 'bg-brand text-white'
                  : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {month.toLocaleDateString(undefined, { month: 'long' })}
            </button>
          )
        })}
      </div>

      {isOffline ? (
        <div className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">
          Showing cached data (Offline)
        </div>
      ) : null}

      {loading ? (
        <div className="card mt-4 p-10 text-center text-sm text-slate-500">{t(language, 'syncing')}</div>
      ) : filteredData.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-sm text-slate-500">{t(language, 'noData')}</div>
      ) : (
        <div className="mt-4 space-y-4">
          {filteredData.map((item, index) => {
            const steps = Number(item.steps || 0)
            const distance = Number(item.distance || 0)
            const calories = Number(item.calories || 0)
            const statusColor = steps < 5000 ? 'text-red-500' : steps < 8000 ? 'text-amber-500' : 'text-emerald-500'

            return (
              <div key={`${item.date}-${index}`} className="flex gap-3">
                <div className="w-3 pt-4">
                  <div className={`h-3 w-3 rounded-full ${statusColor.replace('text', 'bg')}`} />
                  <div className="mx-auto h-full w-[2px] bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="card flex-1 rounded-2xl p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wide ${statusColor}`}>{new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                      <p className="text-lg font-bold">{formatDateLabel(item.date)}</p>
                    </div>
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${statusColor.replace('text', 'bg').replace('-500', '-100')} ${statusColor}`}>
                      {steps >= 8000 ? 'Great' : steps >= 5000 ? 'Normal' : 'Check'}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <Metric label="Steps" value={steps.toLocaleString()} icon="🚶" />
                    <Metric label="Distance" value={`${distance.toFixed(2)} km`} icon="📍" />
                    <Metric label="Calories" value={`${calories} kcal`} icon="🔥" />
                  </div>

                  {Array.isArray(item.activities) && item.activities.length > 0 ? (
                    <div className="mt-3 rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-700/50">
                      <p className="font-semibold">Activities</p>
                      <div className="mt-2 space-y-1">
                        {item.activities.map((activity, activityIndex) => (
                          <div key={activityIndex} className="flex justify-between">
                            <span>
                              {activity.type} ({activity.durationMin} min)
                            </span>
                            <span className="font-semibold">{activity.calories} cal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}

          <div className="pb-6 text-center">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold tracking-wider text-slate-500 dark:border-slate-700"
              onClick={() => setDays((value) => value + 30)}
            >
              LOAD OLDER RECORDS
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

function Metric({ label, value, icon }) {
  return (
    <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-700/50">
      <p className="text-xs text-slate-500">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  )
}
