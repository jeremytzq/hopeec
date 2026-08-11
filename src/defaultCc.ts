// Standing CC list (leadership/staff who should be copied every week, separate from
// the per-week volunteer recipients).
export type CcPerson = { name: string; email: string };

export const DEFAULT_CC_PEOPLE: CcPerson[] = [
  { name: "Chua Tian Tian", email: "ttchua@hopesingapore.org.sg" },
  { name: "Donald Ng", email: "donald.ng@hopesingapore.org.sg" },
  { name: "Hope MM Live", email: "hopemmlive@gmail.com" },
  { name: "hopestagemanager@gmail.com", email: "hopestagemanager@gmail.com" },
  { name: "Jiayi", email: "jeanlee.jiayi@gmail.com" },
  { name: "Lim Chee Harn", email: "chlim@hopesingapore.org.sg" },
  { name: "russellaeneaslim@gmail.com", email: "russellaeneaslim@gmail.com" },
  { name: "Xu Zhenzhong", email: "xu.zhenzhong@hopesingapore.org.sg" },
  { name: "Steven Yeoh", email: "shyeoh@hopesingapore.org.sg" },
  { name: "Zelanie Soh", email: "zelanie.soh@hopesingapore.org.sg" },
  { name: "Tan Wei Yeat", email: "weiyeat.tan@hopesingapore.org.sg" },
  { name: "Samantha Leck", email: "samantha.leck@hopesingapore.org.sg" },
  { name: "Daniel Tan", email: "danielghtan@hopesingapore.org.sg" },
];

// Already formatted "Name <email>; ..." so it can be pasted straight into Outlook's CC field.
export const DEFAULT_CC_LIST = DEFAULT_CC_PEOPLE.map((p) => `${p.name} <${p.email}>`).join("; ");
