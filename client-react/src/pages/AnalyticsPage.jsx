import { useEffect, useMemo, useState } from 'react'
import {
  BedDouble,
  Droplets,
  Flame,
  HeartPulse,
  Pencil,
  Route as RouteIcon,
  Sparkles,
} from 'lucide-react'
import MainLayout from '../components/MainLayout'
import { useApp } from '../context/AppContext'
import {
  getHealthData,
  getMonthlyAnalytics,
  getWeeklyAnalytics,
  syncStravaActivities,
} from '../services/api'

const STRINGS = {
  English: {
    today: 'Today',
    week: 'Week',
    month: 'Month',
    overallWellness: 'Overall Wellness',
    wellnessDesc:
      "Your biometrics are looking stable. You're doing better than last week with consistent movement and sleep.",
    activityLevel: 'Activity Level',
    stepsAvg: 'steps avg',
    caloriesBurned: 'Calories Burned',
    distance: 'Distance',
    restingHeartRate: 'Resting Heart Rate',
    bpm: 'bpm',
    sleepTrend: 'Sleep Trend',
    hours: 'hours',
    sleepQuality: 'Sleep Quality',
    hydration: 'Hydration',
    weeklyInsight: 'Weekly Insight',
    insightText:
      'Your activity is strongest mid-week. Keeping this consistency can improve recovery and sleep quality.',
    score: 'Score',
    noData: 'No data available',
    addWater: 'Add Water Intake',
    dailyGoal: 'Daily Goal',
    reset: 'Reset',
    cancel: 'Cancel',
    add: 'Add',
  },
  Hindi: {
    today: 'आज',
    week: 'सप्ताह',
    month: 'महीना',
    overallWellness: 'समग्र कल्याण',
    wellnessDesc: 'आपके बायोमेट्रिक्स स्थिर हैं और आपका प्रदर्शन पिछले सप्ताह से बेहतर है।',
    activityLevel: 'गतिविधि स्तर',
    stepsAvg: 'कदम औसत',
    caloriesBurned: 'कैलोरी बर्न',
    distance: 'दूरी',
    restingHeartRate: 'विश्राम हृदय गति',
    bpm: 'BPM',
    sleepTrend: 'नींद रुझान',
    hours: 'घंटे',
    sleepQuality: 'नींद गुणवत्ता',
    hydration: 'जलयोजन',
    weeklyInsight: 'साप्ताहिक अंतर्दृष्टि',
    insightText: 'सप्ताह के मध्य आपकी गतिविधि अधिक है। यही निरंतरता रिकवरी बेहतर करती है।',
    score: 'स्कोर',
    noData: 'कोई डेटा उपलब्ध नहीं',
    addWater: 'जल सेवन जोड़ें',
    dailyGoal: 'दैनिक लक्ष्य',
    reset: 'रीसेट',
    cancel: 'रद्द करें',
    add: 'जोड़ें',
  },
  Marathi: {
    today: 'आज',
    week: 'आठवडा',
    month: 'महिना',
    overallWellness: 'एकूण आरोग्य',
    wellnessDesc: 'तुमचे बायोमेट्रिक्स स्थिर आहेत आणि सातत्यामुळे सुधारणा दिसत आहे.',
    activityLevel: 'क्रियाकलाप पातळी',
    stepsAvg: 'पावले सरासरी',
    caloriesBurned: 'कॅलरीज बर्न',
    distance: 'अंतर',
    restingHeartRate: 'विश्रांती हृदय गती',
    bpm: 'BPM',
    sleepTrend: 'झोप ट्रेंड',
    hours: 'तास',
    sleepQuality: 'झोप गुणवत्ता',
    hydration: 'जलयोजन',
    weeklyInsight: 'साप्ताहिक अंतर्दृष्टी',
    insightText: 'आठवड्याच्या मध्यात तुमची क्रियाकलाप जास्त आहे. हे सातत्य रिकव्हरी सुधारते.',
    score: 'स्कोअर',
    noData: 'डेटा उपलब्ध नाही',
    addWater: 'पाणी सेवन जोडा',
    dailyGoal: 'दैनिक लक्ष्य',
    reset: 'रीसेट',
    cancel: 'रद्द करा',
    add: 'जोडा',
  },
}

function dateKey(date) {
  return date.toISOString().split('T')[0]
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function calculateRestingHeartRate(avgHR, sleepQuality, totalSteps) {
  if (avgHR === 0) return 0

  let multiplier = 0.75
  if (sleepQuality === 'good') multiplier = 0.72
  if (sleepQuality === 'bad') multiplier = 0.78

  if (totalSteps > 8000) multiplier -= 0.02
  if (totalSteps < 3000) multiplier += 0.02

  return Math.round(avgHR * multiplier)
}

function buildWeekDayData(dailyData, extractor) {
  const values = Array(7).fill(0)
  dailyData.forEach((item) => {
    const date = new Date(item.date)
    const index = (date.getDay() + 6) % 7
    values[index] = extractor(item)
  })
  return values
}

export default function AnalyticsPage() {
  const { language } = useApp()
  const text = STRINGS[language] || STRINGS.English

  const [selectedTimeframe, setSelectedTimeframe] = useState('Today')
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  const [stepsGoal, setStepsGoal] = useState(parseNumber(localStorage.getItem('stepsGoal'), 10000))
  const [sleepGoal, setSleepGoal] = useState(parseNumber(localStorage.getItem('sleepGoal'), 8))
  const [distanceGoal, setDistanceGoal] = useState(parseNumber(localStorage.getItem('distanceGoal'), 5000))

  const [totalSteps, setTotalSteps] = useState(0)
  const [totalCalories, setTotalCalories] = useState(0)
  const [avgHeartRate, setAvgHeartRate] = useState(0)
  const [restingHeartRate, setRestingHeartRate] = useState(0)
  const [avgSleep, setAvgSleep] = useState(0)
  const [sleepQuality, setSleepQuality] = useState('good')
  const [distance, setDistance] = useState(0)
  const [dailyData, setDailyData] = useState([])

  const [hydrationDate, setHydrationDate] = useState(dateKey(new Date()))
  const [hydration, setHydration] = useState(0)
  const [hydrationGoal, setHydrationGoal] = useState(parseNumber(localStorage.getItem('hydration_goal'), 2500))
  const [showHydrationModal, setShowHydrationModal] = useState(false)
  const [hydrationInput, setHydrationInput] = useState('')
  const [hydrationGoalDraft, setHydrationGoalDraft] = useState(hydrationGoal)

  useEffect(() => {
    setStepsGoal(parseNumber(localStorage.getItem('stepsGoal'), 10000))
    setSleepGoal(parseNumber(localStorage.getItem('sleepGoal'), 8))
    setDistanceGoal(parseNumber(localStorage.getItem('distanceGoal'), 5000))
  }, [selectedTimeframe])

  useEffect(() => {
    const today = dateKey(new Date())
    setHydrationDate(today)
    setHydration(parseNumber(localStorage.getItem(`hydration_${today}`), 0))
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeframe])

  useEffect(() => {
    const timer = setInterval(() => {
      const today = dateKey(new Date())
      if (today !== hydrationDate) {
        setHydrationDate(today)
        setHydration(parseNumber(localStorage.getItem(`hydration_${today}`), 0))
      }
    }, 60_000)

    return () => clearInterval(timer)
  }, [hydrationDate])

  useEffect(() => {
    localStorage.setItem(`hydration_${hydrationDate}`, String(hydration))
  }, [hydration, hydrationDate])

  useEffect(() => {
    localStorage.setItem('hydration_goal', String(hydrationGoal))
  }, [hydrationGoal])

  async function fetchAnalyticsData() {
    setLoading(true)

    await syncStravaActivities()

    if (selectedTimeframe === 'Today') {
      const result = await getHealthData(dateKey(new Date()))
      if (result.success && result.data) {
        const data = result.data
        const nextSteps = parseNumber(data.steps, 0)
        const nextSleep = parseNumber(data?.sleep?.duration, 0)
        const nextHeartRate = parseNumber(data.heartRateAvg, 0)
        const nextCalories = parseNumber(data.caloriesBurned, 0)
        const nextDistance = Math.round(nextSteps * 0.75)
        const quality = data?.sleep?.quality || 'good'

        setIsOffline(result.cached === true)
        setTotalSteps(nextSteps)
        setTotalCalories(nextCalories)
        setAvgHeartRate(nextHeartRate)
        setRestingHeartRate(calculateRestingHeartRate(nextHeartRate, quality, nextSteps))
        setAvgSleep(nextSleep)
        setSleepQuality(quality)
        setDistance(nextDistance)
        setDailyData([
          {
            date: dateKey(new Date()),
            steps: nextSteps,
            heartRateAvg: nextHeartRate,
            sleep: { duration: nextSleep, quality },
            caloriesBurned: nextCalories,
          },
        ])
      } else {
        setIsOffline(false)
        setTotalSteps(0)
        setTotalCalories(0)
        setAvgHeartRate(0)
        setRestingHeartRate(0)
        setAvgSleep(0)
        setSleepQuality('good')
        setDistance(0)
        setDailyData([])
      }
    } else {
      const response =
        selectedTimeframe === 'Week' ? await getWeeklyAnalytics() : await getMonthlyAnalytics()

      if (response.success && response.data) {
        const summary = response.data.summary || {}
        const daily = Array.isArray(response.data.dailyData) ? response.data.dailyData : []
        const totalDistance = daily.reduce(
          (sum, item) => sum + Math.round(parseNumber(item.steps, 0) * 0.75),
          0,
        )
        const quality = daily.length > 0 ? daily[daily.length - 1]?.sleep?.quality || 'good' : 'good'
        const heart = parseNumber(summary.avgHeartRate, 0)
        const steps = parseNumber(summary.totalSteps, 0)

        setIsOffline(response.cached === true)
        setTotalSteps(steps)
        setTotalCalories(parseNumber(summary.totalCaloriesBurned, 0))
        setAvgHeartRate(heart)
        setRestingHeartRate(calculateRestingHeartRate(heart, quality, steps))
        setAvgSleep(parseNumber(summary.avgSleep, 0))
        setSleepQuality(quality)
        setDistance(totalDistance)
        setDailyData(daily)
      } else {
        setIsOffline(false)
        setTotalSteps(0)
        setTotalCalories(0)
        setAvgHeartRate(0)
        setRestingHeartRate(0)
        setAvgSleep(0)
        setSleepQuality('good')
        setDistance(0)
        setDailyData([])
      }
    }

    setLoading(false)
  }

  const wellnessScore = useMemo(() => {
    if (selectedTimeframe === 'Today') {
      const score =
        (totalSteps / Math.max(stepsGoal, 1)) * 40 +
        (avgSleep / Math.max(sleepGoal, 1)) * 30 +
        (distance / Math.max(distanceGoal, 1)) * 30
      return Math.max(0, Math.min(100, Math.round(score)))
    }

    const stepsTarget = selectedTimeframe === 'Week' ? 70000 : 300000
    const stepsScore = Math.max(0, Math.min(100, (totalSteps / stepsTarget) * 100))
    const sleepScore = Math.max(0, Math.min(100, (avgSleep / Math.max(sleepGoal, 1)) * 100))
    let hrScore = 100
    if (avgHeartRate > 0) {
      if (avgHeartRate < 60) hrScore = Math.max(0, Math.min(100, (avgHeartRate / 60) * 100))
      else if (avgHeartRate > 100) hrScore = Math.max(0, 100 - (avgHeartRate - 100))
    }

    return Math.round(stepsScore * 0.35 + sleepScore * 0.35 + hrScore * 0.3)
  }, [selectedTimeframe, totalSteps, avgSleep, avgHeartRate, stepsGoal, sleepGoal, distance, distanceGoal])

  const activityBars = useMemo(() => {
    const raw = buildWeekDayData(dailyData, (item) => parseNumber(item.steps, 0))
    const max = Math.max(1000, ...raw)
    return raw.map((value) => Math.max(0.05, value / max))
  }, [dailyData])

  const sleepBars = useMemo(() => {
    const raw = buildWeekDayData(dailyData, (item) => parseNumber(item?.sleep?.duration, 0))
    return raw.map((value) => Math.max(0.05, Math.min(1, value / 10)))
  }, [dailyData])

  const heartLinePoints = useMemo(() => {
    const raw = buildWeekDayData(dailyData, (item) => parseNumber(item.heartRateAvg, 0))
    const max = Math.max(120, ...raw)
    const min = Math.min(40, ...raw.filter((value) => value > 0))
    const range = Math.max(1, max - min)

    return raw
      .map((value, index) => {
        const x = (index / 6) * 314
        const y = value > 0 ? 56 - ((value - min) / range) * 46 : 42
        return `${x.toFixed(1)},${Math.max(6, y).toFixed(1)}`
      })
      .join(' ')
  }, [dailyData])

  const hydrationProgress = Math.max(0, Math.min(1, hydration / Math.max(hydrationGoal, 1)))
  const hydrationPercent = Math.round(hydrationProgress * 100)

  function applyHydration(amount) {
    if (amount <= 0) return
    setHydration((previous) => previous + amount)
  }

  function saveHydrationChanges() {
    applyHydration(parseNumber(hydrationInput, 0))
    const goal = Math.round(parseNumber(hydrationGoalDraft, hydrationGoal))
    if (goal >= 2500 && goal <= 4000) {
      setHydrationGoal(goal)
    }
    setHydrationInput('')
    setShowHydrationModal(false)
  }

  return (
    <MainLayout title="Analytics" onRefresh={fetchAnalyticsData} headerMode="center">
      {isOffline ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-100/80 px-3 py-2 text-xs font-semibold text-amber-700">
          Showing cached data (Offline)
        </div>
      ) : null}

      <div className="mt-2 rounded-2xl border border-appStroke bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
        <div className="grid grid-cols-3 gap-1">
          {['Today', 'Week', 'Month'].map((frame) => {
            const active = frame === selectedTimeframe
            return (
              <button
                key={frame}
                onClick={() => setSelectedTimeframe(frame)}
                className={`rounded-xl py-2 text-sm font-semibold ${
                  active
                    ? 'bg-brand text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {frame === 'Today' ? text.today : frame === 'Week' ? text.week : text.month}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="card mt-4 p-10 text-center text-sm text-slate-500">Loading analytics...</div>
      ) : (
        <>
          <section className="card mt-4 p-5">
            <div className="flex items-center gap-5">
              <div className="relative h-32 w-32 shrink-0">
                <div
                  className="h-full w-full rounded-full p-2"
                  style={{
                    background: `conic-gradient(#45A191 ${wellnessScore * 3.6}deg, #E6EEF0 ${wellnessScore * 3.6}deg 360deg)`,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-slate-800">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-brand">{wellnessScore}</p>
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-appMuted">{text.score}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{text.overallWellness}</p>
                <p className="mt-2 text-sm leading-6 text-appMuted">{text.wellnessDesc}</p>
              </div>
            </div>
          </section>

          <section className="card mt-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-appMuted">{text.activityLevel}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  {totalSteps.toLocaleString()} <span className="text-lg font-medium text-appMuted">{text.stepsAvg}</span>
                </p>
              </div>
              <div className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                {dailyData.length || 1} days
              </div>
            </div>

            <div className="mt-5 grid h-32 grid-cols-7 items-end gap-2">
              {activityBars.map((height, index) => (
                <div key={index} className="flex h-full flex-col items-center justify-end gap-2">
                  <div className="w-full rounded-md bg-brand/15">
                    <div className="rounded-md bg-brand" style={{ height: `${Math.round(height * 90)}px` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-appMuted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <MiniCard
              title={text.caloriesBurned}
              value={totalCalories.toLocaleString()}
              unit="kcal"
              icon={<Flame size={18} />}
              tone="bg-orange-100 text-orange-600"
            />
            <MiniCard
              title={text.distance}
              value={distance.toLocaleString()}
              unit="m"
              icon={<RouteIcon size={18} />}
              tone="bg-violet-100 text-violet-600"
            />
          </section>

          <section className="card mt-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-appMuted">{text.restingHeartRate}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  {restingHeartRate} <span className="text-lg font-medium text-appMuted">{text.bpm}</span>
                </p>
                <p className="mt-1 text-xs text-appMuted">Avg: {avgHeartRate} bpm</p>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <HeartPulse size={20} />
              </div>
            </div>

            <div className="mt-5 h-20 w-full">
              <svg width="100%" height="100%" viewBox="0 0 314 56" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#E11D48"
                  strokeWidth="2.5"
                  points={heartLinePoints}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold text-appMuted">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </section>

          <section className="card mt-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-appMuted">{text.sleepTrend}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  {avgSleep.toFixed(1)} <span className="text-lg font-medium text-appMuted">{text.hours}</span>
                </p>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <BedDouble size={18} />
              </div>
            </div>

            <div className="mt-5 grid h-24 grid-cols-7 items-end gap-2">
              {sleepBars.map((height, index) => (
                <div key={index} className="flex h-full flex-col items-center justify-end gap-2">
                  <div className="w-full rounded-md bg-indigo-100/70">
                    <div className="rounded-md bg-indigo-500" style={{ height: `${Math.round(height * 72)}px` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-appMuted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <BedDouble size={18} />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    sleepQuality === 'good'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {sleepQuality}
                </span>
              </div>
              <p className="mt-4 text-sm text-appMuted">{text.sleepQuality}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{avgSleep.toFixed(1)}h</p>
              <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full ${sleepQuality === 'good' ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.round(Math.max(0, Math.min(1, avgSleep / 8)) * 100)}%` }}
                />
              </div>
            </div>

            <button className="card p-5 text-left" onClick={() => setShowHydrationModal(true)}>
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <Droplets size={18} />
                </div>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-600">
                  <Pencil size={13} />
                </span>
              </div>
              <p className="mt-4 text-sm text-appMuted">{text.hydration}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{hydration.toLocaleString()} ml</p>
              <p className="mt-1 text-xs font-semibold text-sky-600">{hydrationPercent}% of {(hydrationGoal / 1000).toFixed(1)}L goal</p>
              <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${hydrationPercent}%` }} />
              </div>
            </button>
          </section>

          <section className="mt-4 rounded-2xl bg-brand/10 p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 text-brand">
                <Sparkles size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{text.weeklyInsight}</p>
                <p className="mt-1 text-sm leading-6 text-appMuted">{text.insightText}</p>
              </div>
            </div>
          </section>
        </>
      )}

      {showHydrationModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[480px] rounded-3xl bg-white p-6 shadow-card dark:bg-slate-800">
            <h4 className="text-[34px] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">{text.addWater}</h4>

            <div className="mt-4 rounded-xl bg-sky-50 p-4 dark:bg-sky-900/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{text.dailyGoal}</p>
                <p className="text-sm font-bold text-sky-600">{(hydrationGoalDraft / 1000).toFixed(1)}L</p>
              </div>
              <input
                type="range"
                min={2500}
                max={4000}
                step={250}
                value={hydrationGoalDraft}
                onChange={(event) => setHydrationGoalDraft(parseNumber(event.target.value, hydrationGoalDraft))}
                className="mt-3 w-full accent-sky-500"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-appMuted">
                <span>2.5L</span>
                <span>4.0L</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="number"
                className="auth-input"
                placeholder="Amount in ml"
                value={hydrationInput}
                onChange={(event) => setHydrationInput(event.target.value)}
              />

              <div className="grid grid-cols-3 gap-2">
                {[250, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    className="rounded-lg bg-sky-100 py-2 text-xs font-semibold text-sky-700"
                    onClick={() => applyHydration(amount)}
                  >
                    +{amount}ml
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-500"
                onClick={() => {
                  setHydration(0)
                  setShowHydrationModal(false)
                }}
              >
                {text.reset}
              </button>
              <button
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-appMuted dark:bg-slate-700"
                onClick={() => setShowHydrationModal(false)}
              >
                {text.cancel}
              </button>
              <button className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-slate-900" onClick={saveHydrationChanges}>
                {text.add}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  )
}

function MiniCard({ title, value, unit, icon, tone }) {
  return (
    <div className="card p-4">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-appMuted">{title}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
        {value} <span className="text-base font-medium text-appMuted">{unit}</span>
      </p>
    </div>
  )
}
