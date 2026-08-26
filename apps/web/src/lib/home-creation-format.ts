import type { LearningView } from "./kairo-api";

export type HomeCreationFormat = "image" | "carousel" | "reel" | "video";
export type HomeCreationGoal = "Grow audience" | "Build authority" | "Generate leads" | "Build community" | "Promote an offer";
export interface HomeFormatRecommendation {
  goal: HomeCreationGoal;
  format: HomeCreationFormat;
  reason: string;
  choices: HomeCreationFormat[];
}

export function recommendHomeFormat(input:{text:string;source?:string;mediaKinds?:Array<"image"|"video">;learnings?:LearningView[]}):HomeFormatRecommendation{
  const text=`${input.text??""} ${input.source??""}`.trim().toLowerCase();
  const scores:Record<HomeCreationFormat,number>={image:1,carousel:1,reel:0,video:0};
  const reasons:Record<HomeCreationFormat,string[]>={image:[],carousel:[],reel:[],video:[]};
  const words=text.split(/\s+/).filter(Boolean).length;
  if(words>=45){scores.carousel+=3;reasons.carousel.push("your idea has enough detail to break into a clear sequence");}
  else if(words>=20){scores.carousel+=2;reasons.carousel.push("the idea benefits from a few structured points");}
  else if(words>0&&words<=12){scores.image+=2;reasons.image.push("the idea is concise enough for a focused post");}
  cue(text,/\b(compare|comparison|versus|vs\.?|steps?|tips?|mistakes?|reasons?|list|guide|breakdown|myths?|things to know|before you)\b/i,scores,reasons,"carousel",3,"the idea is naturally structured as multiple points");
  cue(text,/\b(reel|short[- ]?form|vertical|quick demo|reaction|behind the scenes|voiceover|show how)\b/i,scores,reasons,"reel",5,"a short motion-led treatment fits the idea");
  cue(text,/\b(youtube|long[- ]?form|full video|tutorial|walkthrough|deep dive|interview|webinar|explainer video)\b/i,scores,reasons,"video",5,"the idea benefits from a fuller video treatment");
  cue(text,/\b(announcement|launch|quote|poster|single image|photo|visual|showcase|hero image|post)\b/i,scores,reasons,"image",3,"one strong visual can carry the message");
  if(input.source?.trim()){scores.carousel+=2;reasons.carousel.push("the source can be distilled into useful takeaways");}
  const mediaKinds=input.mediaKinds??[];
  if(mediaKinds.includes("video")){scores.reel+=4;scores.video+=3;reasons.reel.push("you attached video source material");reasons.video.push("you attached video source material");}
  if(mediaKinds.includes("image")){scores.image+=2;scores.carousel+=1;reasons.image.push("you attached image source material");}
  for(const learning of input.learnings??[]){
    if(learning.status!=="accepted"||learning.confidence<0.55)continue;
    const learned=normalise(learning.applicability.format??learning.patterns.find(p=>p.dimension==="format")?.value);
    if(!learned)continue;
    scores[learned]+=learning.confidence>=0.8?3:2;
    reasons[learned].push("similar formats have worked for this Brand");
  }
  const format=(Object.entries(scores)as Array<[HomeCreationFormat,number]>).sort((a,b)=>b[1]-a[1]||order(a[0])-order(b[0]))[0]![0];
  return{goal:inferGoal(text),format,reason:capitalise(reasons[format][0]??defaultReason(format)),choices:["image","carousel","reel","video"]};
}

export function inferHomeCreationFormat(value:string):HomeCreationFormat|undefined{
  const text=value.toLowerCase();
  if(/\b(youtube|long[- ]?form|full video|tutorial|webinar|video)\b/.test(text)&&!(/\breel\b/.test(text)))return"video";
  if(/\b(reel|short[- ]?form|vertical|voiceover|motion|demo)\b/.test(text))return"reel";
  if(/\b(carousel|slides?|listicle|comparison|steps?|breakdown)\b/.test(text))return"carousel";
  if(/\b(image|photo|poster|graphic|post)\b/.test(text))return"image";
  return undefined;
}

export function homeFormatLabel(format:HomeCreationFormat){return format==="image"?"Post":format==="carousel"?"Carousel":format==="reel"?"Reel":"Video";}
function normalise(value?:string):HomeCreationFormat|undefined{if(!value)return;const t=value.toLowerCase();if(t.includes("carousel"))return"carousel";if(t.includes("reel")||t.includes("short"))return"reel";if(t.includes("video")||t.includes("youtube"))return"video";if(t.includes("image")||t.includes("photo")||t.includes("post"))return"image";}
function cue(text:string,pattern:RegExp,scores:Record<HomeCreationFormat,number>,reasons:Record<HomeCreationFormat,string[]>,format:HomeCreationFormat,weight:number,reason:string){if(pattern.test(text)){scores[format]+=weight;reasons[format].push(reason);}}
function order(format:HomeCreationFormat){return format==="image"?0:format==="carousel"?1:format==="reel"?2:3;}
function defaultReason(format:HomeCreationFormat){if(format==="reel")return"short motion will make the idea easier to absorb";if(format==="video")return"a fuller video gives the idea enough room";if(format==="image")return"a focused visual post fits the idea";return"a structured carousel gives the idea enough room without overcomplicating it";}
function capitalise(value:string){return value?`${value[0]!.toUpperCase()}${value.slice(1)}`:value;}
function inferGoal(text:string):HomeCreationGoal{
 const scores:Record<HomeCreationGoal,number>={"Grow audience":1,"Build authority":0,"Generate leads":0,"Build community":0,"Promote an offer":0};
 if(/\b(buy|sale|sell|offer|discount|launch|shop|order|purchase|book now|limited time)\b/i.test(text))scores["Promote an offer"]+=5;
 if(/\b(lead|leads|book a call|contact|enquir\w*|inquir\w*|sign up|consultation|request a demo|get a quote)\b/i.test(text))scores["Generate leads"]+=5;
 if(/\b(comment|community|discuss|conversation|question|poll|share your|tell me)\b/i.test(text))scores["Build community"]+=4;
 if(/\b(explain|teach|guide|how to|why|breakdown|expert|technical|learn)\b/i.test(text))scores["Build authority"]+=3;
 if(/\b(compare|comparison|tradeoffs?|pros and cons|versus|vs\.?)\b/i.test(text))scores["Build authority"]+=2;
 return(["Generate leads","Promote an offer","Build community","Build authority","Grow audience"]as HomeCreationGoal[]).sort((a,b)=>scores[b]-scores[a])[0]!;
}
