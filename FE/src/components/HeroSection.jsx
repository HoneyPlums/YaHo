import { useState } from 'react'
import floatingPerson2Img from '../assets/floating-person-2.png'
import floatingPerson3Img from '../assets/floating-person-3.png'

const EXAMPLE_QUERY =
  '나는 동아대 AI학과 학점은 3.7, 1순위로 워라밸을 원하고 2순위로 연봉이야. 나에게 맞는 기업들을 찾아줘'

const POPULAR_KEYWORDS = [
  { label: '#신입환영', phrase: '신입 개발자를 채용하는 곳' },
  { label: '#IT', phrase: 'IT·데이터 업종' },
  { label: '#핀테크', phrase: '핀테크 업종' },
  { label: '#부산', phrase: '부산 지역' },
  { label: '#워라밸', phrase: '워라밸을 중요하게 생각해' },
  { label: '#복지좋은기업', phrase: '복지가 좋은 기업' },
]

export default function HeroSection({ onQuickSearch, isLoading }) {
  const [query, setQuery] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onQuickSearch({ freeText: query })
  }

  function handleKeywordClick(keyword) {
    setQuery((prev) => (prev ? `${prev} ${keyword.phrase}` : keyword.phrase))
  }

  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-20 h-80 w-80 rounded-full bg-brand-primary/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-5 py-20 md:py-28">
        {/* 상단: 중앙 정렬 카피 */}
        <div className="mx-auto flex animate-slide-up flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-brand-primary shadow-sm">
            청년의 성장, 기업의 내일을{' '}
            <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
              연결합니다
            </span>
          </span>

          <div className="relative">
            <h1 className="mt-5 text-3xl font-bold leading-tight text-brand-navy sm:text-4xl md:text-5xl">
              나에게 딱 맞는
              <br />
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                기업을 추천받아보세요
              </span>
            </h1>

            {/* 둥둥 떠 있는 캐릭터 두 명: 제목 11시/1시 방향 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 hidden w-32 sm:block lg:w-40"
              style={{ left: '-170px' }}
            >
              <img src={floatingPerson3Img} alt="" className="w-full animate-float" />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 hidden w-32 sm:block lg:w-40"
              style={{ left: 'calc(100% + 30px)' }}
            >
              <img src={floatingPerson2Img} alt="" className="w-full animate-float" style={{ animationDelay: '1.1s' }} />
            </div>
          </div>

          <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
            AI가 당신의 관심사와 역량을 분석해 최적의 기업을 찾아드려요.
          </p>

          <div className="mt-9">
            <a
              href="#quick-search"
              className="rounded-full bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:scale-105 hover:bg-blue-700"
            >
              내 기업 추천받기
            </a>
          </div>
        </div>

        {/* 하단: 가로로 긴 퀵서치 바 */}
        <form
          id="quick-search"
          onSubmit={handleSubmit}
          className="mt-12 animate-slide-up scroll-mt-24 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-lg shadow-blue-100/60 backdrop-blur-sm sm:p-5"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <QuickField label="어떤 기업을 찾고 있나요? 자유롭게 설명해주세요">
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={EXAMPLE_QUERY}
                rows={2}
                className="quick-input min-w-0 resize-none"
              />
            </QuickField>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-transform hover:scale-[1.02] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 lg:h-[46px] lg:shrink-0"
            >
              <span aria-hidden>✨</span>
              {isLoading ? '검색 중…' : '물어보기'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
            <span className="text-xs font-medium text-slate-400">이런 식으로 물어보세요</span>
            {POPULAR_KEYWORDS.map((keyword) => (
              <button
                key={keyword.label}
                type="button"
                onClick={() => handleKeywordClick(keyword)}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
              >
                {keyword.label}
              </button>
            ))}
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500 sm:text-sm">
          500+ BEPA 청끌기업 · Top 5 맞춤 추천 · 근거 기반 AI 설명
        </p>
      </div>
    </section>
  )
}

function QuickField({ label, children }) {
  return (
    <label className="flex flex-1 min-w-0 flex-col text-left">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}
