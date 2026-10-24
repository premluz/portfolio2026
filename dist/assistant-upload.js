// A role brief can be attached instead of pasted. Plain text and Markdown are read in the browser; PDF and Word
// need a document reader the site does not ship, so they get a clear message rather than a silent failure.
const readable=/\.(txt|md|markdown)$/i,documentLike=/\.(pdf|docx?|rtf|pages|odt)$/i;
export const MAX_UPLOAD_BYTES=200*1024;

export function uploadedQuestion(name,text){return `Role description from ${name}:\n\n${text.trim()}`;}

export async function readRoleBrief(file,{maxCharacters}){
 if(!file)return {ok:false,message:'No file was chosen.'};
 if(documentLike.test(file.name))return {ok:false,message:'PDF and Word files can’t be read here yet. Please paste the text instead.'};
 if(!readable.test(file.name)&&!/^text\//.test(file.type))return {ok:false,message:'Please attach a .txt or .md file, or paste the text.'};
 if(file.size>MAX_UPLOAD_BYTES)return {ok:false,message:'That file is too large. Please attach a shorter role description.'};
 const text=(await file.text()).trim();
 if(!text)return {ok:false,message:'That file is empty.'};
 const question=uploadedQuestion(file.name,text);
 if(question.length>maxCharacters)return {ok:false,message:`Please keep the role description under ${maxCharacters} characters.`};
 return {ok:true,question};
}

// The question goes through the composer's normal submit, so it lands on the chat page or floating panel like typed text.
export function mountAssistantUpload({button,picker,input,form,maxCharacters,onError}){
 if(!button||!picker||!input||!form)return;
 button.onclick=()=>{picker.value='';picker.click();};
 picker.onchange=async()=>{
  try{
   const result=await readRoleBrief(picker.files?.[0],{maxCharacters});
   if(!result.ok){onError(result.message);return;}
   input.value=result.question;form.requestSubmit();
  }catch(error){console.error('The attached file could not be read.',error);onError('That file could not be read. Please paste the text instead.');}
  finally{picker.value='';}
 };
}
