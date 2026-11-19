import {useEffect,useState,type ChangeEvent} from 'react';
import {Trash2,Upload} from 'lucide-react';
import {savedSession} from './api';
import {readGeminiDrivingLicence,type DrivingLicenceDetails} from './geminiOcr';

const accept='.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';
export default function DrivingLicenceUploader({disabled,onBusy,onReady,onDetails}:{disabled?:boolean;onBusy:(busy:boolean)=>void;onReady:(ready:boolean)=>void;onDetails:(details:DrivingLicenceDetails)=>void}){
 const[front,setFront]=useState<File>();const[back,setBack]=useState<File>();const[status,setStatus]=useState('');const[busy,setBusy]=useState(false);
 const ready=Boolean(front&&back);
 useEffect(()=>onReady(ready),[ready,onReady]);
 useEffect(()=>{if(!front||!back)return;let active=true;setBusy(true);onBusy(true);setStatus('Reading both driving licence images with Gemini…');void(async()=>{try{const grant=savedSession()?.grant;if(!grant)throw new Error('Sign in again before scanning the driving licence.');const details=await readGeminiDrivingLicence([front,back],grant);if(active){onDetails(details);setStatus('Driving licence details filled automatically. Please verify all classes and validity dates.');}}catch(error){if(active)setStatus(error instanceof Error?error.message:'The driving licence could not be read.');}finally{if(active){setBusy(false);onBusy(false);}}})();return()=>{active=false;onBusy(false);};},[front,back,onBusy,onDetails]);
 const choose=(side:'front'|'back')=>(event:ChangeEvent<HTMLInputElement>)=>{const file=event.currentTarget.files?.[0];if(!file)return;(side==='front'?setFront:setBack)(file);};
 const locked=disabled||busy;
 return <section className="aadhaar-upload"><p>Upload both the front and back of the driving licence. Both images are required before continuing.</p><div className="aadhaar-upload-actions">
  <label className="employee-import"><Upload/>Upload Front Driving License Image<input className="employee-import-input" disabled={locked} aria-label="Choose front driving licence image" type="file" accept={accept} onChange={choose('front')}/></label>
  <label className="employee-import"><Upload/>Upload Back Driving License Image<input className="employee-import-input" disabled={locked} aria-label="Choose back driving licence image" type="file" accept={accept} onChange={choose('back')}/></label>
 </div>{front&&<p className="aadhaar-status">Front: {front.name} <button type="button" className="aadhaar-remove" disabled={locked} onClick={()=>setFront(undefined)}><Trash2/>Remove</button></p>}{back&&<p className="aadhaar-status">Back: {back.name} <button type="button" className="aadhaar-remove" disabled={locked} onClick={()=>setBack(undefined)}><Trash2/>Remove</button></p>}{status&&<p className="aadhaar-status" role="status">{status}</p>}</section>;
}
