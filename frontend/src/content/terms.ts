/**
 * Terms & Privacy Policy shown at signup (dialog) and on /terms.
 * When the text changes, bump TERMS_VERSION here and in backend/utils/legal.js.
 * Not legal advice — have it reviewed before a public launch.
 */
export const TERMS_VERSION = '2026-11-17';
export const CONTACT_EMAIL = 'abdallahshady4@gmail.com';

export interface TermsSection {
    title: string;
    paragraphs?: string[];
    bullets?: string[];
    /** Shown after the bullet list */
    footer?: string[];
}

export interface TermsDocument {
    title: string;
    lastUpdated: string;
    summary: string;
    sections: TermsSection[];
}

const en: TermsDocument = {
    title: 'Terms & Privacy Policy',
    lastUpdated: 'Last updated: November 17, 2026',
    summary:
        'In short: HeartAI uses AI to screen your heart sounds — it is not a doctor and can be wrong. ' +
        'By creating an account, you agree that we securely store your recordings and health answers, use them to give you ' +
        'results, and use them with your identity removed to train and improve HeartAI. We never sell your data.',
    sections: [
        {
            title: '1. Medical disclaimer',
            paragraphs: [
                'HeartAI is a screening and research tool, not a medical device, and it does not provide a medical diagnosis. ' +
                'Results are estimates from an AI model and can be wrong — it may miss a problem or flag a healthy heart.',
            ],
            bullets: [
                'Always consult a qualified doctor about your heart health, whatever result you get.',
                'Never ignore medical advice or delay seeing a doctor because of a HeartAI result.',
                'If you have chest pain, shortness of breath, fainting, or a racing or irregular heartbeat, call emergency services immediately (123 in Egypt).',
            ],
        },
        {
            title: '2. Who can use HeartAI',
            paragraphs: ['You must be at least 18 years old. Only record your own heart, or someone who has given you permission.'],
        },
        {
            title: '3. What we collect',
            bullets: [
                'Account details: name, email, age, gender, and your password (stored only in encrypted, hashed form).',
                'Health information: the medical-history answers you give at signup and the optional answers you give about a recording.',
                'Heart sound recordings: a compact copy of each recording you submit (mono, up to 30 seconds), and its analysis result.',
                'Technical data: a login cookie to keep you signed in, and basic server logs for security.',
            ],
        },
        {
            title: '4. How we use it',
            bullets: [
                'To analyze your recordings and show your results and history.',
                'To send account emails such as verification and password-reset codes.',
                'To train, test and improve the HeartAI models, using de-identified data (see section 5).',
                'For research, where only aggregated, non-identifying findings are ever published.',
            ],
            footer: ['We never sell your data or use it for advertising.'],
        },
        {
            title: '5. Training and de-identification',
            paragraphs: [
                'Recordings and answers used for training are separated from your name and email and linked only by a random code. ' +
                'Only authorized members of the HeartAI team can access them, and only for improving the models and research.',
            ],
        },
        {
            title: '6. How we protect your data',
            bullets: [
                'All connections are encrypted (HTTPS), passwords are hashed, and your data is only reachable through your account.',
                'We use trusted providers that process data on our behalf: MongoDB Atlas (database, Frankfurt, EU), Render (server), Vercel (website) and Brevo (email).',
            ],
        },
        {
            title: '7. How long we keep it',
            paragraphs: [
                'We keep your data while your account is active. If you ask us to delete your account, we delete your account, recordings and answers within 30 days. ' +
                'De-identified data already used to train a model cannot be removed from that trained model, but it will not be used for new training.',
            ],
        },
        {
            title: '8. Your rights',
            bullets: [
                'Access a copy of your data, or correct it.',
                'Delete your account, recordings and answers — this also withdraws your consent for any future use.',
                'Complain to the data-protection authority (in Egypt, the Personal Data Protection Center).',
            ],
            footer: [`To use any of these rights, email us at ${CONTACT_EMAIL}.`],
        },
        {
            title: '9. Limitation of liability',
            paragraphs: [
                'HeartAI is provided "as is", without guarantees of accuracy or availability. To the extent the law allows, we are not responsible ' +
                'for decisions made based on its results.',
            ],
        },
        {
            title: '10. Changes',
            paragraphs: ['If we change these terms in a way that affects how your data is used, we will tell you and ask for your agreement again.'],
        },
        {
            title: '11. Contact',
            paragraphs: [`Questions or requests: ${CONTACT_EMAIL}`],
        },
    ],
};

const ar: TermsDocument = {
    title: 'الشروط وسياسة الخصوصية',
    lastUpdated: 'آخر تحديث: 17 نوفمبر 2026',
    summary:
        'باختصار: يستخدم HeartAI الذكاء الاصطناعي لفحص أصوات قلبك — وهو ليس طبيبًا وقد يخطئ. ' +
        'بإنشائك حسابًا، توافق على أن نحفظ تسجيلاتك وإجاباتك الصحية بشكل آمن، وأن نستخدمها لعرض نتائجك، ' +
        'وأن نستخدمها بعد إزالة هويتك لتدريب HeartAI وتحسينه. لن نبيع بياناتك أبدًا.',
    sections: [
        {
            title: '1. إخلاء المسؤولية الطبية',
            paragraphs: [
                'HeartAI أداة فحص وبحث، وليس جهازًا طبيًا ولا يقدّم تشخيصًا طبيًا. ' +
                'النتائج تقديرات من نموذج ذكاء اصطناعي وقد تكون خاطئة — فقد يفوّت مشكلة أو ينبّه إلى قلب سليم.',
            ],
            bullets: [
                'استشر دائمًا طبيبًا مختصًا بشأن صحة قلبك، أيًا كانت النتيجة.',
                'لا تتجاهل نصيحة الطبيب ولا تؤجّل زيارته بسبب نتيجة من HeartAI.',
                'إذا شعرت بألم في الصدر أو ضيق في التنفس أو إغماء أو تسارع أو عدم انتظام في ضربات القلب، اتصل بالإسعاف فورًا (123 في مصر).',
            ],
        },
        {
            title: '2. من يمكنه استخدام HeartAI',
            paragraphs: ['يجب ألا يقل عمرك عن 18 عامًا. سجّل صوت قلبك أنت فقط، أو قلب شخص أعطاك إذنه بذلك.'],
        },
        {
            title: '3. البيانات التي نجمعها',
            bullets: [
                'بيانات الحساب: الاسم والبريد الإلكتروني والعمر والنوع، وكلمة المرور (تُحفظ مشفّرة فقط).',
                'المعلومات الصحية: إجاباتك عن تاريخك الطبي عند التسجيل، وإجاباتك الاختيارية عن كل تسجيل.',
                'تسجيلات صوت القلب: نسخة مضغوطة من كل تسجيل ترسله (قناة واحدة، حتى 30 ثانية)، ونتيجة تحليله.',
                'بيانات تقنية: ملف تعريف ارتباط (كوكي) لإبقائك مسجلًا للدخول، وسجلات أساسية للخادم لأغراض الأمان.',
            ],
        },
        {
            title: '4. كيف نستخدمها',
            bullets: [
                'لتحليل تسجيلاتك وعرض نتائجك وسجلّك.',
                'لإرسال رسائل الحساب مثل رموز التحقق وإعادة تعيين كلمة المرور.',
                'لتدريب نماذج HeartAI واختبارها وتحسينها باستخدام بيانات بعد إزالة الهوية (انظر البند 5).',
                'لأغراض البحث، ولا تُنشر إلا نتائج مجمّعة لا تكشف هوية أحد.',
            ],
            footer: ['لن نبيع بياناتك أبدًا ولن نستخدمها للإعلانات.'],
        },
        {
            title: '5. التدريب وإزالة الهوية',
            paragraphs: [
                'تُفصل التسجيلات والإجابات المستخدمة في التدريب عن اسمك وبريدك الإلكتروني، ولا تُربط إلا برمز عشوائي. ' +
                'لا يصل إليها إلا أعضاء فريق HeartAI المصرّح لهم، ولغرض تحسين النماذج والبحث فقط.',
            ],
        },
        {
            title: '6. كيف نحمي بياناتك',
            bullets: [
                'جميع الاتصالات مشفّرة (HTTPS)، وكلمات المرور مشفّرة، ولا يمكن الوصول إلى بياناتك إلا من خلال حسابك.',
                'نستعين بمزوّدي خدمات موثوقين يعالجون البيانات نيابةً عنا: MongoDB Atlas (قاعدة البيانات، فرانكفورت، الاتحاد الأوروبي)، وRender (الخادم)، وVercel (الموقع)، وBrevo (البريد الإلكتروني).',
            ],
        },
        {
            title: '7. مدة الاحتفاظ بالبيانات',
            paragraphs: [
                'نحتفظ ببياناتك ما دام حسابك نشطًا. إذا طلبت حذف حسابك، نحذف حسابك وتسجيلاتك وإجاباتك خلال 30 يومًا. ' +
                'البيانات منزوعة الهوية التي استُخدمت بالفعل في تدريب نموذج لا يمكن إزالتها من ذلك النموذج المدرَّب، لكنها لن تُستخدم في أي تدريب جديد.',
            ],
        },
        {
            title: '8. حقوقك',
            bullets: [
                'الحصول على نسخة من بياناتك أو تصحيحها.',
                'حذف حسابك وتسجيلاتك وإجاباتك — وهذا يسحب موافقتك على أي استخدام مستقبلي.',
                'تقديم شكوى إلى جهة حماية البيانات (في مصر: مركز حماية البيانات الشخصية).',
            ],
            footer: [`لممارسة أي من هذه الحقوق، راسلنا على ${CONTACT_EMAIL}.`],
        },
        {
            title: '9. حدود المسؤولية',
            paragraphs: [
                'يُقدَّم HeartAI "كما هو"، دون ضمانات للدقة أو للإتاحة. وفي الحدود التي يسمح بها القانون، لا نتحمّل مسؤولية القرارات المتخذة بناءً على نتائجه.',
            ],
        },
        {
            title: '10. التغييرات',
            paragraphs: ['إذا غيّرنا هذه الشروط بما يؤثر على طريقة استخدام بياناتك، فسنبلغك ونطلب موافقتك من جديد.'],
        },
        {
            title: '11. التواصل',
            paragraphs: [`للأسئلة أو الطلبات: ${CONTACT_EMAIL}`],
        },
    ],
};

export const TERMS: Record<'en' | 'ar', TermsDocument> = { en, ar };
export const getTerms = (language: string): TermsDocument => (language.startsWith('ar') ? ar : en);
