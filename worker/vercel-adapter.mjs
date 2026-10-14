const defaults=Object.freeze({AI_API_BASE_URL:'https://api.openai.com/v1',AI_MODEL:'gpt-6-luna'});

export function vercelEnvironment(env=process.env){
 return {
  AI_API_BASE_URL:env.AI_API_BASE_URL||defaults.AI_API_BASE_URL,
  AI_MODEL:env.AI_MODEL||defaults.AI_MODEL,
  AI_API_KEY:env.AI_API_KEY,
  OPENAI_API_KEY:env.OPENAI_API_KEY,
  AI_VOICE_KEY:env.AI_VOICE_KEY,
  AI_VOICE_ID:env.AI_VOICE_ID,
 };
}

export function vercelRequest(request){
 const headers=new Headers(request.headers);
 // Vercel overwrites x-forwarded-for; ignore a caller-supplied Cloudflare header.
 // https://vercel.com/docs/headers/request-headers
 const clientIp=headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 headers.set('cf-connecting-ip',clientIp);
 return new Request(request,{headers});
}
