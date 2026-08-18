"use client";

import { useState } from "react";
import { getGoogleDrivePickerConfigAction, selectGoogleDriveRootAction } from "./actions";

type Props={brandId:string;libraryId:string};

type PickerApi={
  DocsView:new()=>{setIncludeFolders(value:boolean):any;setSelectFolderEnabled(value:boolean):any;setMode(value:unknown):any};
  DocsViewMode:{LIST:unknown};
  PickerBuilder:new()=>{addView(value:unknown):any;setOAuthToken(value:string):any;setDeveloperKey(value:string):any;setAppId(value:string):any;setOrigin(value:string):any;setTitle(value:string):any;setCallback(value:(data:any)=>void):any;build():{setVisible(value:boolean):void}};
  Action:{PICKED:string;CANCEL:string};
  Response:{DOCUMENTS:string};
  Document:{ID:string};
};

type GoogleWindow=Window&{gapi?:{load(name:string,options:{callback:()=>void;onerror:()=>void;timeout:number;ontimeout:()=>void}):void};google?:{picker?:PickerApi}};

export function GoogleDrivePickerControl({brandId,libraryId}:Props){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  async function openPicker(){
    if(busy)return;
    setBusy(true);setMessage(null);
    const response=await getGoogleDrivePickerConfigAction(brandId,libraryId);
    if(!response.ok){setMessage(response.message);setBusy(false);return;}
    try{
      const picker=await loadPicker();
      const view=new picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true).setMode(picker.DocsViewMode.LIST);
      const instance=new picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(response.config.accessToken)
        .setDeveloperKey(response.config.developerKey)
        .setAppId(response.config.appId)
        .setOrigin(window.location.origin)
        .setTitle("Choose a Drive folder for this library")
        .setCallback(async(data:any)=>{
          if(data?.action===picker.Action.CANCEL){setBusy(false);return;}
          if(data?.action!==picker.Action.PICKED)return;
          const documents=data?.[picker.Response.DOCUMENTS];
          const fileId=Array.isArray(documents)?documents[0]?.[picker.Document.ID]:undefined;
          if(typeof fileId!=="string"||!fileId){setMessage("No Drive folder was selected.");setBusy(false);return;}
          const selected=await selectGoogleDriveRootAction(brandId,libraryId,fileId);
          if(!selected.ok){setMessage(selected.message);setBusy(false);return;}
          window.location.assign(`/brands/${encodeURIComponent(brandId)}/content-assets?libraryId=${encodeURIComponent(libraryId)}&rootSelected=1`);
        })
        .build();
      instance.setVisible(true);
    }catch{
      setMessage("Google Drive Picker could not be opened. Try again.");
      setBusy(false);
    }
  }

  return <div><button className="secondary-button" type="button" onClick={openPicker} disabled={busy}>{busy?"Opening Drive…":"Choose Drive folder"}</button>{message?<p role="alert">{message}</p>:null}</div>;
}

async function loadPicker():Promise<PickerApi>{
  const target=window as GoogleWindow;
  if(!target.gapi)await loadScript("https://apis.google.com/js/api.js","kairo-google-picker-api");
  if(!target.gapi)throw new Error("Google API script unavailable");
  await new Promise<void>((resolve,reject)=>target.gapi!.load("picker",{callback:resolve,onerror:()=>reject(new Error("Google Picker load failed")),timeout:8_000,ontimeout:()=>reject(new Error("Google Picker load timed out"))}));
  const picker=target.google?.picker;if(!picker)throw new Error("Google Picker unavailable");return picker;
}
function loadScript(src:string,id:string){return new Promise<void>((resolve,reject)=>{const existing=document.getElementById(id) as HTMLScriptElement|null;if(existing){if((existing as any).dataset.loaded==="true"){resolve();return}existing.addEventListener("load",()=>resolve(),{once:true});existing.addEventListener("error",()=>reject(new Error("Script load failed")),{once:true});return}const script=document.createElement("script");script.id=id;script.src=src;script.async=true;script.defer=true;script.addEventListener("load",()=>{script.dataset.loaded="true";resolve()},{once:true});script.addEventListener("error",()=>reject(new Error("Script load failed")),{once:true});document.head.appendChild(script)});}
