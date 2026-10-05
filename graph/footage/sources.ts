import type {FootageCandidate,FootageSource} from './contracts';

const allowedHosts:Record<FootageSource,string[]>={
  pexels:['pexels.com'],
  pixabay:['pixabay.com'],
  wikimedia:['wikimedia.org'],
  nasa:['nasa.gov'],
  archive:['archive.org'],
};

export function allowedFootageUrl(raw:string,source?:FootageSource):URL{
  const url=new URL(raw),host=url.hostname.toLowerCase();
  const sources=source?[source]:Object.keys(allowedHosts) as FootageSource[];
  const valid=sources.some(id=>allowedHosts[id].some(domain=>host===domain||host.endsWith(`.${domain}`)));
  if(!valid)throw new Error(`FOOTAGE_URL_NOT_ALLOWED:${host}`);
  if(url.protocol==='http:')url.protocol='https:';
  if(url.protocol!=='https:')throw new Error(`FOOTAGE_URL_NOT_ALLOWED:${host}`);
  return url;
}

export async function fetchFootageUrl(raw:string|URL,init:RequestInit,timeoutMs:number,source?:FootageSource):Promise<Response>{
  const first=allowedFootageUrl(String(raw),source);let current=first;
  for(let redirects=0;redirects<=4;redirects++){
    const headers=new Headers(init.headers);
    if(current.hostname!==first.hostname)headers.delete('Authorization');
    const response=await fetch(current,{...init,headers,redirect:'manual',signal:AbortSignal.timeout(timeoutMs)});
    if(response.status<300||response.status>=400)return response;
    const location=response.headers.get('location');await response.body?.cancel();
    if(!location)throw new Error('FOOTAGE_REDIRECT_INVALID');
    current=allowedFootageUrl(new URL(location,current).toString(),source);
  }
  throw new Error('FOOTAGE_REDIRECT_LIMIT');
}

const clean=(value:unknown)=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim();
const enough=(duration:number,target:number)=>Number.isFinite(duration)&&duration+0.05>=target;

interface PexelsVideoFile{id:number;file_type?:string;width?:number;height?:number;link?:string}
interface PexelsVideo{id:number;duration:number;url:string;user:{name:string;url:string};video_files:PexelsVideoFile[]}
async function pexels(query:string,target:number,limit:number):Promise<FootageCandidate[]>{
  const key=process.env.PEXELS_API_KEY?.trim();if(!key)throw new Error('PEXELS_API_KEY_REQUIRED');
  const url=new URL('https://api.pexels.com/v1/videos/search');url.searchParams.set('query',query);url.searchParams.set('orientation','landscape');url.searchParams.set('size','medium');url.searchParams.set('per_page',String(Math.min(80,Math.max(1,limit))));
  const response=await fetchFootageUrl(url,{headers:{Authorization:key,Accept:'application/json'}},30_000,'pexels');
  if(!response.ok)throw new Error(`PEXELS_SEARCH_FAILED:${response.status}`);
  const data=await response.json() as {videos?:PexelsVideo[]};
  return(data.videos??[]).flatMap(video=>{
    if(!enough(video.duration,target)||!video.url||!video.user?.name||!video.user?.url)return[];
    allowedFootageUrl(video.url,'pexels');allowedFootageUrl(video.user.url,'pexels');
    const file=(video.video_files??[]).filter(item=>item.file_type==='video/mp4'&&item.link&&(item.width??0)>=1280&&(item.height??0)>=720)
      .sort((a,b)=>Number((b.width??0)>=(b.height??0))-Number((a.width??0)>=(a.height??0))||Math.abs((a.width??0)-1920)-Math.abs((b.width??0)-1920))[0];
    if(!file?.link)return[];allowedFootageUrl(file.link,'pexels');
    return[{source:'pexels' as const,externalId:String(video.id),pageUrl:video.url,creator:video.user.name,creatorUrl:video.user.url,downloadUrl:file.link,width:file.width!,height:file.height!,durationSeconds:video.duration,query,
      licenseName:'Pexels License',licenseUrl:'https://www.pexels.com/license/',commercialUse:true,modificationsAllowed:true,attributionRequired:false}];
  });
}

interface PixabayFile{url?:string;width?:number;height?:number;size?:number}
interface PixabayHit{id:number;pageURL:string;type?:string;duration:number;user?:string;user_id?:number;videos?:Record<string,PixabayFile>}
async function pixabay(query:string,target:number,limit:number):Promise<FootageCandidate[]>{
  const key=process.env.PIXABAY_API_KEY?.trim();if(!key)throw new Error('PIXABAY_API_KEY_REQUIRED');
  const url=new URL('https://pixabay.com/api/videos/');url.searchParams.set('key',key);url.searchParams.set('q',query);url.searchParams.set('lang','en');url.searchParams.set('video_type','film');url.searchParams.set('safesearch','true');url.searchParams.set('min_width','1280');url.searchParams.set('min_height','720');url.searchParams.set('per_page',String(Math.max(3,Math.min(200,limit))));
  const response=await fetchFootageUrl(url,{headers:{Accept:'application/json'}},30_000,'pixabay');if(!response.ok)throw new Error(`PIXABAY_SEARCH_FAILED:${response.status}`);
  const data=await response.json() as {hits?:PixabayHit[]};
  return(data.hits??[]).flatMap(hit=>{
    if(hit.type&&hit.type!=='film'||!enough(hit.duration,target)||!hit.pageURL)return[];
    const file=['large','medium','small'].map(name=>hit.videos?.[name]).find(item=>item?.url&&(item.width??0)>=1280&&(item.height??0)>=720);if(!file?.url)return[];
    allowedFootageUrl(hit.pageURL,'pixabay');allowedFootageUrl(file.url,'pixabay');const creator=hit.user?.trim()||'Pixabay contributor';
    return[{source:'pixabay' as const,externalId:String(hit.id),pageUrl:hit.pageURL,creator,creatorUrl:`https://pixabay.com/users/${encodeURIComponent(creator)}-${hit.user_id??0}/`,downloadUrl:file.url,width:file.width!,height:file.height!,durationSeconds:hit.duration,query,
      licenseName:'Pixabay Content License',licenseUrl:'https://pixabay.com/service/license-summary/',commercialUse:true,modificationsAllowed:true,attributionRequired:false}];
  });
}

type Meta={value?:string};
interface CommonsInfo{url?:string;descriptionurl?:string;mime?:string;width?:number;height?:number;extmetadata?:Record<string,Meta>}
interface CommonsPage{pageid:number;title:string;imageinfo?:CommonsInfo[]}
function commonsLicense(info:CommonsInfo):Pick<FootageCandidate,'licenseName'|'licenseUrl'|'commercialUse'|'modificationsAllowed'|'attributionRequired'>|undefined{
  const meta=info.extmetadata??{},name=clean(meta.LicenseShortName?.value||meta.UsageTerms?.value),url=clean(meta.LicenseUrl?.value);
  const pd=/public domain|^pd\b|cc0/i.test(name)||/publicdomain|\/zero\//i.test(url);
  const by=/^cc[ -]?by(?:[ -]?\d|$)|creativecommons attribution/i.test(name)||/creativecommons\.org\/licenses\/by\//i.test(url);
  if(!pd&&!by)return undefined;
  return{licenseName:name||'Public domain',licenseUrl:url||'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',commercialUse:true,modificationsAllowed:true,attributionRequired:!pd};
}
async function wikimedia(query:string,target:number,limit:number):Promise<FootageCandidate[]>{
  const url=new URL('https://commons.wikimedia.org/w/api.php');Object.entries({action:'query',format:'json',origin:'*',generator:'search',gsrnamespace:'6',gsrsearch:`${query} filetype:video`,gsrlimit:String(Math.min(50,Math.max(1,limit))),prop:'imageinfo',iiprop:'url|mime|size|extmetadata'}).forEach(([key,value])=>url.searchParams.set(key,value));
  const response=await fetchFootageUrl(url,{headers:{Accept:'application/json','Api-User-Agent':'HSLVideoStudio/1.0 (documentary footage research)'}},30_000,'wikimedia');if(!response.ok)throw new Error(`WIKIMEDIA_SEARCH_FAILED:${response.status}`);
  const data=await response.json() as {query?:{pages?:Record<string,CommonsPage>}};
  return Object.values(data.query?.pages??{}).flatMap(page=>{
    const info=page.imageinfo?.[0],license=info&&commonsLicense(info);if(!info?.url||!info.descriptionurl||!license||!info.mime?.startsWith('video/')||(info.width??0)<1280||(info.height??0)<720||(info.width??0)<(info.height??0))return[];
    const duration=Number(info.extmetadata?.Duration?.value??86400);if(!enough(duration,target))return[];allowedFootageUrl(info.url,'wikimedia');allowedFootageUrl(info.descriptionurl,'wikimedia');
    const creator=clean(info.extmetadata?.Artist?.value||info.extmetadata?.Credit?.value||'Wikimedia Commons contributor');
    return[{source:'wikimedia' as const,externalId:String(page.pageid),pageUrl:info.descriptionurl,creator,creatorUrl:info.descriptionurl,downloadUrl:info.url,width:info.width??1920,height:info.height??1080,durationSeconds:duration,query,...license}];
  });
}

interface NasaItem{data?:Array<{nasa_id?:string;title?:string;media_type?:string;center?:string;photographer?:string;secondary_creator?:string;copyright?:string}>;href?:string}
async function nasa(query:string,_target:number,limit:number):Promise<FootageCandidate[]>{
  const url=new URL('https://images-api.nasa.gov/search');url.searchParams.set('q',query);url.searchParams.set('media_type','video');url.searchParams.set('page_size',String(Math.min(100,Math.max(1,limit))));
  const response=await fetchFootageUrl(url,{headers:{Accept:'application/json'}},30_000,'nasa');if(!response.ok)throw new Error(`NASA_SEARCH_FAILED:${response.status}`);
  const data=await response.json() as {collection?:{items?:NasaItem[]}},results:FootageCandidate[]=[];
  for(const item of (data.collection?.items??[]).slice(0,limit)){
    const meta=item.data?.[0],id=meta?.nasa_id;if(!id||meta?.media_type!=='video')continue;
    if(meta.copyright&&!/^(nasa|public domain|u\.s\. government)$/i.test(meta.copyright.trim()))continue;
    const assetUrl=`https://images-api.nasa.gov/asset/${encodeURIComponent(id)}`,assetResponse=await fetchFootageUrl(assetUrl,{headers:{Accept:'application/json'}},30_000,'nasa');if(!assetResponse.ok)continue;
    const assets=await assetResponse.json() as {collection?:{items?:Array<{href?:string}>}};
    const links=(assets.collection?.items??[]).map(value=>value.href).filter((value):value is string=>!!value&&/\.(mp4|m4v|mov|webm)$/i.test(new URL(value).pathname));
    const downloadUrl=links.find(value=>/~orig\.mp4$/i.test(new URL(value).pathname))??links.find(value=>/\.mp4$/i.test(new URL(value).pathname))??links[0];if(!downloadUrl)continue;
    allowedFootageUrl(downloadUrl,'nasa');const pageUrl=`https://images.nasa.gov/details/${encodeURIComponent(id)}`,creator=meta.photographer||meta.secondary_creator||meta.center||'NASA';
    results.push({source:'nasa',externalId:id,pageUrl,creator,creatorUrl:'https://www.nasa.gov/',downloadUrl,width:1920,height:1080,durationSeconds:86400,query,
      licenseName:'NASA Media Usage Guidelines',licenseUrl:'https://www.nasa.gov/nasa-brand-center/images-and-media/',commercialUse:true,modificationsAllowed:true,attributionRequired:true});
  }
  return results;
}

interface ArchiveDoc{identifier?:string;title?:string;creator?:string;licenseurl?:string;description?:string}
interface ArchiveFile{name?:string;format?:string;width?:string|number;height?:string|number;length?:string|number;private?:string}
async function archive(query:string,target:number,limit:number):Promise<FootageCandidate[]>{
  const url=new URL('https://archive.org/advancedsearch.php');
  const licenseFilter='(licenseurl:"https://creativecommons.org/publicdomain/mark/1.0/" OR licenseurl:"https://creativecommons.org/publicdomain/zero/1.0/" OR licenseurl:"https://creativecommons.org/licenses/by/4.0/" OR licenseurl:"https://creativecommons.org/licenses/by/3.0/" OR licenseurl:"https://creativecommons.org/licenses/by/2.0/")';
  url.searchParams.set('q',`(${query}) AND mediatype:movies AND ${licenseFilter}`);url.searchParams.set('fl[]','identifier');url.searchParams.append('fl[]','title');url.searchParams.append('fl[]','creator');url.searchParams.append('fl[]','licenseurl');url.searchParams.set('rows',String(Math.min(50,Math.max(1,limit))));url.searchParams.set('output','json');
  const response=await fetchFootageUrl(url,{headers:{Accept:'application/json'}},30_000,'archive');if(!response.ok)throw new Error(`ARCHIVE_SEARCH_FAILED:${response.status}`);
  const data=await response.json() as {response?:{docs?:ArchiveDoc[]}};const results:FootageCandidate[]=[];
  for(const doc of data.response?.docs??[]){
    const id=doc.identifier,licenseUrl=doc.licenseurl;if(!id||!licenseUrl)continue;
    const metadata=await fetchFootageUrl(`https://archive.org/metadata/${encodeURIComponent(id)}`,{headers:{Accept:'application/json'}},30_000,'archive');if(!metadata.ok)continue;
    const payload=await metadata.json() as {metadata?:{licenseurl?:string;creator?:string;title?:string};files?:ArchiveFile[]};
    const effectiveLicense=payload.metadata?.licenseurl||licenseUrl;if(!/^https:\/\/creativecommons\.org\/(?:licenses\/by\/|publicdomain\/)/i.test(effectiveLicense))continue;
    const file=(payload.files??[]).filter(item=>!item.private&&item.name&&/\.(mp4|m4v|mov|webm|ogv)$/i.test(item.name)&&Number(item.width??0)>=1280&&Number(item.height??0)>=720)
      .sort((a,b)=>Math.abs(Number(a.width??1920)-1920)-Math.abs(Number(b.width??1920)-1920))[0];if(!file?.name)continue;
    const downloadUrl=`https://archive.org/download/${encodeURIComponent(id)}/${file.name.split('/').map(encodeURIComponent).join('/')}`;allowedFootageUrl(downloadUrl,'archive');
    const duration=Number(file.length??86400);if(!enough(duration,target))continue;const isBy=/\/licenses\/by\//i.test(effectiveLicense),creator=clean(payload.metadata?.creator||doc.creator||'Internet Archive contributor');
    results.push({source:'archive',externalId:id,pageUrl:`https://archive.org/details/${encodeURIComponent(id)}`,creator,creatorUrl:`https://archive.org/details/${encodeURIComponent(id)}`,downloadUrl,width:Number(file.width??1920),height:Number(file.height??1080),durationSeconds:duration,query,
      licenseName:isBy?'Creative Commons Attribution':'Public domain / CC0',licenseUrl:effectiveLicense,commercialUse:true,modificationsAllowed:true,attributionRequired:isBy});
  }
  return results;
}

export async function searchFootageSource(source:FootageSource,query:string,targetSeconds:number,limit:number):Promise<FootageCandidate[]>{
  if(source==='pexels')return pexels(query,targetSeconds,limit);
  if(source==='pixabay')return pixabay(query,targetSeconds,limit);
  if(source==='wikimedia')return wikimedia(query,targetSeconds,limit);
  if(source==='nasa')return nasa(query,targetSeconds,limit);
  return archive(query,targetSeconds,limit);
}
