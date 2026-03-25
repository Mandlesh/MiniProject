import { useEffect, useMemo, useRef, useState } from 'react'
import MainLayout from '../components/MainLayout'
import { analyzeFoodImage } from '../services/api'

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function FoodScannerPage() {
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [nutritionData, setNutritionData] = useState(null)
  const [error, setError] = useState('')

  const identified = nutritionData?.identified === true
  const healthScore = toNumber(nutritionData?.healthScore, 5)
  const healthScoreColor = useMemo(() => {
    if (healthScore >= 8) return 'text-emerald-500'
    if (healthScore >= 6) return 'text-brand'
    if (healthScore >= 4) return 'text-amber-500'
    return 'text-red-500'
  }, [healthScore])

  const healthScoreLabel = useMemo(() => {
    if (healthScore >= 8) return 'Excellent Choice!'
    if (healthScore >= 6) return 'Good Choice'
    if (healthScore >= 4) return 'Moderate'
    return 'Consider Healthier Options'
  }, [healthScore])

  useEffect(
    () => () => {
      if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl)
    },
    [selectedImageUrl],
  )

  async function onPickFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setSelectedImageUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
    setNutritionData(null)
    setError('')

    await analyzeSelectedFile(file)
  }

  async function analyzeSelectedFile(file) {
    setIsAnalyzing(true)
    setError('')

    try {
      const imageBase64 = await toBase64(file)
      const result = await analyzeFoodImage(imageBase64)
      if (result.success) {
        setNutritionData(result.data)
      } else {
        setError(result.message || 'Failed to analyze image')
      }
    } catch (cause) {
      setError(`Error analyzing image: ${cause?.message || String(cause)}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  function resetScanner() {
    if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl)
    setSelectedImageUrl('')
    setNutritionData(null)
    setError('')
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  return (
    <MainLayout title="Food Scanner" back headerMode="back" showBottomNav={false}>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPickFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickFile}
      />

      <section className="mt-4 h-[280px] overflow-hidden rounded-3xl bg-white shadow-card dark:bg-slate-800">
        {selectedImageUrl ? (
          <div className="relative h-full w-full">
            <img src={selectedImageUrl} alt="Selected food" className="h-full w-full object-cover" />
            {isAnalyzing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/10 text-4xl text-brand">🍽️</div>
            <p className="mt-4 text-xl font-bold">Scan Your Food</p>
            <p className="mt-2 text-sm text-slate-500">Take a photo or choose from gallery to get instant calorie information</p>
          </div>
        )}
      </section>

      {!selectedImageUrl ? (
        <>
          <button
            className="mt-4 w-full rounded-2xl bg-brand py-4 text-base font-bold text-white"
            onClick={() => cameraInputRef.current?.click()}
          >
            📷 Take Photo
          </button>
          <button
            className="mt-3 w-full rounded-2xl bg-indigo-500 py-4 text-base font-bold text-white"
            onClick={() => galleryInputRef.current?.click()}
          >
            🖼️ Choose from Gallery
          </button>
        </>
      ) : null}

      {isAnalyzing ? (
        <section className="card mt-5 p-6 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-base font-semibold">Analyzing your food...</p>
          <p className="mt-2 text-sm text-slate-500">AI is identifying food items and calculating nutrition</p>
        </section>
      ) : null}

      {error ? (
        <section className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20">
          {error}
        </section>
      ) : null}

      {nutritionData && !isAnalyzing ? (
        <section className="mt-4 space-y-4">
          {!identified ? (
            <div className="card p-6 text-center">
              <p className="text-4xl">❓</p>
              <p className="mt-3 text-lg font-bold">Could Not Identify Food</p>
              <p className="mt-2 text-sm text-slate-500">
                {nutritionData?.error || 'Please try with a clearer image of the food'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-3xl bg-gradient-to-br from-brand to-emerald-700 p-6 text-center text-white shadow-card">
                <p className="text-sm text-white/80">Total Calories</p>
                <p className="mt-1 text-6xl font-extrabold">{toNumber(nutritionData.totalCalories)}</p>
                <p className="text-sm text-white/80">kcal</p>
                <span className="mt-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {String(nutritionData.mealType || 'meal').replace(/^./, (letter) => letter.toUpperCase())}
                </span>
              </div>

              <div className="card p-5">
                <p className="text-sm font-bold">Macronutrients</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <MacroCard label="Protein" value={`${toNumber(nutritionData.totalProtein)}g`} icon="💪" tone="text-indigo-500" />
                  <MacroCard label="Carbs" value={`${toNumber(nutritionData.totalCarbs)}g`} icon="🌾" tone="text-amber-500" />
                  <MacroCard label="Fat" value={`${toNumber(nutritionData.totalFat)}g`} icon="💧" tone="text-red-500" />
                </div>
              </div>

              {Array.isArray(nutritionData.foodItems) && nutritionData.foodItems.length > 0 ? (
                <div className="card p-5">
                  <p className="text-sm font-bold">Identified Items</p>
                  <div className="mt-3 space-y-3">
                    {nutritionData.foodItems.map((item, index) => (
                      <div key={`${item?.name || 'item'}-${index}`} className="flex items-center gap-3">
                        <span className="text-lg">🍴</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{item?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{item?.portion || ''}</p>
                        </div>
                        <span className="text-sm font-semibold">{toNumber(item?.calories)} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-700">
                    {healthScore}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Health Score</p>
                    <p className={`text-base font-bold ${healthScoreColor}`}>{healthScoreLabel}</p>
                  </div>
                </div>
              </div>

              {nutritionData.healthTip ? (
                <div className="rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm">
                  <p className="font-semibold">💡 Health Tip</p>
                  <p className="mt-1">{nutritionData.healthTip}</p>
                </div>
              ) : null}

              {Array.isArray(nutritionData.warnings) && nutritionData.warnings.length > 0 ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/20">
                  <p className="text-sm font-semibold">⚠ Dietary Notes</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {nutritionData.warnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>• {String(warning)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {selectedImageUrl && !isAnalyzing ? (
        <button className="mt-4 w-full rounded-2xl bg-brand py-4 text-base font-bold text-white" onClick={resetScanner}>
          🔄 Scan Another Food
        </button>
      ) : null}
    </MainLayout>
  )
}

function MacroCard({ label, value, icon, tone }) {
  return (
    <div>
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-700 ${tone}`}>
        {icon}
      </div>
      <p className="mt-2 text-base font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
