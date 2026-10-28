-- Coffin Dance: profanity filter for player names, enforced by the database itself.
-- GENERATED from wordlist.py by gen_filter.py. Run in Supabase > SQL Editor after schema.sql.
-- Safe to run again after updating the word list.

-- normalise a name for scanning. v=0: look-alike letters, 1/!/| as i; v=1: same but as l; v=2: phonetic Cyrillic
create or replace function public.name_norm(n text, v int)
returns text language sql immutable as $fn$
  select translate(
           replace(replace(
             translate(
               case when v = 2 then translate(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(regexp_replace(n, '([[:lower:]])([[:upper:]])', '\1 \2', 'g')), 'ж', 'zh'), 'х', 'kh'), 'ц', 'ts'), 'ч', 'ch'), 'ш', 'sh'), 'щ', 'sch'), 'ъ', ''), 'ь', ''), 'ю', 'yu'), 'я', 'ya'), 'абвгдеёзийклмнопрстуфыэ', 'abvgdeeziyklmnoprstufye')
                    else translate(lower(regexp_replace(n, '([[:lower:]])([[:upper:]])', '\1 \2', 'g')), 'аеорсхуіјкмтнвѕԁӏαοεικνρτυχß', 'aeopcxyijkmthbsdlaoeikvptuxs') end,
               'áàâäãåāăąéèêëēėęíìîïīįóòôöõøōúùûüūůýÿñńçćčšśžźżđłğş', 'aaaaaaaaaeeeeeeeiiiiiiooooooouuuuuuyynncccsszzzdlgs'),
           'ph', 'f'), 'vv', 'w'),
           '01!|34@5$7+8962€£¡',
           case when v = 1 then 'ollleaassttbggzeli' else 'oiiieaassttbggzeli' end)
$fn$;

create or replace function public.name_is_clean(n text)
returns boolean language plpgsql immutable as $fn$
declare s text; j text; spaced text; v int;
begin
  if n is null then return false; end if;
  n := btrim(regexp_replace(normalize(n, NFKC), '[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF\u00AD]', '', 'g'));
  if n = '' or char_length(n) > 16 then return false; end if;
  if n !~ '^[[:alnum:] ._''-]+$' then return false; end if;
  if lower(n) ~ '((^|\D)14\W*88(\D|$))|((^|\D)88(\D|$))' then return false; end if;
  for v in 0..2 loop
    s := public.name_norm(n, v);
    j := regexp_replace(regexp_replace(s, '[^a-z]', '', 'g'), 'shuttlecock|horoskooppi|conspicuous|despicable|montenegro|skyscraper|scunthorpe|hitchcock|pedometer|therapist|penistone|cancerian|fukushima|cockroach|fantastic|pornpimon|persefone|titsworth|persevere|dickinson|embarrass|shiitake|assassin|document|cocktail|rapeseed|analysis|woodcock|saatanan|cockatoo|benedick|cassette|trapeze|raccoon|sukkula|compass|mustafa|persian|fantasy|fukuoka|classic|fanatic|peacock|kukkula|therapy|shitake|snigger|hancock|torpedo|nigeria|dickson|cockpit|negroni|dickens|babcock|kanceri|elefant|cocoon|assess|tycoon|assist|infant|assume|sukari|analog|scrape|huyton|scrap|spicy|sukat|glass|spice|porra|swank|nazir|fancy|hello|class|grape|kukka|kukko|shell|cocky|sukka|isisi|drape|niger|fanta|grass|suka|fans|pass|bass|kuka|mass|horo|fang|kuki|tits|fan', '-', 'g');
    if j ~ 'k+i+l+l+y+o+u+r+s+e+l+f+|p+o+r+c+h+m+o+n+k+e+y+|j+u+n+g+l+e+b+u+n+n+y+|w+h+i+t+e+p+r+i+d+e+|v+a+f+f+a+n+c+u+l+o+|h+e+i+l+h+i+t+l+e+r+|w+h+i+t+e+p+o+w+e+r+|h+u+r+e+n+s+o+h+n+|h+o+l+o+c+a+u+s+t+|t+e+r+r+o+r+i+s+t+|a+r+s+c+h+l+o+c+h+|t+o+w+e+l+h+e+a+d+|m+u+t+a+k+u+o+n+o+|j+u+m+a+l+a+u+t+a+|a+u+s+c+h+w+i+t+z+|h+e+l+v+e+t+t+i+|s+c+h+e+i+s+s+e+|s+a+n+d+n+i+g+g+|h+o+m+p+p+e+l+i+|a+r+s+e+h+o+l+e+|r+u+n+k+k+a+r+i+|s+c+h+l+a+m+p+e+|s+i+e+g+h+e+i+l+|p+e+d+o+f+i+l+e+|p+e+r+k+e+l+e+|t+i+t+t+i+e+s+|a+s+s+h+o+l+e+|n+e+e+k+e+r+i+|p+e+n+d+e+j+o+|b+l+o+w+j+o+b+|w+e+t+b+a+c+k+|r+a+g+h+e+a+d+|s+t+r+o+n+z+o+|s+c+h+e+i+s+e+|c+o+n+n+a+r+d+|w+i+c+h+s+e+r+|v+a+m+m+a+n+e+|b+o+l+l+o+c+k+|b+a+s+t+a+r+d+|h+a+n+d+j+o+b+|s+a+a+t+a+n+a+|s+p+a+s+t+i+c+|s+u+i+c+i+d+e+|c+a+r+a+l+h+o+|k+u+s+i+p+a+a+|v+a+m+m+a+i+n+|c+u+m+s+h+o+t+|m+o+t+h+e+r+f+|h+i+t+l+e+r+|k+n+u+l+l+a+|v+a+g+i+n+a+|m+u+l+k+k+u+|h+i+n+t+t+i+|s+a+l+o+p+e+|p+i+z+d+e+c+|r+a+p+i+s+t+|m+o+l+e+s+t+|f+a+g+g+o+t+|r+u+n+k+k+u+|n+i+g+g+e+r+|c+a+b+r+o+n+|m+i+e+r+d+a+|e+n+c+u+l+e+|t+r+a+n+n+y+|b+e+a+n+e+r+|p+u+t+a+i+n+|j+a+e+v+l+a+|b+i+a+t+c+h+|r+e+t+a+r+d+|n+u+s+s+i+|c+h+i+n+k+|w+h+o+r+e+|p+a+s+k+a+|n+e+g+r+o+|h+u+o+r+a+|p+u+s+s+y+|k+y+r+p+a+|f+o+t+z+e+|v+i+t+t+u+|y+e+b+a+t+|f+i+t+t+a+|b+i+t+c+h+|s+h+i+t+e+|n+i+g+g+a+|r+y+s+s+a+|p+a+e+d+o+|j+a+v+l+a+|p+i+l+l+u+|p+i+z+d+a+|b+l+y+a+t+|n+e+g+e+r+|j+i+h+a+d+|b+l+y+a+d+|l+u+t+k+a+|m+e+r+d+a+|f+a+g+o+t+|m+e+r+d+e+|k+u+k+e+n+|d+i+l+d+o+|p+e+n+i+s+|n+e+k+r+u+|c+a+z+z+o+|v+i+t+u+|f+a+e+n+|b+o+o+b+|k+h+u+y+|w+a+n+k+|d+i+c+k+|j+i+z+z+|t+w+a+t+|n+i+g+g+|n+a+z+i+|k+i+k+e+|s+l+u+t+|c+u+n+t+|f+v+c+k+|s+h+i+t+|f+u+c+k+|r+a+p+e+|c+o+c+k+|g+o+o+k+|p+o+r+n+|f+c+k+|f+u+k+|k+k+k+' then return false; end if;
    if reverse(j) ~ 'f+u+c+k+|s+h+i+t+|c+u+n+t+|n+i+g+g+e+r+|n+i+g+g+a+|b+i+t+c+h+|w+h+o+r+e+|f+a+g+g+o+t+|p+e+n+i+s+|v+i+t+t+u+|h+i+t+l+e+r+|n+a+z+i+' then return false; end if;
    spaced := ' ' || regexp_replace(s, '[^a-z]+', ' ', 'g') || ' ';
    spaced := spaced || regexp_replace(spaced, '\m([a-z]) (?=[a-z]\M)', '\1', 'g') || ' ';   -- a s s -> ass
    if spaced ~ ' (cancer|boner|polla|nudes|perse|pissa|verga|horny|incel|prick|lesbo|porra|suka|crap|simp|damn|thot|coon|arse|piss|poop|dyke|heil|hora|horo|kaka|milf|mamu|anus|anal|paki|pedo|isis|homo|nude|tits|negr|spic|pimp|sexy|fick|puto|puta|ebat|kusi|gay|kms|fag|nig|fan|kuk|tit|cum|sex|jap|ass|poo|pee|kys|hoe|huy) '
       or regexp_replace(spaced, '(.)\1{2,}', '\1', 'g') ~ ' (cancer|boner|polla|nudes|perse|pissa|verga|horny|incel|prick|lesbo|porra|suka|crap|simp|damn|thot|coon|arse|piss|poop|dyke|heil|hora|horo|kaka|milf|mamu|anus|anal|paki|pedo|isis|homo|nude|tits|negr|spic|pimp|sexy|fick|puto|puta|ebat|kusi|gay|kms|fag|nig|fan|kuk|tit|cum|sex|jap|ass|poo|pee|kys|hoe|huy) '
       or regexp_replace(spaced, '(.)\1{2,}', '\1\1', 'g') ~ ' (cancer|boner|polla|nudes|perse|pissa|verga|horny|incel|prick|lesbo|porra|suka|crap|simp|damn|thot|coon|arse|piss|poop|dyke|heil|hora|horo|kaka|milf|mamu|anus|anal|paki|pedo|isis|homo|nude|tits|negr|spic|pimp|sexy|fick|puto|puta|ebat|kusi|gay|kms|fag|nig|fan|kuk|tit|cum|sex|jap|ass|poo|pee|kys|hoe|huy) ' then return false; end if;
  end loop;
  return true;
end $fn$;

-- Enforce on every new or edited row. NOT VALID = existing rows are left alone.
alter table public.scores drop constraint if exists scores_name_clean;
alter table public.scores add constraint scores_name_clean check (public.name_is_clean(name)) not valid;

-- Optional: list existing names that would now be rejected (delete them in Table Editor if you like)
-- select id, name from public.scores where not public.name_is_clean(name);
