import type {
  IndividualPerformanceAnalysisResult,
  IndividualPlan,
  InterventionPriority,
  PerformanceLevel,
  SkillPerformanceResult,
} from './types';

function safeSkill(priority?: InterventionPriority) {
  return priority?.skill || 'المهارة ذات الأولوية';
}

function formatArabicList(values: string[]): string {
  const unique = Array.from(new Set(values.filter(Boolean)));
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} و${unique[1]}`;
  return `${unique.slice(0, -1).join('، ')}، و${unique[unique.length - 1]}`;
}

function formatArabicNoteCount(count: number): string {
  const forms: Record<number, string> = {
    1: 'ملاحظة واحدة',
    2: 'ملاحظتان',
    3: 'ثلاث ملاحظات',
    4: 'أربع ملاحظات',
    5: 'خمس ملاحظات',
    6: 'ست ملاحظات',
    7: 'سبع ملاحظات',
    8: 'ثماني ملاحظات',
    9: 'تسع ملاحظات',
    10: 'عشر ملاحظات',
  };
  return forms[count] || `${count} ملاحظة`;
}

function formatMasteryCutoffScore(score: number, totalScore: number): string {
  const roundedUp = Math.ceil(score);
  if (Math.abs(score - roundedUp) < 0.000001) return `${score} درجة`;
  return `${score} درجة، أي نحو ${roundedUp} من ${totalScore} عند التقريب للدرجة الكاملة`;
}

export function buildSkillFocusSuggestion(skill: string, percent: number): string {
  if (percent >= 90) return `يُنصح بتقديم إثراء مناسب في مهارة ${skill} عبر مهمة أعمق أو سؤال مفتوح.`;
  if (percent >= 75) return `تحتاج مهارة ${skill} إلى تثبيت قصير للحفاظ على مستوى الإتقان.`;
  if (percent >= 50) return `تحتاج مهارة ${skill} إلى دعم موجه وتدريب متدرج للوصول إلى الإتقان.`;
  return `تحتاج مهارة ${skill} إلى دعم علاجي يبدأ بتبسيط المتطلب ثم تدريب موجه.`;
}

export function buildPriorityReason(skill: SkillPerformanceResult): string {
  if (skill.percent < 50) return `تُقدَّم مهارة ${skill.skill} بسبب انخفاض نسبة الأداء وارتفاع الفقد المرتبط بها.`;
  if (skill.percent < 75) return `تُقدَّم مهارة ${skill.skill} ضمن خطة دعم ورفع لأنها لم تبلغ حد الإتقان بعد.`;
  if (skill.loss > 0) return `تظهر مهارة ${skill.skill} كأولوية تثبيت بسبب وجود فقد محدود رغم تحقق مستوى مناسب.`;
  return `تظهر مهارة ${skill.skill} ضمن المتابعة الإثرائية للحفاظ على جودة الأداء.`;
}

export function buildPlan(level: PerformanceLevel, priorities: InterventionPriority[]): IndividualPlan {
  const first = priorities[0];
  const second = priorities[1];
  const later = priorities[2];
  const firstSkill = safeSkill(first);
  const secondSkill = safeSkill(second);

  if (level.code === 'remedial') {
    return {
      type: level.planType,
      duration: 'أسبوعان',
      title: 'خطة دعم علاجية قصيرة ومنظمة',
      studentMessage: `ابدأ بخطوات قصيرة ومنظمة، مع التركيز أولًا على ${firstSkill}. اكتب ما تعرفه ولا تترك السؤال دون محاولة منظمة.`,
      parentRole: [
        'متابعة الطالب لمدة 10 دقائق يوميًا أو ثلاث مرات أسبوعيًا حسب ظروف الأسرة.',
        'طلب قراءة المطلوب بصوت واضح قبل البدء في الحل.',
        'متابعة خطوات الحل أو التبرير، لا الاكتفاء بالإجابة النهائية.',
      ],
      teacherRole: [
        `بدء الدعم بمهارة ${firstSkill} عبر نموذج محلول وتدريب موجه.`,
        second ? `الانتقال إلى مهارة ${secondSkill} بعد ظهور تحسن أولي في الأولوية الأولى.` : 'تقديم تدريب متدرج من السهل إلى الأصعب.',
        'إعادة قياس قصيرة بعد أسبوعين بأدوات تمثل المهارة نفسها أو نمط الخطأ.',
      ],
      studentActions: [
        'اقرأ السؤال كاملًا وحدد المطلوب قبل الإجابة.',
        'اكتب خطوة أو سببًا حتى لو لم تكن متأكدًا من النتيجة النهائية.',
        'راجع نموذجًا محلولًا ثم حل سؤالًا مشابهًا بالخطوات نفسها.',
      ],
      evidenceOfImprovement: 'إعادة قياس قصيرة من 3 إلى 5 مفردات مرتبطة بالأولوية الأولى، مع مقارنة النتيجة بنتيجة هذه الورقة.',
      firstPriority: first,
      secondPriority: second,
      laterStage: later,
    };
  }

  if (level.code === 'support') {
    return {
      type: level.planType,
      duration: 'أسبوع إلى أسبوعين',
      title: 'خطة دعم ورفع نحو الإتقان',
      studentMessage: `أداؤك قابل للتحسن بوضوح. ركز على ${firstSkill}، ثم انتقل إلى أسئلة مشابهة مع تغيير بسيط في المعطيات.`,
      parentRole: [
        'متابعة سؤالين قصيرين في كل جلسة متابعة.',
        'طلب شرح طريقة الحل بكلمات الطالب قبل اعتماد الإجابة.',
        'تعزيز المحاولة المنظمة وعدم التركيز على الدرجة وحدها.',
      ],
      teacherRole: [
        `تقديم تدريب موجه في ${firstSkill} للوصول إلى حد الإتقان.`,
        'تقديم تغذية راجعة مباشرة حول الأخطاء المتكررة.',
        'استخدام إعادة قياس قصيرة خلال أسبوع أو أسبوعين.',
      ],
      studentActions: [
        'حل سؤال مباشر ثم سؤال تطبيقي قصير.',
        'كتابة سبب أو خطوة أساسية في كل إجابة.',
        'مراجعة الخطأ وتصحيح الإجابة بصياغة جديدة.',
      ],
      evidenceOfImprovement: 'بلوغ حد الإتقان في مفردات مماثلة أو تقليل الفقد في المهارة ذات الأولوية.',
      firstPriority: first,
      secondPriority: second,
      laterStage: later,
    };
  }

  if (level.code === 'mastery') {
    return {
      type: level.planType,
      duration: 'أسبوع',
      title: 'خطة تثبيت للحفاظ على الإتقان',
      studentMessage: `حققت مستوى الإتقان في هذه الورقة. المطلوب الآن تثبيت الأداء عبر أسئلة متنوعة، خاصة في ${firstSkill}.`,
      parentRole: [
        'توفير مراجعة قصيرة مرة أو مرتين أسبوعيًا.',
        'طلب شرح طريقة الحل بدل الاكتفاء بالنتيجة.',
        'تشجيع الطالب على تصحيح أي خطأ محدود يظهر في التدريب.',
      ],
      teacherRole: [
        'تقديم أسئلة تطبيقية متنوعة للتحقق من ثبات الإتقان.',
        'توجيه الطالب إلى المفردات التي ظهر فيها فقد محدود.',
        'إضافة مهمة قصيرة أعلى قليلًا من مستوى الورقة إذا استقر الأداء.',
      ],
      studentActions: [
        'حل سؤالين متنوعين بدل تكرار النمط نفسه.',
        'مراجعة المفردات التي فقدت فيها درجات.',
        'شرح فكرة أو طريقة حل لزميل عند الإمكان.',
      ],
      evidenceOfImprovement: 'ثبات الأداء في إعادة قياس قصيرة أو انخفاض الفقد في المهارات التي تحتاج تثبيتًا.',
      firstPriority: first,
      secondPriority: second,
      laterStage: later,
    };
  }

  return {
    type: level.planType,
    duration: 'أسبوع إلى أسبوعين',
    title: 'خطة إثرائية لتوسيع التعلم',
    studentMessage: 'أظهرت أداءً متميزًا في هذه الورقة. انتقل الآن إلى أسئلة أعمق ومهام تتطلب تفسيرًا أو إنتاجًا أو تصميم سؤال.',
    parentRole: [
      'تشجيع الطالب على شرح فكرة أو تصميم سؤال جديد.',
      'توفير وقت قصير لمهمة تحدٍّ بدل تكرار الأسئلة السهلة.',
      'الاحتفاء بجودة التفكير لا بالدرجة فقط.',
    ],
    teacherRole: [
      'تقديم أسئلة مهارات عليا أو مهمة إنتاجية قصيرة.',
      'تكليف الطالب بتصميم سؤال مع إجابة نموذجية.',
      'توظيف الطالب في تعليم الأقران عند مناسبة ذلك تربويًا.',
    ],
    studentActions: [
      'صمم سؤالًا مشابهًا مع نموذج إجابة.',
      'اشرح فكرة أساسية لزميل أو لأحد أفراد الأسرة.',
      'جرّب سؤالًا مفتوحًا يتطلب حكمًا مبررًا.',
    ],
    evidenceOfImprovement: 'إنتاج مهمة إثرائية قصيرة أو حل سؤال مهارات عليا مع تبرير واضح.',
    firstPriority: first,
    secondPriority: second,
    laterStage: later,
  };
}


export function buildNarratives(result: Omit<IndividualPerformanceAnalysisResult, 'narratives'>) {
  const { summary, level, plan, skills, errorPatterns, codingCompleteness, readingQuality, teacherNotes } = result;
  const sortedSkills = [...skills].sort((a, b) => a.percent - b.percent || b.loss - a.loss);
  const lowestPercent = sortedSkills[0]?.percent;
  const weakestSkills = lowestPercent === undefined
    ? []
    : sortedSkills.filter((skill) => Math.abs(skill.percent - lowestPercent) < 0.000001);
  const strongestPercent = skills.length ? Math.max(...skills.map((skill) => skill.percent)) : undefined;
  const strongestSkills = strongestPercent === undefined
    ? []
    : skills.filter((skill) => Math.abs(skill.percent - strongestPercent) < 0.000001);
  const topError = errorPatterns[0];
  const topErrorTies = topError ? errorPatterns.filter((pattern) => pattern.count === topError.count) : [];
  const hasDominantError = Boolean(topError && topError.count > 1 && topErrorTies.length === 1);

  const executiveSummary = `حقق الطالب نسبة ${summary.percent}% في هذه الورقة، وصُنّف في مستوى «${level.label}». درجة الطالب ${summary.studentScore} من ${summary.totalScore}، وحد الإتقان المعتمد ${summary.masteryCutoffPercent}% (${formatMasteryCutoffScore(summary.masteryCutoffScore, summary.totalScore)}). جودة القراءة: ${readingQuality.label}.`;

  const educationalMeaning = weakestSkills.length
    ? `تشير النتائج إلى أن أقل المهارات أداءً هي ${formatArabicList(weakestSkills.map((skill) => skill.skill))} بنسبة ${lowestPercent}%. ${strongestSkills.length ? `وتظهر أقوى المهارات في ${formatArabicList(strongestSkills.map((skill) => skill.skill))} بنسبة ${strongestPercent}%.` : ''}`
    : 'تحتاج النتائج إلى بيانات مهارية كافية لبناء قراءة تربوية أعمق.';

  const proposedAction = `${plan.title}. تبدأ المتابعة من ${plan.firstPriority?.skill || 'الأولوية الأولى'}، ثم يُعاد القياس بأداة قصيرة للتحقق من أثر الخطة.`;

  const diagnosisIndicator = hasDominantError
    ? `أكثر نوع خطأ ظهورًا هو: ${topError?.errorType || 'غير محدد'} (${topError?.count || 0} مرة)، وظهر في ${formatArabicList(topError?.questionLabels || [])}. ${codingCompleteness.message}`
    : topErrorTies.length > 1
      ? `لا يظهر نمط خطأ غالب بوضوح؛ إذ توزعت الأخطاء بين ${formatArabicList(topErrorTies.map((pattern) => pattern.errorType))}. لذلك تُقرأ أسباب التعثر بحذر، مع الاستفادة من ملاحظات المعلم وأعمال الطالب الصفية. ${codingCompleteness.message}`
      : `لا يوجد نمط خطأ غالب واضح في البيانات المدخلة. ${codingCompleteness.message}`;

  const teacherNotesReading = teacherNotes.length
    ? `توجد ${formatArabicNoteCount(teacherNotes.length)} للمعلم مرتبطة بالمفردات، وتُستخدم بوصفها أدلة داعمة للتشخيص لا حكمًا مستقلًا. أبرزها في ${formatArabicList(teacherNotes.slice(0, 3).map((note) => note.questionLabel))}.`
    : 'لم تُدخل ملاحظات للمعلم؛ تعتمد القراءة الحالية على الدرجات وترميز الأخطاء فقط.';

  const limitationsNote = `هذا التقرير يقرأ أداء الطالب في هذه الورقة المحددة فقط، ولا يمثل حكمًا نهائيًا على قدراته العامة. تُقرأ النتائج في ضوء ${readingQuality.label}، وتزداد دقتها عند مقارنتها بأعمال الطالب الصفية وملاحظات المعلم وأدوات تقويم أخرى.`;

  return {
    executiveSummary,
    educationalMeaning,
    proposedAction,
    diagnosisIndicator,
    limitationsNote,
    teacherNotesReading,
  };
}
