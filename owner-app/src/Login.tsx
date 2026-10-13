import { useState, type FormEvent } from 'react'
import { login } from './api'
import { setToken } from './auth'

export default function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!loginId || !password) return
    setBusy(true)
    setError('')
    try {
      const r = await login(loginId.trim(), password)
      setToken(r.accessToken)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1 className="login-title">쉬마 <span className="sub">사장님</span></h1>
        <label className="login-label">
          아이디
          <input className="login-input" value={loginId} autoComplete="username"
                 onChange={(e) => setLoginId(e.target.value)} autoFocus />
        </label>
        <label className="login-label">
          비밀번호
          <input className="login-input" type="password" value={password} autoComplete="current-password"
                 onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="login-btn" disabled={busy || !loginId || !password}>
          {busy ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </main>
  )
}
