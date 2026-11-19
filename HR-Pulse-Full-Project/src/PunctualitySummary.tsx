import {useEffect, useState} from 'react';
import {api} from './api';

type Mark = {id:string; code:string; name:string; site:string; shift:string; date:string; late:boolean|null; early:boolean|null};

export default function PunctualitySummary({grant,initialMonth}:{grant:string;initialMonth:string}){
 const [month,setMonth]=useState(initialMonth);
 const [result,setResult]=useState<Mark[]>();
 const [error,setError]=useState('');
 const [search,setSearch]=useState('');
 useEffect(()=>{
  let active=true;
  setResult(undefined);
  setError('');
  if(!/^\d{4}-\d{2}$/.test(month))return;
  const [year,number]=month.split('-').map(Number);
  const last=new Date(Date.UTC(year,number,0)).getUTCDate();
  api<{rows:Mark[]}>(grant,`attendance/punctuality?from=${month}-01&to=${month}-${last}`)
   .then(data=>{if(active)setResult(data.rows);})
   .catch(e=>{if(active)setError(e.message);});
  return ()=>{active=false;};
 },[grant,month]);
 const employees=new Map<string,Mark[]>();
 const needle=search.trim().toLowerCase();
 for(const row of result||[]){
  if(!(row.late||row.early)||![row.name,row.code,row.site].some(v=>v.toLowerCase().includes(needle)))continue;
  const marks=employees.get(row.id)||[];
  marks.push(row);
  employees.set(row.id,marks);
 }
 return <section className="data-card">
  <h2>Late Come / Early Going</h2>
  <p>Completed shifts with linked biometric check-ins or check-outs. Late arrivals use the employee’s current assigned shift and its grace period. Office departures more than 15 minutes early are counted.</p>
  <div className="attendance-filters">
   <label>Attendance month<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label>
   <label>Employee or site<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  </div>
  {error?<p role="alert">{error}</p>:!month?<p>Select a month.</p>:!result?<p role="status">Loading attendance…</p>:
   <div className="table-scroll"><table><thead><tr>{['Employee','Site','Shift','Late arrivals','Early departures'].map(label=><th key={label}>{label}</th>)}</tr></thead>
   <tbody>{Array.from(employees,([id,marks])=><tr key={id}><td>{marks[0].name} · {marks[0].code}</td><td>{marks[0].site}</td><td>{marks[0].shift}</td>
    {[true,false].map(late=>{const dates=marks.filter(m=>late?m.late:m.early).map(m=>m.date);return <td key={String(late)}>{dates.length?<details><summary>{dates.length}</summary>{dates.join(', ')}</details>:0}</td>;})}
   </tr>)}{!employees.size&&<tr><td colSpan={5}>{!result.length?'No eligible biometric records for this month.':'No matching late arrivals or early departures.'}</td></tr>}</tbody></table></div>}
 </section>;
}
