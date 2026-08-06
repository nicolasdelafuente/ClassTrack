import type { GroupMember } from '../types'

type MembersListProps = {
  members: GroupMember[]
}

export function MembersList({ members }: MembersListProps) {
  if (members.length === 0) {
    return <p className="empty-note">Sin integrantes cargados.</p>
  }

  return (
    <ul className="members">
      {members.map((member) => (
        <li key={member.id} className="members__item">
          <div className="members__main">
            <span className="members__name">{member.fullName}</span>
            {member.legajo ? (
              <span className="members__legajo">Legajo {member.legajo}</span>
            ) : null}
          </div>
          {member.email ? (
            <a className="members__mail" href={`mailto:${member.email}`}>
              {member.email}
            </a>
          ) : (
            <span className="members__mail members__mail--empty">Sin mail</span>
          )}
        </li>
      ))}
    </ul>
  )
}
