// Spoken the moment a voice question is sent, while the answer is worked out. Audio only, never printed.
// The voice route only speaks phrases from this list, so it cannot be used to voice arbitrary text.
export const acknowledgements=Object.freeze({
 projects:Object.freeze(['Let me check his projects.','Good question. Let me look through the work.','Sure, let me pull those up.','One sec, checking the work.']),
 experience:Object.freeze(['Let me check.','Good question. Let me look at his background.','Checking his experience now.','Sure, let me check that.']),
 contact:Object.freeze(['Sure, one sec.','Let me check that for you.','Good question. One moment.']),
 general:Object.freeze(['Let me check.','Good question.','Checking now.','Good one. Let me look.','One sec, let me check.'])
});
const categories=[
 ['contact',/\b(contact|email|e-mail|hire|hiring|availab|rate|reach|call|book|meet|linkedin)/i],
 ['experience',/\b(experience|background|years?|career|skills?|tools?|familiar|worked (with|on|at)|resume|cv|role|lead|team)/i],
 ['projects',/\b(projects?|work|built|build|case stud|portfolio|examples?|show me|shipped|prototype|designs?)/i]
];
export function acknowledgementFor(question,turn=0){
 const category=categories.find(([,pattern])=>pattern.test(String(question||'')))?.[0]||'general';
 const index=Math.abs(Number(turn)||0)%acknowledgements[category].length;
 return `${category}-${index}`;
}
export function acknowledgementText(id){
 const match=/^([a-z]+)-(\d)$/.exec(String(id||''));
 return match&&Object.hasOwn(acknowledgements,match[1])?acknowledgements[match[1]][Number(match[2])]??null:null;
}
