const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractCVData(text) {
  const prompt = `أنت متخصص موارد بشرية. استخرج البيانات التالية من هذه السيرة الذاتية وأجب بـ JSON فقط بدون أي نص إضافي:

{
  "fullName": "الاسم الكامل",
  "nationality": "الجنسية",
  "qualification": "أعلى مؤهل علمي",
  "major": "التخصص",
  "yearsExperience": "عدد سنوات الخبرة كرقم",
  "lastJob": "آخر وظيفة",
  "subjectsTaught": "المواد أو المراحل التي يدرسها",
  "phone": "رقم الجوال",
  "email": "البريد الإلكتروني",
  "currentCountry": "الدولة الحالية",
  "summary": "ملخص مهني بـ 3-4 جمل بالعربي",
  "fitScore": "نسبة مناسبة للعمل في مدرسة من 0-100",
  "fitNotes": "ملاحظات عن مدى مناسبة المرشح"
}

السيرة الذاتية:
${text.substring(0, 4000)}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;
  const clean = content.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function generateInterviewEmail(candidate, interviewDate, interviewerName, jobTitle, branch) {
  const prompt = `اكتب إيميل دعوة مقابلة احترافي بالعربي لمرشح وظيفي. أجب بـ JSON فقط:
{
  "subject": "عنوان الإيميل",
  "body": "نص الإيميل كاملاً"
}

بيانات المرشح:
- الاسم: ${candidate.fullName}
- الوظيفة: ${jobTitle}
- الفرع: ${branch}
- موعد المقابلة: ${interviewDate}
- اسم المقابل: ${interviewerName}
- الشركة: روّاد الخليج للمدارس الدولية`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  const clean = content.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function generateRejectionEmail(candidate, jobTitle) {
  const prompt = `اكتب إيميل اعتذار لطيف واحترافي بالعربي. أجب بـ JSON فقط:
{
  "subject": "عنوان الإيميل",
  "body": "نص الإيميل"
}
المرشح: ${candidate.fullName}، الوظيفة: ${jobTitle}، الشركة: روّاد الخليج للمدارس الدولية`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  const clean = content.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function generateInterviewQuestions(candidate) {
  const prompt = `اقترح 8 أسئلة مقابلة احترافية بالعربي لمعلم تخصص "${candidate.major}" خبرته ${candidate.yearsExperience} سنوات. أجب بـ JSON فقط:
{"questions": ["سؤال 1", "سؤال 2", ...]}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });

  const content = response.choices[0].message.content;
  const clean = content.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { extractCVData, generateInterviewEmail, generateRejectionEmail, generateInterviewQuestions };
