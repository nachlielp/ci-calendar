import { makeAutoObservable, reaction, observable, action } from "mobx"
import { computed } from "mobx"
import { store } from "../../Store/store"
import { CIRequest, RequestStatus, RequestType } from "../../util/interfaces"
import { UpdateRequest } from "../../supabase/requestsService"
import dayjs from "dayjs"

class UserRequestVM {
    @observable isEditRequest = false
    @observable isSubmitting = false
    @observable openPositionRequest: CIRequest | null = null
    @observable requestType: RequestType | null = null

    constructor() {
        makeAutoObservable(this)

        reaction(
            () => store.getOpenPositionRequests,
            () => {
                this.isEditRequest = false
                this.openPositionRequest = store.getOpenPositionRequests ?? null
            }
        )
    }

    @computed get getRequestType() {
        return this.openPositionRequest?.type ?? this.requestType
    }

    @computed get getDescription() {
        return this.openPositionRequest?.message ?? null
    }

    @computed get getPhone() {
        return this.openPositionRequest?.phone
            ? parseInt(this.openPositionRequest.phone)
            : null
    }

    @computed get getIsEditRequest() {
        return this.isEditRequest
    }

    @computed get getOpenPositionRequest() {
        return this.openPositionRequest
    }

    @computed get isOpenPositionRequest() {
        return this.openPositionRequest !== null
    }

    @computed get showUserStatus() {
        return !this.isOpenPositionRequest && !this.isEditRequest
    }

    @computed get showRequestForm() {
        return this.isEditRequest
    }

    @computed get showOpenRequest() {
        return !this.showRequestForm
    }

    @computed get currentUserType() {
        return store.user.user_type
    }

    @computed get getIsSubmitting() {
        return this.isSubmitting
    }

    @action closeRequest = async () => {
        this.isSubmitting = true
        if (!this.openPositionRequest) return
        await store.updateRequest({
            id: this.openPositionRequest.id,
            closed: true,
            responses: [
                ...this.openPositionRequest.responses,
                {
                    response: ` בקשה בטולה על ידי המשתמש`,
                    created_at: dayjs().toISOString(),
                    responder_name: store.user.user_name,
                },
            ],
        })
        this.isEditRequest = false
        this.openPositionRequest = null
        this.isSubmitting = false
        this.requestType = null
    }

    @action createRequest = async ({
        type,
        phone,
        message,
    }: {
        type: RequestType
        phone: string
        message: string
    }) => {
        if (this.openPositionRequest) return
        const requestPayload: Omit<CIRequest, "id" | "number"> = {
            type,
            message,
            phone,
            email: store.user.email,
            name: store.user.user_name,
            responses: [],
            user_id: store.user.user_id,
            status: RequestStatus.open,
            viewed_response: false,
            viewed_by: [],
            created_at: new Date().toISOString(),
            sent: false,
            viewed: false,
            to_send: false,
            closed: false,
        }
        this.isSubmitting = true
        await store.createRequest(requestPayload)
        this.isEditRequest = false
        this.isSubmitting = false
        this.requestType = null
    }

    @action updateRequest = async ({
        type,
        phone,
        message,
    }: {
        type: RequestType
        phone: string
        message: string
    }) => {
        if (!this.openPositionRequest) return
        const reqObj: UpdateRequest = {
            id: this.openPositionRequest.id,
            type,
            phone,
            message,
            closed: false,
        }
        await store.updateRequest(reqObj)
        this.isSubmitting = false
        this.isEditRequest = false
        this.requestType = null
    }

    @action setEditingRequest = () => {
        this.isEditRequest = true
    }
    @action setRequestType = (type: RequestType) => {
        this.requestType = type
    }

    @action closeForm = () => {
        this.isEditRequest = false
        this.requestType = null
    }
}

export const userRequestVM = new UserRequestVM()
