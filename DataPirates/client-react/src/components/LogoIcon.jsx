import { Check } from 'lucide-react'

export default function LogoIcon({ size = 72 }) {
  return (
    <div
      className="relative rounded-full border border-appStroke bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 m-auto flex items-center justify-center rounded-full bg-brand/15 text-brand"
        style={{ width: size * 0.56, height: size * 0.56 }}
      >
        <Check size={size * 0.28} strokeWidth={3} />
      </div>
    </div>
  )
}
