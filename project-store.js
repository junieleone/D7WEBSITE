// Local project snapshots are separate from the single autosaved working session.
let database;
function openDatabase(){
  if(!database) database=new Promise((resolve,reject)=>{
    const request=indexedDB.open('pace-saved-projects',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('projects',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>{database=null;reject(request.error);};
  });
  return database;
}
async function transaction(mode,action){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('projects',mode),request=action(tx.objectStore('projects'));
    tx.oncomplete=()=>resolve(request.result);
    tx.onerror=()=>reject(tx.error||request.error);
    tx.onabort=()=>reject(tx.error||new Error('Project storage was interrupted.'));
  });
}
export const storeProject=record=>transaction('readwrite',store=>store.put(record));
export const listProjects=()=>transaction('readonly',store=>store.getAll());
export const getProject=id=>transaction('readonly',store=>store.get(id));
