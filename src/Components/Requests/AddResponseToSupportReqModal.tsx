// import { useState } from "react"
// import TextArea from "antd/es/input/TextArea"
// import { Modal } from "../Common/Modal"
// export default function AddResponseToSupportReqModal({
//     onSubmit,
//     isOpen,
//     setIsOpen,
// }: {
//     onSubmit: (response: string) => void
//     isOpen: boolean
//     setIsOpen: (isOpen: boolean) => void
// }) {
//     const [response, setResponse] = useState<string>("")

//     // const handleSubmit = () => {
//     //     const currentResponse = response
//     //     setResponse("")
//     //     onSubmit(currentResponse)
//     //     setIsOpen(false)
//     // }

//     const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
//         e.stopPropagation()
//         e.preventDefault()
//         setIsOpen(true)
//     }

//     return (
//         <>
//             <button
//                 className="secondary-action-btn low-margin"
//                 onClick={handleOpen}
//             >
//                 הוספת תשובה
//             </button>
//             <Modal
//                 open={isOpen}
//                 // title="הוספת תשובה לבקשת תמיכה"
//                 closable={false}
//                 // maskClosable={false}
//                 // onOk={handleSubmit}
//                 onCancel={() => setIsOpen(false)}
//                 // okText="שלח"
//                 // cancelText="ביטול"
//             >
//                 <TextArea
//                     onClick={(e) => e.stopPropagation()}
//                     rows={4}
//                     onChange={(e) => setResponse(e.target.value)}
//                     placeholder="הכנס תשובה כאן..."
//                     value={response}
//                 />
//             </Modal>
//         </>
//     )
// }
