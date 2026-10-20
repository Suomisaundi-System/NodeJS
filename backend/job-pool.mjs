import {randomUUID} from "node:crypto";
// Trusted process only. In-memory scheduler; not a durable production queue.
export class JobPool {
  #jobs=new Map(); #workers=new Map(); #leases=new Map();
  constructor({leaseMs=30000,maxAttempts=3,maxQueued=1000}={}){
    if(!Number.isInteger(leaseMs)||leaseMs<1000)throw Error("Invalid leaseMs");
    this.leaseMs=leaseMs;this.maxAttempts=maxAttempts;this.maxQueued=maxQueued;
  }
  submit({kind,payload={},group="default"}){
    if(typeof kind!=="string"||!/^[a-z0-9_.-]{1,64}$/i.test(kind))throw Error("Invalid kind");
    if(this.#jobs.size>=this.maxQueued)throw Error("Queue full");
    const job={id:randomUUID(),kind,payload:structuredClone(payload),group,status:"queued",attempts:0,createdAt:Date.now()};
    this.#jobs.set(job.id,job);return {id:job.id,status:job.status};
  }
  register({id=randomUUID(),group="default",capacity=1}={}){
    if(this.#workers.has(id))throw Error("Worker exists");
    if(!Number.isInteger(capacity)||capacity<1||capacity>32)throw Error("Invalid capacity");
    this.#workers.set(id,{id,group,capacity,lastSeen:Date.now()});return id;
  }
  heartbeat(id){const w=this.#workers.get(id);if(!w)throw Error("Unknown worker");w.lastSeen=Date.now();}
  claim(id){
    this.reap();
    const w=this.#workers.get(id);
    if(!w||Date.now()-w.lastSeen>this.leaseMs*2)throw Error("Worker unavailable");
    if([...this.#leases.values()].filter(x=>x.workerId===id).length>=w.capacity)return null;
    const job=[...this.#jobs.values()].find(x=>x.status==="queued"&&x.group===w.group);
    if(!job)return null;
    job.status="running";job.attempts++;
    const leaseId=randomUUID();
    this.#leases.set(job.id,{leaseId,workerId:id,expiresAt:Date.now()+this.leaseMs});
    return {...structuredClone(job),leaseId};
  }
  complete(workerId,jobId,leaseId,result){
    const lease=this.#leases.get(jobId),job=this.#jobs.get(jobId);
    if(!lease||!job||lease.workerId!==workerId||lease.leaseId!==leaseId||lease.expiresAt<=Date.now())throw Error("Invalid lease");
    job.status="completed";job.result=structuredClone(result);job.completedAt=Date.now();this.#leases.delete(jobId);
    return {id:jobId,status:job.status};
  }
  fail(workerId,jobId,leaseId,reason="worker error"){
    const lease=this.#leases.get(jobId),job=this.#jobs.get(jobId);
    if(!lease||!job||lease.workerId!==workerId||lease.leaseId!==leaseId||lease.expiresAt<=Date.now())throw Error("Invalid lease");
    this.#leases.delete(jobId);job.status=job.attempts>=this.maxAttempts?"failed":"queued";job.error=String(reason).slice(0,200);
    return {id:jobId,status:job.status};
  }
  reap(){
    const now=Date.now();
    for(const [id,lease] of this.#leases)if(lease.expiresAt<=now){
      this.#leases.delete(id);const job=this.#jobs.get(id);
      if(job)job.status=job.attempts>=this.maxAttempts?"failed":"queued";
    }
    for(const [id,w] of this.#workers)if(now-w.lastSeen>this.leaseMs*2)this.#workers.delete(id);
  }
  status(){this.reap();return {jobs:[...this.#jobs.values()].map(({id,kind,group,status,attempts})=>({id,kind,group,status,attempts})),workers:[...this.#workers.values()].map(({id,group,capacity,lastSeen})=>({id,group,capacity,lastSeen}))};}
}
