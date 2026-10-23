export const assistantLimits=Object.freeze({
 questionCharacters:12000,answerCharacters:8000,outputTokens:2200,
 historyTurns:12,historyCharacters:48000,historyAnswerCharacters:8000,
 sourceCount:8,requestBytes:256000,requestTimeout:30000,clientTimeout:32000,speechCharacters:1000,spokenCharacters:240,offlineQuestionCharacters:240,noticeCharacters:500,
});

export function assistantHistory(entries=[]){
 if(!Array.isArray(entries))return [];
 let remaining=assistantLimits.historyCharacters;
 return entries.filter(item=>item&&['user','assistant'].includes(item.role)&&typeof item.text==='string')
  .slice(-assistantLimits.historyTurns).reverse().map(item=>{
   const limit=item.role==='user'?assistantLimits.questionCharacters:assistantLimits.historyAnswerCharacters;
   const text=item.text.slice(0,Math.min(limit,remaining));remaining-=text.length;
   return {role:item.role,text,documentIds:Array.isArray(item.documentIds)?item.documentIds.filter(id=>typeof id==='string').slice(0,assistantLimits.sourceCount):[]};
  }).filter(item=>item.text).reverse();
}
