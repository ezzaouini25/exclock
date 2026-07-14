import os
import re

languages = {
    'en': {
        'name': 'Minute Timer',
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
}

timers = [5, 10, 15, 20, 25, 30, 45, 60]

for lang, texts in languages.items():
    file_path = f"lib/i18n/{lang}.ts"
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Inject seo contents
    seo_injection = ""
    for t in timers:
        seo_injection += f"""
    timer_{t}: [
      {{ type: "h2", text: "{texts['h2'].format(t)}" }},
      {{ type: "p", text: "{texts['p'].format(t)}" }}
    ],"""
    
    # insert before the closing brace of seo object
    # Find `seo: {` and then its matching closing brace, but since it's the last element, we can just replace `countdown: [\n      // ...\n    ]\n  }\n};`
    # Let's use regex to find the end of `seo: { ... }` block
    
    # simpler: just replace `  seo: {` with `  seo: {` + seo_injection
    if f"timer_5:" not in content:
        content = content.replace("  seo: {", "  seo: {" + seo_injection)
    
    # 2. Inject metadata_timer_X at the root
    metadata_injection = ""
    for t in timers:
        metadata_injection += f"""
  metadata_timer_{t}: {{
    title: "{texts['name'].format(t)} - ExClock",
    description: "{texts['desc_short'].format(t)}",
    openGraph: {{
      title: "{texts['name'].format(t)} - ExClock",
      description: "{texts['desc_short'].format(t)}",
    }},
    twitter: {{
      title: "{texts['name'].format(t)} - ExClock",
      description: "{texts['desc_short'].format(t)}",
    }}
  }},"""
  
    if f"metadata_timer_5:" not in content:
        content = content.replace("  metadata: {", metadata_injection + "\n  metadata: {")
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated translation files successfully.")
