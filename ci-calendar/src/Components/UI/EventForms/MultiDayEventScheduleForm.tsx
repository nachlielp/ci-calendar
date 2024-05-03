import { Button, Card, Form } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import SubEventBase from "./SubEventBase";

interface IMultiDayEventScheduleFormProps {
  fields: any[];
  add: () => void;
  remove: (index: number) => void;
}

// export default function MultiDayEventScheduleForm({
//   fields,
//   add,
//   remove,
// }: IMultiDayEventScheduleFormProps) {
//   return (
//     <>
//       <SubEventBase />
//       <Form.List name="date-events">
//         {() => (
//           <>
//             {fields.map(({ key, name, ...restField }) => (
//               <Card className="mt-4 border-2" key={key}>
//                 <div className="flex items-center justify-center">
//                   <Button onClick={() => remove(name)}>
//                     <span className="text-red-500">
//                       <MinusCircleOutlined /> הסר יום
//                     </span>
//                   </Button>
//                 </div>
//               </Card>
//             ))}
//             <div className="flex items-center justify-center mt-2">
//               <Button className="w-1/2" onClick={add} block>
//                 <span>
//                   <PlusOutlined /> הוסף יום
//                 </span>
//               </Button>
//             </div>
//           </>
//         )}
//       </Form.List>
//     </>
//   );
// }
