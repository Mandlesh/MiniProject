import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Moon,
  Phone,
  Ruler,
  Scale,
  Smartphone,
  Sun,
  User,
  Watch,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { registerUser } from '../services/api'
import LogoIcon from '../components/LogoIcon'

const copy = {
  English: {
    title: 'Create Account',
    subtitle: 'Connect your health data for deeper insights.',
    submit: 'Create Account',
    haveAccount: 'Already have an account?',
    login: 'Login',
    wearable: 'Select Wearable Device',
  },
  Hindi: {
    title: 'खाता बनाएं',
    subtitle: 'गहरी जानकारी के लिए अपना स्वास्थ्य डेटा कनेक्ट करें।',
    submit: 'खाता बनाएं',
    haveAccount: 'पहले से खाता है?',
    login: 'लॉगिन',
    wearable: 'पहनने योग्य डिवाइस चुनें',
  },
  Marathi: {
    title: 'खाते तयार करा',
    subtitle: 'सखोल माहितीसाठी तुमचा आरोग्य डेटा कनेक्ट करा.',
    submit: 'खाते तयार करा',
    haveAccount: 'आधीपासून खाते आहे?',
    login: 'लॉगिन',
    wearable: 'वेअरेबल डिव्हाइस निवडा',
  },
}

const wearableOptions = ['WatchOS', 'Fitbit', 'Garmin', 'Other']

const wearableIcons = {
  WatchOS: Watch,
  Fitbit: Activity,
  Garmin: Ruler,
  Other: Smartphone,
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { themeMode, toggleTheme, language, setLanguage, login } = useApp()
  const text = useMemo(() => copy[language] || copy.English, [language])
  const isDark = themeMode === 'dark'

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
  })
  const [device, setDevice] = useState('WatchOS')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function cycleLanguage() {
    const all = ['English', 'Hindi', 'Marathi']
    const index = all.indexOf(language)
    const next = all[(index + 1) % all.length]
    setLanguage(next)
  }

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password should be at least 6 characters')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const result = await registerUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender || undefined,
      height: form.height ? Number(form.height) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      device,
      mobile: form.phone,
    })
    setLoading(false)

    if (!result.success) {
      setError(result.message || 'Registration failed')
      return
    }

    const user = result.data?.user || { name: form.name || 'User', email: form.email }
    login(user)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-appBg px-4 pb-10 pt-6 dark:bg-appBgDark">
      <div className="pointer-events-none absolute left-[-86px] top-28 h-[150px] w-[150px] rounded-full bg-[#BFD8ED]" />
      <div className="pointer-events-none absolute bottom-[-88px] right-[-72px] h-[180px] w-[180px] rounded-full bg-[#D8EBE8]" />

      <div className="relative mx-auto max-w-[1140px]">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon size={30} />
            <p className="text-[32px] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">SwasthSetu</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="auth-top-icon" onClick={cycleLanguage} title={`Language: ${language}`}>
              <Globe size={15} />
            </button>
            <button className="auth-top-icon" onClick={toggleTheme} title="Toggle theme">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        <section className="mx-auto mt-8 w-full max-w-[360px]">
          <h1 className="text-[52px] font-extrabold leading-[0.98] tracking-[-0.05em] text-slate-900 dark:text-white">
            {text.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-appMuted dark:text-slate-400">
            {text.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="card mt-6 space-y-4 rounded-[20px] p-4">
            <FieldLabel label="Full Name">
              <IconInput
                icon={User}
                placeholder="John Doe"
                value={form.name}
                onChange={(value) => update('name', value)}
                required
              />
            </FieldLabel>

            <FieldLabel label="Email Address">
              <IconInput
                icon={Mail}
                placeholder="john.doe@example.com"
                type="email"
                value={form.email}
                onChange={(value) => update('email', value)}
                required
              />
            </FieldLabel>

            <FieldLabel label="Phone Number">
              <IconInput
                icon={Phone}
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(value) => update('phone', value)}
              />
            </FieldLabel>

            <FieldLabel label="Password">
              <PasswordInput
                value={form.password}
                onChange={(value) => update('password', value)}
                placeholder="Create a password"
                visible={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />
            </FieldLabel>

            <FieldLabel label="Confirm Password">
              <PasswordInput
                value={form.confirmPassword}
                onChange={(value) => update('confirmPassword', value)}
                placeholder="Confirm your password"
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
              />
            </FieldLabel>

            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Age">
                <IconInput
                  icon={User}
                  placeholder="25"
                  type="number"
                  value={form.age}
                  onChange={(value) => update('age', value)}
                />
              </FieldLabel>

              <FieldLabel label="Gender">
                <select
                  className="auth-input"
                  value={form.gender}
                  onChange={(event) => update('gender', event.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FieldLabel>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Height (cm)">
                <IconInput
                  icon={Ruler}
                  placeholder="175"
                  type="number"
                  value={form.height}
                  onChange={(value) => update('height', value)}
                />
              </FieldLabel>

              <FieldLabel label="Weight (kg)">
                <IconInput
                  icon={Scale}
                  placeholder="70"
                  type="number"
                  value={form.weight}
                  onChange={(value) => update('weight', value)}
                />
              </FieldLabel>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-700 dark:text-slate-100">
                <Watch size={14} className="text-brand" />
                {text.wearable}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {wearableOptions.map((option) => {
                  const Icon = wearableIcons[option]
                  const active = option === device
                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setDevice(option)}
                      className={`relative flex h-[100px] flex-col items-center justify-center rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? 'border-brand bg-brand/5 text-slate-800'
                          : 'border-appStroke bg-[#F8FAFB] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      <Icon size={20} className="mb-2" />
                      {option}
                      {active ? (
                        <CheckCircle2 className="absolute right-2 top-2 text-brand" size={16} />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>

            {error ? <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="relative h-12 w-full rounded-xl bg-brand text-base font-semibold text-slate-900 transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? '...' : text.submit}
              {!loading ? (
                <span className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900 text-white">
                  <CheckCircle2 size={13} />
                </span>
              ) : null}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-appMuted">
            {text.haveAccount}{' '}
            <Link to="/login" className="font-semibold text-brand">
              {text.login}
            </Link>
          </p>

          <p className="mx-auto mt-5 max-w-[340px] text-center text-xs text-appMuted">
            By creating an account, you agree to our{' '}
            <button type="button" className="font-semibold text-brand">
              Terms
            </button>{' '}
            and{' '}
            <button type="button" className="font-semibold text-brand">
              Privacy
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}

function FieldLabel({ label, children }) {
  return (
    <label className="block">
      <span className="auth-field-label">{label}</span>
      {children}
    </label>
  )
}

function IconInput({ icon: Icon, value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-appMuted" size={16} />
      <input
        className="auth-input pl-9"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
      />
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder, visible, onToggle }) {
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-appMuted" size={16} />
      <input
        className="auth-input pl-9 pr-10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-appMuted"
        onClick={onToggle}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
