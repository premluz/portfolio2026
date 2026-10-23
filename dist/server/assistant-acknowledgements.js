// Spoken the moment a voice question is sent, while the answer is worked out. Audio only, never printed.
// The voice route only speaks phrases from this list, so it cannot be used to voice arbitrary text.
export const acknowledgements=Object.freeze({
 projects:Object.freeze(['Let me pull up the right projects.','Good one. Let me look through the work.','Let me find the best examples.']),
 experience:Object.freeze(['Let me check his experience on that.','One moment, I’ll look at his background.','Let me see where he’s done that.']),
 contact:Object.freeze(['Sure, one second.','Let me find that for you.']),
 general:Object.freeze(['Let me think about that.','Good question. One moment.','Let me look into that.'])
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
