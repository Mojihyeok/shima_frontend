import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import '../ds/ds.css'
import './flow.css'
import { Bubble, Button, EvidenceChip, ProgressBar, StatCard, TextSizeBar } from '../ds/components'
import { cachedTextSize, saveTextSize, type TextSize } from '../ds/textSize'
import checkDone from './assets/check-done.svg'
import checkDoing from './assets/check-doing.svg'
import checkTodo from './assets/check-todo.svg'

// 사장님 흐름 (Figma "01 사장님 흐름") — 화면 하나 = 해시 하나 (#/flow/o1 …), 데이터는 목업
// 원칙: 사장님이 "올려주세요"를 누르기 전에는 아무것도 밖으로 나가지 않는다
type Step = 'o1' | 'o2a' | 'o2b' | 'o3' | 'o4' | 'o5' | 'o6' | 'o7'
const STEPS: Step[] = ['o1', 'o2a', 'o2b', 'o3', 'o4', 'o5', 'o6', 'o7']

function stepFromRoute(route: string): Step {
  const s = route.replace(/^#\/flow\/?/, '')
  return (STEPS as string[]).includes(s) ? (s as Step) : 'o1'
}

function go(step: Step) {
  window.location.hash = `#/flow/${step}`
  window.scrollTo(0, 0)
}

interface Store { name: string; area: string }

/** 받침 유무로 목적격 조사 — "카페 아로를" / "카페 아로새김을" */
function objectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xAC00
  if (code < 0 || code > 11171) return '를'
  return code % 28 === 0 ? '를' : '을'
}

const STORES: Store[] = [
  { name: '카페 아로', area: '수원시 영통구 · 카페' },
  { name: '카페 아로새김', area: '수원시 팔달구 · 카페' },
  { name: '아로새길 분식', area: '수원시 영통구 · 분식' },
]

const CHANNELS = ['인스타그램', '스레드'] as const
type Channel = typeof CHANNELS[number]

const ORIGINAL_COPY = '손님들이 가장 많이 찾은 크로플, 오늘도 바삭하게 구웠어요. 조용히 쉬어가기 좋은 창가 자리도 비워둘게요.'

const REWRITES = [
  { label: '더 짧게', text: '바삭한 크로플, 오늘도 구웠어요. 창가 자리에서 쉬어가세요.' },
  { label: '더 다정하게', text: '오늘도 손님들이 좋아해주신 크로플을 바삭하게 구웠어요. 창가 자리 비워두고 기다릴게요, 편하게 쉬다 가세요.' },
  { label: '가격 넣기', text: '손님들이 가장 많이 찾은 크로플(4,500원), 오늘도 바삭하게 구웠어요. 조용히 쉬어가기 좋은 창가 자리도 비워둘게요.' },
  { label: '해시태그 빼기', text: ORIGINAL_COPY },
] as const

export default function OwnerFlow({ route }: { route: string }) {
  const step = stepFromRoute(route)
  const [textSize, setTextSize] = useState<TextSize>(cachedTextSize())
  const [store, setStore] = useState<Store>(STORES[0])
  const [channel, setChannel] = useState<Channel>('인스타그램')
  const [copy, setCopy] = useState(ORIGINAL_COPY)

  const chooseSize = (s: TextSize) => { setTextSize(s); saveTextSize(s) }

  return (
    <div className="ds flow" data-text-size={textSize}>
      {step === 'o1' && <O1 textSize={textSize} onTextSize={chooseSize} />}
      {step === 'o2a' && <O2A store={store} onStore={setStore} />}
      {step === 'o2b' && <O2B />}
      {step === 'o3' && <O3 store={store} />}
      {step === 'o4' && <O4 store={store} />}
      {step === 'o5' && <O5 channel={channel} onChannel={setChannel} onFresh={() => setCopy(ORIGINAL_COPY)} />}
      {step === 'o6' && <O6 copy={copy} onCopy={setCopy} />}
      {step === 'o7' && <O7 channel={channel} />}
    </div>
  )
}

/** O1 시작 — 글씨 크기를 먼저 고르고, 가게 찾는 방법 두 가지 중 하나 */
function O1({ textSize, onTextSize }: { textSize: TextSize; onTextSize: (s: TextSize) => void }) {
  return (
    <main className="flow-screen">
      <TextSizeBar value={textSize} onChange={onTextSize} label="글씨 크기 (오른쪽으로 밀면 커져요)" />
      <Bubble>사장님, 안녕하세요. 쉬마예요.<br />먼저 사장님 가게를 찾아볼게요. 어떻게 찾을까요?</Bubble>
      <div className="flow-spacer" />
      <p className="flow-foot">아주대 앞 아로새길 상인회와 함께해요</p>
      <div className="flow-buttons">
        <Button onClick={() => go('o2b')}>영수증 사진으로 찾기</Button>
        <Button variant="secondary" onClick={() => go('o2a')}>가게 이름으로 찾기</Button>
      </div>
    </main>
  )
}

/** O2-A 가게 이름으로 찾기 — 상호명으로 후보를 보여주고 "우리 가게 맞아요"만 누른다 */
function O2A({ store, onStore }: { store: Store; onStore: (s: Store) => void }) {
  const [query, setQuery] = useState('카페 아로')
  const q = query.trim()
  const results = q ? STORES.filter((s) => s.name.includes(q) || q.includes(s.name)).slice(0, 2) : []
  const selected = results.find((s) => s.name === store.name)

  return (
    <main className="flow-screen">
      <Bubble>가게 이름을 알려주세요.</Bubble>
      <input
        className="flow-input" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="예: 카페 아로" aria-label="가게 이름" enterKeyHint="search"
      />
      {results.length > 0 ? (
        <>
          <p className="flow-label">이런 가게를 찾았어요</p>
          <div className="flow-options">
            {results.map((s) => (
              <button key={s.name} type="button" className="flow-option" aria-pressed={s.name === selected?.name} onClick={() => onStore(s)}>
                <span className="flow-option-name">{s.name}</span>
                <span className="flow-option-sub">{s.area}</span>
              </button>
            ))}
          </div>
        </>
      ) : q && <p className="flow-label">찾는 가게가 없어요. 영수증 사진으로 찾아볼까요?</p>}
      <div className="flow-spacer" />
      <div className="flow-buttons">
        <Button disabled={!selected} onClick={() => go('o3')}>우리 가게 맞아요</Button>
        <Button variant="secondary" onClick={() => go('o2b')}>목록에 없어요</Button>
      </div>
    </main>
  )
}

/** O2-B 영수증 사진으로 찾기 — 휴대폰에서는 "찍기"가 카메라를 연다 */
function O2B() {
  const camera = useRef<HTMLInputElement>(null)
  const album = useRef<HTMLInputElement>(null)
  const onPick = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) go('o3') }
  return (
    <main className="flow-screen">
      <Bubble>영수증을 네모 안에 맞춰 찍어주세요. 가게 이름과 주소가 보이면 돼요.</Bubble>
      <div className="flow-camera" aria-hidden>
        <div className="flow-camera-guide">영수증을<br />여기에</div>
      </div>
      <div className="flow-spacer" />
      <div className="flow-buttons">
        <Button onClick={() => camera.current?.click()}>찍기</Button>
        <Button variant="secondary" onClick={() => album.current?.click()}>앨범에서 고르기</Button>
      </div>
      <input ref={camera} className="flow-file" type="file" accept="image/*" capture="environment" onChange={onPick} tabIndex={-1} />
      <input ref={album} className="flow-file" type="file" accept="image/*" onChange={onPick} tabIndex={-1} />
    </main>
  )
}

const CHECKS = [
  { until: 25, todo: '가게 정보 확인', doing: '가게 정보 확인 중', done: '가게 정보 확인했어요' },
  { until: 62, todo: '네이버 리뷰 읽기', doing: '네이버 리뷰 읽는 중', done: '네이버 리뷰 다 읽었어요' },
  { until: 85, todo: '"아주대 카페" 검색 순위 확인', doing: '"아주대 카페" 검색 순위 확인 중', done: '검색 순위 확인했어요' },
  { until: 100, todo: '인스타그램 둘러보기', doing: '인스타그램 둘러보는 중', done: '인스타그램 둘러봤어요' },
]
const CHECK_ICON = { done: checkDone, doing: checkDoing, todo: checkTodo }

/** O3 분석 중 — 기다리는 시간을 "쉬마가 일하는 시간"으로. 다 되면 첫 진단으로 */
function O3({ store }: { store: Store }) {
  const [pct, setPct] = useState(0)

  // 목업: 실제 분석 대신 약 6초 동안 진행
  useEffect(() => {
    if (pct >= 100) {
      const t = setTimeout(() => go('o4'), 700)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 2)), 120)
    return () => clearTimeout(t)
  }, [pct])

  const current = CHECKS.findIndex((c) => pct < c.until)
  const state = (i: number) => (current === -1 || i < current ? 'done' : i === current ? 'doing' : 'todo')
  const doing = current === -1 ? '다 됐어요' : CHECKS[current].doing

  return (
    <main className="flow-screen">
      <h1 className="flow-title">쉬마가 {store.name}{objectParticle(store.name)}<br />살펴보고 있어요</h1>
      <ol className="flow-checklist">
        {CHECKS.map((c, i) => {
          const s = state(i)
          return (
            <li key={c.todo} className={`flow-check ${s}`}>
              <img src={CHECK_ICON[s]} width={22} height={22} alt="" />
              {c[s]}
            </li>
          )
        })}
      </ol>
      <div className="flow-spacer" />
      <Bubble>보통 1분쯤 걸려요. 화면을 닫아도 다 되면 알려드릴게요.</Bubble>
      <ProgressBar value={pct} label={doing} />
    </main>
  )
}

/** O4 첫 진단 — 숫자 카드 4개 + 손님들이 하는 말. 모든 말에 근거 칩 */
function O4({ store }: { store: Store }) {
  return (
    <main className="flow-screen tight">
      <h1 className="flow-title sm">{store.name}, 지금 이렇게 보여요</h1>
      <div className="flow-cards">
        <StatCard label="네이버 별점" value="4.6" sub="리뷰 128개" />
        <StatCard label={'"아주대 카페" 검색'} value="7위" sub="지난주 9위" />
        <StatCard label="최근 한 달 리뷰" value="14개" sub="지난달보다 +3" />
        <StatCard label="인스타 게시글" value="2개" sub="이번 달" />
      </div>
      <Bubble>손님들은 크로플과 조용한 분위기를 가장 많이 칭찬해요. 아쉬운 점은 "주차"예요.</Bubble>
      <div><EvidenceChip>리뷰 23개에서 나온 말이에요</EvidenceChip></div>
      <div className="flow-spacer" />
      <Button onClick={() => go('o5')}>그럼 뭘 하면 좋을까요?</Button>
    </main>
  )
}

/** O5 바로 제안 — 채널과 추천 문구를 확인하고 "올려주세요"를 눌러야만 다음으로 */
function O5({ channel, onChannel, onFresh }: { channel: Channel; onChannel: (c: Channel) => void; onFresh: () => void }) {
  return (
    <main className="flow-screen tight">
      <Bubble>손님들이 칭찬한 크로플로 오늘 글을 올려볼까요?</Bubble>
      <div className="flow-pills" role="group" aria-label="올릴 곳">
        {CHANNELS.map((c) => (
          <button key={c} type="button" className="flow-pill" aria-pressed={c === channel} onClick={() => onChannel(c)}>{c}</button>
        ))}
      </div>
      <div className="flow-box">
        <p className="flow-caption">추천 문구</p>
        <p className="flow-copy">{ORIGINAL_COPY}</p>
        <EvidenceChip>리뷰 23개 · 메뉴판 사진에서</EvidenceChip>
      </div>
      <div className="flow-spacer" />
      <div className="flow-buttons">
        <Button onClick={() => { onFresh(); go('o7') }}>이대로 올려주세요</Button>
        <Button variant="secondary" onClick={() => { onFresh(); go('o6') }}>문구 고칠래요</Button>
        <Button variant="secondary" onClick={() => go('o1')}>다음에 할게요</Button>
      </div>
    </main>
  )
}

/** O6 문구 고치기 — 타이핑 대신 버튼으로. 직접 고치려면 글자를 누른다 */
function O6({ copy, onCopy }: { copy: string; onCopy: (t: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  const pick = (r: typeof REWRITES[number]) => { setPicked(r.label); onCopy(r.text) }

  return (
    <main className="flow-screen tight">
      <Bubble>어떻게 바꿔드릴까요?</Bubble>
      <div className="flow-pills" role="group" aria-label="고치는 방법">
        {REWRITES.map((r) => (
          <button key={r.label} type="button" className="flow-pill" aria-pressed={r.label === picked} onClick={() => pick(r)}>{r.label}</button>
        ))}
      </div>
      <div className="flow-box edited">
        <label className="flow-caption" htmlFor="flow-edit">{picked ? '고친 문구' : '지금 문구'}</label>
        <textarea id="flow-edit" className="flow-edit" value={copy} onChange={(e) => onCopy(e.target.value)} />
        <p className="flow-hint">직접 고치려면 글자를 눌러주세요</p>
      </div>
      <div className="flow-spacer" />
      <div className="flow-buttons">
        <Button disabled={!copy.trim()} onClick={() => go('o7')}>이걸로 올려주세요</Button>
        <Button variant="secondary" onClick={() => { setPicked(null); onCopy(ORIGINAL_COPY); go('o5') }}>처음 문구로 돌아가기</Button>
      </div>
    </main>
  )
}

/** O7 올렸어요 — 결과를 다시 말로 알려준다는 예고 */
function O7({ channel }: { channel: Channel }) {
  return (
    <main className="flow-screen">
      <div className="flow-done">완료</div>
      <h1 className="flow-title">{channel}에 올렸어요</h1>
      <Bubble>일주일 뒤에 "아주대 카페" 검색 순위가 어떻게 바뀌었는지 알려드릴게요.</Bubble>
      <div className="flow-box report">
        <p className="flow-caption">다음 주 리포트에서 볼 것</p>
        <p className="flow-report-main">{'"아주대 카페" 검색  7위 → ?'}</p>
        <p className="flow-report-sub">이 글을 보고 온 손님 수 (쿠폰으로 확인)</p>
      </div>
      <div className="flow-spacer" />
      <Button onClick={() => go('o1')}>홈으로</Button>
    </main>
  )
}
