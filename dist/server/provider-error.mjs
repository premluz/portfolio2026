const publicCodes=new Set([
 'insufficient_quota','credit_balance_exhausted','billing_hard_limit_reached',
 'project_spend_limit_exceeded','organization_spend_limit_exceeded','organization_usage_limit_exceeded',
 'rate_limit_exceeded','slow_down','resource_unavailable','invalid_api_key','model_not_found',
 'voice_not_found','voice_access_denied','invalid_voice_id','invalid_model_id','invalid_parameters',
 'quota_exceeded','max_character_limit_exceeded','missing_permissions','unauthorized',
 'paid_plan_required','subscription_required','free_users_not_allowed','feature_not_available',
 'payment_required','detected_unusual_activity','too_many_concurrent_requests','bad_request',
]);

export async function providerErrorCode(response){
 let body;
 try{body=await response.json();}catch{return 'invalid_provider_error';}
 // Only documented codes can leave the server; raw provider messages stay private.
 const candidates=[body?.error?.code,body?.error?.type,body?.detail?.status,body?.detail?.code];
 return candidates.find(code=>publicCodes.has(code))||'unknown_provider_error';
}

const rateHeaders=Object.freeze({
 requests:'x-ratelimit-limit-requests',remainingRequests:'x-ratelimit-remaining-requests',
 tokens:'x-ratelimit-limit-tokens',remainingTokens:'x-ratelimit-remaining-tokens',
 projectTokens:'x-ratelimit-limit-project-tokens',remainingProjectTokens:'x-ratelimit-remaining-project-tokens',
 retryAfterSeconds:'retry-after',
});

export function providerRateLimits(response){
 const limits={};
 for(const [name,header] of Object.entries(rateHeaders)){
  const raw=response.headers.get(header);if(raw===null||raw.trim()==='')continue;
  const value=Number(raw);if(Number.isFinite(value)&&value>=0)limits[name]=value;
 }
 return limits;
}
