import { useUser } from "../../../context/UserContext"
import BioCard from "./BioCard"

export default function BioSelfPreview() {
    const { user } = useUser()
    if (!user) throw new Error("BioCard: No user found")

    return <BioCard teacher={user.bio} />
}
