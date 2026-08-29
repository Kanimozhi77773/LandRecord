export const operatorDocs = [
  {id:'LR-1025', type:'PDF', survey:'125/2', village:'Kinathukadavu', status:'review', confidence:62, owner:'Ravi Kumar', area:'2.5 acres'},
  {id:'LR-1026', type:'Scan', survey:'88/1', village:'Anaimalai', status:'processing', confidence:null, owner:'Lakshmi N.', area:'1.2 acres'},
  {id:'LR-1027', type:'Image', survey:'40/3', village:'Pollachi', status:'completed', confidence:96, owner:'Suresh M.', area:'3.0 acres'},
  {id:'LR-1028', type:'Map', survey:'12/9', village:'Madukkarai', status:'review', confidence:71, owner:'Geetha R.', area:'0.9 acres'},
  {id:'LR-1032', type:'PDF', survey:'55/4', village:'Sulur', status:'review', confidence:58, owner:'Karthik S.', area:'4.1 acres'},
];

export const operatorActivity = [
  {t:'10:32 AM', text:'Uploaded LR-1025'},
  {t:'10:34 AM', text:'Corrected Area field on LR-1025'},
  {t:'10:36 AM', text:'Submitted LR-1025 for verification'},
  {t:'10:41 AM', text:'Uploaded LR-1026'},
];

export const submittedRecords = [
  {id:'LR-1020', survey:'125/1', village:'ABC', confidence:96, issue:false},
];

export const registrarPending = [
  {id:'LR-1025', survey:'125/2', village:'Kinathukadavu', confidence:96, issue:false, owner:'Ravi Kumar', area:'2.5 acres', operator:'D. Aravind'},
  {id:'LR-1026', survey:'88/1', village:'Anaimalai', confidence:62, issue:true, owner:'Lakshmi N.', area:'1.2 acres', operator:'D. Aravind'},
  {id:'LR-1027', survey:'40/3', village:'Pollachi', confidence:81, issue:true, owner:'Suresh M.', area:'3.0 acres', operator:'K. Priya'},
];

export const registrarApproved = 145;

export const registrarAudit = [
  {t:'10:20', text:'Operator uploaded document LR-1025'},
  {t:'10:23', text:'AI extraction completed on LR-1025'},
  {t:'10:28', text:'Operator corrected owner name on LR-1025'},
  {t:'10:31', text:'LR-1025 submitted for verification'},
];

export const discrepancies = [
  {id:'DC-14', survey:'125/2', level:'High', text:'Historical record 2.50 acres vs current database 3.00 acres'},
  {id:'DC-15', survey:'88/1', level:'Medium', text:'Owner name spelling mismatch across two records'},
  {id:'DC-16', survey:'40/3', level:'Low', text:'Village name abbreviation inconsistency'},
];

export const citizenMyRecords = [
  {survey:'125/2', village:'Kinathukadavu', status:'verified'},
  {survey:'130/1', village:'Madukkarai', status:'review'},
];

export const citizenAllRecords = [
  {survey:'125/2', village:'Kinathukadavu', taluk:'Pollachi', district:'Coimbatore', status:'verified', area:'2.50 acres', classification:'Agricultural'},
  {survey:'130/1', village:'Madukkarai', taluk:'Coimbatore South', district:'Coimbatore', status:'review', area:'1.10 acres', classification:'Residential'},
  {survey:'40/3', village:'Pollachi', taluk:'Pollachi', district:'Coimbatore', status:'discrepancy', area:'3.00 acres', classification:'Agricultural'},
];

export const initialCitizenRequests = [];
export const initialReqCounter = 1025;
