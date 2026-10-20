import test from "node:test";
import assert from "node:assert/strict";
import {JobPool} from "./job-pool.mjs";
test("submit claim and complete",()=>{
 const p=new JobPool();const id=p.register({group:"audio"});const j=p.submit({kind:"encode",group:"audio"});
 const claimed=p.claim(id);assert.equal(claimed.id,j.id);
 assert.equal(p.claim(id),null);
 assert.equal(p.complete(id,j.id,claimed.leaseId,{ok:true}).status,"completed");
 assert.equal(p.status().jobs[0].status,"completed");
});
test("failed job retries",()=>{
 const p=new JobPool({maxAttempts:2});const id=p.register();const j=p.submit({kind:"test"});
 const a=p.claim(id);assert.equal(p.fail(id,j.id,a.leaseId).status,"queued");
 const b=p.claim(id);assert.equal(p.fail(id,j.id,b.leaseId).status,"failed");
});
test("capacity and group isolation",()=>{
 const p=new JobPool();const id=p.register({group:"one",capacity:1});
 p.submit({kind:"task",group:"two"});assert.equal(p.claim(id),null);
 p.submit({kind:"task",group:"one"});assert.ok(p.claim(id));assert.equal(p.claim(id),null);
});
test("reject invalid job kind",()=>assert.throws(()=>new JobPool().submit({kind:"../../bad"})));
