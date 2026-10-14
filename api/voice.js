import {handleVoiceRequest} from '../worker/voice-core.mjs';
import {vercelEnvironment,vercelRequest} from '../worker/vercel-adapter.mjs';

export default {
 fetch(request){
  return handleVoiceRequest(vercelRequest(request),vercelEnvironment());
 },
};
