import {useState} from 'react';
import {BriefcaseBusiness, ChartNoAxesCombined, GraduationCap} from 'lucide-react';
import {Records} from './Modules';
import type {HRConfig} from './api';
import './payroll.css';

export const managementSections = [
  ['Recruitment Management', BriefcaseBusiness],
  ['Training and Development', GraduationCap],
  ['Performance Management', ChartNoAxesCombined],
] as const;

type Section = typeof managementSections[number][0];

export function isManagementSection(name: string): name is Section {
  return managementSections.some(([section]) => section === name);
}

type Props = {section: Section; config: HRConfig['modules']; grant: string; notice: (message: string) => void};

export default function ManagementModules({section, config, grant, notice}: Props) {
  const items = Object.entries(config).filter(([, module]) => module.menu === section);
  const [selected, setSelected] = useState('');
  const current = items.find(([kind]) => kind === selected) ?? items[0];
  if (!current) return <p role="status">Module configuration is unavailable. Refresh to retry.</p>;
  return <>
    <section className="data-card" aria-label={section}>
      <div className="payroll-workflows" role="group" aria-label={`${section} modules`}>
        {items.map(([kind, module]) => <button type="button" key={kind} aria-pressed={current[0] === kind}
          onClick={() => setSelected(kind)}>{module.title}</button>)}
      </div>
    </section>
    <Records key={current[0]} grant={grant} kind={current[0]} module={current[1]} notice={notice}/>
  </>;
}
