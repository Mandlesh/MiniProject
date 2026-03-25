import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Globe, Lock, Mail, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { loginUser } from '../services/api'
import LogoIcon from '../components/LogoIcon'

const copy = {
  English: {
    title: 'Welcome Back',
    subtitle: 'Your health journey continues here. Log in to view your latest analytics.',
    email: 'Email or Phone',
    password: 'Password',
    submit: 'Log In',
    noAccount: "Don't have an account?",
    register: 'Register',
    secure: 'Secure Health Access',
  },
  Hindi: {
    title: 'वापस स्वागत है',
    subtitle: 'आपकी स्वास्थ्य यात्रा यहाँ जारी है। अपने नवीनतम विश्लेषण देखने के लिए लॉग इन करें।',
    email: 'ईमेल या फोन',
    password: 'पासवर्ड',
    submit: 'लॉग इन करें',
    noAccount: 'खाता नहीं है?',
    register: 'रजिस्टर करें',
    secure: 'सुरक्षित स्वास्थ्य पहुँच',
  },
  Marathi: {
    title: 'परत स्वागत आहे',
    subtitle: 'तुमचा आरोग्य प्रवास येथे सुरू आहे. तुमचे नवीनतम विश्लेषण पाहण्यासाठी लॉग इन करा.',
    email: 'ईमेल किंवा फोन',
    password: 'पासवर्ड',
    submit: 'लॉग इन करा',
    noAccount: 'खाते नाही?',
    register: 'नोंदणी करा',
    secure: 'सुरक्षित आरोग्य प्रवेश',
  },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { themeMode, toggleTheme, language, setLanguage, login } = useApp()
  const text = useMemo(() => copy[language] || copy.English, [language])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDark = themeMode === 'dark'

  function cycleLanguage() {
    const all = ['English', 'Hindi', 'Marathi']
    const index = all.indexOf(language)
    const next = all[(index + 1) % all.length]
    setLanguage(next)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const result = await loginUser({ email: email.trim(), password })
    setLoading(false)

    if (!result.success) {
      setError(result.message || 'Invalid credentials')
      return
    }

    const name = result.data?.user?.name || 'User'
    login(name)
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

        <section className="mx-auto mt-12 w-full max-w-[360px]">
          <div className="rounded-[20px] bg-gradient-to-r from-[#755E86] via-[#916D96] to-[#B57F9F] px-4 py-7 text-center shadow-soft">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-brand">
              <ShieldCheck size={14} />
              {text.secure}
            </span>
          </div>

          <h1 className="mt-7 text-center text-[52px] font-extrabold leading-[0.98] tracking-[-0.05em] text-slate-900 dark:text-white">
            {text.title}
          </h1>
          <p className="mx-auto mt-3 max-w-[325px] text-center text-sm leading-6 text-appMuted dark:text-slate-400">
            {text.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="card mt-6 space-y-4 rounded-[20px] p-4">
            <label className="block">
              <span className="auth-field-label">{text.email}</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-appMuted" size={16} />
                <input
                  className="auth-input pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="auth-field-label">{text.password}</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-appMuted" size={16} />
                <input
                  className="auth-input pl-9 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-appMuted"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error ? <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="relative h-12 w-full rounded-xl bg-brand text-base font-semibold text-slate-900 transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? '...' : text.submit}
              {!loading ? (
                <span className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900 text-white">
                  <ArrowRight size={13} />
                </span>
              ) : null}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-appMuted">
            {text.noAccount}{' '}
            <Link to="/register" className="font-semibold text-brand">
              {text.register}
            </Link>
          </p>

          <p className="mx-auto mt-5 max-w-[340px] text-center text-xs text-appMuted">
            By continuing, you agree to our{' '}
            <button type="button" className="font-semibold text-brand">
              Terms of Service
            </button>{' '}
            and{' '}
            <button type="button" className="font-semibold text-brand">
              Privacy Policy
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}
