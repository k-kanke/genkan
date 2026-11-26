import { useEffect, useState } from 'react'
import { subscribe, type Topic } from './api'

/** 初回取得 + 購読トピックが更新されるたびに再取得する */
export function useLive<T>(fetcher: () => Promise<T>, topics: Topic[]): T | undefined {
  const [data, setData] = useState<T>()
  const key = topics.join(',')
  useEffect(() => {
    let alive = true
    const load = () => fetcher().then((v) => alive && setData(v))
    load()
    const offs = topics.map((t) => subscribe(t, load))
    return () => {
      alive = false
      offs.forEach((o) => o())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return data
}

export const fmtMinutes = (s: number) => `${Math.floor(s / 60)} min`
export const fmtClock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
