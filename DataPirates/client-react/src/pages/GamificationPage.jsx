import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../components/MainLayout'
import {
  getGamificationProfile,
  getTodayLeaderboard,
  syncGamification,
} from '../services/gamificationApi'

const allBadges = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your first 1,000 steps', icon: '🚶' },
  { id: 'step_master', name: 'Step Master', description: 'Reach 10,000 steps in a day', icon: '🏃' },
  { id: 'marathon_walker', name: 'Marathon Walker', description: 'Walk 50,000 steps in a week', icon: '🏆' },
  { id: 'sleep_champion', name: 'Sleep Champion', description: 'Get 8+ hours sleep for 7 days', icon: '😴' },
  { id: 'early_bird', name: 'Early Bird', description: 'Log activity before 7 AM', icon: '🌅' },
  { id: 'calorie_crusher', name: 'Calorie Crusher', description: 'Burn 500+ calories in a day', icon: '🔥' },
  { id: 'consistency_king', name: 'Consistency King', description: 'Log health data for 30 days', icon: '📅' },
  { id: 'heart_healthy', name: 'Heart Healthy', description: 'Maintain optimal heart rate', icon: '❤️' },
  { id: 'hydration_hero', name: 'Hydration Hero', description: 'Meet hydration goal for 5 days', icon: '💧' },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Share your progress', icon: '📣' },
  { id: 'level_5', name: 'Rising Star', description: 'Reach Level 5', icon: '⭐' },
  { id: 'level_10', name: 'Health Champion', description: 'Reach Level 10', icon: '🥇' },
]

export default function GamificationPage() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')
  const [points, setPoints] = useState(0)
  const [dailyPoints, setDailyPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [badges, setBadges] = useState([])
  const [leaderboard, setLeaderboard] = useState([])

  const earnedBadgeIds = useMemo(() => new Set(badges.map((badge) => badge.id)), [badges])
  const levelProgress = (points % 100) / 100

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    await syncGamification()
    const [profileResult, leaderboardResult] = await Promise.all([
      getGamificationProfile(),
      getTodayLeaderboard(),
    ])

    if (profileResult.success && profileResult.data) {
      setPoints(Number(profileResult.data.points || 0))
      setDailyPoints(Number(profileResult.data.dailyPoints || 0))
      setLevel(Number(profileResult.data.level || 1))
      setBadges(Array.isArray(profileResult.data.badges) ? profileResult.data.badges : [])
    }

    if (leaderboardResult.success && Array.isArray(leaderboardResult.data)) {
      setLeaderboard(leaderboardResult.data)
    }

    setLoading(false)
  }

  async function shareProgress() {
    const text =
      `🎮 My SwasthSetu Progress\n\n` +
      `🏆 Level ${level}\n` +
      `⭐ ${points} Total XP\n` +
      `💪 ${dailyPoints} XP Today\n` +
      `🎖️ ${badges.length} Badges Earned\n\n` +
      `Join me on SwasthSetu and start your health journey!`

    if (navigator.share) {
      await navigator.share({ text, title: 'My SwasthSetu Progress' })
      return
    }

    await navigator.clipboard.writeText(text)
    alert('Progress copied to clipboard!')
  }

  return (
    <MainLayout
      title="Gamification"
      back
      onRefresh={loadData}
      headerMode="back"
      showBottomNav={false}
    >
      <div className="mt-4 flex rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
        {['Overview', 'Badges', 'Leaderboard'].map((item) => (
          <button
            key={item}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-brand text-white' : 'text-slate-500'}`}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card mt-4 p-10 text-center text-sm text-slate-500">Loading gamification data...</div>
      ) : tab === 'Overview' ? (
        <>
          <section className="mt-4 rounded-3xl bg-gradient-to-br from-brand to-emerald-700 p-6 text-white shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Current Level</p>
                <p className="text-5xl font-extrabold">{level}</p>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-xl font-bold">
                {Math.round(levelProgress * 100)}%
              </div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(levelProgress * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/80">{points % 100} / 100 XP to next level</p>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3">
            <StatCard title="Total Points" value={String(points)} icon="⭐" />
            <StatCard title="Today's Points" value={`+${dailyPoints}`} icon="📅" />
          </section>

          <section className="card mt-4 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold">Daily Goals</p>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                {dailyPoints >= 80 ? '5/5' : dailyPoints >= 60 ? '4/5' : dailyPoints >= 40 ? '3/5' : dailyPoints >= 20 ? '2/5' : '1/5'}
              </span>
            </div>

            <GoalRow done={dailyPoints >= 10} label="Log Activity" xp={10} />
            <GoalRow done={dailyPoints >= 30} label="8,000+ Steps" xp={20} />
            <GoalRow done={dailyPoints >= 40} label="12,000+ Steps" xp={10} />
            <GoalRow done={dailyPoints >= 60} label="400+ Calories" xp={20} />
            <GoalRow done={dailyPoints >= 80} label="7+ Hours Sleep" xp={20} />
          </section>

          <section className="card mt-4 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold">Badges</p>
              <button className="text-xs font-bold text-brand" onClick={() => setTab('Badges')}>
                View All
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {allBadges.slice(0, 4).map((badge) => (
                <BadgeIcon key={badge.id} badge={badge} earned={earnedBadgeIds.has(badge.id)} />
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-violet-300 bg-violet-50 p-4 dark:bg-violet-900/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Share Your Progress</p>
                <p className="text-xs text-slate-500">Challenge friends and earn bonus XP!</p>
              </div>
              <button className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white" onClick={shareProgress}>
                Share
              </button>
            </div>
          </section>
        </>
      ) : tab === 'Badges' ? (
        <section className="mt-4">
          <p className="mb-3 text-sm text-slate-500">
            {badges.length} of {allBadges.length} earned
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allBadges.map((badge) => (
              <div key={badge.id} className="card rounded-2xl p-4 text-center">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${earnedBadgeIds.has(badge.id) ? 'bg-brand/15' : 'bg-slate-100 dark:bg-slate-700'}`}>
                  {badge.icon}
                </div>
                <p className="mt-2 text-sm font-bold">{badge.name}</p>
                <p className="mt-1 text-xs text-slate-500">{badge.description}</p>
                {!earnedBadgeIds.has(badge.id) ? <p className="mt-2 text-xs text-slate-400">🔒 Locked</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-4">
          <div className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 p-5 text-white shadow-card">
            <p className="text-2xl font-extrabold">Today's Leaderboard</p>
            <p className="text-sm text-white/85">Top performers of the day</p>
          </div>

          <div className="mt-4 space-y-2">
            {leaderboard.length === 0 ? (
              <div className="card p-8 text-center text-sm text-slate-500">No leaderboard data yet</div>
            ) : (
              leaderboard.map((entry, index) => (
                <div key={entry._id || index} className="card flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-center leading-10 dark:bg-slate-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{entry?.userId?.name || 'Anonymous'}</p>
                    <p className="text-xs text-slate-500">Level {entry.level || 1}</p>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                    {entry.dailyPoints || 0} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </MainLayout>
  )
}

function StatCard({ title, value, icon }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xl">{icon}</p>
    </div>
  )
}

function GoalRow({ done, label, xp }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className={`h-6 w-6 rounded-full text-center text-sm leading-6 ${done ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
        {done ? '✓' : '○'}
      </span>
      <span className={`flex-1 text-sm ${done ? 'line-through text-slate-400' : ''}`}>{label}</span>
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${done ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
        +{xp} XP
      </span>
    </div>
  )
}

function BadgeIcon({ badge, earned }) {
  return (
    <div className="text-center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl ${earned ? 'bg-brand/15' : 'bg-slate-100 dark:bg-slate-700'}`}>
        {badge.icon}
      </div>
      <p className="mt-1 text-[11px] font-semibold">{badge.name}</p>
    </div>
  )
}
