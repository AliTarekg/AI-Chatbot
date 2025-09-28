class LanguageUtils {
  constructor() {
    this.arabicKeywordMappings = {
      'أسعار': ['price', 'pricing', 'cost', 'fee', 'rates'],
      'تكلفة': ['cost', 'price', 'expense', 'fee'],
      'رسوم': ['fees', 'charges', 'cost', 'price'],
      'مجاني': ['free', 'complimentary', 'no-cost'],
      'دورات': ['course', 'courses', 'training', 'bootcamp', 'program'],
      'كورسات': ['course', 'courses', 'training', 'bootcamp'],
      'تدريب': ['training', 'course', 'courses', 'bootcamp', 'workshop'],
      'برامج': ['program', 'programs', 'courses', 'training'],
      'شهادة': ['certificate', 'certification', 'diploma'],
      'خدمات': ['service', 'services', 'consulting', 'support'],
      'منتجات': ['product', 'products', 'software', 'solution'],
      'حلول': ['solution', 'solutions', 'services'],
      'استشارات': ['consulting', 'consultation', 'advisory'],
      'اتصال': ['contact', 'contacts', 'phone', 'call'],
      'تواصل': ['contact', 'communication', 'reach'],
      'هاتف': ['phone', 'telephone', 'number'],
      'إيميل': ['email', 'mail', 'contact'],
      'عنوان': ['address', 'location', 'office'],
      'موقع': ['location', 'address', 'site', 'office'],
      'سياسات': ['policy', 'policies', 'terms', 'conditions'],
      'قوانين': ['rules', 'policies', 'regulations', 'terms'],
      'شروط': ['terms', 'conditions', 'requirements'],
      'أسئلة': ['faq', 'faqs', 'question', 'questions', 'ask'],
      'استفسار': ['inquiry', 'question', 'ask', 'faq'],
      'سؤال': ['question', 'ask', 'inquiry'],
      'شركة': ['company', 'overview', 'about', 'organization'],
      'مؤسسة': ['company', 'organization', 'institution'],
      'فريق': ['team', 'employees', 'staff', 'personnel'],
      'موظفين': ['employees', 'staff', 'team', 'workers'],
      'وقت': ['time', 'duration', 'schedule'],
      'مدة': ['duration', 'time', 'period'],
      'جدول': ['schedule', 'timetable', 'calendar'],
      'موعد': ['appointment', 'schedule', 'time'],
      'معلومات': ['information', 'details', 'data'],
      'تفاصيل': ['details', 'information', 'specifics'],
      'كيف': ['how', 'method', 'way'],
      'ماذا': ['what', 'which'],
      'متى': ['when', 'time', 'schedule'],
      'أين': ['where', 'location', 'place']
    };
    this.arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  }

  isArabic(text) {
    if (!text || typeof text !== 'string') return false;
    return this.arabicRegex.test(text);
  }

  detectLanguage(text) {
    return this.isArabic(text) ? 'ar' : 'en';
  }

  expandArabicKeywords(words) {
    const expandedWords = new Set(words);
    
    for (const word of words) {
      const englishEquivalents = this.arabicKeywordMappings[word];
      if (englishEquivalents) {
        englishEquivalents.forEach(equiv => expandedWords.add(equiv));
      }
    }
    
    return Array.from(expandedWords);
  }

  normalizeText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .trim()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      .replace(/\s+/g, ' ');
  }

  extractKeywords(query) {
    const normalizedQuery = this.normalizeText(query);
    const words = normalizedQuery
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    const expandedWords = this.expandArabicKeywords(words);
    
    return {
      original: words,
      expanded: expandedWords,
      language: this.detectLanguage(query)
    };
  }

  getEgyptianToneInstructions() {
    return `
    When responding in Arabic, use Egyptian dialect and tone with these characteristics:
    - Use "إزيك" or "أهلاً وسهلاً" for greetings
    - Use "إيه" instead of "ما" for questions
    - Use "عايز/عاوز" instead of "أريد"
    - Use friendly, conversational tone
    - Include common Egyptian expressions like "إن شاء الله", "ربنا يكرمك"
    - Be respectful and professional while maintaining warmth
    - Use "حضرتك" for formal address
    `;
  }
}

module.exports = LanguageUtils;
