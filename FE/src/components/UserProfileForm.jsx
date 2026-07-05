import { forwardRef, useImperativeHandle, useState } from 'react'
import { SectionHeading } from './SectionHeading'
import { mockCompanies } from '../data/mockCompanies'

// mockCompanies에 실제로 존재하는 산업/지역만 선택지로 노출한다.
// 하드코딩하면 데이터 담당(PRD 9.4)이 기업을 추가할 때마다 이 파일도 같이 고쳐야 해서
// 새로 추가된 산업·지역의 기업은 검색 폼에서 아예 선택할 수 없는 문제가 생긴다.
export const INDUSTRY_OPTIONS = [...new Set(mockCompanies.map((company) => company.industry))]

export const LOCATION_OPTIONS = ['부산 전체', ...new Set(mockCompanies.map((company) => company.location))]

const BENEFIT_OPTIONS = [
  '재택 근무 병행',
  '자율 출퇴근',
  '자기계발비 지원',
  '식대 지원',
  '통근버스 운영',
  '자유복장',
  '정시 퇴근',
  '연구수당',
]

const PRIORITY_OPTIONS = ['성장성', '안정성', '연봉', '워라밸', '직무적합성']

export const INITIAL_PROFILE = {
  industry: INDUSTRY_OPTIONS[0],
  jobRole: '',
  skills: '',
  location: LOCATION_OPTIONS[0],
  benefits: [],
  priority: '직무적합성',
  freeText: '',
}

const UserProfileForm = forwardRef(function UserProfileForm({ onSubmit, isLoading }, ref) {
  const [profile, setProfile] = useState(INITIAL_PROFILE)

  useImperativeHandle(ref, () => ({
    applyQuickValues(partial) {
      setProfile((prev) => ({ ...prev, ...partial }))
    },
  }))

  function updateField(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  function toggleBenefit(benefit) {
    setProfile((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter((item) => item !== benefit)
        : [...prev.benefits, benefit],
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(profile)
  }

  function fillDemoExample() {
    setProfile({
      industry: '핀테크',
      jobRole: '신입 개발자',
      skills: 'Java, Spring, AWS',
      location: '부산 사상구',
      benefits: ['재택 근무 병행', '자기계발비 지원'],
      priority: '직무적합성',
      freeText: '금융IT 분야에서 결제 시스템을 개발해보고 싶습니다.',
    })
  }

  return (
    <section id="profile-form" className="bg-white px-5 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="사용자 질의"
          title="나에게 맞는 기업, 조건을 입력해주세요"
          description="입력하신 정보는 embedding으로 변환되어 vector DB에서 유사한 기업을 검색하는 데 사용돼요."
        />

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-7 rounded-3xl border border-blue-100 bg-brand-bg/60 p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="관심 산업">
              <select
                value={profile.industry}
                onChange={(event) => updateField('industry', event.target.value)}
                className="form-input"
              >
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="근무 희망 지역">
              <select
                value={profile.location}
                onChange={(event) => updateField('location', event.target.value)}
                className="form-input"
              >
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="희망 직무">
              <input
                type="text"
                value={profile.jobRole}
                onChange={(event) => updateField('jobRole', event.target.value)}
                placeholder="예: 신입 개발자, 백엔드 개발자"
                className="form-input"
              />
            </Field>

            <Field label="보유 기술 스택">
              <input
                type="text"
                value={profile.skills}
                onChange={(event) => updateField('skills', event.target.value)}
                placeholder="예: Java, Spring, AWS"
                className="form-input"
              />
            </Field>
          </div>

          <Field label="선호 복지 (복수 선택 가능)">
            <div className="flex flex-wrap gap-2">
              {BENEFIT_OPTIONS.map((benefit) => {
                const active = profile.benefits.includes(benefit)
                return (
                  <button
                    type="button"
                    key={benefit}
                    onClick={() => toggleBenefit(benefit)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm ${
                      active
                        ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50 hover:text-brand-primary'
                    }`}
                  >
                    {benefit}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="중요하게 보는 기준">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PRIORITY_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                    profile.priority === option
                      ? 'border-brand-primary bg-blue-50 text-brand-primary'
                      : 'border-slate-200 text-slate-500 hover:border-brand-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={option}
                    checked={profile.priority === option}
                    onChange={(event) => updateField('priority', event.target.value)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </Field>

          <Field label="자유 입력란 (선택)">
            <textarea
              value={profile.freeText}
              onChange={(event) => updateField('freeText', event.target.value)}
              placeholder="예: 금융IT 분야에서 결제 시스템을 개발해보고 싶습니다."
              rows={3}
              className="form-input resize-none"
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={fillDemoExample}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-brand-primary/40 hover:text-brand-primary"
            >
              데모 예시 채우기
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:scale-105 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? '검색 중…' : '내 기업 추천받기'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
})

export default UserProfileForm

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-navy">{label}</span>
      {children}
    </label>
  )
}
