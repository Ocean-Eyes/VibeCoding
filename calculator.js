(() => {
  const $ = id => document.getElementById(id);
  const symbols = {'+':'+','-':'−','*':'×','/':'÷'};
  let input='0', accumulator=null, operator=null, fresh=false, failed=false, expression='READY FOR TAKEOFF', history=[];
  const normalize = n => {if(!Number.isFinite(n)) throw Error('계산 가능한 범위를 벗어났어요.'); return String(Number(n.toPrecision(12)));};
  const calculate = (a,b,op) => {if(op==='/' && b===0) throw Error('0으로 나눌 수 없어요. AC로 다시 시작하세요.');return normalize(op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b);};
  function render(){ $('result').textContent=input; $('result').classList.toggle('compact',input.length>11); $('expression').textContent=expression; document.querySelectorAll('[data-key]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.key===operator))); }
  function updateSpace(burst=false){window.dispatchEvent(new CustomEvent('orbit-value',{detail:{value:Number(input)||0,burst}}));}
  function renderHistory(){ $('history').replaceChildren(); $('history-count').textContent=String(history.length).padStart(2,'0'); if(!history.length){const p=document.createElement('p');p.className='empty-history';p.textContent='첫 계산을 마치면 이곳에 궤적이 남아요.';$('history').append(p);} history.forEach(row=>{const b=document.createElement('button');b.className='history-row';b.title='이 결과 다시 사용하기';const s=document.createElement('span');s.textContent=row.expression;const v=document.createElement('strong');v.textContent=row.result+' ↗';b.append(s,v);b.onclick=()=>{input=row.result;accumulator=null;operator=null;fresh=true;failed=false;expression='비행 기록에서 불러옴';$('message').textContent='이 숫자로 계속 계산할 수 있어요.';render();updateSpace();};$('history').append(b);}); }
  function press(key){
    if(failed && key!=='clear' && !/^\d$/.test(key)) return;
    if(failed){input='0';accumulator=null;operator=null;fresh=false;failed=false;expression='READY FOR TAKEOFF';}
    $('message').textContent='숫자가 새로운 궤도를 만들고 있어요.';
    try{
      if(key==='clear'){input='0';accumulator=null;operator=null;fresh=false;expression='READY FOR TAKEOFF';$('message').textContent='새로운 우주를 시작해볼까요?';}
      else if(/^\d$/.test(key) || key==='.'){
        if(fresh){input='0';fresh=false;if(!operator) expression='새로운 비행';}
        if(key==='.' && input.includes('.')) return;
        if(input.replace(/[-.]/g,'').length>=12) return;
        input=key==='.'?input+'.':input==='0'?key:input==='-0'?'-'+key:input+key;
      }
      else if(key==='back'){if(fresh) return;input=input.slice(0,-1);if(!input || input==='-')input='0';}
      else if(key==='sign'){input=normalize(-Number(input));if(fresh && operator) fresh=false;}
      else if(key==='percent'){input=normalize(Number(input)/100);if(fresh && operator)fresh=false;$('message').textContent='%는 현재 숫자를 100으로 나눕니다.';}
      else if(symbols[key]){if(operator && !fresh)input=calculate(accumulator,Number(input),operator);accumulator=Number(input);operator=key;expression=input+' '+symbols[key];fresh=true;}
      else if(key==='='){if(!operator || fresh)return;const equation=accumulator+' '+symbols[operator]+' '+input;input=calculate(accumulator,Number(input),operator);expression=equation+' =';operator=null;accumulator=null;fresh=true;history.unshift({expression:equation,result:input});history=history.slice(0,8);renderHistory();$('message').textContent='계산 완료. 새로운 행성이 탄생했어요 ✧';}
      render();updateSpace(key==='=');
    }catch(error){input='Error';expression='궤도 이탈';failed=true;operator=null;accumulator=null;$('message').textContent=error.message;render();}
  }
  document.querySelectorAll('[data-key]').forEach(b=>b.addEventListener('click',()=>press(b.dataset.key)));
  document.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select'))return;if(event.key==='Enter'&&event.target.tagName==='BUTTON'&&!event.target.hasAttribute('data-key'))return;const key=({'Enter':'=','Escape':'clear','Backspace':'back','Delete':'clear','%':'percent'})[event.key]||event.key;if(!/^\d$/.test(key)&&!['.','+','-','*','/','=','clear','back','percent'].includes(key))return;event.preventDefault();press(key);const b=[...document.querySelectorAll('[data-key]')].find(b=>b.dataset.key===key);if(b){b.classList.add('pressed');setTimeout(()=>b.classList.remove('pressed'),120);}});
  $('clear-history').onclick=()=>{history=[];renderHistory();};
  $('random').onclick=()=>{input=String(Math.floor(Math.random()*9999)+1);operator=null;accumulator=null;fresh=true;failed=false;expression='RANDOM DISCOVERY';$('message').textContent='발견한 숫자로 계산을 이어가세요.';render();updateSpace(true);};
  render();
})();
