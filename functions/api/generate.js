const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

function json(data, status = 200){
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

export function onRequestOptions(){
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context){
  try{
    const env = context.env || {};
    const provider = String(env.AI_PROVIDER || env.LLM_PROVIDER || 'deepseek').toLowerCase();
    const defaults = {
      deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
      minimax: { baseUrl: 'https://api.minimax.io/v1', model: 'MiniMax-M1' },
      openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
      custom: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' }
    };
    const preset = defaults[provider] || defaults.deepseek;

    const providerConfig = {
      deepseek: {
        apiKey: env.DEEPSEEK_API_KEY,
        baseUrl: env.DEEPSEEK_BASE_URL,
        model: env.DEEPSEEK_MODEL
      },
      minimax: {
        apiKey: env.MINIMAX_API_KEY,
        baseUrl: env.MINIMAX_BASE_URL,
        model: env.MINIMAX_MODEL
      },
      openai: {
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_BASE_URL,
        model: env.OPENAI_MODEL
      },
      custom: {
        apiKey: env.AI_API_KEY,
        baseUrl: env.AI_BASE_URL,
        model: env.AI_MODEL
      }
    };
    const cfg = providerConfig[provider] || providerConfig.deepseek;
    const apiKey = String(cfg.apiKey || env.AI_API_KEY || '').trim();
    const baseUrl = String(cfg.baseUrl || env.AI_BASE_URL || preset.baseUrl).trim().replace(/\/$/, '');
    const model = String(cfg.model || env.AI_MODEL || preset.model).trim();

    if(!apiKey){
      return json({ error: `服务端未配置 ${provider} 的 API Key。请检查环境变量。`, provider, baseUrl, model }, 500);
    }

    const body = await context.request.json();
    const transcript = String(body.transcript || '').slice(0, 12000);
    const count = Math.max(1, Math.min(20, Number(body.count || 6)));
    if(!transcript.trim()) return json({ error: '缺少 transcript' }, 400);

    const systemPrompt = `你是「发售同传小助手」，专门服务直播发售场景。

你必须基于以下 SOP 生成文案：
1. 同传不是搬运逐字稿，而是缩短信任链、营造氛围、推动进房/互动/下单。
2. 每条社群同传文案要短，适合微信社群，不写大段文章。
3. 每条社群文案尽量带直播入口/会议号。如果用户未提供入口，用「入口 👉 {请补充直播入口}」。
4. 判断每条文案主要调动：从众心理、损失厌恶、好奇、用户证言、信任建立。
5. 干货/PPT/图表节点要「犹抱琵琶半遮面」：只透露一半，提醒截图遮住核心步骤，引导进直播间看完整版。
6. 福利/中奖/下单节点要突出价值、名额、限时、错过成本，但不得编造价格、名额、下单人数。
7. 异议解除要温和，不硬怼，不制造冲突。
8. 多群同传要提醒「可以转这条」「✅ a1-a9 已同传完毕」。
9. 所有数据、案例、价格、名额，只能使用用户提供的信息；不确定就写成占位提醒。
10. 输出必须是严格 JSON，不要 Markdown 代码块。`;

    const userPrompt = {
      task: `请根据直播逐字稿/现场信息，按模板规则生成 ${count} 份社群同传文案推荐，并额外生成评论区话术。`,
      currentStage: body.stage || 'auto',
      stageInput: body.stageInput || 'auto',
      teacher: body.teacher || '',
      entry: body.entry || '',
      offer: body.offer || '',
      tone: body.tone || '新手稳妥，短句，真实不夸张',
      transcript,
      outputSchema: {
        stage: 'preheat/opening/content/benefit/order/objection/ending',
        stageLabel: '中文场景判断',
        psychology: '本节点主要调动的心理',
        materialAdvice: '截图/素材建议',
        rhythmTip: '节奏提醒',
        communityCopies: [`${count}条社群同传文案，每条可直接复制，尽量带入口`],
        commentCopies: ['3-6条直播间评论区/侧面种草话术'],
        collabTips: ['1-3条多群协作提醒']
      }
    };

    const requestBody = {
      model,
      temperature: 0.85,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPrompt, null, 2) }
      ]
    };

    // DeepSeek / OpenAI 通常支持 JSON mode；MiniMax 兼容接口不强依赖该参数，用提示词约束 JSON。
    if(provider !== 'minimax' && String(env.AI_JSON_MODE || 'true') !== 'false'){
      requestBody.response_format = { type: 'json_object' };
    }

    // MiniMax 部分模型可能返回 thinking；关闭以避免干扰 JSON 解析。
    if(provider === 'minimax'){
      requestBody.thinking = { type: 'disabled' };
      requestBody.max_completion_tokens = Number(env.AI_MAX_TOKENS || 4096);
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await upstream.json().catch(() => ({}));
    if(!upstream.ok){
      return json({
        error: result.error?.message || result.base_resp?.status_msg || `AI 接口错误：${upstream.status}`,
        provider,
        baseUrl,
        model
      }, upstream.status);
    }

    let content = result.choices?.[0]?.message?.content || '{}';
    content = String(content).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    let parsed;
    try{
      parsed = JSON.parse(content);
    }catch(e){
      const match = content.match(/\{[\s\S]*\}/);
      if(match){
        try{ parsed = JSON.parse(match[0]); }
        catch(e2){ parsed = { text: content }; }
      }else{
        parsed = { text: content };
      }
    }
    parsed.provider = provider;
    parsed.model = model;
    return json(parsed);
  }catch(err){
    return json({ error: err.message || '服务器异常' }, 500);
  }
}
