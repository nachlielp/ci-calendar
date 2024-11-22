import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import BioCard from "./BioCard"

const BioSelfPreview = () => {
    return <BioCard teacher={store.getBio} />
}

export default observer(BioSelfPreview)
