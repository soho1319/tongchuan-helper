const $ = (id) => document.getElementById(id);

const stageNames = {
  preheat: '开播前预热', opening: '开播初期拉在线', content: '金句/干货节点',
  benefit: '福利/中奖节点', order: '下单/跟单节点', objection: '异议解除', ending: '下播收尾'
};

const psychology = {
  preheat: '好奇 + 价值预期', opening: '从众心理', content: '好奇 + 损失厌恶',
  benefit: '损失厌恶', order: '从众心理 + 损失厌恶', objection: '信任建立 + 异议解除', ending: '余温承接 + 跟单转化'
};

function clean(s){ return (s || '').trim(); }
function compact(s, max=42){
  s = clean(s).replace(/\s+/g, ' ');
  return s.length > max ? s.slice(0, max) + '…' : s;
}
function pickStage(text, selected){
  if(selected !== 'auto') return selected;
  const t = text || '';
  if(/下单|付款|成交|上车|购买|名额|订单/.test(t)) return 'order';
  if(/福利|福袋|赠品|中奖|抽奖|倒计时|仅剩|限时/.test(t)) return 'benefit';
  if(/顾虑|担心|质疑|太贵|没时间|没效果|退款|付款|扫码|冻结/.test(t)) return 'objection';
  if(/结束|下播|回放|明天|下一场|收尾/.test(t)) return 'ending';
  if(/开播|刚开始|人数|在线|评论区|刷屏/.test(t)) return 'opening';
  if(/PPT|图|表|方法|观点|金句|认知|案例|核心/.test(t)) return 'content';
  return 'content';
}
function entryText(entry){ return entry ? `\n入口 👉 ${entry}` : '\n入口 👉 {请填写会议号/直播链接}'; }
function teacherText(t){ return t || '老师'; }
function offerText(o){ return o || '本场福利/名额'; }
function getCollabRanges(){
  const raw = clean($('collabRanges')?.value || '');
  return raw ? raw.split(/[\n,，、;；]+/).map(x=>x.trim()).filter(Boolean) : ['a1-a9'];
}
function collabText(){
  const ranges = getCollabRanges();
  return '可以转这条\n\n' + ranges.map(r => `✅ ${r} 已同传完毕`).join('\n') + '\n⚠️ 有异常及时在同传官群上报';
}

function templates(stage, ctx){
  const {teacher, entry, offer, text, hook} = ctx;
  const e = entryText(entry), T = teacherText(teacher), O = offerText(offer);
  const point = compact(text, 50) || '刚刚这段内容';
  const shortPoint = compact(text, 28) || '这个关键点';
  const map = {
    preheat: [
      `今晚这场真的建议提前锁定！\n${T}会把「${shortPoint}」讲透${e}`,
      `开播前提醒一下：\n如果你正好卡在「${shortPoint}」这个问题上，今晚别错过${e}`,
      `${T}今晚不是泛泛而谈，会直接拆解决方案。\n提前 5 分钟进来，占个好位置${e}`,
      `红包/预告可以发了：\n今晚重点讲 ${shortPoint}\n想听完整拆解的家人先进去${e}`
    ],
    opening: [
      `绝了，刚开播就热起来了！\n大家都在听 ${T} 讲「${shortPoint}」${e}`,
      `开播没多久，直播间已经开始刷屏。\n还没进来的家人，真的别等讲完才后悔${e}`,
      `这场越听越有东西。\n尤其刚刚 ${T} 讲的这个点，评论区都在共鸣${e}`,
      `现在进来刚刚好，前面还没错过太多。\n直接来听 ${T} 现场拆解${e}`
    ],
    content: [
      `颠覆认知！\n${T}刚刚讲的这个点太关键：${point}\n完整版一定要进直播间听${e}`,
      `扎心了。\n我们以前可能都把问题想简单了，${T}刚刚这段是在拆底层原因${e}`,
      `这个 PPT/观点不要只看截图。\n我建议进直播间听 ${T} 讲完整逻辑，不然容易断章取义${e}`,
      `刚刚这句值得记下来：\n${point}\n后面的解决方法更关键${e}`
    ],
    benefit: [
      `${T}这波太大气了！🎁\n${O}\n名额/时间有限，手慢真的可能没有${e}`,
      `福利节点到了！\n不是普通资料，是跟今晚主题强相关的 ${O}\n需要的家人现在进${e}`,
      `别等名单出来才后悔。\n${T}现在正在发福利，错过就只能看别人领了${e}`,
      `中奖/福利开始滚动了。\n已经进来的家人在抢，还没来的赶紧${e}`
    ],
    order: [
      `恭喜刚刚上车的家人！🎉\n又有人抢到 ${O}\n还在观望的，先把问题问清楚${e}`,
      `直播间已经有人行动了。\n不是催你冲动下单，而是这套方案确实解决「${shortPoint}」${e}`,
      `又一位家人锁定名额。\n如果你也有同样问题，建议现在进来听完再决定${e}`,
      `名额在动了。\n真正需要的人，别只在群里看截图，进直播间听完整说明${e}`
    ],
    objection: [
      `这个顾虑很多人都会有：${shortPoint}\n建议直接进直播间听 ${T} 现场解释，会比群里几句话更清楚${e}`,
      `不是你一个人担心这个问题。\n刚好 ${T} 现在可以把适合/不适合的人群讲明白${e}`,
      `关于「${shortPoint}」，不要自己猜。\n进直播间把细节问清楚，再决定也不迟${e}`,
      `有疑问很正常，尤其涉及孩子/成长/付费决策。\n先听 ${T} 怎么拆，再判断适不适合${e}`
    ],
    ending: [
      `今晚这场信息量很大。\n没听完整的家人，可以先蹲回放/下一场通知${e}`,
      `下播前提醒：今天讲的核心不是鸡血，而是方法。\n有同类问题的家人可以私聊我梳理${e}`,
      `今晚有互动但还没决定的家人，建议把你的问题发我。\n我帮你判断该听哪一段/问哪个点${e}`,
      `今天先收个尾。\n${T}讲到的「${shortPoint}」后面还会继续延展，别错过下一场${e}`
    ]
  };
  return map[stage];
}

function comments(stage, ctx){
  const T = teacherText(ctx.teacher), point = compact(ctx.text, 36) || '这个点';
  const map = {
    preheat:[`期待 ${T} 今晚把这个问题讲透`,`我先蹲住，感觉今晚会很有料`,`有同样问题的家人可以一起听`],
    opening:[`刚进来就听到重点了`,`评论区好多同频的家人`,`这场建议认真听，别后台播放`],
    content:[`这句真的戳到我了`,`原来 ${point} 还能这么理解`,`这个观点建议展开讲讲`],
    benefit:[`这个福利老学员都羡慕了`,`手慢无啊家人们`,`这个赠品跟今晚主题太匹配了`],
    order:[`已经有人上车了，说明大家真有需求`,`先听清楚再决定，很理性`,`这个名额适合真正需要的人`],
    objection:[`这个问题我也想问`,`替大家问一下，具体怎么落地？`,`能不能讲讲适合和不适合的人？`],
    ending:[`今晚收获很大`,`没听全的建议看回放`,`期待下一场继续讲`]
  };
  return map[stage];
}

function materialAdvice(stage){
  const map = {
    preheat:'发红包封面 + 讲师身份/主题海报；入口要清晰露出。',
    opening:'截直播间人数和评论区刷屏，红框圈出人数/高共鸣评论。',
    content:'截 PPT/金句，但干货图表遮住关键步骤，只露一半。',
    benefit:'截福利页、福袋、中奖名单；圈价值、名额、截止时间。',
    order:'截下单提示/订单滚动/用户反馈；注意打码。',
    objection:'截典型问题，不曝光隐私；用统一话术回应。',
    ending:'截讲师收尾页、回放/下一场预告、核心金句。'
  };
  return map[stage];
}

function render(){
  const raw = clean($('transcript').value);
  const stage = pickStage(raw, $('stage').value);
  const ctx = { teacher: clean($('teacher').value), entry: clean($('entry').value), offer: clean($('offer').value), text: raw };
  const useLargeLaunch = $('largeLaunch')?.checked;
  const list = templates(stage, ctx);
  const coms = comments(stage, ctx);
  $('analysis').style.display = 'block';
  $('analysis').innerHTML = `<b>场景判断：</b>${stageNames[stage]}<br><b>调动心理：</b>${psychology[stage]}<br><b>截图建议：</b>${materialAdvice(stage)}${useLargeLaunch ? '<br><b>多群协作：</b>如果要一转九，请在主同传官群补一句「可以转这条」，助手转完按你填写的范围回传。' : ''}`;
  const cards = [];
  list.forEach((v,i)=>cards.push({title:`社群同传文案 ${i+1}`, text:v}));
  coms.forEach((v,i)=>cards.push({title:`评论区话术 ${i+1}`, text:v}));
  cards.push({title:'截图/素材提醒', text:materialAdvice(stage)});
  if(useLargeLaunch){
    cards.push({title:'协作回传格式', text: collabText()});
  }
  $('results').innerHTML = cards.map((c,idx)=>`<article class="copy-card"><button data-copy="${idx}">复制</button><h3>${c.title}</h3><p>${c.text}</p></article>`).join('');
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copyText(cards[btn.dataset.copy].text, btn)));
}

function copyText(text, btn){
  navigator.clipboard.writeText(text).then(()=>{ const old=btn.textContent; btn.textContent='已复制'; setTimeout(()=>btn.textContent=old,900); });
}

$('generate').addEventListener('click', render);
$('generateAI').addEventListener('click', renderAI);
$('copyAll').addEventListener('click', () => {
  const text = [...document.querySelectorAll('.copy-card')].map(card => card.innerText.replace('复制\n','')).join('\n\n---\n\n');
  if(text) navigator.clipboard.writeText(text);
});
$('clear').addEventListener('click', () => { ['teacher','entry','offer','transcript'].forEach(id=>$(id).value=''); $('results').innerHTML=''; $('analysis').style.display='none'; });
$('resetChecks').addEventListener('click', () => document.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=false));
$('largeLaunch').addEventListener('change', () => $('collabRangesWrap').classList.toggle('hidden', !$('largeLaunch').checked));
document.querySelectorAll('.step').forEach(step => step.addEventListener('click', e => {
  if(e.target.tagName !== 'INPUT') $('stage').value = step.dataset.stage;
  document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));
  step.classList.add('active');
}));

async function renderAI(){
  const btn = $('generateAI');
  const raw = clean($('transcript').value);
  if(!raw){ alert('请先粘贴直播逐字稿/现场信息'); return; }
  const payload = {
    stage: pickStage(raw, $('stage').value),
    stageInput: $('stage').value,
    teacher: clean($('teacher').value),
    entry: clean($('entry').value),
    offer: clean($('offer').value),
    transcript: raw,
    count: Math.max(1, Math.min(20, Number($('count')?.value || 6))),
    tone: clean($('tone')?.value || '新手稳妥，短句，真实不夸张'),
    largeLaunch: Boolean($('largeLaunch')?.checked),
    collabRanges: getCollabRanges()
  };
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'AI 生成中…';
  $('analysis').style.display = 'block';
  $('analysis').innerHTML = '正在调用 AI，根据 SOP 和模板规则生成同传文案…';
  try{
    const res = await fetch('/api/generate', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error || `请求失败：${res.status}`);
    renderAIResult(data, payload);
  }catch(err){
    $('analysis').innerHTML = `<b>AI 生成失败：</b>${err.message}<br>已保留「本地模板兜底」按钮，可先用规则模板生成。`;
  }finally{
    btn.disabled = false;
    btn.textContent = old;
  }
}

function renderAIResult(data, payload){
  const stage = data.stage || payload.stage;
  $('analysis').style.display = 'block';
  $('analysis').innerHTML = `<b>场景判断：</b>${data.stageLabel || stageNames[stage] || stage}<br><b>调动心理：</b>${data.psychology || psychology[stage] || ''}<br><b>截图建议：</b>${data.materialAdvice || materialAdvice(stage)}<br><b>节奏提醒：</b>${data.rhythmTip || (payload.largeLaunch ? '短文案、有呼吸感、带入口；多群转发需等待回传。' : '短文案、有呼吸感、带入口；单群/小场不需要输出协作回传格式。')}`;
  const cards = [];
  (data.communityCopies || []).forEach((v,i)=>cards.push({title:`AI 社群同传 ${i+1}`, text:v}));
  (data.commentCopies || []).forEach((v,i)=>cards.push({title:`AI 评论区话术 ${i+1}`, text:v}));
  if(payload.largeLaunch){
    (data.collabTips || []).forEach((v,i)=>cards.push({title:`协作提醒 ${i+1}`, text:v}));
  }
  if(!cards.length && data.text){ cards.push({title:'AI 结果', text:data.text}); }
  $('results').innerHTML = cards.map((c,idx)=>`<article class="copy-card"><button data-copy="${idx}">复制</button><h3>${c.title}</h3><p>${c.text}</p></article>`).join('');
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copyText(cards[btn.dataset.copy].text, btn)));
}

