# Single source of truth for the name filter. gen_filter.py turns this into
# profanity.js (browser) and supabase/name_filter.sql (database), so both stay in sync.

# STRONG: blocked anywhere inside the name, even glued to other words or with letters repeated
# ("xXfuuuckXx", "f.u.c.k", "fvck"). Leetspeak, accents and look-alike letters are normalised first.
STRONG = [
  # English
  "fuck","fuk","fck","fvck","phuck","shit","shite","bitch","biatch","cunt","cock","dick","pussy","penis","vagina",
  "asshole","arsehole","bastard","whore","slut","rape","rapist","molest","pedo","paedo","pedophile",
  "jizz","cumshot","blowjob","handjob","dildo","porn","boob","titties","tits","wank","twat","bollock",
  "motherf","nigger","nigga","nigg","negro","faggot","fagot","retard","tranny","kike","chink","gook",
  "wetback","beaner","raghead","towelhead","sandnigg","porchmonkey","junglebunny","spastic","coon",
  "nazi","hitler","heilhitler","siegheil","holocaust","auschwitz","kkk","whitepower","whitepride",
  "isis","jihad","terrorist","suicide","killyourself",
  # Finnish
  "vittu","vitu","perkele","saatana","jumalauta","helvetti","paska","kyrpa","mulkku","pillu",
  "kusipaa","runkku","runkkari","huora","lutka","horo","nussi","neekeri","nekru","ryssa","mutakuono",
  "hintti","homppeli","vammane","vammain",
  # Swedish / Norwegian / Danish
  "fitta","kuk","hora","javla","jaevla","fan","knulla","neger","fotze","faen","kuken",
  # German
  "scheisse","scheise","arschloch","hurensohn","wichser","schlampe","fick",
  # Spanish / Portuguese / Italian / French
  "mierda","pendejo","cabron","caralho","porra","merda",
  "cazzo","vaffanculo","stronzo","merde","putain","salope","connard","encule",
  # Russian (transliterated)
  "blyat","blyad","suka","pizdec","pizda","huy","khuy","yebat",
]

# WEAK: only blocked as a whole word ("ass" but not "class", "sex" but not "sussex").
WEAK = [
  "kys","kms","puta","puto","polla","verga","ebat","perse","cancer",
  "ass","arse","anus","anal","cum","tit","hoe","fag","dyke","homo","spic","sex","sexy","nude","nudes",
  "crap","damn","piss","prick","boner","horny","milf","gay","lesbo","jap","paki","negr","nig","mamu",
  "pee","poo","poop","kaka","pissa","kusi","pimp","thot","simp","incel","heil",
]

# WHITELIST: innocent words that contain a STRONG word. They are removed before scanning.
WHITELIST = [
  "class","classic","bass","pass","grass","glass","mass","assassin","assess","assist","assume","cassette",
  "embarrass","compass","scunthorpe","cocktail","cockpit","cockroach","peacock","hancock","hitchcock",
  "babcock","shuttlecock","cockatoo","woodcock","dickens","dickinson","benedick","shitake","shiitake",
  "therapist","grape","drape","scrape","skyscraper","trapeze","rapeseed","snigger","niger","nigeria",
  "spice","spicy","conspicuous","despicable","raccoon","cocoon","tycoon","tits","titsworth",
  "penistone","fanatic","fancy","fantasy","fanta","fantastic","infant","elephant","fang","fans","fan",
  "huyton","kukka","kukko","kuka","kuki","kukkula","suka","sukat","sukka","sukkula","sukari","horoskooppi",
  "persephone","saatanan","isisi","cancerian","kanceri","horo","porra","therapy","pornpimon",
  "analysis","fukuoka","fukushima","dickson","montenegro","negroni","nazir","swank","pedometer","torpedo","analog","mustafa","cocky","hello","shell","document","scrap","persevere","persian",
]
# Note: some WHITELIST entries above are also STRONG words; whitelisting them removes the exact
# whole word only, so e.g. "Fanta" or "kukka" (flower) pass, but "fan" inside "xfanx" is handled by
# the separate "ambiguous" rule below.

# AMBIGUOUS strong words that are also common innocent words: treat them as WEAK instead.
AMBIGUOUS = {"fan","suka","horo","porra","tits","kuk","isis","hora","coon","huy","fick","pedo"}

# RAW regex patterns checked on the untouched lowercase name (numbers etc.)
RAW = [r"(^|\D)14\W*88(\D|$)", r"(^|\D)88(\D|$)"]
