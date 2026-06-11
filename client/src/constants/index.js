export const LEAD_STAGES = ['Leads','Communicated','Discussion','Pricing / Quote','Demo','Closure'];
export const DEAL_STAGES = ['Negotiation','Won','Lost'];
export const SOURCES = ['LinkedIn','Referral','Website','Cold Email','Events'];
export const OWNERS = ['Sivaram B','Sureka Suresh','Rajib Saikia'];
export const SECTORS = ['Mining','Highway & Railways','Urban Development','Energy & Utilities','Water Resources','Emergency Services'];
export const DOC_TYPES = ['Quotation','Agreement','Purchase Order','Contract','Others'];
export const T_STATUSES = ['New','Under Preparation','Submitted','Evaluation','Awarded','Won','Lost'];
export const T_EMD = ['EMD Paid','EMD NA','EMD Exempted'];
export const T_JV = ['JV','JV Not Allowed'];

export const T_COLORS = {
  'New':'#8A8D8F', 'Under Preparation':'#54585A', 'Submitted':'#2563EB',
  'Evaluation':'#f59e0b', 'Awarded':'#8b5cf6', 'Won':'#16a34a', 'Lost':'#DA291C'
};

export const STG_COLORS = {
  'Leads':'#8A8D8F','Communicated':'#54585A','Discussion':'#DA291C',
  'Pricing / Quote':'#8A8D8F','Demo':'#54585A','Closure':'#DA291C',
};

export const DEAL_COLORS = { Negotiation:'#54585A', Won:'#DA291C', Lost:'#8A8D8F' };
export const OWN_COLORS = { 'Sivaram B':'#DA291C','Sureka Suresh':'#54585A','Rajib Saikia':'#16a34a' };

export const BANT_TABS = [
  { key:'all',      label:'All Leads', range:null },
  { key:'hot',      label:'Hot',       range:[16,20] },
  { key:'warm',     label:'Warm',      range:[11,15] },
  { key:'cold',     label:'Cold',      range:[6,10] },
  { key:'nurture',  label:'Nurture',   range:[1,5] },
  { key:'none',     label:'Unscored',  range:[0,0] },
];

export const BANT_DEFS = [
  { key:'bant_b', label:'BUDGET (B)', opts:[
    {v:5, l:'5 - Budget approved / ready'},
    {v:4, l:'4 - Budget likely'},
    {v:3, l:'3 - Exploring'},
    {v:2, l:'2 - Unclear'},
    {v:1, l:'1 - No budget'}
  ]},
  { key:'bant_a', label:'AUTHORITY (A)', opts:[
    {v:5, l:'5 - Direct decision maker'},
    {v:4, l:'4 - Strong influencer'},
    {v:3, l:'3 - Partial access'},
    {v:2, l:'2 - Indirect contact'},
    {v:1, l:'1 - No access'}
  ]},
  { key:'bant_n', label:'NEED (N)', opts:[
    {v:5, l:'5 - Critical dependency'},
    {v:4, l:'4 - Strong need'},
    {v:3, l:'3 - Moderate'},
    {v:2, l:'2 - Weak'},
    {v:1, l:'1 - Just exploring'}
  ]},
  { key:'bant_t', label:'TIMELINE (T)', opts:[
    {v:5, l:'5 - Immediate (0-1 month)'},
    {v:4, l:'4 - Short term'},
    {v:3, l:'3 - Medium'},
    {v:2, l:'2 - Long'},
    {v:1, l:'1 - No clarity'}
  ]},
];
