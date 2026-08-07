import type { GroupMember } from '../../types'

type MemberRowProps = {
  member: GroupMember
}

export function MemberRow({ member }: MemberRowProps) {
  return (
    <li className="flex flex-col gap-0.5 rounded-md border border-border bg-surface-2 px-3 py-2.5">
      <span className="text-[13px] font-medium text-fg">{member.fullName}</span>
      {member.legajo ? (
        <span className="text-xs tabular-nums text-fg-faint">
          Legajo {member.legajo}
        </span>
      ) : null}
      {member.email ? (
        <a
          className="break-all text-xs text-accent no-underline hover:underline"
          href={`mailto:${member.email}`}
        >
          {member.email}
        </a>
      ) : (
        <span className="text-xs text-fg-faint">Sin mail</span>
      )}
    </li>
  )
}
