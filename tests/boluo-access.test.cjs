const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createAccess}=require('../assets/boluo-access.js');

function setup(base='https://zhanglingshare.github.io/boluo-simulator/') {
  const entries=new Map([['boluo-observations','keep my questions']]);
  const storage={
    getItem:key=>entries.get(key)||null,
    setItem:(key,value)=>entries.set(key,value),
    removeItem:key=>entries.delete(key)
  };
  let time=1000;
  return {entries,storage,access:createAccess({baseUrl:base,storage,now:()=>time}),tick:()=>{time+=86400001;}};
}

test('public account accepts the provided password, keeps passwords out of storage, and expires',()=>{
  const s=setup();
  assert.equal(s.access.login('boluo','000000').ok,false);
  assert.equal(s.access.session(),null);
  assert.equal(s.access.login('boluo','123456').ok,true);
  assert.equal(s.access.session().account,'boluo');
  assert.ok([...s.entries.values()].every(value=>!value.includes('123456')));
  s.tick();
  assert.equal(s.access.session(),null);
});

test('return links preserve page, event, query and hash through login and logout',()=>{
  const s=setup();
  const target='https://zhanglingshare.github.io/boluo-simulator/v11/relations.html?change=C004&from=reality#network';
  const entry=new URL(s.access.loginUrl(target,true));
  assert.equal(entry.searchParams.get('next'),target);
  assert.equal(entry.searchParams.get('logout'),'1');
  assert.equal(s.access.nextUrl(entry.searchParams.get('next')),target);
  assert.equal(s.access.nextUrl('v11/wind.html?seed=42#experiment'),
    'https://zhanglingshare.github.io/boluo-simulator/v11/wind.html?seed=42#experiment');
});

test('return targets cannot leave this project or loop through the entrance',()=>{
  const s=setup();
  for(const target of [
    'https://example.org/','//example.org/','javascript:alert(1)',
    '/huicheng-simulator/index.html','/grade7-math-visualized/',
    '../index.html','v11/%2e%2e/%2e%2e/index.html',
    'v11/%2f..%2f..%2findex.html','https://visitor@zhanglingshare.github.io/boluo-simulator/v11/index.html',
    'assets/boluo-access.js'
  ]) assert.equal(s.access.nextUrl(target),s.access.home,target);
  assert.equal(new URL(s.access.nextUrl('login.html?next=login.html')).pathname,
    '/boluo-simulator/v11/index.html');
});

test('logout removes only the experience session and retains saved user work',()=>{
  const s=setup();
  s.access.login('boluo','123456');
  const anotherPage=createAccess({baseUrl:'https://zhanglingshare.github.io/boluo-simulator/',storage:s.storage,now:()=>1000});
  assert.ok(s.access.session());
  assert.ok(anotherPage.session());
  assert.equal(s.access.logout(),true);
  assert.equal(anotherPage.session(),null);
  assert.equal(s.entries.get('boluo-observations'),'keep my questions');
});

test('unavailable storage reports failure instead of producing a redirect loop',()=>{
  const access=createAccess({baseUrl:'https://preview.test/',storage:{
    getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}
  }});
  assert.equal(access.session(),null);
  assert.deepEqual(access.login('boluo','123456'),{ok:false,reason:'storage'});
  assert.equal(access.logout(),false);
  assert.equal(access.nextUrl('//example.org/'),access.home);
});
