/** 대시보드 카드 — SNS 글 대신 쓰기 바로 가기 */
export default function WriteCard({ easy }: { easy: boolean }) {
  return (
    <section className="card">
      <h2 className="card-title">{easy ? '인스타·블로그 글, 대신 써 드려요' : 'SNS 글 대신 쓰기'}</h2>
      <p className="muted">버튼 두 번이면 바로 올릴 수 있는 글이 완성돼요.</p>
      <div className="write-choice">
        <a className="action-btn link-btn" href="#/write?ch=instagram">인스타그램 글</a>
        <a className="action-btn link-btn" href="#/write?ch=blog">블로그 글</a>
      </div>
    </section>
  )
}
