import { ALL_WORDS } from './words.js';

// Brackets identify the single exact target occurrence; original and blanked
// forms are derived together, so casing and punctuation round-trip exactly.
const examples = {
  the: 'Look at [the] moon.', to: 'We go [to] school.', and: 'Tom [and] Sam play.', a: 'I see [a] dog.', I: '[I] like robots.',
  you: 'Can [you] help me?', it: 'Put [it] in the box.', in: 'The toy is [in] my bag.', said: 'Dad [said] hello.', for: 'This gift is [for] you.',
  up: 'Look [up] at the sky.', look: 'Please [look] at my picture.', is: 'My dog [is] happy.', go: 'We [go] to the park.', we: 'Can [we] play now?',
  little: 'I have a [little] boat.', down: 'Sit [down] with me.', can: 'I [can] jump.', see: 'I [see] a rainbow.', not: 'That is [not] my hat.',
  one: 'I have [one] kite.', my: 'This is [my] robot.', me: 'Come with [me].', big: 'That is a [big] tree.', come: 'Please [come] here.',
  blue: 'The sky is [blue].', red: 'My cap is [red].', where: 'Do you know [where] my bag is?', jump: 'I can [jump] high.', away: 'The bird flew [away].',
  here: 'Your book is [here].', help: 'Please [help] me.', make: 'We can [make] a kite.', yellow: 'I see a [yellow] bus.', two: 'I have [two] hands.',
  play: 'We [play] outside.', run: 'I can [run] fast.', find: 'Can you [find] my shoe?', three: 'I see [three] stars.', funny: 'That is a [funny] joke.',
  he: 'Can [he] ride a bike?', was: 'The puppy [was] sleepy.', that: 'Look at [that] rocket.', she: 'Can [she] come too?', on: 'The cup is [on] the table.',
  they: 'Can [they] play with us?', but: 'I am small, [but] I am strong.', at: 'Look [at] the stars.', with: 'Play [with] me.', all: 'We [all] like games.',
  there: 'My bike is over [there].', out: 'Come [out] and play.', be: 'I will [be] kind.', have: 'I [have] a toy car.', am: 'I [am] happy.',
  do: 'What can we [do]?', did: 'We [did] a good job.', what: 'Tell me [what] you see.', so: 'The puppy is [so] cute.', get: 'Let us [get] our coats.',
  like: 'I [like] this book.', this: 'Look at [this] shell.', will: 'I [will] help you.', yes: 'Please say [yes].', went: 'I [went] to the park.',
  are: 'We [are] a team.', now: 'Let us play [now].', no: 'There are [no] clouds today.', came: 'My friend [came] to play.', ride: 'I can [ride] a bike.',
  into: 'The frog jumps [into] the pond.', good: 'You are a [good] friend.', want: 'I [want] a snack.', too: 'I can come [too].', pretty: 'That is a [pretty] flower.',
  four: 'The car has [four] wheels.', saw: 'I [saw] a little bird.', well: 'You did [well] today.', ran: 'The dog [ran] home.', brown: 'The bear is [brown].',
  eat: 'We [eat] lunch together.', who: 'Do you know [who] made this?', new: 'I have a [new] book.', must: 'We [must] wear our helmets.', black: 'My cat is [black].',
  white: 'The snow is [white].', soon: 'We will go home [soon].', our: 'This is [our] tree house.', ate: 'I [ate] an apple.', say: 'Please [say] hello.',
  under: 'The cat is [under] the bed.', please: 'Help me, [please].',
  of: 'I want a cup [of] milk.', his: 'That is [his] ball.', had: 'We [had] fun today.', him: 'Give the ball to [him].', her: 'This is [her] kite.',
  some: 'I have [some] grapes.', as: 'I am [as] tall as you.', then: 'We eat, [then] we play.', could: 'I [could] hear the birds.', when: 'Tell me [when] to start.',
  were: 'The ducks [were] in the pond.', them: 'I can help [them].', ask: 'You can [ask] me.', an: 'I see [an] owl.', over: 'The plane flies [over] the hill.',
  just: 'I [just] finished my puzzle.', from: 'This card is [from] Dad.', any: 'Do you have [any] crayons?', how: 'Show me [how] to draw.', know: 'I [know] your name.',
  put: 'Please [put] the toy here.', take: 'Please [take] my hand.', every: 'I read [every] day.', old: 'This is an [old] tree.', by: 'Sit [by] me.',
  after: 'We play [after] lunch.', think: 'I [think] it will rain.', let: 'Please [let] me try.', going: 'We are [going] home.', walk: 'We [walk] to school.',
  again: 'Let us try [again].', may: 'You [may] have a turn.', stop: 'Please [stop] at the gate.', fly: 'Birds can [fly].', round: 'The ball is [round].',
  give: 'Please [give] me a hug.', once: 'I saw a fox [once].', open: 'Please [open] the box.', has: 'My robot [has] blue eyes.', live: 'We [live] near a park.',
  thank: 'I want to [thank] you.',
  would: 'I [would] like some water.', very: 'The turtle is [very] slow.', your: 'Is this [your] hat?', its: 'The dog wags [its] tail.', around: 'We walk [around] the pond.',
  "don't": "I [don't] like cold soup.", right: 'Turn [right] at the tree.', green: 'The frog is [green].', their: 'This is [their] garden.', call: 'Please [call] my name.',
  sleep: 'I [sleep] in my bed.', five: 'I see [five] ducks.', wash: 'Please [wash] your hands.', or: 'Do you want milk [or] water?', before: 'Wash your hands [before] lunch.',
  been: 'I have [been] to the zoo.', off: 'Take [off] your boots.', cold: 'The snow feels [cold].', tell: 'Please [tell] me a story.', work: 'We [work] as a team.',
  first: 'I put my shoes on [first].', does: 'What [does] a frog eat?', goes: 'My brother [goes] to school.', write: 'I can [write] my name.', always: 'I [always] brush my teeth.',
  made: 'I [made] a paper boat.', gave: 'Dad [gave] me a hug.', us: 'Come and play with [us].', buy: 'We can [buy] some bread.', those: 'Look at [those] clouds.',
  use: 'You can [use] my crayons.', fast: 'The rabbit runs [fast].', pull: 'Please [pull] the little wagon.', both: 'We [both] like robots.', sit: 'Please [sit] here.',
  which: 'Tell me [which] book you want.', read: 'I like to [read] books.', why: 'Tell me [why] you are happy.', found: 'I [found] my toy.', because: 'I smile [because] I am happy.',
  best: 'You are my [best] friend.', upon: 'Once [upon] a time, a bear found a hat.', these: 'I like [these] shoes.', sing: 'We can [sing] a song.', wish: 'I [wish] I could fly.',
  many: 'There are [many] stars.',
  if: 'We can play outside [if] it is sunny.', long: 'The train is [long].', about: 'This book is [about] space.', got: 'I [got] a new bike.', six: 'I have [six] crayons.',
  never: 'I [never] tease my friends.', seven: 'I see [seven] balloons.', eight: 'A spider has [eight] legs.', today: 'We can play [today].', myself: 'I can dress [myself].',
  much: 'Thank you so [much].', keep: 'Please [keep] your room tidy.', try: 'I will [try] again.', start: 'We can [start] now.', ten: 'I have [ten] fingers.',
  bring: 'Please [bring] your book.', drink: 'I [drink] water.', only: 'I have [only] one cookie.', better: 'I feel [better] today.', hold: 'Please [hold] my hand.',
  warm: 'My coat is [warm].', full: 'My cup is [full].', done: 'My puzzle is [done].', light: 'Turn on the [light].', pick: 'Please [pick] a book.',
  hurt: 'My knee does not [hurt] now.', cut: 'Dad can [cut] the apple.', kind: 'Please be [kind].', fall: 'Leaves [fall] from the trees.', carry: 'I can [carry] my bag.',
  small: 'The mouse is [small].', own: 'I have my [own] desk.', show: 'Please [show] me your picture.', hot: 'The soup is [hot].', far: 'The moon is [far] away.',
  draw: 'I can [draw] a robot.', clean: 'Please [clean] your desk.', grow: 'Plants [grow] in the sun.', together: 'We play [together].', shall: 'What [shall] we play?',
  laugh: 'Funny stories make me [laugh].'
};

const confusionGroups = [
  ['were','where','when'], ['then','them','the'], ['saw','was','say'], ['of','off','for'],
  ['went','want','what'], ['there','their','these'], ['your','our','you'], ['to','too','two'],
  ['on','one','no'], ['he','her','here'], ['his','is','has'], ['she','see','we'],
  ['a','an','am'], ['I','if','in'], ['it','its','sit'], ['and','an','any'],
  ['look','like','little'], ['go','goes','good'], ['do','does',"don't"], ['come','came','can'],
  ['me','my','may'], ['be','by','buy'], ['blue','black','brown'], ['red','read','ride'],
  ['up','us','use'], ['out','our','over'], ['all','call','fall'], ['had','has','have'],
  ['will','well','with'], ['not','now','new'], ['ran','run','round'], ['eat','ate','at'],
  ['white','write','with'], ['four','for','from'], ['thank','think','that'], ['who','how','why'],
  ['made','make','many'], ['found','find','funny'], ['soon','some','so'], ['right','ride','light'],
  ['would','could','cold'], ['very','every','never'], ['five','give','live'], ['sleep','keep','see'],
  ['before','because','both'], ['been','be','green'], ['tell','well','let'], ['work','walk','word'],
  ['first','fast','far'], ['always','away','all'], ['gave','give','have'], ['those','these','this'],
  ['pull','full','put'], ['which','wish','with'], ['best','be','been'], ['upon','up','open'],
  ['sing','sit','going'], ['if','of','off'], ['long','look','going'], ['about','out','both'],
  ['got','get','go'], ['six','sit','fix'], ['seven','never','every'], ['eight','right','light'],
  ['today','to','they'], ['myself','my','me'], ['much','must','such'], ['try','three','they'],
  ['start','stop','star'], ['ten','then','them'], ['bring','big','sing'], ['drink','think','kind'],
  ['only','one','old'], ['better','before','best'], ['hold','old','cold'], ['warm','wash','work'],
  ['done','one','down'], ['pick','pretty','play'], ['hurt','her','hot'], ['cut','but','put'],
  ['carry','call','came'], ['small','all','shall'], ['own','on','now'], ['show','she','shall'],
  ['draw','down','did'], ['clean','can','came'], ['grow','go','green'], ['together','there','their'],
  ['laugh','look','light'], ['yellow','yes','you'], ['jump','just','up'], ['help','he','her'],
  ['two','to','too'], ['three','there','their'], ['they','the','that'], ['yes','you','your'],
  ['am','an','ask'], ['get','got','give'], ['pretty','please','play'], ['under','after','her'],
  ['please','play','pull'], ['as','ask','has'], ['ask','as','at'], ['just','must','us'],
  ['any','and','an'], ['know','no','now'], ['take','make','thank'], ['old','hold','cold'],
  ['after','ask','at'], ['let','little','tell'], ['again','going','an'], ['stop','start','sit'],
  ['fly','five','funny'], ['once','one','on'], ['open','on','over']
];
const allowed = new Set(ALL_WORDS);
function distance(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const row = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return row[b.length];
}
function distractorsFor(word) {
  const curated = confusionGroups.filter(group => group.includes(word)).flat();
  const nearby = ALL_WORDS.filter(other => other !== word).sort((a, b) => distance(word, a) - distance(word, b));
  return [...new Set([...curated, ...nearby])].filter(other => other !== word && allowed.has(other)).slice(0, 2);
}
export const SENTENCES = Object.fromEntries(ALL_WORDS.map(word => {
  const tagged = examples[word];
  if (!tagged || !tagged.includes(`[${word}]`)) throw new Error(`Missing sentence: ${word}`);
  return [word, [{
    answer: word,
    original: tagged.replace(`[${word}]`, word),
    blanked: tagged.replace(`[${word}]`, '___'),
    distractors: distractorsFor(word)
  }]];
}));
