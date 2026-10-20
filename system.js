export const system=location.pathname.split("/").filter(Boolean)[0] || "System";
export const capabilities=Object.freeze({
  orientation:screen.orientation?.type || (innerWidth>innerHeight?"landscape":"portrait"),
  viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visualWidth:visualViewport?.width??innerWidth},
  touch:navigator.maxTouchPoints>0,
  mobile:navigator.userAgentData?.mobile??/Android|iPhone|Mobile/i.test(navigator.userAgent),
  pointerFine:matchMedia("(pointer:fine)").matches,
  pointerCoarse:matchMedia("(pointer:coarse)").matches,
  mime:typeof Blob!=="undefined",
  url:typeof URL!=="undefined",
  fetch:typeof fetch==="function",
  workers:typeof Worker!=="undefined",
  indexedDB:typeof indexedDB!=="undefined",
  serviceWorkers:"serviceWorker" in navigator,
  webAssembly:typeof WebAssembly!=="undefined"
});
export function createElement(tag,text=""){const el=document.createElement(tag);el.textContent=text;return el;}
export function injectCSS(css){const el=document.createElement("style");el.textContent=String(css);document.head.append(el);return el;}
export function parseURI(value,base=location.href){const u=new URL(value,base);return {href:u.href,origin:u.origin,protocol:u.protocol,pathname:u.pathname,search:u.search,hash:u.hash};}
export function detectMIME(file){return file?.type||"application/octet-stream";}
export function createBrowserSandbox(source,{name="suomisaundi-sandbox"}={}){
  if(typeof Worker==="undefined") throw new Error("Workers unavailable");
  const blob=new Blob([String(source)],{type:"text/javascript"});
  const url=URL.createObjectURL(blob);
  const worker=new Worker(url,{name});
  URL.revokeObjectURL(url);
  return worker; // worker isolation is not a security boundary for untrusted code.
}
export const localPool=typeof BroadcastChannel==="function"?new BroadcastChannel("suomisaundi-system-v1"):null;
export function sendLocal(type,payload=null){localPool?.postMessage({protocol:"suomisaundi-system-v1",source:system,type,payload,timestamp:Date.now()});}
