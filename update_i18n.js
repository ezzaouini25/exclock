const fs = require('fs');

const languages = {
    'en': {
        'name': '{0} Minute Timer',
        'desc_short': 'Set a {0} minute timer online. Perfect for quick tasks, short breaks, or Pomodoro sessions.',
        'desc_long': 'A simple and easy to use {0} minute online timer.',
        'h2': '{0} Minute Timer',
        'p': 'Use our free online {0} minute timer to manage your time effectively.'
    },
    'fr': {
        'name': 'Minuteur de {0} minutes',
        'desc_short': 'Réglez un minuteur de {0} minutes en ligne. Idéal pour les tâches rapides, les courtes pauses ou les sessions Pomodoro.',
        'desc_long': 'Un minuteur en ligne de {0} minutes simple et facile à utiliser.',
        'h2': 'Minuteur de {0} minutes',
        'p': 'Utilisez notre minuteur de {0} minutes gratuit en ligne pour gérer efficacement votre temps.'
    },
    'es': {
        'name': 'Temporizador de {0} minutos',
        'desc_short': 'Configure un temporizador de {0} minutos en línea. Perfecto para tareas rápidas, descansos cortos o sesiones Pomodoro.',
        'desc_long': 'Un temporizador en línea de {0} minutos simple y fácil de usar.',
        'h2': 'Temporizador de {0} minutos',
        'p': 'Utilice nuestro temporizador de {0} minutos en línea gratuito para gestionar su tiempo de forma eficaz.'
    },
    'de': {
        'name': '{0} Minuten Timer',
        'desc_short': 'Stellen Sie online einen {0}-Minuten-Timer ein. Perfekt für schnelle Aufgaben, kurze Pausen oder Pomodoro-Sitzungen.',
        'desc_long': 'Ein einfacher und leicht zu bedienender {0}-Minuten-Timer online.',
        'h2': '{0} Minuten Timer',
        'p': 'Nutzen Sie unseren kostenlosen {0}-Minuten-Timer online, um Ihre Zeit effektiv zu verwalten.'
    },
    'it': {
        'name': 'Timer di {0} minuti',
        'desc_short': 'Imposta un timer di {0} minuti online. Perfetto per compiti veloci, pause brevi o sessioni Pomodoro.',
        'desc_long': 'Un timer online di {0} minuti semplice e facile da usare.',
        'h2': 'Timer di {0} minuti',
        'p': 'Usa il nostro timer gratuito di {0} minuti online per gestire efficacemente il tuo tempo.'
    },
    'ar': {
        'name': 'مؤقت {0} دقائق',
        'desc_short': 'اضبط مؤقتًا لمدة {0} دقائق عبر الإنترنت. مثالي للمهام السريعة أو فترات الراحة القصيرة أو جلسات بومودورو.',
        'desc_long': 'مؤقت عبر الإنترنت لمدة {0} دقائق بسيط وسهل الاستخدام.',
        'h2': 'مؤقت {0} دقائق',
        'p': 'استخدم مؤقتنا المجاني عبر الإنترنت لمدة {0} دقائق لإدارة وقتك بفعالية.'
    },
    'ru': {
        'name': 'Таймер {0} минут',
        'desc_short': 'Установите таймер на {0} минут онлайн. Идеально подходит для быстрых задач, коротких перерывов или сессий Pomodoro.',
        'desc_long': 'Простой и удобный онлайн-таймер на {0} минут.',
        'h2': 'Таймер {0} минут',
        'p': 'Используйте наш бесплатный онлайн-таймер на {0} минут, чтобы эффективно управлять своим временем.'
    }
};

const timers = [5, 10, 15, 20, 25, 30, 45, 60];

for (const [lang, texts] of Object.entries(languages)) {
    const filePath = `lib/i18n/${lang}.ts`;
    if (!fs.existsSync(filePath)) continue;
        
    let content = fs.readFileSync(filePath, 'utf-8');
    
    let seoInjection = "";
    for (const t of timers) {
        seoInjection += `
    timer_${t}: [
      { type: "h2", text: "${texts.h2.replace('{0}', t)}" },
      { type: "p", text: "${texts.p.replace('{0}', t)}" }
    ],`;
    }
    
    if (!content.includes("timer_5:")) {
        content = content.replace("  seo: {", "  seo: {" + seoInjection);
    }
    
    let metadataInjection = "";
    for (const t of timers) {
        metadataInjection += `
  metadata_timer_${t}: {
    title: "${texts.name.replace('{0}', t)} - ExClock",
    description: "${texts.desc_short.replace('{0}', t)}",
    openGraph: {
      title: "${texts.name.replace('{0}', t)} - ExClock",
      description: "${texts.desc_short.replace('{0}', t)}",
    },
    twitter: {
      title: "${texts.name.replace('{0}', t)} - ExClock",
      description: "${texts.desc_short.replace('{0}', t)}",
    }
  },`;
    }
  
    if (!content.includes("metadata_timer_5:")) {
        content = content.replace("  metadata: {", metadataInjection + "\n  metadata: {");
    }
        
    fs.writeFileSync(filePath, content, 'utf-8');
}

console.log("Updated translation files successfully.");
