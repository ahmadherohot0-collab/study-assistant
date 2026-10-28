// StudyDB: Pure Client-Side IndexedDB Database for Study Assistant
// Persists books, materials, questions, quiz history, and settings locally on mobile & web.

const INITIAL_SEED_DATA = [{"book": {"id": 3, "name": "صيانة الحاسوب", "description": "الفصل الاول", "icon": "book", "color": "#ff0000", "created_at": "2026-10-27 17:45:37", "materials_count": 2, "questions_count": 20, "avg_score": 0}, "materials": [{"id": 8, "book_id": 3, "title": "اللوحة الام", "page_range": "ص3 ص8", "extracted_text": "", "summary": "{\n  \"extracted_text\": \"[=== صفحة 1 ===]\\nالفصل الاول: اللوحة الأم Motherboard\\nس1/ ما هي اللوحة الأم ؟ وما اهميتها بالنسبة لجهاز الحاسوب؟\\nاللوحة الأم 20 د3 ت 24 د1 22د1 وتسمى لوحة الدائرة المطبوعة ويرمز لها بـ PCB وهي التي تركب عليها جميع مكونات الحاسوب وتصنع من عدة طبقات، من 4 إلى 8 بحسب المكونات المستخدمة على اللوحة وهي القاعدة أو الأساس الذي يبنى عليه جهاز الحاسوب، و يكمن دورها في ربط قطع جهاز الحاسوب بعضها ببعض وتنظيم عملية الاتصال بينها، كذلك تقوم بعملية تعريف نظام التشغيل بمكونات الحاسوب.\\n\\nعلل / تصنع اللوحة الام من عدة طبقات ؟ ت 18 ت19\\n• كثرة التوصيلات التي يجب عملها بين المكونات على اللوحة.\\n• عدم وجود المساحة الكافية على سطح اللوحة لكل التوصيلات.\\n• تقارب هذه التوصيلات يؤدي إلى تشويش الإشارة الكهربائية عند انتقالها من موقع إلى موقع آخر، لهذا فإن كل مجموعة من التوصيلات يتم عملها على جانبي طبقة ومن ثم تضع فوقها طبقة أخرى تحتوي على مجموعة ثانية من الوصلات وهكذا.\\n\\nتأتي اللوحة المطبوعة بأحجام مختلفة وهي AT, ATX, و MicroATX\\n\\nمكونات اللوحة الأم:\\nس/ عدد فقط مكونات اللوحة الام ؟ وزاري مهم 23د1 ت22 20 د1\\n1- مجموعة الرقائق\\n2- شقوق التوسعة\\n3- شقوق الذاكرة العشوائية\\n4- وحدة المعالجة المركزية (CPU) وفتحة المعالج او المقابس\\n5- موصلات القدرة\\n6- موصلات محرك الاقراص على اللوحة\\n7- موصلات لوحة المفاتيح\\n8- منافذ وموصلات الاجهزة الملحقة\\n9- رقاقة البايوس\\n10- بطارية CMOS\\n\\nأولا : مجموعة الرقائق او الشرائح (Chipsets) 18 د1 21 د2 20د3\\nس/ مالقصود بمجموعة الرقائق ؟ وماهي انواعها\\nهي مجموعة من الرقائق التي تربط بين وحدة المعالجة المركزية CPU وباقي المكونات المادية للحاسوب وهي موجودة على اللوحة الام وعلى البطاقات المختلفة في الحاسوب.\\nس2) ما المقصود برقاقة الجسر الشمالي؟ وماهي الاجزاء التي ترتبط به؟ 16 د3 17د1\\n1- رقاقة الجسر الشمالي (Northbridge) وزاري مهم 24 ت 24د1 22د2 هي عبارة عن عدد من الدوائر الالكترونية التي تنفذ وظيفة مهمة جدا وهي ادارة الاتصالات السريعة وتكون قريبة من المعالج والذاكرة وشق AGP لبطاقة الشاشة . وظيفتها 19د1 نقل المعلومات والاتصال ما بين المعالج والذاكرة وبطاقة الشاشة، وتنقل البيانات بواسطة الناقل الامامي.\\n• تعمل شريحة الجسر الشمالي على تحديد نوع المعالج ونوع الذاكرة وسعتها وسرعة الشق AGP 18د1.\\n• تصدر كميات كبيرة من الحرارة التي تقوم باتلافها لذا يوضع عليها مشتت حراري للتخلص من الحرارة المتبددة.\\n2- رقاقة الجسر الجنوبي (Southbridge) ت 17 ت 18 23د2 22د2 16د1\\nس3) ما المقصود برقاقة الجسر الجنوبي ؟ وماهي الاجزاء التي ترتبط به؟\\nهي التي تقع في الجزء الجنوبي من اللوحة الأم وتعمل على توصيل أجهزة الإدخال والإخراج والمعالج والذاكرة العشوائية، وهي التي تحدد سرعة نقل البيانات القصوى بين اللوحة الأم والقرص الصلب.\\n• رقاقة الجسر الجنوبي South Bridge لا تصدر حرارة لذلك لا تحتاج إلى مبرد.\\n• هذا النوع من الرقائق م مسؤول عن دعم آلاف الملاحق الموجودة على اللوحة الأم مباشرة إضافة إلى ادارة اتصالاتها مع بقية اجزاء الحاسوب والموارد المعطاة لها.\\n\\n[=== صفحة 2 ===]\\nس4) ما الفرق بين رقاقة الجسر الشمالي والجسر الجنوبي؟ واي منهما تعمل على تحديد نوع المعالج ونوع الذاكرة؟\\nرقاقة الجسر الشمالي Northbridge: تصدر كميات كبيرة من الحرارة التي تقوم باتلافها لذلك فهي مزودة بنوع من المبردات لطرد الحرارة. تعمل على تحديد نوع المعالج ونوع الذاكرة وسعتها وسرعة الشق AGP.\\nرقاقة الجسر الجنوبي South Bridge: لا", "file_type": "images", "files_json": "[\"f675457c_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_0.jpg\", \"c088826d_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_1.jpg\", \"b86b6414_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_2.jpg\", \"a15c517a_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_3.jpg\", \"dfce24ba_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_4.jpg\", \"479754bc_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_5.jpg\"]", "created_at": "2026-10-27 18:11:43", "questions_count": 10, "files": ["f675457c_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_0.jpg", "c088826d_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_1.jpg", "b86b6414_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_2.jpg", "a15c517a_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_3.jpg", "dfce24ba_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_4.jpg", "479754bc_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_5.jpg"]}, {"id": 7, "book_id": 3, "title": "اللوحة الام", "page_range": "ص3 ص8", "extracted_text": "الفصل الأول: اللوحة الأم Motherboard. اللوحة الأم هي لوحة الدائرة المطبوعة ويرمز لها بـ PCB وهي التي تركب عليها جميع مكونات الحاسوب وتصنع من عدة طبقات من 4 إلى 8 طبقات. وظيفتها ربط قطع جهاز الحاسوب ببعضها وتنظيم عملية الاتصال بينها وتعريف نظام التشغيل بمكونات الحاسوب. علل تصنع من عدة طبقات: كثرة التوصيلات، عدم وجود مساحة كافية، تقارب التوصيلات يؤدي لتشويش الإشارة الكهربائية. أحجامها: AT, ATX, MicroATX. مكونات اللوحة الأم: مجموعة الرقائق، شقوق التوسعة، شقوق الذاكرة العشوائية، وحدة المعالجة المركزية (CPU) وفتحة المعالج، موصلات القدرة، موصلات محرك الأقراص، موصلات لوحة المفاتيح، منافذ وموصلات الأجهزة الملحقة، رقاقة البايوس، بطارية CMOS. مجموعة الرقائق (Chipsets): تربط بين المعالج وباقي المكونات المادية. رقاقة الجسر الشمالي (Northbridge): إدارة الاتصالات السريعة بين المعالج والذاكرة وبطاقة الشاشة، وتحدد نوع المعالج وسعة الذاكرة وسرعة الشق AGP، وتصدر حرارة كبيرة وتحتاج لمشتت حراري. رقاقة الجسر الجنوبي (Southbridge): تقع في الجزء الجنوبي، تربط أجهزة الإدخال والإخراج والمعالج والذاكرة، وتحدد سرعة نقل البيانات بين اللوحة الأم والقرص الصلب، ولا تصدر حرارة. شقوق التوسعة (Expansion Slots): تقع في الجزء الجنوبي، وظيفتها إضافة البطاقات المختلفة (شاشة، صوت). أنواعها: ISA (بطيئة)، PCI (للبطاقات العادية)، AGP (للشاشة)، PCI-E (سريع جداً لنقل البيانات). شقوق الذاكرة العشوائية (RAM Slots): تتميز باللون الأسود مع قفلين باللون الأبيض، وتختلف حسب نوع الذاكرة. المقابس (Sockets): مقبس المعالج الدقيق، مقبس الطاقة الكهربائية (لتزويد اللوحة بالتيار المستمر DC)، مقبس IDE (لنقل المعلومات بـ 40 إبرة)، مقبس SATA (أصغر وأسرع من IDE)، مقبس USB الداخلي. الوصلات الخلفية: مقبسي لوحة المفاتيح والفأرة، منفذ USB، مقبس Parallel للطابعة، مقبس ليد التحكم بالألعاب Joystick، مقابس السماعات والميكروفون، منفذ الشبكة LAN. النواقل (Buses): خطوط نحاسية مطبوعة توصل جميع أجزاء اللوحة الأم. تتكون من: ناقل البيانات، ناقل العناوين، ناقل إشارات التحكم. أنواع النبضات: عناوين كودية، شفرة البيانات المنقولة، إشارات كودية. طرق التحكم بالناقل: المتحكم المركزي، المتحكم الموزع. المتحكم الدقيق (Microcontroller): دائرة متكاملة تحتوي على معالج دقيق وذاكرة داخلية وبوابات إدخال وإخراج. أنواعه: متحكم الدخل والخرج الفائق (Super I/O Controller)، المتحكمات المدمجة، متحكمات لوحة المفاتيح. الحاسوب المحمول: يتميز بخفة الوزن، المكونات مدمجة، استقلالية الطاقة (البطارية)، وإمكانية الاتصال بالشبكة.", "summary": "### ملخص الفصل الأول: اللوحة الأم (Motherboard)\n\n#### الفكرة العامة\nاللوحة الأم هي العمود الفقري للحاسوب، حيث تمثل القاعدة الأساسية التي تربط جميع المكونات المادية وتنظم الاتصال بينها وبين نظام التشغيل.\n\n#### المفاهيم والتعريفات الأساسية\n*   **اللوحة الأم (PCB):** لوحة مطبوعة متعددة الطبقات (4-8 طبقات) لضمان جودة الإشارة وتوفير المساحة.\n*   **مجموعة الرقائق (Chipsets):** تنقسم إلى الجسر الشمالي (للاتصالات السريعة كالمعالج والذاكرة) والجسر الجنوبي (للاتصالات الأبطأ كأجهزة الإدخال والإخراج).\n*   **النواقل (Buses):** هي المسارات النحاسية التي تنقل البيانات والعناوين وإشارات التحكم بين أجزاء الحاسوب.\n*   **المتحكم الدقيق (Microcontroller):** معالج صغير مدمج مع ذاكرة وبوابات تحكم، يستخدم في وظائف محددة مثل لوحة المفاتيح أو الشاشة.\n\n#### النقاط والقواعد الرئيسية\n*   **أحجام اللوحة الأم:** تتوفر بثلاثة أحجام رئيسية هي AT و ATX و MicroATX.\n*   **شقوق التوسعة:** تختلف حسب السرعة والغرض، وأحدثها وأسرعها هو PCI-E.\n*   **التحكم في النواقل:** يتم إما عبر متحكم مركزي واحد أو متحكم موزع تشترك فيه جميع الوحدات.\n*   **الحاسوب المحمول:** يتميز بدمج المكونات (لوحة المفاتيح والشاشة) والاعتماد على البطارية.\n\n#### حل أسئلة \"اختبر نفسك\" (الصفحة الأخيرة)\n\n**س1/ أعلل ما يأتي:**\n1. **تزود رقاقة الجسر الشمالي بمروحة تبريد؟** لأنها تصدر كميات كبيرة من الحرارة التي قد تؤدي لإتلافها.\n2. **تصنع اللوحة الأم من عدة طبقات؟** بسبب كثرة التوصيلات، وعدم كفاية المساحة، ولمنع تشويش الإشارات الكهربائية.\n3. **يحدد عرض ناقل العناوين كمية الذاكرة العشوائية؟** لأن ناقل العناوين يجب أن يكون قادراً على وصف أي مكان (عنوان) في الذاكرة بشكل كافٍ.\n\n**س5/ املأ الفراغات التالية:**\n1. من أنواع المقابس الموجودة على اللوحة الأم هي: **مقبس المعالج، مقبس الطاقة، مقبس IDE، مقبس SATA**.\n2. مقبس الطاقة الكهربائية هو مقبس لتزويد اللوحة الأم بالـ **طاقة الكهربائية للتيار المستمر DC**.\n3. رقاقة الجسر الجنوبي تحدد سرعة نقل البيانات بين **اللوحة الأم** و **القرص الصلب**.\n4. رقاقة الجسر الشمالي تعمل على تحديد **نوع المعالج** و **نوع الذاكرة وسعتها** و **سرعة الشق AGP**.\n5. ناقل النظام مقسم لقسمين: **ناقل المعالج** و **ناقل الذاكرة العشوائية**.\n6. يوجد أكثر من متحكم مربوط مع الناقل في وقت واحد منهما **مركزي** و **موزع**.\n7. من أنواع الوصلات الموجودة على الجهة الخلفية: **منفذ USB، منفذ LAN، مقبس الطابعة، مقابس الصوت**.\n8. ناقل النظام: وهو الذي ينقل البيانات بين **المعالج** و **الذاكرة العشوائية**.\n9. من المكونات الأساسية لجهاز الحاسوب المحمول: **اللوحة الأم، المعالج، الذاكرة، الشاشة، البطارية**.\n10. يمكن تقسيم عمل الناقل إلى قسمين طبقاً للأجهزة التي يوصلها ببعضها: **ناقل النظام** و **ناقل الإدخال والإخراج**.\n11. من أنواع النبضات المنقولة عبر النواقل: **عناوين كودية، شفرة البيانات المنقولة، إشارات كودية**.\n12. سرعة أي ناقل في الحاسوب تقاس بوسيلتين هما **تردد الناقل** و **عرض حزمة الناقل**.\n\n#### نصائح لتثبيت المعلومة\n*   تذكر دائماً أن **الجسر الشمالي** مرتبط بالسرعة (معالج، ذاكرة) ويسخن، بينما **الجسر الجنوبي** مرتبط بالأجهزة الطرفية ولا يسخن.\n*   اربط بين لون شقوق الذاكرة (الأسود) وأقفالها (الأبيض) لتمييزها بصرياً.", "file_type": "images", "files_json": "[\"c7155e51_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_0.jpg\", \"c623a6c6_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_1.jpg\", \"af19d6f3_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_2.jpg\", \"14217442_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_3.jpg\", \"95984a63_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_4.jpg\", \"1ceff8ad_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_5.jpg\"]", "created_at": "2026-10-27 17:52:27", "questions_count": 10, "files": ["c7155e51_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_0.jpg", "c623a6c6_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_1.jpg", "af19d6f3_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_2.jpg", "14217442_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_3.jpg", "95984a63_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_4.jpg", "1ceff8ad_pic_٢٠٢٦١٠٢٧٢٠٤٩٠٨_5.jpg"]}], "questions": [{"id": 14, "book_id": 3, "material_id": 7, "type": "mcq", "question": "كم عدد الطبقات التي تصنع منها اللوحة الأم (PCB)؟", "options_json": "[\"طبقة واحدة فقط\", \"من طبقتين إلى 3 طبقات\", \"من 4 إلى 8 طبقات\", \"10 طبقات فأكثر\"]", "correct_answer": "من 4 إلى 8 طبقات", "explanation": "تصنع اللوحة الأم من عدة طبقات تتراوح بين 4 إلى 8 طبقات بسبب كثرة التوصيلات وعدم وجود مساحة كافية ولتجنب تشويش الإشارة.", "difficulty": "easy", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": ["طبقة واحدة فقط", "من طبقتين إلى 3 طبقات", "من 4 إلى 8 طبقات", "10 طبقات فأكثر"]}, {"id": 15, "book_id": 3, "material_id": 7, "type": "mcq", "question": "ما هي الرقاقة المسؤولة عن إدارة الاتصالات السريعة بين المعالج والذاكرة وبطاقة الشاشة؟", "options_json": "[\"رقاقة الجسر الجنوبي (Southbridge)\", \"رقاقة الجسر الشمالي (Northbridge)\", \"رقاقة البايوس\", \"المتحكم الدقيق\"]", "correct_answer": "رقاقة الجسر الشمالي (Northbridge)", "explanation": "وظيفة رقاقة الجسر الشمالي هي إدارة الاتصالات السريعة وتحديد نوع المعالج وسعة الذاكرة وسرعة الشق AGP.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": ["رقاقة الجسر الجنوبي (Southbridge)", "رقاقة الجسر الشمالي (Northbridge)", "رقاقة البايوس", "المتحكم الدقيق"]}, {"id": 16, "book_id": 3, "material_id": 7, "type": "mcq", "question": "أي من أنواع شقوق التوسعة التالية يعتبر سريعاً جداً لنقل البيانات؟", "options_json": "[\"ISA\", \"PCI\", \"AGP\", \"PCI-E\"]", "correct_answer": "PCI-E", "explanation": "حسب النص، يعتبر PCI-E سريعاً جداً لنقل البيانات مقارنة بالأنواع الأخرى.", "difficulty": "easy", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": ["ISA", "PCI", "AGP", "PCI-E"]}, {"id": 17, "book_id": 3, "material_id": 7, "type": "mcq", "question": "ما هي المكونات التي تتميز باللون الأسود مع قفلين باللون الأبيض على اللوحة الأم؟", "options_json": "[\"شقوق التوسعة\", \"شقوق الذاكرة العشوائية (RAM Slots)\", \"موصلات القدرة\", \"منافذ USB\"]", "correct_answer": "شقوق الذاكرة العشوائية (RAM Slots)", "explanation": "تتميز شقوق الذاكرة العشوائية بلونها الأسود ووجود قفلين باللون الأبيض وتختلف حسب نوع الذاكرة.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": ["شقوق التوسعة", "شقوق الذاكرة العشوائية (RAM Slots)", "موصلات القدرة", "منافذ USB"]}, {"id": 18, "book_id": 3, "material_id": 7, "type": "true_false", "question": "تصدر رقاقة الجسر الجنوبي (Southbridge) حرارة كبيرة وتحتاج دائماً لمشتت حراري.", "options_json": "[\"صح\", \"خطأ\"]", "correct_answer": "خطأ", "explanation": "حسب النص، رقاقة الجسر الجنوبي لا تصدر حرارة، بينما رقاقة الجسر الشمالي هي التي تصدر حرارة كبيرة وتحتاج لمشتت.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": ["صح", "خطأ"]}, {"id": 19, "book_id": 3, "material_id": 7, "type": "true_false", "question": "يقوم مقبس الطاقة الكهربائية بتزويد اللوحة الأم بالتيار المستمر DC.", "options_json": "[\"صح\", \"خطأ\"]", "correct_answer": "صح", "explanation": "مقبس الطاقة الكهربائية وظيفته تزويد اللوحة بالتيار المستمر DC.", "difficulty": "easy", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": ["صح", "خطأ"]}, {"id": 20, "book_id": 3, "material_id": 7, "type": "true_false", "question": "يعتبر ناقل البيانات أحد مكونات النواقل (Buses) في اللوحة الأم.", "options_json": "[\"صح\", \"خطأ\"]", "correct_answer": "صح", "explanation": "تتكون النواقل من ناقل البيانات، وناقل العناوين، وناقل إشارات التحكم.", "difficulty": "easy", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": ["صح", "خطأ"]}, {"id": 21, "book_id": 3, "material_id": 7, "type": "short_answer", "question": "لماذا تصنع اللوحة الأم من عدة طبقات؟", "options_json": "[]", "correct_answer": "بسبب كثرة التوصيلات، وعدم وجود مساحة كافية، ولأن تقارب التوصيلات يؤدي لتشويش الإشارة الكهربائية.", "explanation": "هذه هي الأسباب الثلاثة المذكورة في النص تحت بند 'علل تصنع من عدة طبقات'.", "difficulty": "hard", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": []}, {"id": 22, "book_id": 3, "material_id": 7, "type": "short_answer", "question": "اذكر أنواع النبضات التي يتم نقلها عبر النواقل (Buses).", "options_json": "[]", "correct_answer": "عناوين كودية، شفرة البيانات المنقولة، إشارات كودية.", "explanation": "النص حدد ثلاثة أنواع من النبضات المنقولة عبر الخطوط النحاسية المطبوعة.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": []}, {"id": 23, "book_id": 3, "material_id": 7, "type": "short_answer", "question": "ما هي مميزات الحاسوب المحمول كما وردت في الفصل الأول؟", "options_json": "[]", "correct_answer": "يتميز بخفة الوزن، المكونات مدمجة، استقلالية الطاقة (البطارية)، وإمكانية الاتصال بالشبكة.", "explanation": "هذه هي الخصائص الأربع التي تميز الحاسوب المحمول عن غيره وفقاً للنص المرفق.", "difficulty": "hard", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 17:52:39", "options": []}, {"id": 24, "book_id": 3, "material_id": 8, "type": "mcq", "question": "ما هو الرمز الذي يطلق على اللوحة الأم باعتبارها لوحة دائرة مطبوعة؟", "options_json": "[\"CPU\", \"PCB\", \"CMOS\", \"BIOS\"]", "correct_answer": "PCB", "explanation": "ورد في النص أن اللوحة الأم تسمى لوحة الدائرة المطبوعة ويرمز لها بـ PCB.", "difficulty": "easy", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": ["CPU", "PCB", "CMOS", "BIOS"]}, {"id": 25, "book_id": 3, "material_id": 8, "type": "true_false", "question": "تقوم اللوحة الأم بعملية تعريف نظام التشغيل بمكونات الحاسوب.", "options_json": "[\"صح\", \"خطأ\"]", "correct_answer": "صح", "explanation": "من مهام اللوحة الأم المذكورة في النص أنها تقوم بعملية تعريف نظام التشغيل بمكونات الحاسوب.", "difficulty": "easy", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": ["صح", "خطأ"]}, {"id": 26, "book_id": 3, "material_id": 8, "type": "mcq", "question": "كم عدد الطبقات التي تصنع منها اللوحة الأم بحسب المكونات المستخدمة؟", "options_json": "[\"من 1 إلى 2 طبقة\", \"من 2 إلى 4 طبقات\", \"من 4 إلى 8 طبقات\", \"أكثر من 10 طبقات\"]", "correct_answer": "من 4 إلى 8 طبقات", "explanation": "ذكر النص أن اللوحة الأم تصنع من عدة طبقات، من 4 إلى 8 بحسب المكونات المستخدمة.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": ["من 1 إلى 2 طبقة", "من 2 إلى 4 طبقات", "من 4 إلى 8 طبقات", "أكثر من 10 طبقات"]}, {"id": 27, "book_id": 3, "material_id": 8, "type": "short_answer", "question": "علل: لماذا تصنع اللوحة الأم من عدة طبقات؟", "options_json": "[]", "correct_answer": "1- كثرة التوصيلات التي يجب عملها بين المكونات على اللوحة. 2- عدم وجود المساحة الكافية على سطح اللوحة لكل التوصيلات. 3- تقارب هذه التوصيلات يؤدي إلى تشويش الإشارة الكهربائية عند انتقالها من موقع إلى موقع آخر.", "explanation": "هذه هي الأسباب الثلاثة المذكورة في النص لتفسير تعدد طبقات اللوحة الأم.", "difficulty": "hard", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": []}, {"id": 28, "book_id": 3, "material_id": 8, "type": "mcq", "question": "أي من الرقائق التالية تكون قريبة من المعالج والذاكرة وتدير الاتصالات السريعة؟", "options_json": "[\"رقاقة الجسر الجنوبي\", \"رقاقة البايوس\", \"رقاقة الجسر الشمالي\", \"بطارية CMOS\"]", "correct_answer": "رقاقة الجسر الشمالي", "explanation": "رقاقة الجسر الشمالي (Northbridge) هي المسؤولة عن إدارة الاتصالات السريعة وتكون قريبة من المعالج والذاكرة.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": ["رقاقة الجسر الجنوبي", "رقاقة البايوس", "رقاقة الجسر الشمالي", "بطارية CMOS"]}, {"id": 29, "book_id": 3, "material_id": 8, "type": "true_false", "question": "تحتاج رقاقة الجسر الجنوبي (South Bridge) إلى مبرد لأنها تصدر حرارة عالية.", "options_json": "[\"صح\", \"خطأ\"]", "correct_answer": "خطأ", "explanation": "ورد في النص أن رقاقة الجسر الجنوبي لا تصدر حرارة لذلك لا تحتاج إلى مبرد.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": ["صح", "خطأ"]}, {"id": 30, "book_id": 3, "material_id": 8, "type": "mcq", "question": "ما هي أحجام اللوحة المطبوعة المذكورة في النص؟", "options_json": "[\"AT, ATX, و MicroATX\", \"Large, Medium, و Small\", \"XT, BTX, و MiniITX\", \"PCB, CPU, و AGP\"]", "correct_answer": "AT, ATX, و MicroATX", "explanation": "تأتي اللوحة المطبوعة بأحجام مختلفة وهي AT, ATX, و MicroATX كما ورد في النص.", "difficulty": "easy", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": ["AT, ATX, و MicroATX", "Large, Medium, و Small", "XT, BTX, و MiniITX", "PCB, CPU, و AGP"]}, {"id": 31, "book_id": 3, "material_id": 8, "type": "short_answer", "question": "عدد خمسة فقط من مكونات اللوحة الأم.", "options_json": "[]", "correct_answer": "1- مجموعة الرقائق، 2- شقوق التوسعة، 3- شقوق الذاكرة العشوائية، 4- وحدة المعالجة المركزية (CPU)، 5- موصلات القدرة.", "explanation": "توجد 10 مكونات في النص، وتم اختيار أول خمسة منها كإجابة نموذجية.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": []}, {"id": 32, "book_id": 3, "material_id": 8, "type": "mcq", "question": "ما هي الرقاقة المسؤولة عن تحديد سرعة نقل البيانات القصوى بين اللوحة الأم والقرص الصلب؟", "options_json": "[\"رقاقة الجسر الشمالي\", \"رقاقة الجسر الجنوبي\", \"رقاقة البايوس\", \"وحدة المعالجة المركزية\"]", "correct_answer": "رقاقة الجسر الجنوبي", "explanation": "رقاقة الجسر الجنوبي هي التي تحدد سرعة نقل البيانات القصوى بين اللوحة الأم والقرص الصلب.", "difficulty": "medium", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": ["رقاقة الجسر الشمالي", "رقاقة الجسر الجنوبي", "رقاقة البايوس", "وحدة المعالجة المركزية"]}, {"id": 33, "book_id": 3, "material_id": 8, "type": "true_false", "question": "تعمل شريحة الجسر الشمالي على تحديد نوع المعالج ونوع الذاكرة وسعتها.", "options_json": "[\"صح\", \"خطأ\"]", "correct_answer": "صح", "explanation": "وفقاً للنص، تعمل شريحة الجسر الشمالي على تحديد نوع المعالج ونوع الذاكرة وسعتها وسرعة الشق AGP.", "difficulty": "easy", "times_tested": 0, "times_correct": 0, "created_at": "2026-10-27 18:11:55", "options": ["صح", "خطأ"]}]}];

class StudyDB {
  constructor() {
    this.dbName = 'StudyAssistantDB';
    this.version = 1;
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Books store
        if (!db.objectStoreNames.contains('books')) {
          const booksStore = db.createObjectStore('books', { keyPath: 'id', autoIncrement: true });
          booksStore.createIndex('name', 'name', { unique: false });
        }

        // Materials store
        if (!db.objectStoreNames.contains('materials')) {
          const matStore = db.createObjectStore('materials', { keyPath: 'id', autoIncrement: true });
          matStore.createIndex('book_id', 'book_id', { unique: false });
        }

        // Questions store
        if (!db.objectStoreNames.contains('questions')) {
          const qStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
          qStore.createIndex('book_id', 'book_id', { unique: false });
          qStore.createIndex('material_id', 'material_id', { unique: false });
        }

        // Quiz History store
        if (!db.objectStoreNames.contains('history')) {
          const hStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          hStore.createIndex('book_id', 'book_id', { unique: false });
          hStore.createIndex('date', 'date', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (e) => {
        this.db = e.target.result;
        // Auto-seed if database is completely empty
        await this.autoSeedIfEmpty();
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB error:', e);
        reject(e);
      };
    });
  }

  async autoSeedIfEmpty() {
    const books = await this.getBooks();
    if (books.length === 0 && INITIAL_SEED_DATA && INITIAL_SEED_DATA.length > 0) {
      console.log('Seeding initial data into IndexedDB...');
      for (const item of INITIAL_SEED_DATA) {
        const originalBook = item.book;
        const newBookId = await this.addBook({
          name: originalBook.name,
          description: originalBook.description || '',
          icon: originalBook.icon || 'book',
          color: originalBook.color || '#3b82f6',
          created_at: originalBook.created_at || new Date().toISOString()
        });

        const matIdMap = {};
        if (item.materials) {
          for (const mat of item.materials) {
            const newMatId = await this.addMaterial({
              book_id: newBookId,
              title: mat.title,
              page_range: mat.page_range || '',
              extracted_text: mat.extracted_text || '',
              summary: mat.summary || '',
              file_type: mat.file_type || 'image',
              files_json: mat.files_json || '[]',
              created_at: mat.created_at || new Date().toISOString()
            });
            matIdMap[mat.id] = newMatId;
          }
        }

        if (item.questions) {
          for (const q of item.questions) {
            let options = q.options;
            if (typeof options === 'string') {
              try { options = JSON.parse(options); } catch(e) { options = []; }
            } else if (!options && q.options_json) {
              try { options = JSON.parse(q.options_json); } catch(e) { options = []; }
            }
            await this.addQuestion({
              book_id: newBookId,
              material_id: matIdMap[q.material_id] || 0,
              type: q.type || 'mcq',
              question: q.question,
              options: options,
              correct_answer: q.correct_answer,
              explanation: q.explanation || '',
              difficulty: q.difficulty || 'medium',
              times_tested: q.times_tested || 0,
              times_correct: q.times_correct || 0,
              created_at: q.created_at || new Date().toISOString()
            });
          }
        }
      }
      console.log('Database seeded successfully!');
    }
  }

  // --- Books CRUD ---
  async getBooks() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('books', 'readonly');
      const store = tx.objectStore('books');
      const req = store.getAll();
      req.onsuccess = async () => {
        const books = req.result || [];
        // calculate counts
        for (const b of books) {
          const mats = await this.getMaterials(b.id);
          const qs = await this.getQuestions(b.id);
          b.materials_count = mats.length;
          b.questions_count = qs.length;
          b.avg_score = 0;
        }
        resolve(books);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getBook(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('books', 'readonly');
      const store = tx.objectStore('books');
      const req = store.get(Number(id));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async addBook(bookData) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const req = store.add({
        name: bookData.name,
        description: bookData.description || '',
        icon: bookData.icon || 'book',
        color: bookData.color || '#3b82f6',
        created_at: new Date().toISOString()
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteBook(id) {
    await this.initPromise;
    id = Number(id);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['books', 'materials', 'questions', 'history'], 'readwrite');
      tx.objectStore('books').delete(id);

      // Cascading deletes
      const matStore = tx.objectStore('materials');
      const matIndex = matStore.index('book_id');
      const matReq = matIndex.openCursor(IDBKeyRange.only(id));
      matReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      const qStore = tx.objectStore('questions');
      const qIndex = qStore.index('book_id');
      const qReq = qIndex.openCursor(IDBKeyRange.only(id));
      qReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Materials CRUD ---
  async getMaterials(bookId) {
    await this.initPromise;
    bookId = Number(bookId);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('materials', 'readonly');
      const store = tx.objectStore('materials');
      const index = store.index('book_id');
      const req = index.getAll(IDBKeyRange.only(bookId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async addMaterial(matData) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('materials', 'readwrite');
      const store = tx.objectStore('materials');
      const req = store.add({
        book_id: Number(matData.book_id),
        title: matData.title,
        page_range: matData.page_range || '',
        extracted_text: matData.extracted_text || '',
        summary: matData.summary || '',
        file_type: matData.file_type || 'image',
        files_json: matData.files_json || '[]',
        created_at: new Date().toISOString()
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteMaterial(id) {
    await this.initPromise;
    id = Number(id);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('materials', 'readwrite');
      const store = tx.objectStore('materials');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Questions CRUD ---
  async getQuestions(bookId) {
    await this.initPromise;
    bookId = Number(bookId);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('questions', 'readonly');
      const store = tx.objectStore('questions');
      const index = store.index('book_id');
      const req = index.getAll(IDBKeyRange.only(bookId));
      req.onsuccess = () => {
        const qs = req.result || [];
        // normalize options
        qs.forEach(q => {
          if (typeof q.options === 'string') {
            try { q.options = JSON.parse(q.options); } catch(e) { q.options = []; }
          }
          if (!q.options && q.options_json) {
            try { q.options = JSON.parse(q.options_json); } catch(e) { q.options = []; }
          }
        });
        resolve(qs);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async addQuestion(qData) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('questions', 'readwrite');
      const store = tx.objectStore('questions');
      let opts = qData.options;
      if (typeof opts === 'string') {
        try { opts = JSON.parse(opts); } catch(e) { opts = []; }
      }
      const req = store.add({
        book_id: Number(qData.book_id),
        material_id: Number(qData.material_id || 0),
        type: qData.type || 'mcq',
        question: qData.question,
        options: opts,
        options_json: JSON.stringify(opts),
        correct_answer: qData.correct_answer,
        explanation: qData.explanation || '',
        difficulty: qData.difficulty || 'medium',
        times_tested: Number(qData.times_tested || 0),
        times_correct: Number(qData.times_correct || 0),
        created_at: new Date().toISOString()
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async updateQuestion(id, updates) {
    await this.initPromise;
    id = Number(id);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('questions', 'readwrite');
      const store = tx.objectStore('questions');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (!getReq.result) return resolve(false);
        const updated = Object.assign(getReq.result, updates);
        if (updates.options) {
          updated.options_json = JSON.stringify(updates.options);
        }
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async deleteQuestion(id) {
    await this.initPromise;
    id = Number(id);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('questions', 'readwrite');
      const store = tx.objectStore('questions');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Quiz History ---
  async addHistory(historyItem) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      const req = store.add({
        book_id: Number(historyItem.book_id),
        book_name: historyItem.book_name || '',
        score: historyItem.score,
        total_questions: historyItem.total_questions,
        correct_answers: historyItem.correct_answers,
        percentage: historyItem.percentage,
        details: historyItem.details || [],
        date: historyItem.date || new Date().toISOString()
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getHistory() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('history', 'readonly');
      const store = tx.objectStore('history');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        // sort by date descending
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- Statistics ---
  async getStats() {
    await this.initPromise;
    const books = await this.getBooks();
    const history = await this.getHistory();

    let totalQuestions = 0;
    let totalMaterials = 0;
    for (const b of books) {
      totalQuestions += b.questions_count || 0;
      totalMaterials += b.materials_count || 0;
    }

    let avgScore = 0;
    if (history.length > 0) {
      const sum = history.reduce((acc, h) => acc + (h.percentage || 0), 0);
      avgScore = Math.round(sum / history.length);
    }

    return {
      total_books: books.length,
      total_materials: totalMaterials,
      total_questions: totalQuestions,
      total_quizzes: history.length,
      avg_score: avgScore
    };
  }

  // --- Backup & Restore (JSON Export / Import) ---
  async exportBackup() {
    await this.initPromise;
    const books = await this.getBooks();
    const backup = [];
    for (const b of books) {
      const materials = await this.getMaterials(b.id);
      const questions = await this.getQuestions(b.id);
      backup.push({
        book: b,
        materials: materials,
        questions: questions
      });
    }
    const history = await this.getHistory();
    return {
      version: 1,
      exported_at: new Date().toISOString(),
      books_data: backup,
      history: history
    };
  }

  async importBackup(data) {
    await this.initPromise;
    if (!data) return false;
    const booksData = data.books_data || (Array.isArray(data) ? data : []);
    
    for (const item of booksData) {
      if (!item.book) continue;
      const newBookId = await this.addBook({
        name: item.book.name,
        description: item.book.description || '',
        icon: item.book.icon || 'book',
        color: item.book.color || '#3b82f6'
      });

      const matIdMap = {};
      if (item.materials) {
        for (const mat of item.materials) {
          const newMatId = await this.addMaterial({
            book_id: newBookId,
            title: mat.title,
            page_range: mat.page_range || '',
            extracted_text: mat.extracted_text || '',
            summary: mat.summary || '',
            file_type: mat.file_type || 'image',
            files_json: mat.files_json || '[]'
          });
          matIdMap[mat.id] = newMatId;
        }
      }

      if (item.questions) {
        for (const q of item.questions) {
          let options = q.options;
          if (typeof options === 'string') {
            try { options = JSON.parse(options); } catch(e) { options = []; }
          }
          await this.addQuestion({
            book_id: newBookId,
            material_id: matIdMap[q.material_id] || 0,
            type: q.type || 'mcq',
            question: q.question,
            options: options,
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium'
          });
        }
      }
    }

    if (data.history && Array.isArray(data.history)) {
      for (const h of data.history) {
        await this.addHistory(h);
      }
    }

    return true;
  }
}

// Global singleton instance
window.studyDB = new StudyDB();
