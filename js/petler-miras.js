/* petler-miras.js — Pixel petler: veri (Cemre'nin Evi projesinden devralınan 7 karakter + Pıttıksu) ve motor (CD.PetMotor).
   Format: {id,name,palette,roles,frames}; "." şeffaf; çizgi rengi ortak #3b2a3a (--pixel-cizgi). Kareler orijinal buddies/*.json ile aynı. */
window.CD_PETLER_MIRAS = [{"id":"ayi","name":"Ponçik Ayı","palette":{"k":"#3b2a3a","p":"#ffb3c7","d":"#ff8fae","n":"#ff6f95","b":"#ff5c8a","w":"#ffffff","r":"#ff3b5c","s":"#8fcdff"},"frames":[[".....kk.........kk......","....kppk.......kppk.....","...kpnnpk.....kpnnpk....","...kpnnpkkkkkkkpnnpk....","..kpppppppppppppppppk...",".kppppppppppppppppkkpkk.",".kpppppppppppppppkbbkbbk",".kpppppkwpppppkwpkbbnbbk",".kpppppkkpppppkkpkbbkbbk",".kppppppppnnnpppppkkkkk.",".kpdddpppppnpppppdddpk..",".kpdddppppkpkppppdddpk..","..kppppppppkppppppppk...","...kpppppppppppppppk....","....kkpppppppppppkk.....","......kpppppppppk.......",".....kpddrrprrddpk......",".....kdddrrrrrdddk......",".....kpddprrrpddpk......","......kpppprppppk.......","......kpppppppppk.......",".....kdddpppppdddk......","......kkkkkkkkkkk.......","........................"],[".....kk.........kk......","....kppk.......kppk.....","...kpnnpk.....kpnnpk....","...kpnnpkkkkkkkpnnpk....","..kpppppppppppppppppk...",".kppppppppppppppppkkpkk.",".kpppppppppppppppkbbkbbk",".kppppppkpppppkppkbbnbbk",".kpppppkpkpppkpkpkbbkbbk",".kppppppppnnnpppppkkkkk.",".kpdddpppppnpppppdddpk..",".kpdddppppkpkppppdddpk..","..kppppppppkppppppppk...","...kpppppppppppppppk....","....kkpppppppppppkk.....","......kpppppppppk.......",".....kpddrrprrddpk......",".....kdddrrrrrdddk......",".....kpddprrrpddpk......","......kpppprppppk.......","......kpppppppppk.......",".....kdddpppppdddk......","......kkkkkkkkkkk.......","........................"],[".....kk.........kk......","....kppk.......kppk.....","...kpnnpk.....kpnnpk....","...kpnnpkkkkkkkpnnpk....","..kpppppppppppppppppk...",".kppppppppppppppppkkpkk.",".kpppppppppppppppkbbkbbk",".kpppppkwpppppkwpkbbnbbk",".kpppppkkpppppkkpkbbkbbk",".kppppppppnnnpppppkkkkk.",".kpdddpppppnpppppdddpk..",".kpdddppppkpkppppdddpk..","..kppppppppkppppppppk...","...kpppppppppppppppk....","....kkpppppppppppkk.....","......kpppppppppk.......",".....kpddrrprrddpk......",".....kdddrrrrrdddk......",".....kpppprrrpddpk......","......kpppprppddk.......",".....kdddpppppppk.......","......kkkpppppdddk......",".........kkkkkkkk.......","........................"],[".....kk.........kk......","....kppk.......kppk.....","...kpnnpk.....kpnnpk....","...kpnnpkkkkkkkpnnpk....","..kpppppppppppppppppk...",".kppppppppppppppppkkpkk.",".kpppppppppppppppkbbkbbk",".kpppppkwpppppkwpkbbnbbk",".kpppppkkpppppkkpkbbkbbk",".kppppppppnnnpppppkkkkk.",".kpdddpppppnpppppdddpk..",".kpdddppppkpkppppdddpk..","..kppppppppkppppppppk...","...kpppppppppppppppk....","....kkpppppppppppkk.....","......kpppppppppk.......",".....kpddrrprrddpk......",".....kdddrrrrrdddk......",".....kpddprrrppppk......","......kddpprppppk.......","......kpppppppdddk......",".....kdddpppppkkk.......","......kkkkkkkk..........","........................"],[".....kk.........kk......","....kppk.......kppk.....","...kpnnpk.....kpnnpk....","...kpnnpkkkkkkkpnnpk....",".skpppppppppppppppppk...",".kppppppppppppppppkkpkk.",".kpppppkkkpppkkkpkbbkbbk",".kpppppkwkpppkwkpkbbnbbk",".kpppppkkkpppkkkpkbbkbbk",".kppppppppnnnpppppkkkkk.",".kpdddpppppnpppppdddpk..",".kpdddpppppkpppppdddpk..","..kppppppppkppppppppk...","...kpppppppppppppppk....","...kkkpppppppppppkkk....","..kdddkpppppppppkdddk...","...kkkppprrprrpppkkk....",".....kppprrrrrpppk......",".....kpppprrrppppk......","......kpppprppppk.......","......kpppppppppk.......",".....kdddpppppdddk......","......kkkkkkkkkkk.......","........................"],["........................","........................",".....kk.........kk......","....kppk.......kppk.....","...kpnnpk.....kpnnpk....","...kpnnpkkkkkkkpnnpk....","..kpppppppppppppppppk...",".kppppppppppppppppkkpkk.",".kpppppkpppppppkpkbbkbbk",".kppppppkpppppkppkbbnbbk",".kpppppkpppppppkpkbbkbbk",".kppppppppnnnpppppkkkkk.",".kpdddpppppnpppppdddpk..",".kpdddppppkpkppppdddpk..","..kppppppppkppppppppk...","...kpppppppppppppppk....","....kkpppppppppppkk.....",".....kpppppppppppk......","....kpdddrrprrdddpk.....","....kddddrrrrrddddk.....","....kppddprrrpddppk.....","....kddddpppppddddk.....",".....kkkkkkkkkkkkk......","........................"]],"roles":{"idle":0,"blink":1,"walk":[2,3],"held":4,"land":5,"sleep":1}},{"id":"hayalet","name":"Fiyonklu Hayalet","palette":{"k":"#3b2a3a","w":"#fffaf3","s":"#ecdfd3","p":"#ff8fae","d":"#e06b92","b":"#ffb3c7","h":"#ffffff","t":"#8fcdff"},"frames":[["........kk.....kk.......",".......kpppkkkpppk......","......kppppdddppppk.....","......kppppdddppppk.....",".......kpppkkkpppk......","........kkkkkkkkk.......","......kkwwwwwwwwwkk.....",".....kwwwwwwwwwwwwwk....","....kwwwwwwwwwwwwwwwk...","....kwwkkkkwwwkkkkwwk...","....kwwkhkkwwwkhkkwwk...","....kwwkkkkwwwkkkkwwk...","....kwwkkkkwwwkkkkwwk...","..kkkbbwwwwwwwwwwwbbkkk.",".kwwwwwwwwkwwwkwwwwwwwwk",".ksswwwwwwwkkkwwwwwwwssk","..kkkwwwwwwwwwwwwwwwkkk.","....kwwwwwwwwwwwwwwwk...","....kwwwwwwwwwwwwwwwk...","....kwwwwkwwwwwkwwwwk...","....kwwwk.kwwwk.kwwwk...",".....kssk.ksssk.kssk....","......kk...kkk...kk.....","........................"],["........kk.....kk.......",".......kpppkkkpppk......","......kppppdddppppk.....","......kppppdddppppk.....",".......kpppkkkpppk......","........kkkkkkkkk.......","......kkwwwwwwwwwkk.....",".....kwwwwwwwwwwwwwk....","....kwwwwwwwwwwwwwwwk...","....kwwwwwwwwwwwwwwwk...","....kwwwkkwwwwwkkwwwk...","....kwwkwwkwwwkwwkwwk...","....kwwwwwwwwwwwwwwwk...","..kkkbbwwwwwwwwwwwbbkkk.",".kwwwwwwwwkwwwkwwwwwwwwk",".ksswwwwwwwkkkwwwwwwwssk","..kkkwwwwwwwwwwwwwwwkkk.","....kwwwwwwwwwwwwwwwk...","....kwwwwwwwwwwwwwwwk...","....kwwwwkwwwwwkwwwwk...","....kwwwk.kwwwk.kwwwk...",".....kssk.ksssk.kssk....","......kk...kkk...kk.....","........................"],["........kk.....kk.......",".......kpppkkkpppk......","......kppppdddppppk.....","......kppppdddppppk.....",".......kpppkkkpppk......","........kkkkkkkkk.......","......kkwwwwwwwwwkk.....",".....kwwwwwwwwwwwwwk....","....kwwwwwwwwwwwwwwwk...","....kwwkkkkwwwkkkkwwk...","....kwwkhkkwwwkhkkwwk...","....kwwkkkkwwwkkkkwwk...","..kkkwwkkkkwwwkkkkwwkkk.",".kwwwbbwwwwwwwwwwwbbwwwk",".ksswwwwwwkwwwkwwwwwwssk","..kkkwwwwwwkkkwwwwwwkkk.","....kwwwwwwwwwwwwwwwk...","....kwwwwwwwwwwwwwwwk...","....kwwwwkwwwwwkwwwwk...","....kwwwk.kwwwk.kwwwk...","....kssk..kssk..kssk....",".....kk....kk....kk.....","........................","........................"],["........kk.....kk.......",".......kpppkkkpppk......","......kppppdddppppk.....","......kppppdddppppk.....",".......kpppkkkpppk......","........kkkkkkkkk.......","......kkwwwwwwwwwkk.....",".....kwwwwwwwwwwwwwk....","....kwwwwwwwwwwwwwwwk...","....kwwkkkkwwwkkkkwwk...","....kwwkhkkwwwkhkkwwk...","....kwwkkkkwwwkkkkwwk...","....kwwkkkkwwwkkkkwwk...","..kkkbbwwwwwwwwwwwbbkkk.",".kwwwwwwwwkwwwkwwwwwwwwk",".ksswwwwwwwkkkwwwwwwwssk","..kkkwwwwwwwwwwwwwwwkkk.","....kwwwwwwwwwwwwwwwk...","....kwwwwwwwwwwwwwwwk...","....kwwwwkwwwwwkwwwwk...","....kwwwk.kwwwk.kwwwk...",".....kssk..kssk..kssk...","......kk....kk....kk....","........................"],["........kk.....kk.......",".......kpppkkkpppk......","......kppppdddppppk.....","......kppppdddppppk.....",".......kpppkkkpppk......","........kkkkkkkkk.......","......kkwwwwwwwwwkk.....",".....kwwwwwwwwwwwwwk.t..","....kwwkkkwwwwwkkkwwk...","..kkkwkhhhkwwwkhhhkwkkk.",".kwwwwkhkhkwwwkhkhkwwwwk",".kwwwwkhhhkwwwkhhhkwwwwk","..kwwwwkkkwwwwwkkkwwwwk.","...kkbbwwwwwwwwwwwbbkk..","....kwwwwwwwkwwwwwwwk...","....kwwwwwwkwkwwwwwwk...","....kwwwwwwwkwwwwwwwk...","....kwwwwwwwwwwwwwwwk...","....kwwwwwwwwwwwwwwwk...","....kwwwwkwwwwwkwwwwk...","....kwwwk.kwwwk.kwwwk...",".....kssk.ksssk.kssk....","......kk...kkk...kk.....","........................"],["........................","........................","........kk.....kk.......",".......kpppkkkpppk......","......kppppdddppppk.....","......kppppdddppppk.....",".......kpppkkkpppk......","........kkkkkkkkk.......",".....kkkwwwwwwwwwkkk....","....kwwwwwwwwwwwwwwwk...","...kwwwwwwwwwwwwwwwwwk..","...kwwwkkwwwwwwwkkwwwk..","...kwwwwkkwwwwwkkwwwwk..","...kwwwkkwwwwwwwkkwwwk..",".kkkbbwwwwwwwwwwwwwbbkkk",".kwwwwwwwwkwwwkwwwwwwwwk",".ksswwwwwwwkkkwwwwwwwssk",".kkkwwwwwwwwwwwwwwwwwkkk","...kwwwwwwwwwwwwwwwwwk..","...kwwwwwkwwwwwkwwwwwk..","...kwwwwk.kwwwk.kwwwwk..","....ksssk.ksssk.ksssk...",".....kkk...kkk...kkk....","........................"]],"roles":{"idle":0,"blink":1,"walk":[2,3],"held":4,"land":5,"sleep":1}},{"id":"flork","name":"Flork","palette":{"k":"#3b2a3a","w":"#ffffff","g":"#e9e0e8","p":"#ffb3c7","r":"#ff7a9a","l":"#ffa3b8"},"frames":[["........kkkkkkkk........","......kkwwwwwwwwkk......",".....kwwwwwwwwwwwwk.....","....kwwwwwwwwwwwwwwk....","..kkwwwwwwwwwwwwwwwwkk..",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwwkgwwwwwwkgwwwwwk.",".kwwwwwkkwwwwwwkkwwwwwk.",".kwppwwwwwwwwwwwwwwppwk.",".kwppwwwwkwwwwkwwwwppwk.",".kwwwwwwwwkkkkwwwwwwwwk.","..kwwwwwwwwwwwwwwwwwwk..","...kwwwwwwwwwwwwwwwwk...","....kggggggggggggggk....","....kwwwwkkwwkkwwwwk....","....kwwwklrkklrkwwwk....","....kwwwklrrrrrkwwwk....","....kwwwkrrrrrrkwwwk....","....kkwwwkrrrrkwwwkk....","....kgkwwwkrrkwwwkgk....","....kggkwwwkkwwwkggk....",".....kggkkkggkkkggk.....","......kkkkkkkkkkkk......","........................"],["........kkkkkkkk........","......kkwwwwwwwwkk......",".....kwwwwwwwwwwwwk.....","....kwwwwwwwwwwwwwwk....","..kkwwwwwwwwwwwwwwwwkk..",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwwkkwwwwwwkkwwwwwk.",".kwppwkwwkwwwwkwwkwppwk.",".kwppwwwwkwwwwkwwwwppwk.",".kwwwwwwwwkkkkwwwwwwwwk.","..kwwwwwwwwwwwwwwwwwwk..","...kwwwwwwwwwwwwwwwwk...","....kggggggggggggggk....","....kwwwwkkwwkkwwwwk....","....kwwwklrkklrkwwwk....","....kwwwklrrrrrkwwwk....","....kwwwkrrrrrrkwwwk....","....kkwwwkrrrrkwwwkk....","....kgkwwwkrrkwwwkgk....","....kggkwwwkkwwwkggk....",".....kggkkkggkkkggk.....","......kkkkkkkkkkkk......","........................"],["........kkkkkkkk........","......kkwwwwwwwwkk......",".....kwwwwwwwwwwwwk.....","....kwwwwwwwwwwwwwwk....","..kkwwwwwwwwwwwwwwwwkk..",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwwkgwwwwwwkgwwwwwk.",".kwwwwwkkwwwwwwkkwwwwwk.",".kwppwwwwwwwwwwwwwwppwk.",".kwppwwwwkwwwwkwwwwppwk.",".kwwwwwwwwkkkkwwwwwwwwk.","..kwwwwwwwwwwwwwwwwwwk..","...kwwwwwwwwwwwwwwwwk...","....kggggggggggggggk....","....kwwwwkkwwkkwwwwk....","....kwwwklrkklrkwwwk....","....kwwwklrrrrrkwwwk....","....kwwwkrrrrrrkwwwk....","....kkwwwkrrrrkwwwkk....","....kgkwwwkrrkwwwkgk....","....kggkwwwkkwwwkggk....",".....kggkkkggkkkggk.....","......kkkkkkkkkkkk......",".....kk.......kk........"],["........................","........kkkkkkkk........","......kkwwwwwwwwkk......",".....kwwwwwwwwwwwwk.....","....kwwwwwwwwwwwwwwk....","..kkwwwwwwwwwwwwwwwwkk..",".kwwwwwkgwwwwwwkgwwwwwk.",".kwwwwwkkwwwwwwkkwwwwwk.",".kwppwwwwwwwwwwwwwwppwk.",".kwppwwwwkwwwwkwwwwppwk.",".kwwwwwwwwkkkkwwwwwwwwk.","..kwwwwwwwwwwwwwwwwwwk..","...kwwwwwwwwwwwwwwwwk...","....kggggggggggggggk....","....kwwwwkkwwkkwwwwk....","....kwwwklrkklrkwwwk....","....kwwwklrrrrrkwwwk....","....kwwwkrrrrrrkwwwk....","....kkwwwkrrrrkwwwkk....","....kgkwwwkrrkwwwkgk....","....kggkwwwkkwwwkggk....",".....kggkkkggkkkggk.....","......kkkkkkkkkkkk......","........kk.......kk....."],["........kkkkkkkk........","......kkwwwwwwwwkk......",".k...kwwwwwwwwwwwwk...k.","..k.kwwwwwwwwwwwwwwk.k..","..kkwwwwwwwwwwwwwwwwkk..",".kwwwwkkkwwwwwwkkkwwwwk.",".kwwwwkwkwwwwwwkwkwwwwk.",".kwwwwkkkwwwwwwkkkwwwwk.",".kwppwwwwwwwwwwwwwwppwk.",".kwppwwwwwwkkwwwwwwppwk.",".kwwwwwwwwkrrkwwwwwwwwk.","..kwwwwwwwwkkwwwwwwwwk..","...kwwwwwwwwwwwwwwwwk...","....kggggggggggggggk....","....kwwwwkkwwkkwwwwk....","....kwwwklrkklrkwwwk....","....kwwwklrrrrrkwwwk....","....kwwwkrrrrrrkwwwk....","....kkwwwkrrrrkwwwkk....","....kgkwwwkrrkwwwkgk....","....kggkwwwkkwwwkggk....",".....kggkkkggkkkggk.....","......kkkkkkkkkkkk......","........................"],["........................","........................",".......kkkkkkkkkk.......",".....kkwwwwwwwwwwkk.....","...kkwwwwwwwwwwwwwwkk...",".kkwwwwwwwwwwwwwwwwwwkk.","kwwwwwwwwwwwwwwwwwwwwwwk","kwwwwwkwwwwwwwwwwkwwwwwk","kwppwwwkwwwwwwwwkwwwppwk","kwppwwkwwwwwwwwwwkwwppwk","kwwwwwwwwwkkkkwwwwwwwwwk",".kwwwwwwwwwwwwwwwwwwwwk.","..kwwwwwwwwwwwwwwwwwwk..","...kwwwwwwwwwwwwwwwwk...","....kggggggggggggggk....","....kwwwwkkwwkkwwwwk....","....kwwwklrkklrkwwwk....","....kwwwklrrrrrkwwwk....","....kkwwwkrrrrkwwwkk....","....kgkwwwkrrkwwwkgk....","....kggkwwwkkwwwkggk....",".....kggkkkggkkkggk.....","......kkkkkkkkkkkk......","........................"]],"roles":{"idle":0,"blink":1,"walk":[2,3],"held":4,"land":5,"sleep":1}},{"id":"top","name":"Pembe Top","palette":{"k":"#3b2a3a","p":"#ffb3c7","d":"#ff8fae","r":"#e8506f","h":"#ff7a9a","w":"#ffffff"},"frames":[[".h.h....................","hhhhh...............h.h.",".hhh................hhh.","..h..................h..",".........kkkkkk.........",".......kkppppppkk.......","......kpwwpppppppk...h.h",".....kppppppppppppk..hhh","....kppkkkppppkkkppk..h.","....kppkwkppppkwkppk....","....kppkkkppppkkkppk....","..kkkppkkkppppkkkppkkk..",".kpppppkkkppppkkkpppppk.",".kppphhpppkrrkppphhpppk.","..kkkppppppkkppppppkkk..","....kdppppppppppppdk....",".....kdppppppppppdk.....","......kddppppppddk......",".......kkddddddkk.......",".....kkrrkkkkkkrrkk.....","....krrrrrk..krrrrrk....","....krrrrrk..krrrrrk....",".....kkkkk...kkkkk......","........................"],[".h.h....................","hhhhh...............h.h.",".hhh................hhh.","..h..................h..",".........kkkkkk.........",".......kkppppppkk....h.h","......kpwwpppppppk...hhh",".....kppppppppppppk...h.","....kppppppppppppppk....","....kppppppppppppppk....","....kppkkkppppkkkppk....","..kkkpkpppkppkpppkpkkk..",".kpppddppppppppppddpppk.",".kppphhpppkrrkppphhpppk.","..kkkppppppkkppppppkkk..","....kdppppppppppppdk....",".....kdppppppppppdk.....","......kddppppppddk......",".......kkddddddkk.......",".....kkrrkkkkkkrrkk.....","....krrrrrk..krrrrrk....","....krrrrrk..krrrrrk....",".....kkkkk...kkkkk......","........................"],[".h.h....................","hhhhh...............h.h.",".hhh................hhh.","..h......kkkkkk......h..",".......kkppppppkk.......","......kpwwpppppppk......",".....kppppppppppppk..h.h","....kppkkkppppkkkppk.hhh","....kppkwkppppkwkppk..h.","....kppkkkppppkkkppk....","..kkkppkkkppppkkkppkkk..",".kpppppkkkppppkkkpppppk.",".kppphhpppkrrkppphhpppk.","..kkkppppppkkppppppkkk..","....kdppppppppppppdk....",".....kdppppppppppdk.....","......kddppppppddk......",".......kkddddddkk.......",".....kkrrkkkkkkrrk......","....krrrrrk..kkrrkk.....","....krrrrrk..krrrrrk....",".....kkkkk...krrrrrk....","..............kkkkk.....","........................"],[".h.h....................","hhhhh...............h.h.",".hhh................hhh.","..h..................h..",".........kkkkkk.........",".......kkppppppkk.......","......kpwwpppppppk...h.h",".....kppppppppppppk..hhh","....kppkkkppppkkkppk..h.","....kppkwkppppkwkppk....","....kppkkkppppkkkppk....","..kkkppkkkppppkkkppkkk..",".kpppppkkkppppkkkpppppk.",".kppphhpppkrrkppphhpppk.","..kkkppppppkkppppppkkk..","....kdppppppppppppdk....",".....kdppppppppppdk.....","......kddppppppddk......",".......kkddddddkk.......",".....kkrrkkkkkkrrkk.....","....krrrrrk..krrrrrk....","....krrrrrk...kkkkk.....",".....kkkkk..............","........................"],[".h.h....................","hhhhh...............h.h.",".hhh................hhh.","..h..................h..",".........kkkkkk.........",".......kkppppppkk.......","......kpwwpppppppk...h.h",".....kppppppppppppk..hhh","....kppkkppppppkkppk..h.","..kkkpkwwkppppkwwkpkkk..",".kppkpkwwkppppkwwkpkppk.","..kkppkkkkppppkkkkppkk..","..kppppkkppkkppkkppppk..","..kpphhpppkrrkppphhppk..","...kpppppppkkpppppppk...","....kdppppppppppppdk....",".....kdppppppppppdk.....","......kddppppppddk......",".......kkddddddkk.......",".....kkrrkkkkkkrrkk.....","....krrrrrk..krrrrrk....","....krrrrrk..krrrrrk....",".....kkkkk....kkkkk.....","........................"],[".h.h....................","hhhhh...............h.h.",".hhh................hhh.","..h..................h..","........................","........................",".......kkkkkkkkkk....h.h",".....kkwwppppppppkk..hhh","...kkppppppppppppppkk.h.","..kpppkkppppppppkkpppk..",".kppppppkppppppkppppppk.","kpppppkkppppppppkkpppppk","kpphhpppppkrrkppppphhppk","kdpppppppppkkpppppppppdk",".kdppppppppppppppppppdk.","..kdppppppppppppppppdk..","...kdppppppppppppppdk...","....kddppppppppppddk....",".....kkddddddddddkk.....","...kkrrkkkkkkkkkkrrkk...","..krrrrrk......krrrrrk..","..krrrrrk......krrrrrk..","...kkkkk........kkkkk...","........................"]],"roles":{"idle":0,"blink":1,"walk":[2,3],"held":4,"land":5,"sleep":1}},{"id":"kedi","name":"Sırıtan Kedi","palette":{"k":"#3b2a3a","w":"#ffffff","p":"#ffb3c7","g":"#ece1ea","h":"#9d8ca0","b":"#8fcdff"},"frames":[["....k..............k....","...kwk............kwk...","..kwpwk..........kwpwk..","..kwppwk........kwppwk..",".kwwwwwwkkkkkkkkwwwwwwk.",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwwhkwwwwwwhkwwwwwk.",".kwwwwwkkwwwwwwkkwwwwwk.",".kpppwwkkwwwwwwkkwwpppk.",".kpppwwwwwwwwwwwwwwpppk.",".kpppkkkkkkkkkkkkkkpppk.",".kwwkwwkwwkwwkwwkwwkwwk.",".kwwkwwkwwkwwkwwkwwkwwk.",".kwwwkwkwwkwwkwwkwkwwwk.","..kwwwkkwwkwwkwwkkwwwk..","...kwwwwkkkkkkkkwwwwk...","....kkwwwwwwwwwwwwkk....","......kkkkkkkkkkkk......","........kggggggk........",".......kwwwwwwwwk.......","......kwwwwwwwwwwk......","......kwwwwwwwwwwk......",".......kwwwkkwwwk.......","........kkkkkkkk........","........................"],["....k..............k....","...kwk............kwk...","..kwpwk..........kwpwk..","..kwppwk........kwppwk..",".kwwwwwwkkkkkkkkwwwwwwk.",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwkwwkwwwwkwwkwwwwk.",".kpppwwkkwwwwwwkkwwpppk.",".kpppwwwwwwwwwwwwwwpppk.",".kpppkkkkkkkkkkkkkkpppk.",".kwwkwwkwwkwwkwwkwwkwwk.",".kwwkwwkwwkwwkwwkwwkwwk.",".kwwwkwkwwkwwkwwkwkwwwk.","..kwwwkkwwkwwkwwkkwwwk..","...kwwwwkkkkkkkkwwwwk...","....kkwwwwwwwwwwwwkk....","......kkkkkkkkkkkk......","........kggggggk........",".......kwwwwwwwwk.......","......kwwwwwwwwwwk......","......kwwwwwwwwwwk......",".......kwwwkkwwwk.......","........kkkkkkkk........","........................"],["........................","....k..............k....","...kwk............kwk...","..kwpwk..........kwpwk..","..kwppwk........kwppwk..",".kwwwwwwkkkkkkkkwwwwwwk.",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwwhkwwwwwwhkwwwwwk.",".kwwwwwkkwwwwwwkkwwwwwk.",".kpppwwkkwwwwwwkkwwpppk.",".kpppwwwwwwwwwwwwwwpppk.",".kpppkkkkkkkkkkkkkkpppk.",".kwwkwwkwwkwwkwwkwwkwwk.",".kwwkwwkwwkwwkwwkwwkwwk.",".kwwwkwkwwkwwkwwkwkwwwk.","..kwwwkkwwkwwkwwkkwwwk..","...kwwwwkkkkkkkkwwwwk...","....kkwwwwwwwwwwwwkk....","......kkkkkkkkkkkk......","........kggggggk........",".......kwwwwwwwwk.......","......kwwwwwwwwwwk......",".......kkkkkkwwwk.......","............kkkk........","........................"],["....k..............k....","...kwk............kwk...","..kwpwk..........kwpwk..","..kwppwk........kwppwk..",".kwwwwwwkkkkkkkkwwwwwwk.",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwwhkwwwwwwhkwwwwwk.",".kwwwwwkkwwwwwwkkwwwwwk.",".kpppwwkkwwwwwwkkwwpppk.",".kpppwwwwwwwwwwwwwwpppk.",".kpppkkkkkkkkkkkkkkpppk.",".kwwkwwkwwkwwkwwkwwkwwk.",".kwwkwwkwwkwwkwwkwwkwwk.",".kwwwkwkwwkwwkwwkwkwwwk.","..kwwwkkwwkwwkwwkkwwwk..","...kwwwwkkkkkkkkwwwwk...","....kkwwwwwwwwwwwwkk....","......kkkkkkkkkkkk......","........kggggggk........",".......kwwwwwwwwk.......","......kwwwwwwwwwwk......","......kwwwwwwwwwwk......",".......kwwwkkkkkk.......","........kkkk............","........................"],[".......................b","...k................k.bb","..kwk..............kwk..",".kwpwk............kwpwk.",".kwppwk..........kwppwk.",".kwwwwwkkkkkkkkkkwwwwwk.",".kwwwwwwwwwwwwwwwwwwwwk.",".kwwwwkkkwwwwwwkkkwwwwk.",".kwwwkwwwkwwwwkwwwkwwwk.",".kwwwkwkwkwwwwkwkwkwwwk.",".kwwwkwwwkwwwwkwwwkwwwk.",".kpppwkkkwwwwwwkkkwpppk.",".kpppwwwwwwwwwwwwwwpppk.",".kpppwwwwwwkkwwwwwwpppk.","..kwwwwwwwkwwkwwwwwwwk..","...kwwwwwwwkkwwwwwwwk...","....kkwwwwwwwwwwwwkk....","......kkkkkkkkkkkk......","........kggggggk........",".......kwwwwwwwwk.......","......kwwwwwwwwwwk......","......kwwwwwwwwwwk......",".......kwwwkkwwwk.......","........kkkkkkkk........","........................"],["........................","........................","...k................k...","..kwk..............kwk..",".kwpwk............kwpwk.",".kwppwk..........kwppwk.","kwwwwwwkkkkkkkkkkwwwwwwk","kwwwwwwwwwwwwwwwwwwwwwwk","kwwwwkkwwwwwwwwwwkkwwwwk","kwwwwwkkwwwwwwwwkkwwwwwk","kpppwkkwwwwwwwwwwkkwpppk","kpppwwwwwwwwwwwwwwwwpppk","kpppkkkkkkkkkkkkkkkkpppk",".kwwkwwkwwkwwkwwkwwkwwk.","..kwwkwkwwkwwkwwkwkwwk..","...kwwkkkkkkkkkkkkwwk...","....kkwwwwwwwwwwwwkk....","......kkkkkkkkkkkk......","........kggggggk........",".......kwwwwwwwwk.......","......kwwwwwwwwwwk......","......kwwwwwwwwwwk......",".......kwwwkkwwwk.......","........kkkkkkkk........","........................"]],"roles":{"idle":0,"blink":1,"walk":[2,3],"held":4,"land":5,"sleep":1}},{"id":"tavsan","name":"Tavşan","palette":{"k":"#3b2a3a","c":"#fff1e2","s":"#efd3bd","p":"#ffb3c7","r":"#ff8fae","w":"#ffffff","b":"#8fcdff"},"frames":[[".....kkk......kkk.......","....kccck....kccck......","....kcpck....kcpck..k.k.","....kcpck....kcpck.krrrk","....kcpck....kcpck.krrrk","....kcpck....kcpck..krk.","....kcpck....kcpck...k..","....kcpck....kcpck......","....kccckkkkkkccck......","...kcccccccccccccck.....","...kcccccccccccccck.....","...kcckkcccccckkcck.....","...kckwkkcccckwkkck.....","...kckkkkcccckkkkck.....","...kcckkccrrcckkcck.....","...kppccckcckcccppk.....","...kppcccckkccccppk.....","....kcccccccccccck......",".....kkrrrkkrrrkk.......","......krrrpprrrk........","......kcrrccrrck........","......kcccccccck........","......ksccccccsk........","......kssskksssk........","......kkkk..kkkk........","........................"],[".....kkk......kkk...k.k.","....kccck....kccck.krrrk","....kcpck....kcpck.krrrk","....kcpck....kcpck..krk.","....kcpck....kcpck...k..","....kcpck....kcpck......","....kcpck....kcpck......","....kcpck....kcpck......","....kccckkkkkkccck......","...kcccccccccccccck.....","...kcccccccccccccck.....","...kcccccccccccccck.....","...kcckkcccccckkcck.....","...kckcckcccckcckck.....","...kccccccrrcccccck.....","...kppccckcckcccppk.....","...kppcccckkccccppk.....","....kcccccccccccck......",".....kkrrrkkrrrkk.......","......krrrpprrrk........","......kcrrccrrck........","......kcccccccck........","......ksccccccsk........","......kssskksssk........","......kkkk..kkkk........","........................"],["........................","....kkk......kkk........","...kccck....kccck...k.k.","...kcpck....kcpck..krrrk","...kcpck....kcpck..krrrk","....kcpck....kcpck..krk.","....kcpck....kcpck...k..","....kcpck....kcpck......","....kcpck....kcpck......","....kccckkkkkkccck......","...kcccccccccccccck.....","...kcccccccccccccck.....","...kcckkcccccckkcck.....","...kckwkkcccckwkkck.....","...kckkkkcccckkkkck.....","...kcckkccrrcckkcck.....","...kppccckcckcccppk.....","...kppcccckkccccppk.....","....kcccccccccccck......",".....kkrrrkkrrrkk.......","......krrrpprrrk........","......kcrrccrrck........","......ksccccsssk........","......kssskkkkkk........","......kkkk..............","........................"],[".....kkk......kkk.......","....kccck....kccck......","....kcpck....kcpck..k.k.","....kcpck....kcpck.krrrk","....kcpck....kcpck.krrrk","....kcpck....kcpck..krk.","....kcpck....kcpck...k..","....kcpck....kcpck......","....kccckkkkkkccck......","...kcccccccccccccck.....","...kcccccccccccccck.....","...kcckkcccccckkcck.....","...kckwkkcccckwkkck.....","...kckkkkcccckkkkck.....","...kcckkccrrcckkcck.....","...kppccckcckcccppk.....","...kppcccckkccccppk.....","....kcccccccccccck......",".....kkrrrkkrrrkk.......","......krrrpprrrk........","......kcrrccrrck........","......kcccccccck........","......ksssccccsk........","......kkkkkksssk........","............kkkk........","........................"],[".....kkk......kkk.......","....kccck....kccck......","....kcpck....kcpck..k.k.","....kcpck....kcpck.krrrk","....kcpck....kcpck.krrrk","....kcpck....kcpck..krk.","....kcpck....kcpck...k..","....kcpck....kcpck......","....kccckkkkkkccck......","...kcccccccccccccck.....","...kcckkkcccckkkcck.b...","...kckwwkkcckwwkkck.b...","...kckwkkkcckwkkkck.....","...kckkkkkcckkkkkck.....","...kcckkkcrrckkkcck.....","...kppcccckkccccppk.....","...kppcccckkccccppk.....","....kcccccccccccck......",".....kkrrrkkrrrkk.......","......krrrpprrrk........","......kcrrccrrck........","....kkcccccccccckk......","....ksssccccccsssk......","....kkkssskkssskkk......","......kkkk..kkkk........","........................"],["....................k.k.","...................krrrk","...................krrrk","....................krk.","...kkk..........kkk..k..","..kccck........kccck....","...kcpck......kcpck.....","...kcpck......kcpck.....","....kcpck....kcpck......","....kcpck....kcpck......","....kccckkkkkkccck......","...kcccccccccccccck.....","..kcccccccccccccccck....","..kcckkcccccccckkcck....","..kcccckcccccckcccck....","..kcckkcccccccckkcck....","..kppcccccrrcccccppk....","..kppccccckkcccccppk....","...kcccccccccccccck.....","....kkrrrrkkrrrrkk......",".....krrrrpprrrrk.......",".....kcrrrccrrrck.......",".....ksccccccccsk.......",".....ksssskkssssk.......","......kkkk..kkkk........","........................"]],"roles":{"idle":0,"blink":1,"walk":[2,3],"held":4,"land":5,"sleep":1}},{"id":"bibble","name":"Bibble","palette":{"k":"#3b2a3a","b":"#aeb8cf","d":"#8b95b0","h":"#ff8fae","n":"#ff6f95","w":"#fffaf3","p":"#ffb3c7"},"frames":[[".......kk..kk..kk.......","......khhkkhhkkhhk......","......khhhhhhhhhhk......",".....khhhhhhhhhhhhk.....","....khhhhhhhhhhhhhhk....","...khhnhhhhhhhhhhnhhk...","..khhhhhhhhhhhhhhhhhhk..","..khhbbhhbbbbbbhhbbhhk..","..kbbbbbbbbbbbbbbbbbbk..","..kbbbkkkkbbbbkkkkbbbk..","..kbbbwwkwbbbbwwkwbbbk..","..kbbbwwkkbbbbwwkkbbbk..","..kbppbbbbbnnbbbbbppbk..","..kbbbbbbbkkbbbbbbbbbk..","..kbkbbbbbwwwwbbbbbkbk..","..kbkbbbbwwwwwwbbbbkbk..","..kkkbbbbwppwwwbbbbkkkk.","..kdbbbbbwwwwwwbbbbbdkdk","...kdbbbbwwwwwwbbbbdkkk.","....kddbbbwwwwbbbddk....",".....kddddddddddddk.....","......kkkddkkddkkk......",".........kk..kk.........","........................"],[".......kk..kk..kk.......","......khhkkhhkkhhk......","......khhhhhhhhhhk......",".....khhhhhhhhhhhhk.....","....khhhhhhhhhhhhhhk....","...khhnhhhhhhhhhhnhhk...","..khhhhhhhhhhhhhhhhhhk..","..khhbbhhbbbbbbhhbbhhk..","..kbbbbbbbbbbbbbbbbbbk..","..kbbbbbbbbbbbbbbbbbbk..","..kbbbbkkbbbbbbkkbbbbk..","..kbbbkbbkbbbbkbbkbbbk..","..kbppbbbbbnnbbbbbppbk..","..kbbbbbbknnnnkbbbbbbk..","..kbkbbbbbwwwwbbbbbkbk..","..kbkbbbbwwwwwwbbbbkbk..","..kkkbbbbwppwwwbbbbkkkk.","..kdbbbbbwwwwwwbbbbbdkdk","...kdbbbbwwwwwwbbbbdkkk.","....kddbbbwwwwbbbddk....",".....kddddddddddddk.....","......kkkddkkddkkk......",".........kk..kk.........","........................"],[".......kk..kk..kk.......","......khhkkhhkkhhk......","......khhhhhhhhhhk......",".....khhhhhhhhhhhhk.....","....khhhhhhhhhhhhhhk....","...khhnhhhhhhhhhhnhhk...","..khhhhhhhhhhhhhhhhhhk..","..khhbbhhbbbbbbhhbbhhk..","..kbbbbbbbbbbbbbbbbbbk..","..kbbbkkkkbbbbkkkkbbbk..","..kbbbwwkwbbbbwwkwbbbk..","..kbbbwwkkbbbbwwkkbbbk..","..kbppbbbbbnnbbbbbppbk..","..kbbbbbbbkkbbbbbbbbbk..","..kbkbbbbbwwwwbbbbbbbk..","..kbkbbbbwwwwwwbbbbkbk..","..kkkbbbbwppwwwbbbbkbkk.","..kdbbbbbwwwwwwbbbkkdkdk","...kdbbbbwwwwwwbbbbdkkk.","....kddbbbwwwwbbbddk....",".....kddddddddddddk.....","......kkkddkkddkkk......","........kk....kk........","........................"],["......khhkkhhkkhhk......","......khhhhhhhhhhk......",".....khhhhhhhhhhhhk.....","....khhhhhhhhhhhhhhk....","...khhnhhhhhhhhhhnhhk...","..khhhhhhhhhhhhhhhhhhk..","..khhbbhhbbbbbbhhbbhhk..","..kbbbbbbbbbbbbbbbbbbk..","..kbbbkkkkbbbbkkkkbbbk..","..kbbbwwkwbbbbwwkwbbbk..","..kbbbwwkkbbbbwwkkbbbk..","..kbppbbbbbnnbbbbbppbk..","..kbbbbbbbkkbbbbbbbbbk..","..kbbbbbbbwwwwbbbbbkbk..","..kbkbbbbwwwwwwbbbbkbk..","..kbkbbbbwppwwwbbbbkkkk.","..kkkbbbbwwwwwwbbbbbdkdk","...kdbbbbwwwwwwbbbbdkkk.","....kddbbbwwwwbbbddk....",".....kddddddddddddk.....","......kkkddkkddkkk......",".........kk.............","........................","........................"],[".......kk..kk..kk.......","......khhkkhhkkhhk......","......khhkkhhkkhhk......",".....khhhhhhhhhhhhk.....","....khhhhhhhhhhhhhhk....","...khhnhhhhhhhhhhnhhk...","..khhhhhhhhhhhhhhhhhhk..","..khhbbhhbbbbbbhhbbhhk..","..kbbbbbbbbbbbbbbbbbbk..","..kbbbbkkbbbbbbkkbbbbk..","..kbbbkwwkbbbbkwwkbbbk..",".kkbbbkkwkbbbbkkwkbbbkk.",".kkbbbbkkbbbbbbkkbbbbkk.","kkkbppbbbbknnkbbbbppbkkk","..kbbbbbbbwwwwbbbbbbbk..","..kbbbbbbwwwwwwbbbbbbk..","..kbbbbbbwppwwwbbbbbbkk.","..kdbbbbbwwwwwwbbbbbdkdk","...kdbbbbwwwwwwbbbbdkkk.","....kddbbbwwwwbbbddk....",".....kddddddddddddk.....","......kkkddkkddkkk......",".........kk..kk.........","........................"],["........................","........................","........................",".........kk..kk..kk.....",".......khhkkhhkkhhk.....","...khhhhhhhhhhhhhhhhhk..",".khhhhhhhhhhhhhhhhhhhhk.",".khhbbhhbbbbbbbbhhbbhhk.",".kbbbbbbbbbbbbbbbbbbbbk.",".kbbbkkbbbbbbbbbkkbbbbk.",".kbppbkkbbbbbbbkkbppbbk.",".kbbbkkbbbbnnbbbkkbbbbk.",".kbbbbbbbkkkkbbbbbbbbbk.",".kbbbbbbbbbbbbbbbbbbbbk.",".kbbbbbbwwwwwwwwbbbbbbk.",".kbbbbbbwwppwwwwbbbbbbk.",".kbbkbbbwwwwwwwwbbbkbbk.",".kbkkbbbbwwwwwwbbbbkkbk.","..kddbbbbwwwwwwbbbbddkkk","...kdddddwwwwwwdddddk...","....kddddddddddddddk....",".....kkkddkkkkddkkk.....","........kk....kk........","........................"]],"roles":{"idle":0,"blink":1,"walk":[2,3],"held":4,"land":5,"sleep":1}},{"id":"pittiksu","name":"Pıttıksu","palette":{"k":"#3B2A3A","f":"#848D9A","d":"#5E6674","l":"#A9B3BF","e":"#5C7D99","b":"#1F2A36","n":"#E6A3B0","p":"#E9B4BC","w":"#FFFFFF"},"roles":{"idle":0,"blink":1,"walk":[2,3],"held":4,"land":5,"sleep":1},"frames":[["...kk...........kk......","..kfdk.........kdfk.....",".kfpdfk.......kfdpfk....",".kfppdfkkkkkkkkfdppfk...",".kffpffffffffffffpfffk..","kfffffffffffffffffffffk.","kffffffffffffffffffffffk","kfffffkkfffffffkkffffffk","kffffkeekfffffkeekfffffk","kffffkbwkfffffkbwkfffffk","kfffffkkfffffffkkffffffk","kfppfffffffnnfffffffppfk","kfppffffffkffkffffffppfk",".kffffffffffffffffffffk.","..kkffffffffffffffffkk..","....kkffffffffffffkk....","......kkffffffffkk......",".....kffffffffffffk.kk..","....kffflffffffffffkfdk.","....kfflllfffffffffkfdk.","....kfflllffffffffffdfk.","....kffflfffffffffffffk.",".....kffffffffffffffffk.",".....kddkkfffkkfffkddk..","......kkkkkkkkkkkkkkk..."],["...kk...........kk......","..kfdk.........kdfk.....",".kfpdfk.......kfdpfk....",".kfppdfkkkkkkkkfdppfk...",".kffpffffffffffffpfffk..","kfffffffffffffffffffffk.","kffffffffffffffffffffffk","kffffffffffffffffffffffk","kffffkkkkfffffkkkkfffffk","kffffffffffffffffffffffk","kffffffffffffffffffffffk","kfppfffffffnnfffffffppfk","kfppffffffkffkffffffppfk",".kffffffffffffffffffffk.","..kkffffffffffffffffkk..","....kkffffffffffffkk....","......kkffffffffkk......",".....kffffffffffffk.kk..","....kffflffffffffffkfdk.","....kfflllfffffffffkfdk.","....kfflllffffffffffdfk.","....kffflfffffffffffffk.",".....kffffffffffffffffk.",".....kddkkfffkkfffkddk..","......kkkkkkkkkkkkkkk..."],["...kk...........kk......","..kfdk.........kdfk.....",".kfpdfk.......kfdpfk....",".kfppdfkkkkkkkkfdppfk...",".kffpffffffffffffpfffk..","kfffffffffffffffffffffk.","kffffffffffffffffffffffk","kfffffkkfffffffkkffffffk","kffffkeekfffffkeekfffffk","kffffkbwkfffffkbwkfffffk","kfffffkkfffffffkkffffffk","kfppfffffffnnfffffffppfk","kfppffffffkffkffffffppfk",".kffffffffffffffffffffk.","..kkffffffffffffffffkk..","....kkffffffffffffkk....","......kkffffffffkk......",".....kffffffffffffk.kk..","....kffflffffffffffkfdk.","....kfflllfffffffffkfdk.","....kfflllffffffffffdfk.","....kffflfffffffffffffk.",".....kffffffffffffffffk.","....kddkkkfffkkfffkkddk.","......kkkkkkkkkkkkkkk..."],["...kk...........kk......","..kfdk.........kdfk.....",".kfpdfk.......kfdpfk....",".kfppdfkkkkkkkkfdppfk...",".kffpffffffffffffpfffk..","kfffffffffffffffffffffk.","kffffffffffffffffffffffk","kfffffkkfffffffkkffffffk","kffffkeekfffffkeekfffffk","kffffkbwkfffffkbwkfffffk","kfffffkkfffffffkkffffffk","kfppfffffffnnfffffffppfk","kfppffffffkffkffffffppfk",".kffffffffffffffffffffk.","..kkffffffffffffffffkk..","....kkffffffffffffkk....","......kkffffffffkk......",".....kffffffffffffk.kk..","....kffflffffffffffkfdk.","....kfflllfffffffffkfdk.","....kfflllffffffffffdfk.","....kffflfffffffffffffk.",".....kffffffffffffffffk.","......kddkfffkkfffkddk..",".......kkkkkkkkkkkkkk..."],["...kk...........kk......","..kfdk.........kdfk.....",".kfpdfk.......kfdpfk....",".kfppdfkkkkkkkkfdppfk...",".kffpffffffffffffpfffk..","kfffffffffffffffffffffk.","kffffffffffffffffffffffk","kfffffkkfffffffkkffffffk","kffffkeekfffffkeekfffffk","kffffkbbkfffffkbbkfffffk","kfffffkkfffffffkkffffffk","kfppfffffffnnfffffffppfk","kfppffffffknnkffffffppfk",".kffffffffffffffffffffk.","..kkffffffffffffffffkk..","....kkffffffffffffkk....","......kkffffffffkk......",".....kffffffffffffk.kk..","....kffflffffffffffkfdk.","....kfflllfffffffffkfdk.","....kfflllffffffffffdfk.","....kffflfffffffffffffk.",".....kffffffffffffffffk.",".....kddk..fff..fkddk...","......kkk..kkk..kkkk...."],["...kk...........kk......","..kfdk.........kdfk.....",".kfpdfk.......kfdpfk....",".kfppdfkkkkkkkkfdppfk...",".kffpffffffffffffpfffk..","kfffffffffffffffffffffk.","kffffffffffffffffffffffk","kffffffffffffffffffffffk","kffffkkkkfffffkkkkfffffk","kffffffffffffffffffffffk","kffffffffffffffffffffffk","kfppfffffffnnfffffffppfk","kfppffffffkffkffffffppfk",".kffffffffffffffffffffk.","..kkffffffffffffffffkk..","....kkffffffffffffkk....","......kkffffffffkk......",".....kffffffffffffk.kk..","....kffflffffffffffkfdk.","....kfflllfffffffffkfdk.","....kfflllffffffffffdfk.","....kffflfffffffffffffk.",".....kffffffffffffffffk.",".....kddkkfffkkfffkddk..",".....kkkkkkkkkkkkkkkkk.."]]}];

/* ------------------------------------------------------------------------------------------
   PET MOTORU — Cemre'nin Evi'ndeki buddies.js'ten devralındı, Cemre'nin Dünyası'na uyarlandı.
   Kullanım:
     const motor = CD.PetMotor({ katman?, sabit: true|false, tunekSecici?, sozler?, zeminPay? });
     const pet = motor.ekle(CD.petVeri('ayi'), { x: 40, ad: 'Ponçik Ayı' });
     pet.soyle('♥'); pet.zipla(); pet.uyu(); pet.uyan(); pet.git(x); pet.kare('eat'); pet.kilit(true);
     motor.goster(false); motor.sevin(); motor.yokEt();
   Sprite formatı: { id, name, palette:{harf:renk}, roles:{idle,blink,walk:[a,b],held,land,sleep?,eat?,happy?}, frames:[[satır...]] }
   - Dokun: zıplar + kalp + laf. Çift dokun: büyük zıplama. Basılı tut / yana çek: kaldır → fırlat.
   - Kendi kafasına dolaşır: yürür, arkadaş ziyaret eder, itişir, kovalar, karta tüner, uyur.
   - prefers-reduced-motion: fizik/dolaşma kapalı; dokununca yine kalp çıkar.
   ------------------------------------------------------------------------------------------ */
(() => {
  'use strict';
  const CD = window.CD = window.CD || {};
  const VERI = window.CD_PETLER_MIRAS || [];
  CD.petVeri = (id) => VERI.find(p => p.id === id) || null;
  CD.petListesi = () => VERI.slice();

  const AYAR = {
    gravity: 2100, bounce: 0.42, wallBounce: 0.55, floorFriction: 5, airDrag: 0.3, maxSpeed: 2600,
    floorPad: 8, holdMs: 120, tapMs: 220, tapPx: 6, dblMs: 350,
    walkSpeed: 55, visitSpeed: 62, chaseSpeed: 130, fleeSpeed: 118,
    thinkMin: 2600, thinkMax: 6200, blinkMin: 3000, blinkMax: 6500, sleepAfter: 45000, walkStepPx: 22
  };
  const SOZLER = ['♥', 'ponçik!', 'hehe', 'hoş geldin!', 'zıp!', 'beni fırlat!', 'Cemre ♥', 'bir kalp daha', 'yumuşacık', 'gezmece!', 'burası güzelmiş', 'mırr', 'battaniye!'];
  const TUNEK_SOZLER = ['manzara güzel', 'buradan her şey görünüyor', 'tünedim ✓', 'yukarısı rahat'];
  const olcek = () => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sprite-olcek')); return isNaN(v) ? 3 : v; };

  // sprite → canvas (1 hücre = 1 px; CSS büyütür)
  CD.spriteCiz = function (canvas, sprite, fi) {
    fi = Math.max(0, Math.min(fi == null ? 0 : fi, sprite.frames.length - 1));
    const f = sprite.frames[fi];
    const w = Math.max.apply(null, f.map(r => r.length)), h = f.length;
    if (canvas.width !== w) canvas.width = w; if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    f.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.' || ch === ' ') continue; ctx.fillStyle = sprite.palette[ch] || '#000'; ctx.fillRect(x, y, 1, 1); } });
    return canvas;
  };
  // sprite'ı tek başına bir elemente koy (kart ikonu vb.)
  CD.spriteElemani = function (sprite, kare, olc) {
    const c = document.createElement('canvas'); CD.spriteCiz(c, sprite, kare == null ? (sprite.roles ? sprite.roles.idle : 0) : kare);
    const s = olc || olcek(); c.style.width = (c.width * s) + 'px'; c.style.height = (c.height * s) + 'px'; c.style.imageRendering = 'pixelated'; c.className = 'pet-sprite';
    return c;
  };

  function preventScroll(e) { e.preventDefault(); }

  CD.PetMotor = function (secenek) {
    secenek = secenek || {};
    const azalt = () => CD.azHareket;
    const sabit = secenek.sabit !== false;
    let katman = secenek.katman;
    if (!katman) { katman = document.createElement('div'); katman.className = 'pet-katmani'; katman.setAttribute('aria-hidden', 'true'); document.body.appendChild(katman); }
    katman.classList.add('pet-katmani'); if (!sabit) katman.classList.add('yerel');
    const sozler = secenek.sozler || SOZLER;
    const petler = [];
    const tunekKullanilan = new Set();
    let SCALE = olcek();

    const kutu = () => katman.getBoundingClientRect();
    const W = () => sabit ? innerWidth : katman.clientWidth;
    const H = () => sabit ? innerHeight : katman.clientHeight;
    const guvenliAlt = () => { if (!sabit) return 0; const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--guvenli-alt')); return isNaN(v) ? 0 : v; };
    const zeminY = () => (secenek.zemin ? secenek.zemin() : H() - guvenliAlt() - (secenek.zeminPay != null ? secenek.zeminPay : AYAR.floorPad));
    const solSinir = () => 0, sagSinir = () => W();

    // ---- parçacıklar (katman içi, yerel koordinat)
    let parcaSayisi = 0;
    function parca(cls, x, y, vars, omur) {
      if (azalt() || parcaSayisi >= 18) return;
      parcaSayisi++;
      const p = document.createElement('i'); p.className = 'pet-parca ' + cls;
      p.style.left = x + 'px'; p.style.top = y + 'px';
      for (const k in vars) p.style.setProperty(k, vars[k]);
      katman.appendChild(p);
      setTimeout(() => { p.remove(); parcaSayisi--; }, omur);
    }
    const kalpler = (x, y, n) => { for (let i = 0; i < n; i++) setTimeout(() => parca('kalp', x + (Math.random() * 36 - 18), y + (Math.random() * 10 - 5), { '--dx': (Math.random() * 40 - 20) + 'px' }, 900), i * 45); };
    const toz = (x, y, n) => { for (let i = 0; i < n; i++) parca('toz', x + (Math.random() * 30 - 15), y - 4, { '--dx': ((i % 2 ? 1 : -1) * (8 + Math.random() * 18)) + 'px' }, 550); };
    const yildizlar = (x, y, n) => { for (let i = 0; i < n; i++) parca('yildiz', x, y + (Math.random() * 20 - 10), { '--dx': (Math.random() * 44 - 22) + 'px', '--dy': (-8 - Math.random() * 26) + 'px' }, 600); };

    // ---- döngü
    let rafOn = false, last = 0, gizli = false, duraklat = false;
    function uyan() { if (!rafOn) { rafOn = true; last = performance.now(); requestAnimationFrame(dongu); } }
    const engelli = () => document.hidden || gizli || duraklat || katman.classList.contains('kapali') || document.body.classList.contains('sheet-acik');
    function tunekler() {
      if (!secenek.tunekSecici) return [];
      const kr = kutu();
      return [...document.querySelectorAll(secenek.tunekSecici)].filter(h => {
        const r = h.getBoundingClientRect();
        return r.top - kr.top > 96 && r.bottom - kr.top < H() - 140 && r.width > 90 && r.left - kr.left > -20 && r.right - kr.left < W() + 20;
      });
    }
    const yerelRect = (el) => { const r = el.getBoundingClientRect(), k = kutu(); return { left: r.left - k.left, right: r.right - k.left, top: r.top - k.top, bottom: r.bottom - k.top, width: r.width, height: r.height }; };

    class Pet {
      constructor(sprite, sec) {
        sec = sec || {};
        this.sprite = sprite; this.id = sprite.id; this.ad = sec.ad || sprite.name || sprite.id;
        this.R = Object.assign({ idle: 0, blink: 1, walk: null, held: null, land: null }, sprite.roles || {});
        const f = sprite.frames[0];
        this.cw = Math.max.apply(null, f.map(r => r.length)); this.ch = f.length;
        this.w = this.cw * SCALE; this.h = this.ch * SCALE;
        this.el = document.createElement('div');
        this.el.className = 'pet'; this.el.dataset.id = sprite.id; this.el.title = this.ad;
        this.el.style.width = this.w + 'px'; this.el.style.height = this.h + 'px';
        this.canvas = document.createElement('canvas'); this.el.appendChild(this.canvas);
        this.frame = -1; this.kareAyarla(this.R.idle);
        katman.appendChild(this.el);
        this.x = sec.x != null ? sec.x : Math.random() * Math.max(10, W() - this.w);
        this.x = Math.max(0, Math.min(W() - this.w, this.x));
        this.y = sec.y != null ? sec.y : zeminY() - this.h - 40 - Math.random() * 120;
        this.vx = 0; this.vy = 0; this.dir = Math.random() < 0.5 ? 1 : -1;
        this.rot = 0; this.roll = 0; this.sx = 1; this.sy = 1; this.tsx = 1; this.tsy = 1;
        this.onFloor = false; this.held = false; this.pending = null; this.uyuyor = false; this.kilitli = false; this.sabitKare = null;
        this.mode = 'idle'; this.targetX = 0; this.tunekEl = null; this.friend = null;
        this.walkPhase = 0; this.walkDist = 0; this.landUntil = 0; this.happyUntil = 0; this.blinkUntil = 0;
        this.lastTap = 0; this.taps = 0; this.lastInteract = performance.now();
        this.pendingHop = 0; this.landed = false; this.userThrew = false; this.bounces = 0;
        this.bagla(); this.dusunPlanla(); this.kirpPlanla();
        this.ciz(true);
      }
      rol(ad) { const r = this.R[ad]; return r == null ? (ad === 'blink' ? (this.R.blink != null ? this.R.blink : 0) : (this.R.idle || 0)) : r; }
      // ---- etkileşim
      bagla() {
        const el = this.el;
        el.addEventListener('pointerdown', (e) => {
          if (e.button !== undefined && e.button !== 0) return;
          if (engelli()) return;
          e.stopPropagation();
          const k = kutu(); const cx = e.clientX - k.left, cy = e.clientY - k.top;
          this.pending = { id: e.pointerId, x: cx, y: cy, t: performance.now(), timer: setTimeout(() => this.tut(e.pointerId, cx, cy), AYAR.holdMs) };
          this.lastInteract = performance.now();
          if (this.uyuyor) this.uyan();
        });
        el.addEventListener('pointermove', (e) => {
          const k = kutu(); const cx = e.clientX - k.left, cy = e.clientY - k.top;
          if (this.pending && !this.held) {
            const dx = cx - this.pending.x, dy = cy - this.pending.y;
            if (Math.abs(dy) > 5 && Math.abs(dy) > Math.abs(dx)) { this.iptal(); return; }
            if (Math.abs(dx) >= 8) this.tut(e.pointerId, cx, cy);
            return;
          }
          if (!this.held) return;
          const now = performance.now();
          this.tx = cx - this.grabDX; this.ty = cy - this.grabDY;
          this.samples.push({ t: now, x: cx, y: cy });
          while (this.samples.length > 2 && now - this.samples[0].t > 90) this.samples.shift();
          const mdx = cx - this.samples[0].x;
          if (Math.abs(mdx) > 4) this.dir = mdx > 0 ? 1 : -1;
        });
        const up = (e) => {
          if (this.pending && !this.held) {
            const p = this.pending; this.iptal();
            const k = kutu(); const moved = Math.hypot(e.clientX - k.left - p.x, e.clientY - k.top - p.y);
            if (performance.now() - p.t <= AYAR.tapMs + AYAR.holdMs && moved < AYAR.tapPx) this.dokun(e);
            return;
          }
          if (!this.held) return;
          this.birak(e);
        };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', () => { if (this.pending && !this.held) this.iptal(); else if (this.held) this.birak(null); });
        el.addEventListener('lostpointercapture', () => { if (this.held) this.birak(null); });
        el.addEventListener('contextmenu', (e) => e.preventDefault());
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.dokun(null); } });
        el.tabIndex = -1;
      }
      iptal() { if (this.pending) { clearTimeout(this.pending.timer); this.pending = null; } }
      tut(pointerId, cx, cy) {
        if (this.held || engelli() || this.kilitli) { this.iptal(); return; }
        const p = this.pending; this.iptal();
        this.modCik();
        this.held = true; this.el.classList.add('tutuldu');
        try { this.el.setPointerCapture(pointerId); } catch (e) {}
        document.addEventListener('touchmove', preventScroll, { passive: false });
        this.grabDX = (p ? p.x : cx) - this.x; this.grabDY = (p ? p.y : cy) - this.y;
        this.tx = cx - this.grabDX; this.ty = cy - this.grabDY;
        this.samples = [{ t: performance.now(), x: cx, y: cy }];
        this.vx = 0; this.vy = 0; this.onFloor = false;
        this.tsx = .92; this.tsy = 1.08;
        if (Math.random() < 0.3) this.soyle('!');
        if (secenek.tutunca) secenek.tutunca(this);
        uyan();
      }
      birak(e) {
        this.held = false; this.el.classList.remove('tutuldu');
        document.removeEventListener('touchmove', preventScroll);
        const s = this.samples || [];
        const s0 = s[0], s1 = s[s.length - 1];
        let vx = 0, vy = 0;
        if (s0 && s1 && s1.t > s0.t) { const dt = (s1.t - s0.t) / 1000; vx = (s1.x - s0.x) / dt; vy = (s1.y - s0.y) / dt; }
        const sp = Math.hypot(vx, vy);
        if (sp > AYAR.maxSpeed) { vx *= AYAR.maxSpeed / sp; vy *= AYAR.maxSpeed / sp; }
        if (sp < 200) { vx = 0; vy = 0; }
        this.vx = vx; this.vy = vy; this.onFloor = false; this.landed = false; this.userThrew = true; this.bounces = 0;
        if (sp > 1400 && Math.random() < 0.25) this.soyle('yaşasınnn!');
        this.tsx = 1; this.tsy = 1;
        this.lastInteract = performance.now();
        if (secenek.birakinca) secenek.birakinca(this, sp);
        uyan();
      }
      dokun(e) {
        const now = performance.now();
        const dbl = now - this.lastTap < AYAR.dblMs; this.lastTap = now; this.taps++;
        this.lastInteract = now;
        if (!this.kilitli) { this.modCik(); this.vy = dbl ? -900 : -520; this.vx = (Math.random() - 0.5) * 160; this.onFloor = false; this.landed = false; this.bounces = 0; }
        kalpler(this.x + this.w / 2, this.y + this.h * 0.3, dbl ? 10 : 5);
        if (CD.ses) CD.ses.pit();
        this.happyUntil = now + 700;
        switch (this.id) {
          case 'flork': this.soyle('!'); break;
          case 'kedi': this.soyle(this.taps % 3 === 0 ? 'mrrr' : 'miyav'); break;
          case 'pittiksu': this.soyle(this.taps % 2 ? 'mırr' : 'miu'); if (CD.ses) CD.ses.minikMiyav(); break;
          case 'top': this.ez(1.25, .75); break;
          case 'hayalet': this.el.classList.add('hayalet-mod'); this.vy -= 120; setTimeout(() => this.el.classList.remove('hayalet-mod'), 260); break;
          case 'tavsan': this.pendingHop = -300; break;
          case 'bibble': this.soyle(this.taps % 2 ? 'hmph.' : 'pürtük!'); if (CD.ses && this.taps % 2) CD.ses.hmpf(); break;
          case 'ayi': kalpler(this.x + this.w / 2, this.y, 2); break;
        }
        if (!['flork', 'kedi', 'bibble', 'pittiksu'].includes(this.id)) this.soyle(sozler[Math.floor(Math.random() * sozler.length)]);
        if (secenek.dokununca) secenek.dokununca(this, dbl);
        uyan();
      }
      soyle(text, ms) {
        let b = this.el.querySelector('.pet-balon');
        if (!b) { b = document.createElement('div'); b.className = 'pet-balon'; this.el.appendChild(b); }
        b.textContent = text; b.classList.remove('goster'); void b.offsetWidth; b.classList.add('goster');
        clearTimeout(this.balonT); this.balonT = setTimeout(() => b.classList.remove('goster'), ms || 1500);
      }
      ez(sx, sy) { this.sx = sx; this.sy = sy; this.tsx = 1; this.tsy = 1; uyan(); }
      kareAyarla(i) { i = Math.max(0, Math.min(i, this.sprite.frames.length - 1)); if (this.frame === i) return; this.frame = i; CD.spriteCiz(this.canvas, this.sprite, i); }
      kare(rolAdi, ms) { // dışarıdan: belirli rol karesini göster (eat/wash/happy…); ms sonra bırak
        if (rolAdi == null) { this.sabitKare = null; this.yuzUygula(performance.now()); return; }
        const r = this.R[rolAdi]; if (r == null) return;
        this.sabitKare = Array.isArray(r) ? r[0] : r; this.kareAyarla(this.sabitKare);
        clearTimeout(this.kareT); if (ms) this.kareT = setTimeout(() => { this.sabitKare = null; }, ms);
      }
      kilit(v) { this.kilitli = !!v; if (v) { this.modCik(); this.vx = 0; } }
      zipla(guc) { if (this.held) return; this.modCik(); this.vy = -(guc || 520); this.onFloor = false; this.landed = false; this.bounces = 0; uyan(); }
      git(x) { if (this.held || this.kilitli) return; this.modCik(); this.targetX = Math.max(0, Math.min(W() - this.w, x)); this.mode = 'walk'; this.dir = this.targetX > this.x ? 1 : -1; uyan(); }
      uyu() { this.uyuyor = true; this.el.classList.add('zzz'); this.modCik(); this.vx = 0; this.yuzUygula(performance.now()); }
      uyan() { this.uyuyor = false; this.el.classList.remove('zzz'); }
      mutlu(ms) { this.happyUntil = performance.now() + (ms || 900); kalpler(this.x + this.w / 2, this.y, 3); uyan(); }
      modCik() {
        if (this.mode === 'perch' && this.tunekEl) tunekKullanilan.delete(this.tunekEl);
        if (this.friend && this.friend.mode === 'flee') this.friend.mode = 'idle';
        this.mode = 'idle'; this.tunekEl = null; this.friend = null;
      }
      yokEt() { clearTimeout(this.thinkT); clearTimeout(this.blinkT); clearTimeout(this.balonT); clearTimeout(this.kareT); this.modCik(); this.el.remove(); }
      // ---- düşünce
      dusunPlanla() {
        clearTimeout(this.thinkT);
        this.thinkT = setTimeout(() => { try { this.dusun(); } catch (e) {} this.dusunPlanla(); }, AYAR.thinkMin + Math.random() * (AYAR.thinkMax - AYAR.thinkMin));
      }
      dusun() {
        if (engelli() || this.held || azalt() || this.kilitli) return;
        const now = performance.now();
        if (this.mode === 'perch') {
          this.perchTicks = (this.perchTicks || 0) + 1;
          if (this.perchTicks > 2 + Math.random() * 3) this.tunektenIn();
          else if (Math.random() < 0.5) { this.dir *= -1; if (Math.random() < 0.35) this.soyle(TUNEK_SOZLER[Math.floor(Math.random() * TUNEK_SOZLER.length)]); }
          return;
        }
        if (!this.onFloor || this.mode !== 'idle') return;
        if (this.uyuyor) { if (Math.random() < 0.3) this.uyan(); return; }
        const r = Math.random();
        if (r < 0.26) { this.targetX = 8 + Math.random() * Math.max(20, W() - 16 - this.w); this.mode = 'walk'; this.dir = this.targetX > this.x ? 1 : -1; uyan(); }
        else if (r < 0.40) {
          const others = petler.filter(b => b !== this && !b.held && b.onFloor && b.mode !== 'perch' && !b.kilitli);
          if (others.length) { this.friend = others[Math.floor(Math.random() * others.length)]; this.mode = 'visit'; uyan(); }
        }
        else if (r < 0.50 && this.sprite.frames.length > 2) {
          const spots = tunekler().filter(s => !tunekKullanilan.has(s));
          if (spots.length) { this.tunekEl = spots[Math.floor(Math.random() * spots.length)]; tunekKullanilan.add(this.tunekEl); this.mode = 'perch-approach'; uyan(); }
        }
        else if (r < 0.66) { this.vy = -(300 + Math.random() * 220); this.onFloor = false; uyan(); }
        else if (r < 0.76) { this.dir *= -1; if (Math.random() < 0.3) this.soyle(sozler[Math.floor(Math.random() * sozler.length)]); this.ciz(true); }
        else if (now - this.lastInteract > AYAR.sleepAfter && Math.random() < 0.6 && !petler.some(b => b.uyuyor && b !== this)) this.uyu();
      }
      tunektenIn() {
        if (this.tunekEl) tunekKullanilan.delete(this.tunekEl);
        this.tunekEl = null; this.mode = 'idle';
        this.vy = -120; this.vx = (Math.random() < 0.5 ? -1 : 1) * 60; this.onFloor = false; this.bounces = 0;
        uyan();
      }
      kirpPlanla() {
        clearTimeout(this.blinkT);
        this.blinkT = setTimeout(() => {
          if (!engelli() && !this.uyuyor && !this.held) { this.blinkUntil = performance.now() + 140; this.yuzUygula(performance.now()); }
          this.kirpPlanla();
        }, AYAR.blinkMin + Math.random() * (AYAR.blinkMax - AYAR.blinkMin));
      }
      // ---- hedefe yürüme
      sur(dt, now) {
        let target = null, speed = AYAR.walkSpeed;
        if (this.mode === 'walk') target = this.targetX;
        else if (this.mode === 'visit' && this.friend) {
          if (this.friend.held || this.friend.mode === 'perch') { this.modCik(); return; }
          target = this.friend.x + (this.friend.x > this.x ? -this.w - 4 : this.friend.w + 4); speed = AYAR.visitSpeed;
        }
        else if (this.mode === 'perch-approach' && this.tunekEl) {
          const r = yerelRect(this.tunekEl);
          if (r.width < 60 || r.top < 90) { this.modCik(); return; }
          target = r.left + r.width / 2 - this.w / 2; speed = AYAR.visitSpeed;
        }
        else if (this.mode === 'chase' && this.friend) {
          target = this.friend.x; speed = AYAR.chaseSpeed;
          if (now > this.chaseUntil) { this.mode = 'idle'; if (this.friend.mode === 'flee') this.friend.mode = 'idle'; kalpler((this.x + this.friend.x) / 2 + this.w / 2, this.y, 4); this.friend = null; return; }
        }
        else if (this.mode === 'flee' && this.fleeFrom) {
          target = this.fleeFrom.x > this.x ? 8 : W() - this.w - 8; speed = AYAR.fleeSpeed;
          if (this.fleeFrom.mode !== 'chase') { this.mode = 'idle'; this.fleeFrom = null; return; }
        }
        else return;
        const dx = target - this.x;
        if (Math.abs(dx) < 6 && this.mode !== 'flee' && this.mode !== 'chase') { this.var(now); return; }
        this.vx = Math.sign(dx) * speed;
        this.dir = dx > 0 ? 1 : -1;
      }
      var(now) {
        const m = this.mode;
        if (m === 'walk') { this.mode = 'idle'; this.vx = 0; if (this.varinca) { const f = this.varinca; this.varinca = null; f(); } }
        else if (m === 'visit' && this.friend) {
          const f = this.friend;
          this.vx = 0; this.dir = f.x > this.x ? 1 : -1; f.dir = -this.dir;
          this.mode = 'idle';
          const r = Math.random();
          kalpler((this.x + f.x + this.w) / 2, Math.min(this.y, f.y), 3);
          if (r < 0.25 && !f.held && !f.kilitli) { f.vx += this.dir * 190; f.vy = -140; f.onFloor = false; f.soyle('hop!'); this.soyle('pardon 🙊'); }
          else if (r < 0.4 && !f.held && !f.kilitli) { this.mode = 'chase'; this.chaseUntil = now + 2800; f.mode = 'flee'; f.fleeFrom = this; f.soyle('yakalayamazsın!'); }
          else { if (Math.random() < 0.6) this.soyle('♥'); if (Math.random() < 0.4) f.soyle('♥'); f.happyUntil = now + 800; this.happyUntil = now + 800; this.friend = null; }
          if (secenek.bulusunca) secenek.bulusunca(this, f);
        }
        else if (m === 'perch-approach' && this.tunekEl) {
          const r = yerelRect(this.tunekEl);
          const dh = Math.max(40, this.y - (r.top - this.h));
          this.vy = -Math.sqrt(2 * AYAR.gravity * dh) - 90;
          this.vx = 0; this.onFloor = false; this.mode = 'perch-jump'; this.bounces = 0;
        }
        else { this.mode = 'idle'; this.vx = 0; }
      }
      // ---- fizik
      adim(dt, now) {
        if (this.held) {
          this.x += (this.tx - this.x) * Math.min(1, 0.38 * 60 * dt); this.y += (this.ty - this.y) * Math.min(1, 0.38 * 60 * dt);
          const s = this.samples; const vx = s && s.length > 1 ? (s[s.length - 1].x - s[0].x) / Math.max(0.016, (s[s.length - 1].t - s[0].t) / 1000) : 0;
          this.rot = Math.max(-14, Math.min(14, vx / 40));
          this.yuzUygula(now);
          return true;
        }
        if (azalt()) { this.x = Math.max(0, Math.min(W() - this.w, this.x)); this.y = zeminY() - this.h; this.onFloor = true; this.rot = 0; this.yuzUygula(now); return false; }
        if (this.mode === 'perch' && this.tunekEl) {
          const r = yerelRect(this.tunekEl);
          if (r.width < 60 || r.top < 80 || r.bottom > H() - 100 || r.right < 30 || r.left > W() - 30) this.tunektenIn();
          else {
            const nx = Math.max(r.left + 2, Math.min(r.right - 2 - this.w, this.x));
            const ny = r.top - this.h + 3;
            const moved = Math.abs(nx - this.x) > 0.5 || Math.abs(ny - this.y) > 0.5;
            this.x = nx; this.y = ny; this.rot = 0; this.sx = 1; this.sy = 1; this.vx = 0; this.vy = 0;
            this.yuzUygula(now);
            return moved;
          }
        }
        if (this.onFloor && !this.kilitli) this.sur(dt, now);
        this.vy += AYAR.gravity * dt;
        if (!this.onFloor) this.vx *= Math.max(0, 1 - AYAR.airDrag * dt);
        this.x += this.vx * dt; this.y += this.vy * dt;
        if (this.mode === 'perch-jump' && this.tunekEl && this.vy > -200) {
          const r = yerelRect(this.tunekEl);
          if (this.y <= r.top - this.h + 6 && this.x + this.w > r.left && this.x < r.right) {
            this.mode = 'perch'; this.perchTicks = 0; this.vy = 0; this.vx = 0;
            this.y = r.top - this.h + 3; this.ez(1.15, .85); toz(this.x + this.w / 2, this.y + this.h, 3);
            this.yuzUygula(now); return true;
          }
          if (this.vy > 300) this.modCik();
        }
        const fy = zeminY() - this.h;
        if (this.y >= fy) {
          if (!this.onFloor) {
            const k = Math.max(0, Math.min(.32, Math.abs(this.vy) / 2400));
            if (this.vy > 200) { this.sx = 1 + k; this.sy = 1 - k; this.landUntil = now + 150; }
            if (this.vy > 700) toz(this.x + this.w / 2, fy + this.h, this.vy > 1300 ? 6 : 4);
            if (!this.landed && this.userThrew && this.vy > 600) { this.landed = true; this.userThrew = false; try { if (navigator.vibrate) navigator.vibrate(6); } catch (e) {} if (CD.ses && this.vy > 900) CD.ses.uf(); }
            if (this.vy > 1500) this.soyle('uff!');
            this.bounces = (this.bounces || 0) + 1;
          }
          this.y = fy;
          const e = this.bounces > 1 ? AYAR.bounce * 0.6 : AYAR.bounce;
          this.vy = this.vy > 120 ? -this.vy * e : 0;
          this.onFloor = this.vy === 0;
          if (this.onFloor) { this.bounces = 0; if (this.pendingHop) { this.vy = this.pendingHop; this.pendingHop = 0; this.onFloor = false; } }
          if (this.mode === 'idle') this.vx *= Math.max(0, 1 - AYAR.floorFriction * dt);
          if (Math.abs(this.vx) < 12 && this.mode === 'idle') this.vx = 0;
        } else this.onFloor = false;
        if (this.y < -2 * this.h) { this.y = -2 * this.h; this.vy = Math.abs(this.vy) * 0.3; }
        if (this.x < solSinir()) { this.x = solSinir(); if (Math.abs(this.vx) > 400) yildizlar(4, this.y + this.h / 2, 3); this.vx = Math.abs(this.vx) * AYAR.wallBounce; this.dir = 1; this.sx = .8; this.sy = 1.16; }
        if (this.x > sagSinir() - this.w) { this.x = sagSinir() - this.w; if (Math.abs(this.vx) > 400) yildizlar(W() - 8, this.y + this.h / 2, 3); this.vx = -Math.abs(this.vx) * AYAR.wallBounce; this.dir = -1; this.sx = .8; this.sy = 1.16; }
        if (Math.abs(this.vx) > 10 && this.mode === 'idle') this.dir = this.vx > 0 ? 1 : -1;
        if (this.onFloor && Math.abs(this.vx) > 20) { this.walkDist += Math.abs(this.vx) * dt; if (this.walkDist > AYAR.walkStepPx) { this.walkDist = 0; this.walkPhase++; } }
        const sp = Math.hypot(this.vx, this.vy);
        const airSy = 1 + Math.min(.14, sp / 7000);
        this.tsx = this.onFloor ? 1 : 1 / airSy; this.tsy = this.onFloor ? 1 : airSy;
        const lerp = Math.min(1, 14 * dt);
        this.sx += (this.tsx - this.sx) * lerp; this.sy += (this.tsy - this.sy) * lerp;
        if (this.id === 'top' && this.mode !== 'perch') { this.roll += this.vx * dt * (360 / (Math.PI * this.w)); this.rot = this.roll; }
        else this.rot = this.onFloor ? 0 : Math.max(-14, Math.min(14, this.vx * 0.02));
        this.yuzUygula(now);
        return !this.onFloor || Math.abs(this.vx) > 8 || Math.abs(this.sx - 1) > 0.01 || Math.abs(this.sy - 1) > 0.01 || this.mode !== 'idle';
      }
      yuzUygula(now) {
        let f;
        if (this.sabitKare != null) f = this.sabitKare;
        else if (this.held) f = this.rol('held');
        else if (now < this.landUntil) f = this.rol('land');
        else if (this.uyuyor) f = this.R.sleep != null ? this.R.sleep : this.rol('blink');
        else if (!this.onFloor && this.mode !== 'perch' && Math.hypot(this.vx, this.vy) > 750) f = this.rol('held');
        else if (this.onFloor && Math.abs(this.vx) > 20 && this.R.walk) f = this.R.walk[this.walkPhase % this.R.walk.length];
        else if (now < this.happyUntil) f = this.R.happy != null ? this.R.happy : this.rol('blink');
        else if (now < this.blinkUntil) f = this.rol('blink');
        else f = this.rol('idle');
        this.kareAyarla(f);
      }
      ciz(force) {
        const rot = this.id === 'top' ? this.rot : this.rot * this.dir;
        const t = 'translate3d(' + Math.round(this.x) + 'px, ' + this.y.toFixed(1) + 'px, 0) scaleX(' + this.dir + ') scale(' + this.sx.toFixed(3) + ', ' + this.sy.toFixed(3) + ') rotate(' + rot.toFixed(1) + 'deg)';
        if (force || t !== this._t) { this.el.style.transform = t; this._t = t; }
      }
      olcekle() {
        SCALE = olcek(); this.w = this.cw * SCALE; this.h = this.ch * SCALE;
        this.el.style.width = this.w + 'px'; this.el.style.height = this.h + 'px';
      }
    }

    function ayir() {
      for (let i = 0; i < petler.length; i++) for (let j = i + 1; j < petler.length; j++) {
        const a = petler[i], b = petler[j];
        if (a.held || b.held || !a.onFloor || !b.onFloor) continue;
        if (a.mode !== 'idle' || b.mode !== 'idle') continue;
        const minD = (a.w + b.w) * 0.42;
        const d = (b.x + b.w / 2) - (a.x + a.w / 2);
        if (Math.abs(d) < minD) { const push = (minD - Math.abs(d)) * 0.12; const s = d >= 0 ? 1 : -1; a.x -= push * s; b.x += push * s; }
      }
    }
    function dongu(now) {
      const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000)); last = now;
      let any = false;
      if (!document.hidden && !gizli && !duraklat) {
        petler.forEach(b => { if (b.adim(dt, now)) any = true; });
        ayir();
        petler.forEach(b => b.ciz(false));
      }
      if (any || petler.some(b => b.held)) requestAnimationFrame(dongu); else rafOn = false;
    }

    let wasBlocked = false;
    const mo = new MutationObserver(() => {
      const b = document.body.classList.contains('sheet-acik');
      if (b) petler.forEach(bd => { if (bd.mode === 'chase' || bd.mode === 'flee') bd.modCik(); });
      if (wasBlocked && !b) petler.forEach((bd, i) => setTimeout(() => { if (!bd.held && bd.mode !== 'perch' && !bd.kilitli) { bd.vy = -240; bd.onFloor = false; uyan(); } }, i * 50));
      wasBlocked = b;
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const yenidenBoyut = () => { petler.forEach(b => { b.olcekle(); if (b.mode === 'perch') b.tunektenIn(); b.x = Math.min(b.x, Math.max(0, W() - b.w)); if (b.onFloor) b.y = zeminY() - b.h; b.ciz(true); }); uyan(); };
    addEventListener('resize', yenidenBoyut);
    const gorunurluk = () => { if (!document.hidden) uyan(); };
    document.addEventListener('visibilitychange', gorunurluk);

    const motor = {
      katman, petler,
      ekle(sprite, sec) { if (!sprite) return null; const p = new Pet(sprite, sec); petler.push(p); uyan(); return p; },
      bul(id) { return petler.find(p => p.id === id) || null; },
      kaldir(id) { const i = petler.findIndex(p => p.id === id); if (i >= 0) { petler[i].yokEt(); petler.splice(i, 1); } },
      goster(v) { gizli = !v; katman.classList.toggle('kapali', !v); if (v) uyan(); },
      duraklat(v) { duraklat = !!v; if (!v) uyan(); },
      uyan,
      sevin() {
        petler.forEach((b, i) => setTimeout(() => {
          if (b.held) return;
          if (b.mode === 'perch') { b.happyUntil = performance.now() + 1200; b.soyle('🎉'); return; }
          b.modCik(); b.vy = -600; b.onFloor = false; b.landed = false; b.bounces = 0;
          kalpler(b.x + b.w / 2, b.y, 3); b.happyUntil = performance.now() + 900; uyan();
        }, i * 60));
      },
      yokEt() { petler.forEach(p => p.yokEt()); petler.length = 0; mo.disconnect(); removeEventListener('resize', yenidenBoyut); document.removeEventListener('visibilitychange', gorunurluk); if (!secenek.katman) katman.remove(); }
    };
    return motor;
  };
})();
