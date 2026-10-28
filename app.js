// Smart Study Assistant - Standalone Web & Android Client
// Powered by IndexedDB and Gemini 3 Flash AI - Works 100% 24/7 without PC

// State Management
let currentTab = 'books';
let booksList = [];
let selectedUploadFiles = [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let lastUploadedMaterial = null;
let lastQuizSubmission = null;
let activeResultsFilter = 'all';

// On Page Load
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    refreshIcons();
    registerServiceWorker();

    try {
        await loadBooks();
        await loadStats();
    } catch (e) {
        console.error('Initialization error:', e);
    }

    // Setup Drag and Drop
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('border-brand-500', 'bg-brand-50/50'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('border-brand-500', 'bg-brand-50/50'), false);
        });
        dropZone.addEventListener('drop', handleDrop, false);
    }
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    addFiles(files);
}

function handleFileSelect(e) {
    addFiles(e.target.files);
}

function addFiles(files) {
    for (let f of files) {
        selectedUploadFiles.push(f);
    }
    renderSelectedFiles();
}

function renderSelectedFiles() {
    const container = document.getElementById('selected-files-list');
    if (!container) return;
    container.innerHTML = '';
    if (selectedUploadFiles.length === 0) return;

    // Header counter of full pages
    const header = document.createElement('div');
    header.className = 'text-xs font-black text-brand-700 dark:text-brand-300 flex items-center justify-between pb-1';
    header.innerHTML = `
        <span class="flex items-center gap-1.5">
            <i data-lucide="layers" class="w-4 h-4"></i>
            <span>إجمالي الصفحات المحددة: ${selectedUploadFiles.length} صفحة كاملة</span>
        </span>
        <span class="text-[11px] text-slate-400">ستُحفظ كل صفحة بتفاصيلها</span>
    `;
    container.appendChild(header);

    selectedUploadFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs shadow-sm';
        
        const isPdf = file.name.endsWith('.pdf');
        const iconName = isPdf ? 'file-text' : 'image';
        const pageLabel = isPdf ? `ملف مستند ${index + 1}` : `صفحة كاملة (${index + 1})`;
        
        item.innerHTML = `
            <div class="flex items-center gap-2.5 truncate">
                <span class="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-[11px] shrink-0 border border-indigo-200 dark:border-indigo-800">${pageLabel}</span>
                <i data-lucide="${iconName}" class="w-4 h-4 text-brand-600 shrink-0"></i>
                <span class="font-bold truncate text-slate-800 dark:text-slate-200">${file.name}</span>
                <span class="text-slate-400 text-[11px]">(${Math.round(file.size / 1024)} ك.ب)</span>
            </div>
            <button onclick="removeSelectedFile(${index})" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        `;
        container.appendChild(item);
    });
    refreshIcons();
}

function removeSelectedFile(index) {
    selectedUploadFiles.splice(index, 1);
    renderSelectedFiles();
}

function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Service Worker for PWA Offline Caching
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.log('SW registration error:', err);
        });
    }
}

// Theme
function initTheme() {
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeIcon();
}

function toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (document.documentElement.classList.contains('dark')) {
        icon.setAttribute('data-lucide', 'sun');
    } else {
        icon.setAttribute('data-lucide', 'moon');
    }
    refreshIcons();
}

// Navigation Tabs
function switchTab(tabId) {
    currentTab = tabId;

    // Hide all view sections
    document.querySelectorAll('[id^="view-"]').forEach(el => {
        el.classList.add('hidden');
    });

    // Unselect all tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('text-brand-600', 'dark:text-brand-400', 'bg-brand-50', 'dark:bg-brand-950/50');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
    });

    // Show target view
    const targetView = document.getElementById(`view-${tabId}`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // Highlight button
    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
        activeBtn.classList.add('text-brand-600', 'dark:text-brand-400', 'bg-brand-50', 'dark:bg-brand-950/50');
    }

    // Load data specific to tab
    if (tabId === 'books') loadBooks();
    if (tabId === 'bank') loadBankQuestions();
    if (tabId === 'stats') loadStats();
    refreshIcons();
}

// --- Books Management ---
async function loadBooks() {
    try {
        booksList = await window.studyDB.getBooks();
        renderBooksGrid(booksList);
        updateBookSelects(booksList);
    } catch (e) {
        console.error('Failed to load books:', e);
    }
}

function renderBooksGrid(books) {
    const grid = document.getElementById('books-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!books || books.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center">
                <div class="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 mx-auto flex items-center justify-center mb-4 shadow-inner">
                    <i data-lucide="book-open" class="w-10 h-10"></i>
                </div>
                <h3 class="text-lg font-black text-slate-800 dark:text-slate-200 mb-1">لا توجد كتب أو مواد دراسية بعد</h3>
                <p class="text-sm text-slate-500 max-w-sm mx-auto mb-6">أضف كتابك أو مادتك الدراسية الأولى وابدأ باستخراج الأسئلة فوراً</p>
                <button onclick="openNewBookModal()" class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition inline-flex items-center gap-2">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                    <span>إضافة مادة دراسية جديدة</span>
                </button>
            </div>
        `;
        refreshIcons();
        return;
    }

    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all duration-300 flex flex-col justify-between';

        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md" style="background-color: ${book.color || '#3b82f6'}">
                        <i data-lucide="${book.icon || 'book'}" class="w-6 h-6"></i>
                    </div>
                    <button onclick="deleteBook(${book.id}, '${book.name}')" class="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition" title="حذف المادة">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <h3 class="text-base font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">${book.name}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">${book.description || 'لا يوجد وصف للمادة'}</p>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3">
                <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span class="flex items-center gap-1.5">
                        <i data-lucide="file-text" class="w-3.5 h-3.5 text-indigo-500"></i>
                        <span>${book.materials_count || 0} جلسة دراسة</span>
                    </span>
                    <span class="flex items-center gap-1.5">
                        <i data-lucide="help-circle" class="w-3.5 h-3.5 text-amber-500"></i>
                        <span>${book.questions_count || 0} سؤال</span>
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="prepareUploadForBook(${book.id})" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold transition flex items-center justify-center gap-1.5">
                        <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                        <span>إضافة مادة</span>
                    </button>
                    <button onclick="quickQuizForBook(${book.id})" class="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20">
                        <i data-lucide="play" class="w-3.5 h-3.5"></i>
                        <span>بدء اختبار</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    refreshIcons();
}

function updateBookSelects(books) {
    const selects = ['upload-book-select', 'quiz-book-select', 'bank-book-select'];
    selects.forEach(selectId => {
        const el = document.getElementById(selectId);
        if (!el) return;
        const currentVal = el.value;
        el.innerHTML = '';

        if (selectId === 'bank-book-select') {
            const allOpt = document.createElement('option');
            allOpt.value = 'all';
            allOpt.innerText = 'جميع المواد والكتب';
            el.appendChild(allOpt);
        }

        books.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.innerText = b.name;
            el.appendChild(opt);
        });

        if (currentVal && [...el.options].some(o => o.value == currentVal)) {
            el.value = currentVal;
        } else if (books.length > 0 && selectId !== 'bank-book-select') {
            el.value = books[0].id;
        }
    });
}

function openNewBookModal() {
    const modal = document.getElementById('modal-new-book');
    if (modal) modal.classList.remove('hidden');
    document.getElementById('new-book-name').value = '';
    document.getElementById('new-book-desc').value = '';
}

function closeNewBookModal() {
    const modal = document.getElementById('modal-new-book');
    if (modal) modal.classList.add('hidden');
}

async function submitNewBook(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nameInput = document.getElementById('new-book-name');
    const descInput = document.getElementById('new-book-desc');
    const colorInput = document.getElementById('new-book-color');
    const name = nameInput.value.trim();

    if (!name) {
        alert('يرجى إدخال اسم الكتاب أو المادة');
        return;
    }

    try {
        await window.studyDB.addBook({
            name: name,
            description: descInput.value.trim(),
            color: colorInput ? colorInput.value : '#3b82f6',
            icon: 'book'
        });
        closeNewBookModal();
        await loadBooks();
        await loadStats();
    } catch (err) {
        alert('حدث خطأ أثناء حفظ الكتاب: ' + err.message);
    }
}

async function deleteBook(bookId, bookName) {
    if (!confirm(`هل أنت متأكد من حذف المادة "${bookName}" وكافة ملخصاتها وأسئلتها؟`)) {
        return;
    }

    try {
        await window.studyDB.deleteBook(bookId);
        await loadBooks();
        await loadStats();
    } catch (err) {
        alert('فشل حذف المادة: ' + err.message);
    }
}

function prepareUploadForBook(bookId) {
    switchTab('upload');
    const select = document.getElementById('upload-book-select');
    if (select) select.value = bookId;
}

function quickQuizForBook(bookId) {
    switchTab('quiz');
    const select = document.getElementById('quiz-book-select');
    if (select) select.value = bookId;
    onQuizBookChange();
}

// --- Upload & AI Processing ---
async function submitStudyMaterial() {
    const bookSelect = document.getElementById('upload-book-select');
    const titleInput = document.getElementById('upload-title');
    const pageRangeInput = document.getElementById('upload-pages');
    const textNotesInput = document.getElementById('upload-notes');

    const bookId = bookSelect.value;
    const title = titleInput.value.trim();
    const pageRange = pageRangeInput ? pageRangeInput.value.trim() : '';
    const textNotes = textNotesInput ? textNotesInput.value.trim() : '';

    if (!bookId) {
        alert('يرجى اختيار مادة دراسية أولاً');
        return;
    }
    if (!title) {
        alert('يرجى إدخال عنوان للموضوع أو الدرس');
        return;
    }
    if (selectedUploadFiles.length === 0 && !textNotes) {
        alert('يرجى رفع صور صفحات الكتاب أو كتابة ملاحظات دراسية');
        return;
    }

    const currentBook = booksList.find(b => b.id == bookId);
    const bookName = currentBook ? currentBook.name : 'المادة الدراسية';

    const submitBtn = document.getElementById('upload-submit-btn');
    const processingBox = document.getElementById('processing-box');
    const processingStep = document.getElementById('processing-step');
    const resultBox = document.getElementById('study-result-box');

    if (resultBox) resultBox.classList.add('hidden');
    if (processingBox) processingBox.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        if (processingStep) processingStep.innerText = 'جاري ضغط ومعالجة الصور المرفقة...';

        // Compress images client-side
        const processedImages = [];
        for (let i = 0; i < selectedUploadFiles.length; i++) {
            const f = selectedUploadFiles[i];
            if (f.type.startsWith('image/')) {
                const compressed = await window.studyAI.compressImage(f, 1400, 0.85);
                processedImages.push(compressed);
            }
        }

        if (processingStep) processingStep.innerText = 'جاري تحليل نصوص الصفحات وتوليد الأسئلة بالذكاء الاصطناعي...';

        // Call Gemini AI directly
        const aiResult = await window.studyAI.processStudyMaterial(bookName, textNotes, processedImages, pageRange);

        if (processingStep) processingStep.innerText = 'جاري حفظ الملخص وبنك الأسئلة في الذاكرة الدائمة...';

        // Save material to IndexedDB
        const newMaterialId = await window.studyDB.addMaterial({
            book_id: bookId,
            title: title,
            page_range: pageRange,
            extracted_text: textNotes,
            summary: aiResult.summary || '',
            file_type: processedImages.length > 0 ? 'image' : 'text',
            files_json: JSON.stringify({ count: processedImages.length })
        });

        // Save questions to IndexedDB
        const questions = aiResult.questions || [];
        for (const q of questions) {
            await window.studyDB.addQuestion({
                book_id: bookId,
                material_id: newMaterialId,
                type: q.type || 'mcq',
                question: q.question,
                options: q.options || [],
                correct_answer: q.correct_answer,
                explanation: q.explanation || '',
                difficulty: q.difficulty || 'medium'
            });
        }

        lastUploadedMaterial = {
            id: newMaterialId,
            title: title,
            summary: aiResult.summary,
            questions_count: questions.length
        };

        // Reset form inputs
        titleInput.value = '';
        if (pageRangeInput) pageRangeInput.value = '';
        if (textNotesInput) textNotesInput.value = '';
        selectedUploadFiles = [];
        renderSelectedFiles();

        // Refresh stats
        await loadBooks();
        await loadStats();

        // Show study result display
        if (processingBox) processingBox.classList.add('hidden');
        if (resultBox) {
            resultBox.classList.remove('hidden');
            const summaryContent = document.getElementById('material-summary-content');
            if (summaryContent) {
                if (window.marked) {
                    summaryContent.innerHTML = marked.parse(aiResult.summary || '');
                } else {
                    summaryContent.innerText = aiResult.summary || '';
                }
            }
            resultBox.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        console.error('Upload & AI error:', err);
        if (processingBox) processingBox.classList.add('hidden');
        alert('حدث خطأ أثناء معالجة المادة بالذكاء الاصطناعي:\n' + err.message);
    } finally {
        submitBtn.disabled = false;
        refreshIcons();
    }
}

function startQuizWithLastMaterial() {
    if (!lastUploadedMaterial) return;
    const bookSelect = document.getElementById('upload-book-select');
    quickQuizForBook(bookSelect.value);
}

// --- Quiz Engine ---
async function onQuizBookChange() {
    const bookSelect = document.getElementById('quiz-book-select');
    const bookId = bookSelect.value;
    if (!bookId) return;

    const questions = await window.studyDB.getQuestions(bookId);
    const badge = document.getElementById('quiz-available-badge');
    if (badge) {
        badge.innerText = `💡 بنك الأسئلة الحالي يحتوي على ${questions.length} سؤال لهذه المادة`;
    }
}

async function startQuiz() {
    const bookSelect = document.getElementById('quiz-book-select');
    const bookId = bookSelect.value;
    const countSelect = document.getElementById('quiz-count-select');
    const count = parseInt(countSelect ? countSelect.value : 5) || 5;

    // Check mode: fresh_ai vs bank
    const modeRadio = document.querySelector('input[name="quiz-mode"]:checked');
    const isFreshAI = (modeRadio && modeRadio.value === 'fresh_ai');

    if (!bookId) {
        alert('يرجى اختيار مادة دراسية لبدء الاختبار');
        return;
    }

    const currentBook = booksList.find(b => b.id == bookId);
    const bookName = currentBook ? currentBook.name : 'المادة';

    const startBtn = document.getElementById('btn-start-quiz');
    const setupScreen = document.getElementById('quiz-setup-screen');
    const submittingScreen = document.getElementById('quiz-submitting-screen');
    const activeScreen = document.getElementById('quiz-active-screen');
    const resultsScreen = document.getElementById('quiz-results-screen');

    if (startBtn) startBtn.disabled = true;
    if (submittingScreen) submittingScreen.classList.remove('hidden');
    if (setupScreen) setupScreen.classList.add('hidden');

    try {
        let quizQuestions = [];

        if (isFreshAI) {
            // Fetch book materials summary
            const materials = await window.studyDB.getMaterials(bookId);
            const combinedSummary = materials.map(m => `### ${m.title}\n${m.summary}`).join('\n\n');

            if (!combinedSummary.trim()) {
                alert('لا يوجد ملخص للمادة بعد! يرجى إضافة صفحات للمادة أولاً أو اختيار وضع بنك الأسئلة.');
                if (submittingScreen) submittingScreen.classList.add('hidden');
                if (setupScreen) setupScreen.classList.remove('hidden');
                return;
            }

            quizQuestions = await window.studyAI.generateFreshQuiz(bookName, combinedSummary, count);
        } else {
            // Retrieve from local questions bank
            let allQs = await window.studyDB.getQuestions(bookId);
            if (allQs.length === 0) {
                alert('بنك الأسئلة فارغ لهذه المادة! اضغط على (أسئلة جديدة متجددة 🌟) أو ارفع صفحات جديدة.');
                if (submittingScreen) submittingScreen.classList.add('hidden');
                if (setupScreen) setupScreen.classList.remove('hidden');
                return;
            }

            // Shuffle
            allQs = allQs.sort(() => 0.5 - Math.random());
            quizQuestions = allQs.slice(0, count);

            // Shuffle options
            quizQuestions.forEach(q => {
                if (q.options && Array.isArray(q.options)) {
                    q.options = [...q.options].sort(() => 0.5 - Math.random());
                }
            });
        }

        currentQuiz = {
            book_id: bookId,
            book_name: bookName,
            questions: quizQuestions,
            is_fresh: isFreshAI
        };

        currentQuestionIndex = 0;
        userAnswers = {};

        // Switch screens
        if (submittingScreen) submittingScreen.classList.add('hidden');
        if (resultsScreen) resultsScreen.classList.add('hidden');
        if (activeScreen) activeScreen.classList.remove('hidden');

        const activeTitle = document.getElementById('quiz-active-title');
        if (activeTitle) activeTitle.innerText = `${bookName} (${isFreshAI ? 'أسئلة متجددة 🌟' : 'بنك الأسئلة'})`;

        renderActiveQuestion();

    } catch (err) {
        console.error('Quiz start error:', err);
        if (submittingScreen) submittingScreen.classList.add('hidden');
        if (setupScreen) setupScreen.classList.remove('hidden');
        alert('تعذر بدء الاختبار: ' + err.message);
    } finally {
        if (startBtn) startBtn.disabled = false;
        refreshIcons();
    }
}

function renderActiveQuestion() {
    if (!currentQuiz || !currentQuiz.questions) return;
    const q = currentQuiz.questions[currentQuestionIndex];
    const total = currentQuiz.questions.length;

    const counter = document.getElementById('quiz-counter-text');
    if (counter) counter.innerText = `السؤال ${currentQuestionIndex + 1} من ${total}`;

    const percent = Math.round(((currentQuestionIndex + 1) / total) * 100);
    const pBar = document.getElementById('quiz-progress-bar');
    if (pBar) pBar.style.width = `${percent}%`;

    const qText = document.getElementById('quiz-question-text');
    if (qText) qText.innerText = q.question;

    const optionsContainer = document.getElementById('quiz-options-container');
    optionsContainer.innerHTML = '';

    const currentSelected = userAnswers[currentQuestionIndex];

    const options = q.options || [];
    options.forEach((optText, optIdx) => {
        const isSelected = currentSelected === optText;
        const btn = document.createElement('button');
        btn.onclick = () => selectAnswer(optText);
        btn.className = `w-full text-right p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between font-bold text-sm ${
            isSelected
                ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-md ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-brand-300 dark:hover:border-slate-700'
        }`;

        const letter = ['أ', 'ب', 'ج', 'د', 'هـ'][optIdx] || (optIdx + 1);
        btn.innerHTML = `
            <div class="flex items-center gap-3.5">
                <span class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }">${letter}</span>
                <span>${optText}</span>
            </div>
            ${isSelected ? '<i data-lucide="check-circle-2" class="w-5 h-5 text-brand-600 shrink-0"></i>' : ''}
        `;
        optionsContainer.appendChild(btn);
    });

    // Prev / Next buttons
    const prevBtn = document.getElementById('quiz-prev-btn');
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;

    const nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn) {
        if (currentQuestionIndex === total - 1) {
            nextBtn.innerHTML = `<span>إنهاء وتسليم الاختبار</span> <i data-lucide="check-check" class="w-4 h-4"></i>`;
            nextBtn.className = 'px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-2';
        } else {
            nextBtn.innerHTML = `<span>السؤال التالي</span> <i data-lucide="chevron-left" class="w-4 h-4"></i>`;
            nextBtn.className = 'px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-2';
        }
    }

    refreshIcons();
}

function selectAnswer(optionText) {
    userAnswers[currentQuestionIndex] = optionText;
    renderActiveQuestion();
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderActiveQuestion();
    }
}

function nextQuestion() {
    const total = currentQuiz.questions.length;
    if (currentQuestionIndex < total - 1) {
        currentQuestionIndex++;
        renderActiveQuestion();
    } else {
        submitQuizAnswers();
    }
}

// --- Rephrase Question ("غيّر طريقة السؤال 🔀") ---
async function rephraseCurrentQuestion() {
    if (!currentQuiz || !currentQuiz.questions) return;
    const q = currentQuiz.questions[currentQuestionIndex];
    if (!q) return;

    const btn = document.getElementById('btn-rephrase-question');
    const textSpan = document.getElementById('rephrase-text');
    const icon = document.getElementById('rephrase-icon');

    const originalText = textSpan ? textSpan.innerText : 'غيّر طريقة السؤال 🔀';
    if (btn) btn.disabled = true;
    if (textSpan) textSpan.innerText = 'جاري تغيير صيغة السؤال...';
    if (icon) icon.classList.add('animate-spin');

    try {
        const rephrased = await window.studyAI.rephraseQuestion(
            q.question,
            q.options,
            q.correct_answer,
            q.explanation
        );

        if (rephrased && rephrased.question) {
            q.question = rephrased.question;
            if (rephrased.options && Array.isArray(rephrased.options)) {
                q.options = rephrased.options;
            }
            if (rephrased.explanation) {
                q.explanation = rephrased.explanation;
            }
            delete userAnswers[currentQuestionIndex];
            renderActiveQuestion();
        }
    } catch (err) {
        alert('تعذر تغيير طريقة السؤال:\n' + err.message);
    } finally {
        if (btn) btn.disabled = false;
        if (textSpan) textSpan.innerText = originalText;
        if (icon) icon.classList.remove('animate-spin');
        refreshIcons();
    }
}

// --- Submit Quiz & Detailed Breakdown Review ---
async function submitQuizAnswers() {
    if (!currentQuiz) return;

    const questions = currentQuiz.questions;
    let correctCount = 0;
    const details = [];

    questions.forEach((q, idx) => {
        const userChoice = userAnswers[idx] || 'لم تجب';
        const isCorrect = (userChoice.trim() === (q.correct_answer || '').trim());
        if (isCorrect) correctCount++;

        // Update question stats in DB if it has an ID
        if (q.id) {
            window.studyDB.updateQuestion(q.id, {
                times_tested: (q.times_tested || 0) + 1,
                times_correct: (q.times_correct || 0) + (isCorrect ? 1 : 0)
            }).catch(e => console.warn(e));
        }

        details.push({
            question_id: q.id || idx,
            question: q.question,
            user_answer: userChoice,
            correct_answer: q.correct_answer,
            is_correct: isCorrect,
            explanation: q.explanation || 'لا يوجد توضيح متاح لهذا السؤال.'
        });
    });

    const total = questions.length;
    const percentage = Math.round((correctCount / total) * 100);

    const submissionResult = {
        book_id: currentQuiz.book_id,
        book_name: currentQuiz.book_name,
        score: correctCount,
        total_questions: total,
        correct_answers: correctCount,
        percentage: percentage,
        details: details,
        date: new Date().toISOString()
    };

    // Save attempt to IndexedDB
    try {
        await window.studyDB.addHistory(submissionResult);
    } catch (e) {
        console.error('Failed to save history:', e);
    }

    lastQuizSubmission = submissionResult;
    showQuizResults(submissionResult);
    await loadStats();
}

function showQuizResults(result) {
    document.getElementById('quiz-active-screen').classList.add('hidden');
    const resScreen = document.getElementById('quiz-results-screen');
    resScreen.classList.remove('hidden');

    const percent = result.percentage;
    document.getElementById('results-score-percent').innerText = `${percent}%`;
    document.getElementById('results-score-fraction').innerText = `${result.correct_answers} من ${result.total_questions} صحيحة`;

    const headline = document.getElementById('results-headline');
    const badge = document.getElementById('results-status-badge');
    const iconWrap = document.getElementById('results-icon-wrap');

    if (percent >= 90) {
        headline.innerText = 'أداء عبقري وممتاز جداً! 🌟';
        badge.innerText = 'إتقان فائق للمفاهيم';
        iconWrap.innerText = '🏆';
        iconWrap.className = 'w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl bg-amber-100 text-amber-600';
    } else if (percent >= 75) {
        headline.innerText = 'أداء رائع جداً! أحسنت 👍';
        badge.innerText = 'فهم جيد لمعظم النقاط';
        iconWrap.innerText = '🎉';
        iconWrap.className = 'w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl bg-emerald-100 text-emerald-600';
    } else if (percent >= 50) {
        headline.innerText = 'بداية جيدة! يمكنك التحسين 💪';
        badge.innerText = 'تحتاج مراجعة بعض المفاهيم';
        iconWrap.innerText = '📖';
        iconWrap.className = 'w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl bg-blue-100 text-blue-600';
    } else {
        headline.innerText = 'لا تقلق، الممارسة تصنع المعجزات!';
        badge.innerText = 'أعد قراءة الملخص وحاول مجدداً';
        iconWrap.innerText = '💡';
        iconWrap.className = 'w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl bg-rose-100 text-rose-600';
    }

    // Counts for filters
    const totalCount = result.details.length;
    const wrongCount = result.details.filter(d => !d.is_correct).length;
    const correctCount = totalCount - wrongCount;

    document.getElementById('count-filter-all').innerText = totalCount;
    document.getElementById('count-filter-wrong').innerText = wrongCount;
    document.getElementById('count-filter-correct').innerText = correctCount;

    const retryBtn = document.getElementById('retry-wrong-btn');
    if (wrongCount > 0) {
        retryBtn.classList.remove('hidden');
    } else {
        retryBtn.classList.add('hidden');
    }

    activeResultsFilter = 'all';
    filterResultsBreakdown('all');
    refreshIcons();
}

function filterResultsBreakdown(filterType) {
    activeResultsFilter = filterType;

    const btnAll = document.getElementById('filter-btn-all');
    const btnWrong = document.getElementById('filter-btn-wrong');
    const btnCorrect = document.getElementById('filter-btn-correct');

    [btnAll, btnWrong, btnCorrect].forEach(b => {
        b.className = 'px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition';
    });

    if (filterType === 'all') {
        btnAll.className = 'px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold transition';
    } else if (filterType === 'wrong') {
        btnWrong.className = 'px-3 py-1.5 rounded-lg bg-rose-500 text-white shadow-sm font-bold transition';
    } else if (filterType === 'correct') {
        btnCorrect.className = 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white shadow-sm font-bold transition';
    }

    renderResultsBreakdownList();
}

function renderResultsBreakdownList() {
    if (!lastQuizSubmission) return;
    const breakdownList = document.getElementById('results-breakdown-list');
    breakdownList.innerHTML = '';

    const items = lastQuizSubmission.details.filter(d => {
        if (activeResultsFilter === 'wrong') return !d.is_correct;
        if (activeResultsFilter === 'correct') return d.is_correct;
        return true;
    });

    if (items.length === 0) {
        breakdownList.innerHTML = `
            <div class="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm">
                لا توجد أسئلة في هذا التصنيف.
            </div>
        `;
        return;
    }

    items.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = `p-5 rounded-2xl border transition-all ${
            item.is_correct
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
        }`;

        card.innerHTML = `
            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                        item.is_correct
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                    }">${idx + 1}</span>
                    <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        item.is_correct
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                    }">${item.is_correct ? 'إجابة صحيحة ✓' : 'إجابة خاطئة ✗'}</span>
                </div>
            </div>

            <h4 class="text-sm font-black text-slate-900 dark:text-white mb-3.5 leading-relaxed">${item.question}</h4>

            <div class="space-y-2 mb-3.5 text-xs font-bold">
                <div class="p-3 rounded-xl flex items-center justify-between ${
                    item.is_correct
                        ? 'bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-100/70 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                }">
                    <span class="text-slate-500 dark:text-slate-400">إجابتك:</span>
                    <span class="font-black">${item.user_answer}</span>
                </div>

                ${!item.is_correct ? `
                    <div class="p-3 rounded-xl flex items-center justify-between bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                        <span class="text-emerald-700 dark:text-emerald-400">الإجابة الصحيحة:</span>
                        <span class="font-black">${item.correct_answer}</span>
                    </div>
                ` : ''}
            </div>

            ${item.explanation ? `
                <div class="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <div class="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-500"></i>
                        <span>التوضيح والشرح من نص المادة:</span>
                    </div>
                    ${item.explanation}
                </div>
            ` : ''}
        `;
        breakdownList.appendChild(card);
    });
    refreshIcons();
}

function retryWrongQuestions() {
    if (!lastQuizSubmission) return;
    const wrongItems = lastQuizSubmission.details.filter(d => !d.is_correct);
    if (wrongItems.length === 0) return;

    const subQuestions = wrongItems.map(w => {
        let orig = null;
        if (currentQuiz && currentQuiz.questions) {
            orig = currentQuiz.questions.find(q => q.question === w.question);
        }
        return orig || {
            question: w.question,
            options: [w.correct_answer, w.user_answer, 'خيار إضافي', 'خيار آخر'],
            correct_answer: w.correct_answer,
            explanation: w.explanation
        };
    });

    currentQuiz = {
        book_id: lastQuizSubmission.book_id,
        book_name: lastQuizSubmission.book_name,
        questions: subQuestions,
        is_fresh: false
    };

    currentQuestionIndex = 0;
    userAnswers = {};

    document.getElementById('quiz-results-screen').classList.add('hidden');
    document.getElementById('quiz-active-screen').classList.remove('hidden');
    renderActiveQuestion();
}

function resetQuizView() {
    currentQuiz = null;
    userAnswers = {};
    document.getElementById('quiz-active-screen').classList.add('hidden');
    document.getElementById('quiz-results-screen').classList.add('hidden');
    document.getElementById('quiz-setup-screen').classList.remove('hidden');
    onQuizBookChange();
}

function confirmExitQuiz() {
    if (confirm('هل أنت متأكد من الخروج من الاختبار الحالي؟')) {
        resetQuizView();
    }
}

// --- Question Bank ---
async function loadBankQuestions() {
    const bookSelect = document.getElementById('bank-book-select');
    const selectedBookId = bookSelect ? bookSelect.value : 'all';
    const container = document.getElementById('bank-questions-list');
    if (!container) return;

    container.innerHTML = '<div class="py-8 text-center text-slate-400">جاري تحميل الأسئلة...</div>';

    try {
        let questions = [];
        if (selectedBookId === 'all') {
            for (const b of booksList) {
                const qs = await window.studyDB.getQuestions(b.id);
                questions = questions.concat(qs.map(q => ({ ...q, book_name: b.name })));
            }
        } else {
            questions = await window.studyDB.getQuestions(selectedBookId);
            const book = booksList.find(b => b.id == selectedBookId);
            const bookName = book ? book.name : '';
            questions = questions.map(q => ({ ...q, book_name: bookName }));
        }

        renderBankQuestions(questions);
    } catch (err) {
        container.innerHTML = `<div class="py-8 text-center text-rose-500">فشل تحميل بنك الأسئلة: ${err.message}</div>`;
    }
}

function renderBankQuestions(questions) {
    const container = document.getElementById('bank-questions-list');
    container.innerHTML = '';
    if (questions.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center text-slate-400">
                <i data-lucide="help-circle" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
                <p>لا توجد أسئلة مسجلة في بنك الأسئلة لهذا التصنيف</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    questions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3';

        const options = q.options || [];
        const optionsHtml = options.map((opt) => {
            const isCorrect = (opt.trim() === (q.correct_answer || '').trim());
            return `
                <div class="p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }">
                    <span>${opt}</span>
                    ${isCorrect ? '<span class="text-[11px] font-black text-emerald-600">✓ إجابة صحيحة</span>' : ''}
                </div>
            `;
        }).join('');

        item.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-black">#${idx + 1}</span>
                    <span class="text-xs text-slate-400">${q.book_name || ''}</span>
                </div>
                <button onclick="deleteQuestion(${q.id})" class="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>

            <h4 class="text-sm font-black text-slate-900 dark:text-white leading-relaxed">${q.question}</h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${optionsHtml}
            </div>

            ${q.explanation ? `
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <span class="font-bold text-slate-700 dark:text-slate-300">💡 التوضيح: </span>${q.explanation}
                </div>
            ` : ''}
        `;
        container.appendChild(item);
    });
    refreshIcons();
}

async function deleteQuestion(qId) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال من بنك الأسئلة؟')) return;
    try {
        await window.studyDB.deleteQuestion(qId);
        await loadBankQuestions();
        await loadStats();
    } catch (err) {
        alert('فشل حذف السؤال: ' + err.message);
    }
}

// --- Statistics & History ---
async function loadStats() {
    try {
        const stats = await window.studyDB.getStats();

        const booksCountEl = document.getElementById('stat-books-count');
        const materialsCountEl = document.getElementById('stat-materials-count');
        const questionsCountEl = document.getElementById('stat-questions-count');
        const avgScoreEl = document.getElementById('stat-avg-score');

        if (booksCountEl) booksCountEl.innerText = stats.total_books;
        if (materialsCountEl) materialsCountEl.innerText = stats.total_materials;
        if (questionsCountEl) questionsCountEl.innerText = stats.total_questions;
        if (avgScoreEl) avgScoreEl.innerText = `${stats.avg_score}%`;

        // Render history table
        const history = await window.studyDB.getHistory();
        renderHistoryTable(history);

    } catch (e) {
        console.error('Failed to load stats:', e);
    }
}

function renderHistoryTable(historyList) {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!historyList || historyList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-slate-400 text-xs">
                    لم تجرِ أي اختبارات بعد. ابدأ أول اختبار الآن!
                </td>
            </tr>
        `;
        return;
    }

    historyList.forEach((h) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-xs';

        const dateStr = h.date ? new Date(h.date).toLocaleDateString('ar-EG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        tr.innerHTML = `
            <td class="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">${h.book_name || 'مادة دراسية'}</td>
            <td class="py-3 px-4 text-slate-500">${dateStr}</td>
            <td class="py-3 px-4 font-bold">${h.correct_answers} / ${h.total_questions}</td>
            <td class="py-3 px-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-black ${
                    h.percentage >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    h.percentage >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                    'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }">${h.percentage}%</span>
            </td>
            <td class="py-3 px-4">
                <button onclick="viewHistoryDetail(${h.id})" class="text-brand-600 hover:text-brand-700 font-bold hover:underline flex items-center gap-1">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                    <span>مراجعة</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    refreshIcons();
}

async function viewHistoryDetail(historyId) {
    const historyList = await window.studyDB.getHistory();
    const item = historyList.find(h => h.id === historyId);
    if (!item) return;

    lastQuizSubmission = item;
    const modal = document.getElementById('modal-history-detail');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('modal-history-title').innerText = item.book_name || 'تفاصيل الاختبار';
        document.getElementById('modal-history-subtitle').innerText = `الدرجة: ${item.percentage}% (${item.correct_answers} من ${item.total_questions} صحيحة)`;

        const container = document.getElementById('modal-history-body');
        container.innerHTML = '';

        const details = item.details || [];
        details.forEach((d, idx) => {
            const card = document.createElement('div');
            card.className = `p-4 rounded-xl border text-xs space-y-2 ${
                d.is_correct
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            }`;
            card.innerHTML = `
                <div class="flex items-center justify-between font-bold">
                    <span>السؤال ${idx + 1}: ${d.question}</span>
                    <span class="px-2 py-0.5 rounded-full text-[11px] ${
                        d.is_correct ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                    }">${d.is_correct ? 'صحيح ✓' : 'خطأ ✗'}</span>
                </div>
                <div class="text-slate-600 dark:text-slate-300">
                    <div>إجابتك: <b class="${d.is_correct ? 'text-emerald-600' : 'text-rose-600'}">${d.user_answer}</b></div>
                    ${!d.is_correct ? `<div>الإجابة الصحيحة: <b class="text-emerald-600">${d.correct_answer}</b></div>` : ''}
                </div>
                ${d.explanation ? `<div class="text-slate-500 text-[11px] border-t border-slate-200 dark:border-slate-700 pt-1">💡 ${d.explanation}</div>` : ''}
            `;
            container.appendChild(card);
        });
    }
}

function closeHistoryModal() {
    const modal = document.getElementById('modal-history-detail');
    if (modal) modal.classList.add('hidden');
}

// --- Backup & Restore (JSON Export / Import) ---
async function exportBackupFile() {
    try {
        const backupData = await window.studyDB.exportBackup();
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `مساعد_الدراسة_نسخة_احتياطية_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('تعذر تصدير النسخة الاحتياطية: ' + e.message);
    }
}

async function triggerImportBackupFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    await window.studyDB.importBackup(parsed);
                    alert('تم استيراد النسخة الاحتياطية بنجاح!');
                    await loadBooks();
                    await loadStats();
                } catch (parseErr) {
                    alert('الملف غير صالح أو تالف: ' + parseErr.message);
                }
            };
            reader.readAsText(file, 'utf-8');
        } catch (readErr) {
            alert('فشل قراءة الملف: ' + readErr.message);
        }
    };
    input.click();
}

// --- Cloud & Mobile QR Modal ---
function openQrModal() {
    const modal = document.getElementById('modal-qr');
    if (modal) modal.classList.remove('hidden');
    refreshIcons();
}

function closeQrModal() {
    const modal = document.getElementById('modal-qr');
    if (modal) modal.classList.add('hidden');
}
