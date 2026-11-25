/**
 * 新しい版が出たら、開き直さなくても、自動で取り込む。
 *
 * これまでは、新しい版は裏で取得されても、画面に反映されるのは「アプリを閉じて開き直した次」で、1 回では変わらないことがあった。
 * ここでは、(1) 開いている間も、一定間隔と、画面に戻ったときに、新しい版がないかを確かめ、
 * (2) 新しい Service Worker が引き継いだら、1 回だけ再読み込みする。
 * autoUpdate の Service Worker は skipWaiting と clientsClaim が有効なので、取得できればすぐに引き継ぐ。
 */
const CHECK_EVERY_MS = 5 * 60 * 1000
const RELOADED_AT = 'genkan.pwa.reloadedAt'

export function watchForNewVersion() {
  if (!('serviceWorker' in navigator)) return
  // 最初のインストールでも controllerchange は起きる。「前から動いていた版がある」ときだけ、更新とみなす。
  const hadController = !!navigator.serviceWorker.controller
  let reloading = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    // 万一の再読み込みの繰り返しを避ける(直近 30 秒以内に再読み込みしたなら、しない)
    try {
      const last = Number(sessionStorage.getItem(RELOADED_AT) ?? 0)
      if (Date.now() - last < 30_000) return
      sessionStorage.setItem(RELOADED_AT, String(Date.now()))
    } catch { /* sessionStorage が使えなくても、再読み込みは 1 回だけ */ }
    reloading = true
    window.location.reload()
  })

  const check = () => navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => {})
  setInterval(check, CHECK_EVERY_MS)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
}
