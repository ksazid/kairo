import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const fail = message => { console.error(message); process.exit(1); };

const files = {
  prd: read('product/PRD.md'),
  trd: read('product/TRD.md'),
  design: read('product/DESIGN.md'),
  glossary: read('product/GLOSSARY.md'),
  venture: read('product/VENTURE-PACKAGE.yaml'),
  profile: read('.engineering/WEB-AI-PROFILE.yaml')
};

const errors = [];
const requireMatch = (label, text, pattern, message) => {
  if (!pattern.test(text)) errors.push(`${label}: ${message}`);
};

for (const [label, text] of Object.entries({PRD: files.prd, TRD: files.trd, DESIGN: files.design, GLOSSARY: files.glossary})) {
  requireMatch(label, text, /status:\s*Approved/i, 'approved status is required');
}

requireMatch('PRD', files.prd, /document_id:\s*CIE-PRD-001/i, 'CIE-PRD-001 is required');
for (let i=1; i<=20; i++) {
  const id = `FR-${String(i).padStart(2,'0')}`;
  if (!files.prd.includes(id)) errors.push(`PRD: missing ${id}`);
}
for (const term of ['Target customer','Core domain model','Functional requirements','Explicit V1 exclusions','Initial validation success criteria']) {
  if (!files.prd.includes(term)) errors.push(`PRD: missing approved concept "${term}"`);
}

requireMatch('TRD', files.trd, /document_id:\s*CIE-TRD-001/i, 'CIE-TRD-001 is required');
for (const term of ['Architecture style','Technology direction','Module boundaries','Tenant and Brand isolation','PostgreSQL','Agent runtime boundary','Dynamic Skill Registry','Truth and Claims Gate','Publishing','Testing and AI evaluation','Deployment direction','PES Web/AI implementation profile','Technical validation gates before implementation commitment']) {
  if (!files.trd.includes(term)) errors.push(`TRD: missing approved concept "${term}"`);
}

requireMatch('DESIGN', files.design, /document_id:\s*CIE-DESIGN-001/i, 'CIE-DESIGN-001 is required');
requireMatch('GLOSSARY', files.glossary, /document_id:\s*CIE-GLOSSARY-001/i, 'CIE-GLOSSARY-001 is required');
requireMatch('VENTURE-PACKAGE', files.venture, /status:\s*approved_for_pes/i, 'approved_for_pes package is required');
requireMatch('VENTURE-PACKAGE', files.venture, /implementation_profile:\s*pes-web-ai/i, 'pes-web-ai handoff is required');
requireMatch('WEB-AI-PROFILE', files.profile, /id:\s*pes-web-ai/i, 'profile id pes-web-ai is required');
requireMatch('WEB-AI-PROFILE', files.profile, /governance:\s*PES remains technology-neutral and unchanged/i, 'profile must preserve PES governance');

if (errors.length) fail(`KAIRO WEB/AI INTAKE: BLOCKED\n- ${errors.join('\n- ')}`);
console.log('KAIRO WEB/AI INTAKE: PASS');
