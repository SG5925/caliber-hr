import {DOCS,normalizeTrialApproval,type History,type Trial} from './records';

export type ReviewRecord={id:string;formNo:string;site:string;fields:Record<string,string>;history?:History[];resultAt?:string;savedAt?:string;batchId?:string;stage?:string;pendingRole?:string;trialBy?:string;docs?:Record<string,string>};
export function reviewTrial(record:ReviewRecord):Trial|null{
 const f=record.fields||{};
 if(f.Result!=='PASS')return null;
 const at=record.resultAt||record.savedAt||'';
 const post=f['If PASS – recommended for']==='Operator'?'Operator':'Driver';
 const machine=f.Machine||f['Vehicle / equipment for trial']||'';
 return normalizeTrialApproval({
  id:record.id,formNo:record.formNo,site:record.site,batch:record.batchId||'',createdAt:at,
  name:f['Name of candidate']||'',father:f["Father's name"]||'',dob:f['Date of birth / Age']||'',
  mobile:f['Mobile no.']||'',aadhaar:f['Aadhaar no.']||'',address:f.Address||'',photo:'',
  post,vehicles:['Other'],otherVehicle:machine,dl:f['Driving licence no.']||'',dlValid:f['DL valid up to dates']||'',
  experience:f['Total experience (years)']||'',employer:f['Previous employer']||'',referredBy:f['Referred by']||'',trialDate:f['Trial date & time']||'',
  docs:Object.fromEntries(DOCS.map(([key])=>[key,{seen:record.docs?.[key]||'',remarks:''}])) as Trial['docs'],
  stage:'pm',result:'PASS',history:record.history||[],
  outcome:{at,result:'PASS',post,machine,trainer:f['Trial conducted by']||f['Examiner name']||record.trialBy||'',reason:'',remarks:f['Examiner remarks']||''},
 });
}
