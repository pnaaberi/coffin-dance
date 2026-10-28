// Name filter for the public high-score board. GENERATED from wordlist.py by gen_filter.py - edit the list there.
// The same rules run inside the database (supabase/name_filter.sql), so they can't be bypassed by skipping this file.
const HOMO={"а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y", "і": "i", "ј": "j", "к": "k", "м": "m", "т": "t", "н": "h", "в": "b", "ѕ": "s", "ԁ": "d", "ӏ": "l", "α": "a", "ο": "o", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "ρ": "p", "τ": "t", "υ": "u", "χ": "x", "ß": "s"};   // look-alike Cyrillic/Greek letters (р -> p)
const TRANS={"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya"}; // phonetic Cyrillic (ш -> sh)
const LEET={"0": "o", "1": "i", "!": "i", "|": "i", "3": "e", "4": "a", "@": "a", "5": "s", "$": "s", "7": "t", "+": "t", "8": "b", "9": "g", "6": "g", "2": "z", "€": "e", "£": "l", "¡": "i"};   // 4 -> a, 0 -> o, $ -> s ...
const STRONG=/k+i+l+l+y+o+u+r+s+e+l+f+|p+o+r+c+h+m+o+n+k+e+y+|j+u+n+g+l+e+b+u+n+n+y+|w+h+i+t+e+p+r+i+d+e+|v+a+f+f+a+n+c+u+l+o+|h+e+i+l+h+i+t+l+e+r+|w+h+i+t+e+p+o+w+e+r+|h+u+r+e+n+s+o+h+n+|h+o+l+o+c+a+u+s+t+|t+e+r+r+o+r+i+s+t+|a+r+s+c+h+l+o+c+h+|t+o+w+e+l+h+e+a+d+|m+u+t+a+k+u+o+n+o+|j+u+m+a+l+a+u+t+a+|a+u+s+c+h+w+i+t+z+|h+e+l+v+e+t+t+i+|s+c+h+e+i+s+s+e+|s+a+n+d+n+i+g+g+|h+o+m+p+p+e+l+i+|a+r+s+e+h+o+l+e+|r+u+n+k+k+a+r+i+|s+c+h+l+a+m+p+e+|s+i+e+g+h+e+i+l+|p+e+d+o+f+i+l+e+|p+e+r+k+e+l+e+|t+i+t+t+i+e+s+|a+s+s+h+o+l+e+|n+e+e+k+e+r+i+|p+e+n+d+e+j+o+|b+l+o+w+j+o+b+|w+e+t+b+a+c+k+|r+a+g+h+e+a+d+|s+t+r+o+n+z+o+|s+c+h+e+i+s+e+|c+o+n+n+a+r+d+|w+i+c+h+s+e+r+|v+a+m+m+a+n+e+|b+o+l+l+o+c+k+|b+a+s+t+a+r+d+|h+a+n+d+j+o+b+|s+a+a+t+a+n+a+|s+p+a+s+t+i+c+|s+u+i+c+i+d+e+|c+a+r+a+l+h+o+|k+u+s+i+p+a+a+|v+a+m+m+a+i+n+|c+u+m+s+h+o+t+|m+o+t+h+e+r+f+|h+i+t+l+e+r+|k+n+u+l+l+a+|v+a+g+i+n+a+|m+u+l+k+k+u+|h+i+n+t+t+i+|s+a+l+o+p+e+|p+i+z+d+e+c+|r+a+p+i+s+t+|m+o+l+e+s+t+|f+a+g+g+o+t+|r+u+n+k+k+u+|n+i+g+g+e+r+|c+a+b+r+o+n+|m+i+e+r+d+a+|e+n+c+u+l+e+|t+r+a+n+n+y+|b+e+a+n+e+r+|p+u+t+a+i+n+|j+a+e+v+l+a+|b+i+a+t+c+h+|r+e+t+a+r+d+|n+u+s+s+i+|c+h+i+n+k+|w+h+o+r+e+|p+a+s+k+a+|n+e+g+r+o+|h+u+o+r+a+|p+u+s+s+y+|k+y+r+p+a+|f+o+t+z+e+|v+i+t+t+u+|y+e+b+a+t+|f+i+t+t+a+|b+i+t+c+h+|s+h+i+t+e+|n+i+g+g+a+|r+y+s+s+a+|p+a+e+d+o+|j+a+v+l+a+|p+i+l+l+u+|p+i+z+d+a+|b+l+y+a+t+|n+e+g+e+r+|j+i+h+a+d+|b+l+y+a+d+|l+u+t+k+a+|m+e+r+d+a+|f+a+g+o+t+|m+e+r+d+e+|k+u+k+e+n+|d+i+l+d+o+|p+e+n+i+s+|n+e+k+r+u+|c+a+z+z+o+|v+i+t+u+|f+a+e+n+|b+o+o+b+|k+h+u+y+|w+a+n+k+|d+i+c+k+|j+i+z+z+|t+w+a+t+|n+i+g+g+|n+a+z+i+|k+i+k+e+|s+l+u+t+|c+u+n+t+|f+v+c+k+|s+h+i+t+|f+u+c+k+|r+a+p+e+|c+o+c+k+|g+o+o+k+|p+o+r+n+|f+c+k+|f+u+k+|k+k+k+/;          // anywhere in the name, letters may repeat (fuuuck)
const REVERSED=/f+u+c+k+|s+h+i+t+|c+u+n+t+|n+i+g+g+e+r+|n+i+g+g+a+|b+i+t+c+h+|w+h+o+r+e+|f+a+g+g+o+t+|p+e+n+i+s+|v+i+t+t+u+|h+i+t+l+e+r+|n+a+z+i+/;           // written backwards (kcuf)
const WEAK=/^(?:cancer|boner|polla|nudes|perse|pissa|verga|horny|incel|prick|lesbo|porra|suka|crap|simp|damn|thot|coon|arse|piss|poop|dyke|heil|hora|horo|kaka|milf|mamu|anus|anal|paki|pedo|isis|homo|nude|tits|negr|spic|pimp|sexy|fick|puto|puta|ebat|kusi|gay|kms|fag|nig|fan|kuk|tit|cum|sex|jap|ass|poo|pee|kys|hoe|huy)$/;        // whole word only (ass, but not class)
const WHITELIST=/shuttlecock|horoskooppi|conspicuous|despicable|montenegro|skyscraper|scunthorpe|hitchcock|pedometer|therapist|penistone|cancerian|fukushima|cockroach|fantastic|pornpimon|persefone|titsworth|persevere|dickinson|embarrass|shiitake|assassin|document|cocktail|rapeseed|analysis|woodcock|saatanan|cockatoo|benedick|cassette|trapeze|raccoon|sukkula|compass|mustafa|persian|fantasy|fukuoka|classic|fanatic|peacock|kukkula|therapy|shitake|snigger|hancock|torpedo|nigeria|dickson|cockpit|negroni|dickens|babcock|kanceri|elefant|cocoon|assess|tycoon|assist|infant|assume|sukari|analog|scrape|huyton|scrap|spicy|sukat|glass|spice|porra|swank|nazir|fancy|hello|class|grape|kukka|kukko|shell|cocky|sukka|isisi|drape|niger|fanta|grass|suka|fans|pass|bass|kuka|mass|horo|fang|kuki|tits|fan/g;          // innocent words removed before scanning (Scunthorpe, cocktail, therapist)
const RAW=/(?:(^|\D)14\W*88(\D|$))|(?:(^|\D)88(\D|$))/;                // number codes (1488, 88)
export const ALLOWED=/^[\p{L}\p{N} ._'-]+$/u;

const map=(s,m)=>[...s].map(c=>m[c]??c).join('');
// v=0: look-alikes + 1/!/| as i, v=1: look-alikes + 1/!/| as l, v=2: phonetic Cyrillic
function norm(s,v){
  s=s.normalize('NFKC').toLowerCase();
  s=map(s,v===2?TRANS:HOMO);
  s=s.normalize('NFD').replace(/\p{M}/gu,'');           // strip accents: ä -> a, é -> e
  s=s.replace(/ph/g,'f').replace(/vv/g,'w');
  return map(s,v===1?{...LEET,'1':'l','!':'l','|':'l'}:LEET);
}
const BAD="That name isn't allowed.";

// Returns '' when the name is fine, otherwise a short reason to show the player.
export function nameProblem(name){
  name=String(name).replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF\u00AD]/g,'').trim(); // invisible/direction chars
  if(!name)return 'Please enter a name.';
  if(name.length>16)return 'Max 16 characters.';
  if(!ALLOWED.test(name))return "Use letters, numbers, spaces and . _ - ' only.";
  if(RAW.test(name.toLowerCase()))return BAD;
  for(let v=0;v<3;v++){
    const n=norm(name.replace(/(\p{Ll})(\p{Lu})/gu,'$1 $2'),v);  // BigAss -> big ass
    const joined=n.replace(/[^a-z]/g,'').replace(WHITELIST,'-');     // f.u.c.k -> fuck
    if(STRONG.test(joined)||REVERSED.test([...joined].reverse().join('')))return BAD;
    const merged=n.replace(/\b([a-z])[^a-z]+(?=[a-z]\b)/g,'$1');    // a s s -> ass
    const toks=[...n.split(/[^a-z]+/),...merged.split(/[^a-z]+/)].filter(Boolean);
    for(const t of toks)for(const u of [t,t.replace(/(.)\1{2,}/g,'$1'),t.replace(/(.)\1{2,}/g,'$1$1')])if(WEAK.test(u))return BAD; // asss, seeex
  }
  return '';
}
export const isCleanName=n=>!nameProblem(n);
