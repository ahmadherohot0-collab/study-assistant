const DEFAULT_FALLBACK_KEY = atob("QVEuQWI4Uk42S0ttVjM0YjZxcDBob29Kcmp2SDdmSzk2VGZuUngxNEV4c0pHSW03emw2OGc=");

// StudyAI: Pure Client-Side Gemini AI Integration for Study Assistant
// Supports multi-modal image & text analysis, question generation, rephrasing, and fresh quizzes.


class StudyAI {
  constructor() {
    // No key is shipped inside the app any more: every user stores their own key locally.
    this.apiKey = localStorage.getItem('study_gemini_api_key') || DEFAULT_FALLBACK_KEY;
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

  hasApiKey() {
    return !!(this.apiKey && this.apiKey.trim());
  }

  clearApiKey() {
    this.apiKey = '';
    localStorage.removeItem('study_gemini_api_key');
  }

  // --- Core API Caller with Fallback ---
  async callGemini(contents, systemInstruction = '', isJson = false) {
    let lastError = null;

    if (!this.hasApiKey()) {
      if (typeof window.openSettingsModal === 'function') window.openSettingsModal();
      const e = new Error('لم يتم إدخال مفتاح Gemini بعد. افتح ⚙️ الإعدادات وأدخل مفتاحك المجاني من Google AI Studio.');
      e.code = 'NO_API_KEY';
      throw e;
    }

    const generationConfig = {
      temperature: 0.35,
      maxOutputTokens: 8192
    };

    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    for (const model of this.models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
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
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates && data.candidates[0];
          if (candidate && candidate.content && candidate.content.parts) {
            const text = candidate.content.parts.map(p => p.text || '').join('');
            if (isJson) {
              try {
                return this.cleanAndParseJson(text);
              } catch (parseErr) {
                lastError = `${model}: الرد ليس JSON صالحاً (${parseErr.message})`;
                console.warn(lastError);
                continue; // try the next model
              }
            }
            return text;
          }
          lastError = `${model}: لم يُرجع النموذج أي رد (${(data.promptFeedback && data.promptFeedback.blockReason) || (candidate && candidate.finishReason) || 'غير معروف'})`;
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
    const systemInstruction = `أنت أستاذ أكاديمي خبير ومساعد دراسي متخصص في تلخيص المناهج وتصميم الاختبارات الدقيقة والاحترافية باللغة العربية.
مهمتك دراسة المادة التعليمية المرفقة لمادة/كتاب: "${bookTitle}".

قواعد صارمة لا تقبل الاستثناء:
1. كل صورة مرفقة تمثل صفحة كاملة ومحددة من الكتاب/الملزمة ومسماة بالترتيب (صفحة كاملة 1، صفحة كاملة 2، وهكذا).
2. استخرج كافة المعلومات والمفاهيم والنصوص الواردة في هذه الصفحات بدقة وأمانة علمية تامة.
3. ممنوع منعاً باتاً اختراع أو إدخال أي مصطلحات إنجليزية أو تقنية غريبة لم ترد صراحة في الصفحات المرفقة.
4. ممنوع منعاً باتاً طرح أي أسئلة خارج موضوع الصفحات الدراسية. كل سؤال يجب أن يكون 100% مستخرجاً من صلب المادة العلمية فقط.
5. صمم ملخصاً شاملاً، عميقاً، ومنظماً في نقاط وجداول لتسهيل الحفظ والمراجعة.
6. أنشئ بنك أسئلة احترافي ومتنوع (يتراوح بين 6 إلى 12 سؤالاً) يغطي أدق تفاصيل الصفحات ويشمل الأنواع الأساسية التالية لاختبار الطالب باحترافية:
   - تعاريف (type: "definition"): استخراج المصطلحات والمفاهيم الأساسية وطلب تعريفها (مثل: "ما المقصود بـ [...]؟" أو "عرّف المصطلح التالي: [...]"). ضع options مصفوفة فارغة []، و correct_answer هو التعريف النموذجي الشامل كما ورد نصاً في الكتاب.
   - تعاليل وأسباب (type: "reasoning"): أسئلة التعليل والتفسير العلمي (مثل: "علل: [...]؟" أو "ما سبب [...]؟"). ضع options مصفوفة فارغة []، و correct_answer هو التعليل الدقيق من الكتاب.
   - أكمل الفراغات (type: "fill_blank"): جمل هامة من صلب الكتاب حُذف منها مصطلح أو كلمة مفتاحية ووضعت مكانها أقواس مثل "تعتبر [...] هي المسؤولة عن [...]". ضع options مصفوفة فارغة []، و correct_answer هو الكلمة أو العبارة الناقصة بدقة.
   - اختيار من متعدد (type: "mcq"): 4 خيارات منطقية في options، و correct_answer هو الخيار الصحيح.
   - صح أو خطأ (type: "true_false"): خياران فقط في options هما ["صح", "خطأ"].
7. نوّع في الأسئلة بتوازن (بحيث لا يقتصر الاختبار على نمط واحد، بل يشمل تعاريف وتعاليل وفراغات واختيارات)، وقدم شرحاً علمياً وافياً (explanation) لكل سؤال يوضح سبب صحة الإجابة اعتماداً على ما ورد في الصفحة.`;

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
قم بتحليل الصفحات بدقة واستخرج ملخصاً شاملاً وبنك أسئلة متنوع وشامل يضم تعاريف وتعاليل وفراغات واختيارات بصيغة JSON وفق المخطط التالي تماماً:
{
  "summary": "نص الملخص المنظم والشامل بصيغة Markdown مع عناوين ونقاط...",
  "topics": ["الموضوع الرئيسي 1", "الموضوع الرئيسي 2"],
  "questions": [
    {
      "type": "definition",
      "question": "ما المقصود بـ ...؟",
      "options": [],
      "correct_answer": "التعريف الدقيق كما ورد في الكتاب",
      "explanation": "توضيح ومصدر التعريف من الصفحة",
      "difficulty": "medium"
    },
    {
      "type": "reasoning",
      "question": "علل: ما سبب ...؟",
      "options": [],
      "correct_answer": "السبب والتعليل العلمي الدقيق من الكتاب",
      "explanation": "شرح توضيحي للتعليل",
      "difficulty": "medium"
    },
    {
      "type": "fill_blank",
      "question": "تعتبر [...] هي المسؤولة عن ...",
      "options": [],
      "correct_answer": "الكلمة أو العبارة الناقصة الصحيحة",
      "explanation": "توضيح الجملة",
      "difficulty": "medium"
    },
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
  async rephraseQuestion(question, options, correctAnswer, explanation, questionType = 'mcq') {
    const systemInstruction = `أنت خبير تربوي في صياغة الأسئلة التعليمية واختبارات قياس الفهم باللغة العربية.
مهمتك إعادة صياغة السؤال التعليمي التالي بطريقة جديدة ومختلفة تماماً (مثلاً: تغيير أسلوب الطرح، أو صياغته بصيغة غير مباشرة، أو اختباره من زاوية تطبيقية)، مع المحافظة التامة على المفهوم العلمي ونفس الإجابة الصحيحة.

قواعد مهمة:
1. نوع السؤال هو: ${questionType || 'mcq'}.
2. إذا كان السؤال تعريفاً أو تعليلاً ("علل") أو فراغات، أعد صياغة السؤال بأسلوب ذكي وجديد مع الحفاظ على نفس الإجابة النموذجية، واجعل options مصفوفة فارغة [].
3. إذا كان اختيار من متعدد، أعد صياغة السؤال وضع 4 خيارات منطقية.
4. الإخراج بصيغة JSON حصراً.`;

    const prompt = `نوع السؤال: ${questionType}
السؤال الأصلي:
${question}

الخيارات الحالية:
${JSON.stringify(options || [], null, 2)}

الإجابة الصحيحة:
${correctAnswer}

الشرح والتوضيح:
${explanation}

المطلوب: أعد صياغة السؤال بصيغة جديدة تماماً وأرجع النتيجة بهذا المخطط:
{
  "question": "نص السؤال بالصياغة الجديدة؟",
  "options": ${options && options.length > 0 ? '["خيار 1", "خيار 2", "خيار 3", "خيار 4"]' : '[]'},
  "correct_answer": "${correctAnswer}",
  "explanation": "${explanation}"
}`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    return await this.callGemini(contents, systemInstruction, true);
  }

  // --- Generate Fresh Quiz ("أسئلة جديدة متجددة 🌟") ---
  async generateFreshQuiz(bookTitle, summaryText, count = 5, questionType = 'all') {
    let typeInstructions = '';
    if (questionType === 'definition') {
      typeInstructions = 'جميع الأسئلة يجب أن تكون من نوع تعاريف ومصطلحات ومفاهيم (type: "definition") فقط. options تكون مصفوفة فارغة []، و correct_answer هو التعريف النموذجي من الملخص.';
    } else if (questionType === 'reasoning') {
      typeInstructions = 'جميع الأسئلة يجب أن تكون من نوع تعاليل وتفسير أسباب ("علل" / "ما سبب") (type: "reasoning") فقط. options تكون مصفوفة فارغة []، و correct_answer هو التعليل الدقيق من الملخص.';
    } else if (questionType === 'fill_blank') {
      typeInstructions = 'جميع الأسئلة يجب أن تكون من نوع أكمل الفراغات (type: "fill_blank") مع وضع أقواس [...] مكان الكلمة المحذوفة. options تكون مصفوفة فارغة []، و correct_answer هو الكلمة الناقصة.';
    } else if (questionType === 'mcq_tf') {
      typeInstructions = 'الأسئلة من نوع اختيار من متعدد (type: "mcq") وصح أو خطأ (type: "true_false") فقط مع 4 خيارات واضحة للمتعدد وخيارين لصح/خطأ.';
    } else {
      typeInstructions = 'نوّع الأسئلة باحترافية بتوزيع متوازن بين: تعاريف ومصطلحات (type: "definition")، تعاليل وأسباب (type: "reasoning")، أكمل الفراغ (type: "fill_blank")، واختيار من متعدد (type: "mcq").';
    }

    const systemInstruction = `أنت أستاذ ومصمم اختبارات ذكي واحترافي. مهمتك توليد أسئلة اختبار جديدة ومتنوعة باللغة العربية بناءً على ملخص المنهج المقدم فقط، لاختبار فهم الطالب من كافة الزوايا دون تكرار الأسئلة السابقة.
قواعد:
1. ${typeInstructions}
2. لا تخرج عن نطاق الملخص المعطى.
3. التنسيق JSON فقط.`;

    const prompt = `كتاب/مادة: ${bookTitle}
ملخص الدروس والمفاهيم:
${summaryText}

المطلوب:
أنشئ (${count}) أسئلة ذكية جديدة ومتنوعة (${questionType === 'all' ? 'تشمل تعاريف وتعاليل وفراغات واختيارات' : questionType}) بصيغة JSON التالية:
[
  {
    "type": "definition | reasoning | fill_blank | mcq | true_false",
    "question": "نص السؤال؟",
    "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], // فارغة [] في التعاريف والتعاليل والفراغات
    "correct_answer": "الإجابة النموذجية الصحيحة بدقة",
    "explanation": "شرح توضيحي لسبب صحة الإجابة اعتماداً على الملخص",
    "difficulty": "medium"
  }
]`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    return await this.callGemini(contents, systemInstruction, true);
  }

  // --- Flashcards generation ---
  async generateFlashcards(bookTitle, text, count = 12, existingFronts = []) {
    const systemInstruction = `أنت خبير في تصميم بطاقات الاستذكار السريع (Flashcards) للطلاب باللغة العربية.
قواعد صارمة:
1. كل بطاقة مأخوذة حصراً من النص المعطى، ولا تضف معلومة غير موجودة فيه.
2. وجه البطاقة (front) سؤال قصير أو مصطلح أو "علل" أو "قارن"، وظهرها (back) إجابة مركزة لا تتجاوز 40 كلمة.
3. نوّع بين: تعريف، علل، مقارنة، تعداد، وظيفة، رقم أو تاريخ مهم.
4. لا تكرر بطاقة موجودة سابقاً ولا تكرر نفس الفكرة.
5. الإخراج JSON فقط.`;

    const used = (existingFronts || []).slice(0, 60).map(f => `- ${f}`).join('\n');
    const prompt = `المادة: ${bookTitle}

النص الدراسي:
${String(text).slice(0, 24000)}

${used ? `البطاقات الموجودة سابقاً (لا تكررها):\n${used}\n` : ''}
أنشئ (${count}) بطاقة، بالصيغة التالية فقط:
[
  { "front": "نص وجه البطاقة؟", "back": "الإجابة المختصرة" }
]`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const result = await this.callGemini(contents, systemInstruction, true);
    const list = Array.isArray(result) ? result : (result && result.cards) || [];
    return list
      .filter(c => c && typeof c.front === 'string' && typeof c.back === 'string' && c.front.trim() && c.back.trim())
      .map(c => ({ front: c.front.trim(), back: c.back.trim() }));
  }

  // --- Weakness analysis (free-text advice in Markdown) ---
  async analyzeWeakness(bookTitle, stats) {
    const systemInstruction = `أنت مرشد دراسي ودود وخبير. تحلل أداء طالب في الاختبارات وتعطيه خطة مراجعة واضحة وعملية بالعربية.
اعتمد فقط على البيانات المعطاة، ولا تخترع معلومات علمية جديدة. اكتب بصيغة Markdown مختصرة: عناوين صغيرة ونقاط.`;
    const prompt = `المادة: ${bookTitle}

بيانات الأداء (JSON):
${JSON.stringify(stats, null, 1)}

اكتب:
1. ملخصاً قصيراً لمستوى الطالب (جملتان).
2. أهم 3 مواضيع تحتاج مراجعة ولماذا (بحسب الأخطاء المتكررة).
3. خطة مراجعة لمدة 3 أيام (كل يوم مهمتان فقط).
4. نصيحة تحفيزية واحدة.`;
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    return await this.callGemini(contents, systemInstruction, false);
  }

  // --- Study aids: comparison table / mind map (Markdown) ---
  async generateStudyAid(bookTitle, text, kind = 'table') {
    const systemInstruction = `أنت أستاذ خبير في تبسيط المناهج الدراسية بالعربية. اعتمد حصراً على النص المعطى ولا تضف معلومات من خارجه.`;
    const task = kind === 'mindmap'
      ? `ابنِ خريطة ذهنية نصية للدرس كقائمة Markdown متداخلة: العنوان الرئيسي في السطر الأول بخط عريض، ثم 4-7 فروع رئيسية، تحت كل فرع 2-4 نقاط قصيرة جداً (كلمات مفتاحية لا جمل طويلة). استخدم رمزاً تعبيرياً واحداً لكل فرع رئيسي.`
      : `ابحث في النص عن مفاهيم متشابهة أو متقابلة (مثل: جسر شمالي/جنوبي، نوعان من الذاكرة...) وأنشئ جدول مقارنة واحداً أو اثنين بصيغة جدول Markdown، بأعمدة واضحة وصفوف قصيرة. أضف سطراً واحداً بعد كل جدول يوضح "كيف أميّز بينهما".`;
    const prompt = `المادة: ${bookTitle}

النص الدراسي:
${String(text).slice(0, 24000)}

المطلوب: ${task}`;
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    return await this.callGemini(contents, systemInstruction, false);
  }
}

// Global singleton instance
window.studyAI = new StudyAI();
