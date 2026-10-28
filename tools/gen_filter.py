import sys
OUTDIR=(sys.argv[1]+'/') if len(sys.argv)>1 else ''
import importlib.util,re,json,unicodedata
spec=importlib.util.spec_from_file_location('w','wordlist.py');W=importlib.util.module_from_spec(spec);spec.loader.exec_module(W)
HOMO={'а':'a','е':'e','о':'o','р':'p','с':'c','х':'x','у':'y','і':'i','ј':'j','к':'k','м':'m','т':'t','н':'h','в':'b','ѕ':'s','ԁ':'d','ӏ':'l','α':'a','ο':'o','ε':'e','ι':'i','κ':'k','ν':'v','ρ':'p','τ':'t','υ':'u','χ':'x','ß':'s'}
TRANS={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'}
LEET={'0':'o','1':'i','!':'i','|':'i','3':'e','4':'a','@':'a','5':'s','$':'s','7':'t','+':'t','8':'b','9':'g','6':'g','2':'z','€':'e','£':'l','¡':'i'}
def norm(s):
  s=unicodedata.normalize('NFKC',s).lower(); s=''.join(HOMO.get(c,c) for c in s)
  s=''.join(c for c in unicodedata.normalize('NFD',s) if not unicodedata.combining(c))
  s=s.replace('ph','f').replace('vv','w'); return ''.join(LEET.get(c,c) for c in s)
clean=lambda w:re.sub('[^a-z]','',norm(w))
STRONG=sorted({clean(w) for w in W.STRONG if w not in W.AMBIGUOUS},key=len,reverse=True)
WEAK=sorted({clean(w) for w in list(W.WEAK)+list(W.AMBIGUOUS)},key=len,reverse=True)
WL=sorted({clean(w) for w in W.WHITELIST},key=len,reverse=True)
REVSET=[clean(w) for w in ["fuck","shit","cunt","nigger","nigga","bitch","whore","faggot","penis","vittu","hitler","nazi"]]
pat=lambda w:''.join(re.escape(c)+'+' for c in w)
strong_re='|'.join(pat(w) for w in STRONG)
rev_re='|'.join(pat(w) for w in REVSET)
weak_re='|'.join(re.escape(w) for w in WEAK)
wl_re='|'.join(re.escape(w) for w in WL)
raw_re='|'.join('(?:%s)'%r for r in W.RAW)
hk,hv=''.join(HOMO),''.join(HOMO.values())
lk,lv=''.join(LEET),''.join(LEET.values())

js=f"""// Name filter for the public high-score board. GENERATED from wordlist.py by gen_filter.py - edit the list there.
// The same rules run inside the database (supabase/name_filter.sql), so they can't be bypassed by skipping this file.
const HOMO={json.dumps(HOMO,ensure_ascii=False)};   // look-alike Cyrillic/Greek letters (р -> p)
const TRANS={json.dumps(TRANS,ensure_ascii=False)}; // phonetic Cyrillic (ш -> sh)
const LEET={json.dumps(LEET,ensure_ascii=False)};   // 4 -> a, 0 -> o, $ -> s ...
const STRONG=/{strong_re}/;          // anywhere in the name, letters may repeat (fuuuck)
const REVERSED=/{rev_re}/;           // written backwards (kcuf)
const WEAK=/^(?:{weak_re})$/;        // whole word only (ass, but not class)
const WHITELIST=/{wl_re}/g;          // innocent words removed before scanning (Scunthorpe, cocktail, therapist)
const RAW=/{raw_re}/;                // number codes (1488, 88)
export const ALLOWED=/^[\\p{{L}}\\p{{N}} ._'-]+$/u;

const map=(s,m)=>[...s].map(c=>m[c]??c).join('');
// v=0: look-alikes + 1/!/| as i, v=1: look-alikes + 1/!/| as l, v=2: phonetic Cyrillic
function norm(s,v){{
  s=s.normalize('NFKC').toLowerCase();
  s=map(s,v===2?TRANS:HOMO);
  s=s.normalize('NFD').replace(/\\p{{M}}/gu,'');           // strip accents: ä -> a, é -> e
  s=s.replace(/ph/g,'f').replace(/vv/g,'w');
  return map(s,v===1?{{...LEET,'1':'l','!':'l','|':'l'}}:LEET);
}}
const BAD="That name isn't allowed.";

// Returns '' when the name is fine, otherwise a short reason to show the player.
export function nameProblem(name){{
  name=String(name).replace(/[\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2069\\uFEFF\\u00AD]/g,'').trim(); // invisible/direction chars
  if(!name)return 'Please enter a name.';
  if(name.length>16)return 'Max 16 characters.';
  if(!ALLOWED.test(name))return "Use letters, numbers, spaces and . _ - ' only.";
  if(RAW.test(name.toLowerCase()))return BAD;
  for(let v=0;v<3;v++){{
    const n=norm(name.replace(/(\\p{{Ll}})(\\p{{Lu}})/gu,'$1 $2'),v);  // BigAss -> big ass
    const joined=n.replace(/[^a-z]/g,'').replace(WHITELIST,'-');     // f.u.c.k -> fuck
    if(STRONG.test(joined)||REVERSED.test([...joined].reverse().join('')))return BAD;
    const merged=n.replace(/\\b([a-z])[^a-z]+(?=[a-z]\\b)/g,'$1');    // a s s -> ass
    const toks=[...n.split(/[^a-z]+/),...merged.split(/[^a-z]+/)].filter(Boolean);
    for(const t of toks)for(const u of [t,t.replace(/(.)\\1{{2,}}/g,'$1'),t.replace(/(.)\\1{{2,}}/g,'$1$1')])if(WEAK.test(u))return BAD; // asss, seeex
  }}
  return '';
}}
export const isCleanName=n=>!nameProblem(n);
"""
open(OUTDIR+'profanity.js','w').write(js)

ACC_FROM='áàâäãåāăąéèêëēėęíìîïīįóòôöõøōúùûüūůýÿñńçćčšśžźżđłğş'
ACC_TO  ='aaaaaaaaaeeeeeeeiiiiiiooooooouuuuuuyynncccsszzzdlgs'
assert len(ACC_FROM)==len(ACC_TO),(len(ACC_FROM),len(ACC_TO))
assert len(hk)==len(hv) and len(lk)==len(lv)
q=lambda s:s.replace("'","''")
multi=[(k,v) for k,v in TRANS.items() if len(v)!=1]
single=[(k,v) for k,v in TRANS.items() if len(v)==1]
tr_multi=''.join(f"replace(" for _ in multi)
tr_multi_end=''.join(f", '{k}', '{v}')" for k,v in multi)
tsk,tsv=''.join(k for k,v in single),''.join(v for k,v in single)
sql=f"""-- Coffin Dance: profanity filter for player names, enforced by the database itself.
-- GENERATED from wordlist.py by gen_filter.py. Run in Supabase > SQL Editor after schema.sql.
-- Safe to run again after updating the word list.

-- normalise a name for scanning. v=0: look-alike letters, 1/!/| as i; v=1: same but as l; v=2: phonetic Cyrillic
create or replace function public.name_norm(n text, v int)
returns text language sql immutable as $fn$
  select translate(
           replace(replace(
             translate(
               case when v = 2 then translate({tr_multi}lower(regexp_replace(n, '([[:lower:]])([[:upper:]])', '\\1 \\2', 'g')){tr_multi_end}, '{q(tsk)}', '{q(tsv)}')
                    else translate(lower(regexp_replace(n, '([[:lower:]])([[:upper:]])', '\\1 \\2', 'g')), '{q(hk)}', '{q(hv)}') end,
               '{q(ACC_FROM)}', '{q(ACC_TO)}'),
           'ph', 'f'), 'vv', 'w'),
           '{q(lk)}',
           case when v = 1 then '{q(lv).replace("i","l",1).replace("i","l",1).replace("i","l",1)}' else '{q(lv)}' end)
$fn$;

create or replace function public.name_is_clean(n text)
returns boolean language plpgsql immutable as $fn$
declare s text; j text; spaced text; v int;
begin
  if n is null then return false; end if;
  n := btrim(regexp_replace(normalize(n, NFKC), '[\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2069\\uFEFF\\u00AD]', '', 'g'));
  if n = '' or char_length(n) > 16 then return false; end if;
  if n !~ '^[[:alnum:] ._''-]+$' then return false; end if;
  if lower(n) ~ '{q(raw_re.replace("(?:","("))}' then return false; end if;
  for v in 0..2 loop
    s := public.name_norm(n, v);
    j := regexp_replace(regexp_replace(s, '[^a-z]', '', 'g'), '{wl_re}', '-', 'g');
    if j ~ '{strong_re}' then return false; end if;
    if reverse(j) ~ '{rev_re}' then return false; end if;
    spaced := ' ' || regexp_replace(s, '[^a-z]+', ' ', 'g') || ' ';
    spaced := spaced || regexp_replace(spaced, '\\m([a-z]) (?=[a-z]\\M)', '\\1', 'g') || ' ';   -- a s s -> ass
    if spaced ~ ' ({weak_re}) '
       or regexp_replace(spaced, '(.)\\1{{2,}}', '\\1', 'g') ~ ' ({weak_re}) '
       or regexp_replace(spaced, '(.)\\1{{2,}}', '\\1\\1', 'g') ~ ' ({weak_re}) ' then return false; end if;
  end loop;
  return true;
end $fn$;

-- Enforce on every new or edited row. NOT VALID = existing rows are left alone.
alter table public.scores drop constraint if exists scores_name_clean;
alter table public.scores add constraint scores_name_clean check (public.name_is_clean(name)) not valid;

-- Optional: list existing names that would now be rejected (delete them in Table Editor if you like)
-- select id, name from public.scores where not public.name_is_clean(name);
"""
open(OUTDIR+'name_filter.sql','w').write(sql)
print('strong',len(STRONG),'weak',len(WEAK),'wl',len(WL))
