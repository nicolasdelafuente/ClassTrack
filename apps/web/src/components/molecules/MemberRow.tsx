import type { GroupMember } from '../../types'
import { Avatar } from '../atoms/Avatar'

type MemberRowProps = {
  member: GroupMember
}

export function MemberRow({ member }: MemberRowProps) {
  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-[background-color,transform] duration-200 ease-out hover:bg-surface-interactive motion-safe:hover:translate-x-0.5">
      <Avatar
        name={member.fullName}
        size="sm"
        className="motion-safe:group-hover:scale-105"
      />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-fg">
          {member.fullName}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-fg-faint">
          {member.legajo ? `Legajo ${member.legajo}` : 'Sin legajo'}
          {member.email ? ` · ${member.email}` : ''}
        </span>
      </div>
      {member.email ? (
        <a
          className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold text-accent opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100 motion-safe:group-hover:translate-x-0.5"
          href={`mailto:${member.email}`}
        >
          Mail →
        </a>
      ) : null}
    </li>
  )
}
