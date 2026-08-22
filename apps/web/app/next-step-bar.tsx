import Link from"next/link";
export function NextStepBar({href,label="Choose a goal and create"}:{href:string;label?:string}){return <aside className="next-step-bar" aria-label="Recommended next step"><div><span>Next step</span><strong>Turn one clear goal into content.</strong></div><Link className="primary-button" href={href}>{label}</Link></aside>}
