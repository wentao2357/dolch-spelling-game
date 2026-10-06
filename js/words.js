// The supplied Dolch list: preserve both level and word order.
export const WORDS = {
  pre_primer: ["the","to","and","a","I","you","it","in","said","for","up","look","is","go","we","little","down","can","see","not","one","my","me","big","come","blue","red","where","jump","away","here","help","make","yellow","two","play","run","find","three","funny"],
  primer: ["he","was","that","she","on","they","but","at","with","all","there","out","be","have","am","do","did","what","so","get","like","this","will","yes","went","are","now","no","came","ride","into","good","want","too","pretty","four","saw","well","ran","brown","eat","who","new","must","black","white","soon","our","ate","say","under","please"],
  first_grade: ["of","his","had","him","her","some","as","then","could","when","were","them","ask","an","over","just","from","any","how","know","put","take","every","old","by","after","think","let","going","walk","again","may","stop","fly","round","give","once","open","has","live","thank"],
  second_grade: ["would","very","your","its","around","don't","right","green","their","call","sleep","five","wash","or","before","been","off","cold","tell","work","first","does","goes","write","always","made","gave","us","buy","those","use","fast","pull","both","sit","which","read","why","found","because","best","upon","these","sing","wish","many"],
  third_grade: ["if","long","about","got","six","never","seven","eight","today","myself","much","keep","try","start","ten","bring","drink","only","better","hold","warm","full","done","light","pick","hurt","cut","kind","fall","carry","small","own","show","hot","far","draw","clean","grow","together","shall","laugh"]
};
export const LEVEL_KEYS = Object.keys(WORDS);
export const ALL_WORDS = Object.values(WORDS).flat();
export const WORLDS = [
  { key: 'pre_primer', name: '星光基地', robot: '星光先锋', color: '#58dfcb', code: '01' },
  { key: 'primer', name: '云端航线', robot: '云翼守卫', color: '#70bfff', code: '02' },
  { key: 'first_grade', name: '熔岩山谷', robot: '赤焰探险家', color: '#ff9970', code: '03' },
  { key: 'second_grade', name: '极光冰原', robot: '极光巡航者', color: '#baa3ff', code: '04' },
  { key: 'third_grade', name: '太阳之城', robot: '太阳领航员', color: '#ffda70', code: '05' }
];
export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
