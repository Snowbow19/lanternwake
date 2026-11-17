export const $=id=>document.getElementById(id);
export const formatTime=n=>`${Math.floor(Math.max(0,n)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,n)%60).toString().padStart(2,'0')}`;
export const medalName=n=>['Uncharted','Bronze','Silver','Gold'][n]||'Uncharted';
export function button(label,action,className='launch'){const b=document.createElement('button');b.className=className;b.textContent=label;b.addEventListener('click',action);return b;}
export function text(id,value){const node=$(id);if(node.textContent!==String(value))node.textContent=String(value);}
