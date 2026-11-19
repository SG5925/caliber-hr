import {useEffect,useRef,useState} from 'react';
import {Upload} from 'lucide-react';
import AadhaarUploader from '../AadhaarUploader';
import DrivingLicenceUploader from '../DrivingLicenceUploader';
import {savedSession} from '../api';
import {mountTrialPreview,type PrepareJoining} from './mount';
import {fetchTrialAccess} from './telegramSend';

type Workflow = ReturnType<typeof mountTrialPreview>;

export default function TrialWorkflowPreview({owner,legacyOwner,name,site,region,group,company,department,onCleared}: {
  owner: string; legacyOwner?: string; name: string; site: string; region: string; group: string; company: string; department: string; onCleared?: PrepareJoining;
}) {
  const host=useRef<HTMLDivElement>(null);
  const [workflow,setWorkflow] = useState<Workflow | null>(null);
  const [disabled,setDisabled] = useState(false);
  const [uploadVersion,setUploadVersion] = useState(0);
  const [uploadMenu,setUploadMenu] = useState<'root'|'aadhaar'|'front'|'back'>();
  const signerName=name||savedSession()?.profile?.name||savedSession()?.profile?.username||'';
  const cleared=useRef(onCleared);
  cleared.current=onCleared;
  useEffect(()=>{
    const node=host.current;
    if (!node) return;
    const mounted = mountTrialPreview(node.shadowRoot||node.attachShadow({mode:'open'}),{owner,legacyOwner,name:signerName,site,region,group,company,department},{
      reset: () => setUploadVersion(version => version + 1),
      setDisabled,
    },onCleared?async rows=>cleared.current?.(rows):undefined);
    const session=savedSession();
    if(session?.grant)void fetchTrialAccess({site,region,group,company,department})
      .then(access=>mounted.setAccess(access))
      .catch(error=>mounted.setAccess({role:null,name:session.profile.name||session.profile.username||session.profile.actor||signerName,reason:error instanceof Error?error.message:'Unable to load Trial Form access.'}));
    setDisabled(Boolean(session?.grant));
    setWorkflow(mounted);
    return mounted.dispose;
  },[owner,legacyOwner,signerName,site,region,group,company,department]);
  return <div ref={host} aria-label="Trial workflow local preview">
    {workflow && <div slot="aadhaar-upload" className="trial-document-uploads">
      <div className="trial-document-menu">
        <button disabled={disabled} type="button" className="employee-import" aria-expanded={Boolean(uploadMenu)} onClick={()=>setUploadMenu(menu=>menu?undefined:'root')}><Upload/>Upload A/D</button>
        {uploadMenu==='root'&&<div className="aadhaar-source-menu trial-document-options">
          <button type="button" onClick={()=>setUploadMenu('aadhaar')}>Upload Aadhaar Image</button>
          <button type="button" onClick={()=>setUploadMenu('front')}>Upload Front Driving License Image</button>
          <button type="button" onClick={()=>setUploadMenu('back')}>Upload Back Driving License Image</button>
        </div>}
      </div>
      <AadhaarUploader key={uploadVersion} disabled={disabled} onBusy={workflow.setAadhaarBusy}
        fillDetails={workflow.fillAadhaarDetails} showScanInstructions={false}
        primaryButtonLabel="Upload Aadhar Image" hideSecond hidePrimary openMenu={uploadMenu==='aadhaar'} onMenuChange={open=>!open&&setUploadMenu(undefined)}/>
      <DrivingLicenceUploader key={'dl-'+uploadVersion} disabled={disabled} onBusy={workflow.setDrivingLicenceBusy}
        onReady={workflow.setDrivingLicenceReady} onDetails={workflow.fillDrivingLicenceDetails} hideLaunchers openMenu={uploadMenu==='front'||uploadMenu==='back'?uploadMenu:undefined} onMenuChange={menu=>!menu&&setUploadMenu(undefined)}/>
    </div>}
  </div>;
}
