// StudyAI: Pure Client-Side Gemini AI Integration for Study Assistant
// Supports multi-modal image & text analysis, question generation, rephrasing, and fresh quizzes.

const DEFAULT_GEMINI_API_KEY = atob("QVEuQWI4Uk42S0ttVjM0YjZxcDBob29Kcmp2SDdmSzk2VGZuUngxNEV4c0pHSW03emw2OGc=");

class StudyAI {
  constructor() {
    this.apiKey = localStorage.getItem('study_gemini_api_key') || DEFAULT_GEMINI_API_KEY;
    this.models = [
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ];
  }

  setApiKey(key) {
    if (key && key.trim()) {
      this.apiKey = key.trim();
      localStorage.setItem('study_gemini_api_key', this.apiKey);
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  // --- Core API Caller with Fallback ---
  async callGemini(contents, systemInstruction = '', isJson = false) {
    let lastError = null;

    const generationConfig = {
      temperature: 0.35,
      maxOutputTokens: 8192
    };

    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    for (const model of this.models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: contents,
        generationConfig: generationConfig
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates && data.candidates[0];
          if (candidate && candidate.content && candidate.content.parts) {
            const text = candidate.content.parts[0].text;
            if (isJson) {
              return this.cleanAndParseJson(text);
            }
            return text;
          }
        } else {
          const errText = await response.text();
          lastError = `${model} (HTTP ${response.status}): ${errText.substring(0, 180)}`;
          console.warn(`Model ${model} failed:`, lastError);
        }
      } catch (err) {
        lastError = `${model} Network Error: ${err.message}`;
        console.warn(`Model ${model} network error:`, err);
      }
    }

    throw new Error(`تعذر الاتصال بخدمة الذكاء الاصطناعي:\n${lastError || 'يرجى التحقق من اتصال الإنترنت'}`);
  }

  cleanAndParseJson(rawText) {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  }

  // --- Client-Side Canvas Image Compression ---
  async compressImage(file, maxDimension = 1400, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Data = dataUrl.split(',')[1];
          resolve({
            dataUrl: dataUrl,
            base64: base64Data,
            mimeType: 'image/jpeg',
            width: width,
            height: height
          });
        };
        img.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('فشل فتح ملف الصورة'));
      reader.readAsDataURL(file);
    });
  }

  // --- Process Study Material (OCR + Summarization + Question Bank) ---
  async processStudyMaterial(bookTitle, textContent, imagesList, pageRange = '') {
    const parts = [];

    // System instruction enforces strict curriculum boundary and page awareness
    const systemInstruction = `أنت أستاذ أكاديمي خبير ومساعد دراسي متخصص في تلخيص المناهج وتصميم الاختبارات الدقيقة باللغة العربية.
مهمتك دراسة المادة التعليمية المرفقة لمادة/كتاب: "${bookTitle}".

قواعد صارمة لا تقبل الاستثناء:
1. كل صورة مرفقة تمثل صفحة كاملة ومحددة من الكتاب/الملزمة ومسماة بالترتيب (صفحة كاملة 1، صفحة كاملة 2، وهكذا).
2. استخرج كافة المعلومات والمفاهيم والنصوص الواردة في هذه الصفحات بدقة أمانة علمية تامة.
3. ممنوع منعاً باتاً اختراع أو إدخال أي مصطلحات إنجليزية أو تقنية غريبة لم ترد صراحة في الصفحات المرفقة.
4. ممنوع منعاً باتاً طرح أي أسئلة خارج موضوع الصفحات الدراسية (مثل: أسباب فشل الاختبار، أسئلة عن سرعة الإنترنت، أو أعطال البرمجيات غير المذكورة في المنهج). كل سؤال يجب أن يكون 100% مستخرجاً من صلب المادة العلمية فقط.
5. صمم ملخصاً شاملاً، عميقاً، ومنظماً في نقاط وجداول لتسهيل الحفظ والمراجعة.
6. أنشئ بنك أسئلة من نوع اختيار من متعدد (MCQ) يتراوح بين 5 إلى 10 أسئلة تغطي أدق تفاصيل الصفحات.
7. لكل سؤال: ضع 4 خيارات منطقية، حدد الإجابة الصحيحة كما وردت نصاً في الكتاب، وقدم شرحاً علمياً وافياً يوضح سبب صحة الإجابة اعتماداً على ما ورد في الصفحة.`;

    let userPromptText = `كتاب/مادة: ${bookTitle}\n`;
    if (pageRange) {
      userPromptText += `نطاق الصفحات: ${pageRange}\n`;
    }

    if (imagesList && imagesList.length > 0) {
      userPromptText += `مرفق عدد (${imagesList.length}) صورة، تمثل صفحات كاملة من الكتاب:\n`;
      imagesList.forEach((img, idx) => {
        userPromptText += `- الصورة رقم ${idx + 1}: صفحة كاملة ${idx + 1}\n`;
      });
    }

    if (textContent && textContent.trim()) {
      userPromptText += `\nنصوص أو ملاحظات إضافية من الطالب:\n${textContent.trim()}\n`;
    }

    userPromptText += `\nالمطلوب الآن:
قم بتحليل الصفحات بدقة واستخرج ملخصاً شاملاً وبنك أسئلة بصيغة JSON وفق المخطط التالي تماماً:
{
  "summary": "نص الملخص المنظم والشامل بصيغة Markdown مع عناوين ونقاط...",
  "topics": ["الموضوع الرئيسي 1", "الموضوع الرئيسي 2"],
  "questions": [
    {
      "type": "mcq",
      "question": "نص السؤال الدقيق من صلب المادة؟",
      "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
      "correct_answer": "الخيار الصحيح المطابق لنص الكتاب",
      "explanation": "شرح من نص الصفحة يوضح سبب الاختيار",
      "difficulty": "medium"
    }
  ]
}`;

    parts.push({ text: userPromptText });

    // Append images with inlineData
    if (imagesList && imagesList.length > 0) {
      imagesList.forEach((img, idx) => {
        parts.push({
          text: `[صورة ${idx + 1} - صفحة كاملة ${idx + 1} من كتاب ${bookTitle}]`
        });
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: img.base64
          }
        });
      });
    }

    const contents = [{ role: 'user', parts: parts }];
    return await this.callGemini(contents, systemInstruction, true);
  }

  // --- Rephrase Question ("غيّر طريقة السؤال 🔀") ---
  async rephraseQuestion(question, options, correctAnswer, explanation) {
    const systemInstruction = `أنت خبير تربوي في صياغة الأسئلة التعليمية واختبارات قياس الفهم.
مهمتك إعادة صياغة السؤال التعليمي التالي بطريقة جديدة ومختلفة تماماً (مثلاً: تحويله إلى حالة تطبيقية، أو صياغة بصيغة سؤال غير مباشر، أو إعادة ترتيب المعنى لاختبار عمق الفهم)، مع المحافظة التامة على المفهوم العلمي ونفس الإجابة الصحيحة.

قواعد مهمة:
1. لا تخرج إطلاقاً عن المعنى الأصلي.
2. لا تستخدم مصطلحات جديدة غير مألوفة.
3. الإجابة الصحيحة يجب أن تظل كما هي أو بصيغة مطابقة لمعناها.
4. الخيارات الأربعة يجب أن تكون معقولة وتختبر الفهم.
5. الإخراج بصيغة JSON حصراً.`;

    const prompt = `السؤال الأصلي:
${question}

الخيارات الحالية:
${JSON.stringify(options, null, 2)}

الإجابة الصحيحة:
${correctAnswer}

الشرح والتوضيح:
${explanation}

المطلوب: أعد صياغة السؤال بصيغة جديدة تماماً وأرجع النتيجة بهذا المخطط:
{
  "question": "نص السؤال بالصياغة الجديدة؟",
  "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
  "correct_answer": "${correctAnswer}",
  "explanation": "${explanation}"
}`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    return await this.callGemini(contents, systemInstruction, true);
  }

  // --- Generate Fresh Quiz ("أسئلة جديدة متجددة 🌟") ---
  async generateFreshQuiz(bookTitle, summaryText, count = 5) {
    const systemInstruction = `أنت أستاذ ومصمم اختبارات ذكي. مهمتك توليد أسئلة اختبار جديدة ومتنوعة باللغة العربية بناءً على ملخص المنهج المقدم فقط، لاختبار فهم الطالب من زوايا جديدة دون تكرار الأسئلة السابقة.
قواعد:
1. الأسئلة من نوع MCQ، أربعة خيارات واضحة، وخيار واحد صحيح فقط.
2. لا تخرج عن نطاق الملخص المعطى.
3. التنسيق JSON فقط.`;

    const prompt = `كتاب/مادة: ${bookTitle}
ملخص الدروس والمفاهيم:
${summaryText}

المطلوب:
أنشئ (${count}) أسئلة ذكية جديدة ومتنوعة من نوع اختيار من متعدد، بصيغة JSON التالية:
[
  {
    "type": "mcq",
    "question": "نص السؤال الجديد؟",
    "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
    "correct_answer": "الخيار الصحيح بدقة",
    "explanation": "شرح توضيحي لسبب صحة الإجابة اعتماداً على الملخص",
    "difficulty": "medium"
  }
]`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    return await this.callGemini(contents, systemInstruction, true);
  }
}

// Global singleton instance
window.studyAI = new StudyAI();
