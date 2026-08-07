import type { GroupMember } from '../../types'
import { MemberRow } from '../molecules/MemberRow'
import { Text } from '../atoms/Text'

type MembersListProps = {
  members: GroupMember[]
}

export function MembersList({ members }: MembersListProps) {
  if (members.length === 0) {
    return <Text>Sin integrantes cargados.</Text>
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {members.map((member) => (
        <MemberRow key={member.id} member={member} />
      ))}
    </ul>
  )
}
