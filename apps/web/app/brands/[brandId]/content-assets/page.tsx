import Link from "next/link";
import { getBrand } from "../../../../src/lib/kairo-api";
import { getContentAssetLibraries, getContentLibraryAssets, getGoogleDriveContentAssetCapability, type ContentAssetKind, type ContentAssetLibraryView, type ContentLibraryAssetView } from "../../../../src/lib/content-asset-library-api";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import { connectGoogleDriveAction, createContentAssetLibraryAction, disconnectGoogleDriveLibraryAction, indexGoogleDriveLibraryAction } from "./actions";
import { GoogleDrivePickerControl } from "./google-drive-picker";
import styles from "./content-assets.module.css";

type Params=Promise<{brandId:string}>;
type SearchParams=Promise<{libraryId?:string;kind?:string;q?:string;error?:string;created?:string;connected?:string;rootSelected?:string;indexed?:string;partial?:string;disconnected?:string}>;

export default async function ContentAssetsPage({params,searchParams}:{params:Params;searchParams:SearchParams}){
  const {brandId}=await params;
  const query=await searchParams;
  const brand=await getBrand(brandId);
  if(!brand)return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;

  const kind=isKind(query.kind)?query.kind:undefined;
  let libraries:ContentAssetLibraryView[]=[];
  let loadError:string|null=null;
  try{libraries=await getContentAssetLibraries(brand.id)}catch{loadError="Content Asset Libraries are temporarily unavailable. Try again."}
  const selectedLibrary=query.libraryId&&libraries.some((library)=>library.id===query.libraryId)?query.libraryId:undefined;
  let assets:ContentLibraryAssetView[]=[];
  if(!loadError){
    try{assets=await getContentLibraryAssets(brand.id,{...(selectedLibrary?{libraryId:selectedLibrary}:{}),...(kind?{kind}:{}),...(query.q?{q:query.q}:{})})}catch{loadError="Content Assets are temporarily unavailable. Try again."}
  }
  let driveEnabled=false;
  let driveCapabilityKnown=true;
  try{driveEnabled=(await getGoogleDriveContentAssetCapability()).enabled}catch{driveCapabilityKnown=false}
  const create=createContentAssetLibraryAction.bind(null,brand.id);

  return <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active={null} mobileActive="More">
    <main className={`workspace-main ${styles.main}`} id="kairo-main-content" tabIndex={-1}>
      <header className={styles.topbar}>
        <div className={styles.intro}><p className="eyebrow">Content Assets</p><h1>Keep reusable Brand media close to the work.</h1><p className={styles.lede}>Organize photography, product media, campaign files and video references into Brand-scoped libraries. External libraries stay separate from Brand Brain truth.</p></div>
        <KairoScopePicker brandName={brand.name} meta="Reusable production assets" />
      </header>

      {query.error?<p className={`${styles.notice} ${styles.error}`} role="alert">{query.error}</p>:null}
      {loadError?<p className={`${styles.notice} ${styles.error}`} role="alert">{loadError}</p>:null}
      {!driveCapabilityKnown?<p className={`${styles.notice} ${styles.error}`} role="status">Google Drive connection availability could not be confirmed. Existing local library data is unaffected.</p>:null}
      {query.created&&!loadError?<p className={styles.notice} role="status">Library created. Connect Google Drive only when you want Kairo to access files you explicitly choose.</p>:null}
      {query.connected?<p className={styles.notice} role="status">Google Drive connected. Choose a Drive folder for this library; Kairo will not scan the rest of your Drive.</p>:null}
      {query.rootSelected?<p className={styles.notice} role="status">Drive folder selected. Index its accessible metadata when you are ready.</p>:null}
      {query.indexed?<p className={styles.notice} role="status">Indexed {query.indexed} accessible {query.indexed==="1"?"asset":"assets"}.{query.partial==="1"?" Some Drive content could not be fully traversed; the library needs attention.":""}</p>:null}
      {query.disconnected?<p className={styles.notice} role="status">Google Drive disconnected and its indexed library metadata was cleared.</p>:null}

      <div className={styles.layout}>
        <aside className={styles.panel} aria-labelledby="asset-libraries-title">
          <div className={styles.panelHeader}><h2 id="asset-libraries-title">Libraries</h2><p>One Brand can keep multiple focused collections.</p></div>
          <div className={styles.libraryList}>
            {libraries.length?libraries.map((library)=><div className={styles.libraryRow} key={library.id}><strong>{library.name}</strong><div className={styles.libraryMeta}><span>{providerName(library.provider)}</span><span className={styles.status} data-status={library.status}>{statusName(library.status)}</span></div><LibraryConnection brandId={brand.id} library={library} driveEnabled={driveEnabled} driveCapabilityKnown={driveCapabilityKnown}/></div>):<div className={styles.libraryRow}><strong>{loadError?"Libraries unavailable":"No libraries yet"}</strong><div className={styles.libraryMeta}>{loadError?"Existing libraries could not be loaded.":"Create one without connecting a provider."}</div></div>}
          </div>
          <details className={styles.create}>
            <summary>Add library</summary>
            <form className={styles.form} action={create}>
              <label>Library name<input name="name" maxLength={120} placeholder="Product Photos" required /></label>
              <label>Provider<select name="provider" defaultValue="google-drive"><option value="google-drive">Google Drive</option><option value="manual">Manual / Kairo-managed later</option></select></label>
              <p className={styles.providerNote}>Creating a library does not grant provider access. Google Drive authorization is a separate, explicit step and is limited to files you choose for Kairo.</p>
              <button type="submit">Create library</button>
            </form>
          </details>
        </aside>

        <section className={styles.assets} aria-labelledby="asset-browser-title">
          <div className={styles.assetsHeader}><div><h2 id="asset-browser-title">Asset browser</h2><p>{loadError?"Availability could not be confirmed":assets.length?`${assets.length} indexed ${assets.length===1?"asset":"assets"}`:"No indexed assets in this view"}</p></div><Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/campaigns`}>Back to Content Studio</Link></div>
          <form className={styles.filters} method="get">
            <label>Search<input name="q" defaultValue={query.q??""} placeholder="Name or file type" /></label>
            <label>Library<select name="libraryId" defaultValue={selectedLibrary??""}><option value="">All libraries</option>{libraries.map((library)=><option value={library.id} key={library.id}>{library.name}</option>)}</select></label>
            <label>Type<select name="kind" defaultValue={kind??""}><option value="">All types</option><option value="image">Images</option><option value="video">Video</option><option value="document">Documents</option><option value="other">Other</option></select></label>
            <button className={styles.filterButton} type="submit">Filter</button>
          </form>

          {loadError?<div className={styles.empty}><h3>Content Assets are temporarily unavailable.</h3><p>Kairo could not confirm your existing libraries or indexed assets. Try again before creating or selecting production media.</p></div>:assets.length?<div className={styles.assetList}>{assets.map((asset)=><article className={styles.assetRow} key={asset.id}><div className={styles.assetName}><strong>{asset.name}</strong><p>{asset.mimeType} · {asset.kind} · source reference retained</p></div><div className={styles.assetMeta}>{asset.modifiedAt?`Modified ${new Date(asset.modifiedAt).toLocaleDateString()}`:"Modification date unavailable"}</div></article>)}</div>:<div className={styles.empty}><h3>Your library is ready for intentional inputs.</h3><p>Create a collection, connect Google Drive if needed, choose a folder, then index only the metadata Kairo can access from that selected source.</p></div>}

          <div className={styles.trust}><div><strong>Brand Brain stays human-governed.</strong><p>Content Assets are reusable production inputs. Connecting or indexing a Drive file here never confirms a Brand Brain field or silently creates Knowledge evidence.</p></div></div>
        </section>
      </div>
    </main>
  </KairoProductShell>;
}

function LibraryConnection({brandId,library,driveEnabled,driveCapabilityKnown}:{brandId:string;library:ContentAssetLibraryView;driveEnabled:boolean;driveCapabilityKnown:boolean}){
  if(library.provider!=="google-drive")return null;
  if(!driveCapabilityKnown||!driveEnabled)return <div className={styles.connection}><p>{driveCapabilityKnown?"Google Drive connection is not configured in this environment.":"Google Drive connection availability is temporarily unknown."}</p></div>;
  const connect=connectGoogleDriveAction.bind(null,brandId,library.id);
  const index=indexGoogleDriveLibraryAction.bind(null,brandId,library.id);
  const disconnect=disconnectGoogleDriveLibraryAction.bind(null,brandId,library.id);
  if(library.status==="not-connected")return <div className={styles.connection}><p>Nothing is shared until you authorize Google Drive.</p><div className={styles.connectionActions}><form action={connect}><button className={styles.quietButton} type="submit">Connect Google Drive</button></form></div></div>;
  if(library.status==="needs-attention")return <div className={styles.connection}><p>{library.providerLabel?`${library.providerLabel} · `:""}Reconnect before Kairo reads more Drive metadata.</p><div className={styles.connectionActions}><form action={connect}><button className={styles.quietButton} type="submit">Reconnect Drive</button></form><form action={disconnect}><button className={styles.dangerButton} type="submit">Disconnect</button></form></div></div>;
  if(!library.externalRootRef)return <div className={styles.connection}><p>Drive is connected. Choose one folder to define this library's boundary.</p><div className={styles.connectionActions}><GoogleDrivePickerControl brandId={brandId} libraryId={library.id}/><form action={disconnect}><button className={styles.dangerButton} type="submit">Disconnect</button></form></div></div>;
  return <div className={styles.connection}><p><strong>{library.providerLabel??"Selected Drive folder"}</strong><br/>Only accessible metadata under this selected root is indexed.</p><div className={styles.connectionActions}><form action={index}><button className={styles.quietButton} type="submit">Refresh index</button></form><GoogleDrivePickerControl brandId={brandId} libraryId={library.id}/><form action={disconnect}><button className={styles.dangerButton} type="submit">Disconnect</button></form></div></div>;
}
function isKind(value?:string):value is ContentAssetKind{return value==="image"||value==="video"||value==="document"||value==="other"}
function providerName(provider:string){return provider==="google-drive"?"Google Drive":"Manual"}
function statusName(status:string){if(status==="connected")return"Connected";if(status==="needs-attention")return"Needs attention";return"Not connected"}
