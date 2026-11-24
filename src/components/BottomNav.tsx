import { NavLink, useLocation } from 'react-router-dom'
import { tabs } from '../config/tabs'

export default function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => {
        const Icon = t.icon
        return (
          <NavLink key={t.to} to={t.to} className={t.match(pathname) ? 'tab active' : 'tab'}>
            <Icon size={22} />
            <span>{t.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
