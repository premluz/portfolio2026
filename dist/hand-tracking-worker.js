// Classic worker: MediaPipe's WASM loader uses importScripts. Every dependency
// and model is served by this Site; frames never leave this worker/device.
let detector=null;
self.onmessage=async ({data})=>{
  if(data.type==='init') {
    try {
      self.exports={};
      importScripts(new URL('./vendor/mediapipe/vision_bundle.js',self.location.href).href);
      const vision=self.exports;
      const files=await vision.FilesetResolver.forVisionTasks(new URL('./vendor/mediapipe/wasm',self.location.href).href);
      detector=await vision.HandLandmarker.createFromOptions(files,{
        baseOptions:{modelAssetPath:new URL('./vendor/mediapipe/hand_landmarker.task',self.location.href).href,delegate:'CPU'},
        runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65
      });
      self.postMessage({type:'ready'});
    } catch {self.postMessage({type:'error',message:'Local hand tracking could not load. Please try again.'});}
  } else if(data.type==='frame') {
    const start=performance.now();
    try {
      const result=detector.detectForVideo(data.bitmap,data.time);
      self.postMessage({type:'result',landmarks:result.landmarks[0]||null,worldLandmarks:result.worldLandmarks?.[0]||null,time:data.time,epoch:data.epoch,elapsed:performance.now()-start});
    } catch {self.postMessage({type:'error',message:'Local hand tracking stopped. Please try again.'});}
    finally {data.bitmap.close();}
  }
};
