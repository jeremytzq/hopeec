import { uid } from "./types";

// Standing CC list (leadership/staff who should be copied every week, separate from
// the per-week volunteer recipients). Editable in the app - this is just the seed
// used the first time (see storage.ts's loadCcList).
export type CcPerson = { id: string; name: string; email: string };

export const DEFAULT_CC_PEOPLE: CcPerson[] = [
  { id: uid(), name: "Chua Tian Tian", email: "ttchua@hopesingapore.org.sg" },
  { id: uid(), name: "Donald Ng", email: "donald.ng@hopesingapore.org.sg" },
  { id: uid(), name: "Hope MM Live", email: "hopemmlive@gmail.com" },
  { id: uid(), name: "hopestagemanager@gmail.com", email: "hopestagemanager@gmail.com" },
  { id: uid(), name: "Jiayi", email: "jeanlee.jiayi@gmail.com" },
  { id: uid(), name: "Lim Chee Harn", email: "chlim@hopesingapore.org.sg" },
  { id: uid(), name: "russellaeneaslim@gmail.com", email: "russellaeneaslim@gmail.com" },
  { id: uid(), name: "Xu Zhenzhong", email: "xu.zhenzhong@hopesingapore.org.sg" },
  { id: uid(), name: "Steven Yeoh", email: "shyeoh@hopesingapore.org.sg" },
  { id: uid(), name: "Zelanie Soh", email: "zelanie.soh@hopesingapore.org.sg" },
  { id: uid(), name: "Tan Wei Yeat", email: "weiyeat.tan@hopesingapore.org.sg" },
  { id: uid(), name: "Samantha Leck", email: "samantha.leck@hopesingapore.org.sg" },
  { id: uid(), name: "Daniel Tan", email: "danielghtan@hopesingapore.org.sg" },
];

// "Name <email>; ..." so it can be pasted straight into Outlook's CC field.
export function formatCcList(people: CcPerson[]): string {
  return people.map((p) => `${p.name} <${p.email}>`).join("; ");
}
