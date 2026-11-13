/* Original 64 px reliefs and 72 × 100 creature cels. */
const VeilArt = (() => {
  const walls = {
    salt: ['#1e1c22','#343034','#685d56','#917f6e','#b5a48c','#e0d3b9'],
    archive: ['#130e17','#2c2328','#503a37','#765649','#ad8262','#dfc194'],
    garden: ['#0c181b','#1e3030','#374740','#506854','#82a177','#c7c8a1'],
    soundings: ['#08171c','#19303b','#2d4b54','#496871','#7b9da1','#c1d0c3'],
    sky: ['#101323','#22283f','#353f5e','#556184','#828fb3','#c7c6df'],
    crypt:     ['#100e18','#2d2632','#483a46','#77605e','#ad8d78','#c5a789'],
    catacomb:  ['#091c22','#173039','#345256','#4e6e6b','#7ca49a','#a8c6ab'],
    chapel:    ['#180e20','#302039','#4d2b4f','#73506d','#a97791','#d2aab7'],
    sanctuary: ['#190e18','#39232c','#57303a','#805459','#b9907b','#eed4a3'],
    nave:      ['#071b21','#153136','#245052','#3b7873','#65b5a3','#b8e0c0'],
  };

  function painter(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    const rect = (color, x, y, width, height) => {
      g.fillStyle = color;
      g.fillRect(x, y, width, height);
    };
    function path(points, color, width) {
      g.beginPath();
      g.moveTo(...points[0]);
      for (const point of points.slice(1)) g.lineTo(...point);
      if (width) {
        g.strokeStyle = color;
        g.lineWidth = width;
        g.stroke();
      } else {
        g.closePath();
        g.fillStyle = color;
        g.fill();
      }
    }
    return { canvas, rect, path };
  }

  function masonry(region, feature) {
    const {canvas, rect, path} = painter(64, 64);
    const [dark, mortar, mid, rim, gold, light] = walls[region];
    rect(mortar, 0, 0, 64, 64);
    for (let y = 0; y < 64; y += 13) {
      rect(dark, 0, y, 64, 1);
      for (let x = y % 2 ? 12 : 0; x < 64; x += 24) {
        rect(dark, x, y, 1, 13);
        rect(mid, x + 1, y + 1, 22, 1);
      }
    }
    const recess = (x, y, width, height) => {
      rect(rim, x, y, width, height);
      rect(dark, x + 2, y + 2, width - 4, height - 4);
      rect(mid, x, y + height - 2, width, 2);
    };
    if (feature === 'niches') {
      for (const y of [8, 32]) for (const x of [5, 34]) {
        recess(x, y, 25, 20);
        rect(gold, x + 7, y + 12, 13, 3);
        rect(mid, x + 5, y + 15, 16, 2);
      }
    } else if (feature === 'tomb') {
      path([[4,62],[4,25],[14,12],[32,1],[50,12],[60,25],[60,62]],rim);
      path([[10,60],[10,27],[19,15],[32,7],[45,15],[54,27],[54,60]],dark);
      path([[19,52],[23,30],[27,27],[27,21],[32,17],[37,21],[37,27],[41,30],[45,52]],mid);
      path([[32,29],[26,39],[38,39],[32,44]],gold,2);
      rect(rim,14,51,36,9);
      rect(light,17,51,30,1);
    } else if (feature === 'ossuary') {
      for (const y of [12, 33]) {
        recess(4, y, 56, 19);
        for (let x = 8; x < 55; x += 9) {
          rect(mid, x, y+9, 8, 3);
          rect(gold, x+2, y+5, 4, 4);
          rect(dark, x+3, y+6, 2, 1);
        }
      }
    } else if (feature === 'rooted') {
      recess(15, 13, 33, 41);
      path([[0,5],[21,18],[29,33],[47,42],[61,64]], dark, 10);
      path([[0,4],[21,17],[29,32],[47,41],[61,64]], rim, 3);
      path([[29,32],[21,47],[9,53],[4,64]], mid, 6);
      rect(gold, 18, 50, 17, 2);
    } else if (feature === 'choir') {
      for (const x of [4,52]) {
        rect(dark,x,0,8,61);
        rect(rim,x+1,5,3,51);
      }
      path([[15,55],[15,23],[32,4],[49,23],[49,55]], dark);
      path([[19,31],[32,20],[45,31],[32,42],[19,31]], gold, 2);
      rect(light,31,25,2,12);
    } else if (feature === 'waterline') {
      for (const x of [1,48]) {
        rect(dark,x,0,15,64);
        rect(mid,x+3,0,4,64);
      }
      rect(dark,0,43,64,17);
      for (const y of [41,43,49,55]) rect(y === 43 ? gold : mid,0,y,64,1);
      for (const x of [23,38]) rect(rim,x,25,3,14);
    } else if (feature === 'workshop') {
      recess(5, 8, 54, 44);
      for (const y of [32,45,55]) rect(rim,0,y,64,3);
      for (let i=0; i<26; i++) {
        rect(i%5 ? mid : light,(i*23)%63,34+(i*7)%23,2,1);
      }
    } else if (feature === 'stacks') {
      for (const y of [6,23,40]) {
        recess(3,y,58,17);
        for (let x=7;x<57;x+=7) {
          rect(mid,x,y+7,6,6);
          rect(gold,x+1,y+9,3,1);
        }
      }
      rect(rim,30,5,4,54);
    } else if (feature === 'trellis') {
      for (const x of [7,30,53]) rect(mid,x,0,4,56);
      for (const y of [9,24,39]) rect(rim,0,y,64,3);
      path([[1,59],[14,45],[25,41],[32,29],[47,17],[51,0]],dark,7);
      path([[1,58],[14,44],[25,40],[32,28],[47,16],[51,0]],gold,2);
    } else if (feature === 'conduits') {
      for (const y of [15,30,51]) {
        rect(dark,0,y,64,9);
        rect(mid,0,y+1,64,5);
        rect(gold,0,y+1,64,1);
        for (const x of [9,48]) {
          rect(rim,x,y-2,5,11);
          rect(light,x+1,y-1,1,2);
        }
      }
      rect(dark,27,13,11,46);
      rect(rim,29,13,6,46);
    } else if (feature === 'observatory') {
      recess(2,4,60,53);
      const g = canvas.getContext('2d');
      for (const [rx,ry,color] of [[23,17,mid],[18,12,rim],[11,8,gold]]) {
        g.strokeStyle=color; g.lineWidth=1;
        g.beginPath(); g.ellipse(32,29,rx,ry,0,0,Math.PI*2); g.stroke();
      }
      rect(light,31,28,3,3);
      for (const [x,y] of [[12,13],[49,14],[17,36],[46,43],[26,48]]) rect(gold,x,y,2,1);

    }
    rect(dark, 0, 60, 64, 4);
    rect(mid, 0, 60, 64, 1);
    return canvas;
  }

  function landmark(region, kind) {
    const {canvas, rect, path} = painter(72, 100);
    const [dark, mortar, stone, edge, metal, light] = walls[region];
    if (kind === 'ossuary') {
      rect(dark, 6, 86, 60, 14);
      rect(edge, 9, 82, 54, 6);
      for (const [x,y] of [[11,75],[26,65],[41,74],[49,65],[19,82]]) {
        rect(stone,x,y,12,8); rect(metal,x+2,y+1,8,2); rect(dark,x+4,y+4,2,2);
      }
    } else if (kind === 'broken') {
      rect(mortar,12,91,48,9);
      path([[18,94],[24,40],[38,30],[49,35],[44,54],[50,94]],stone);
      path([[18,93],[26,41],[34,36],[31,56],[28,91]],edge,3);
      path([[22,61],[34,58],[42,65],[53,67]],dark,4);
    } else if (kind === 'needle') {
      rect(mortar,20,91,32,9);
      path([[25,92],[29,25],[36,9],[43,25],[47,92]],stone);
      path([[36,12],[35,87],[43,91]],edge,2);
      rect(metal,32,29,7,3);
    } else if (kind === 'crane') {
      rect(dark,9,91,43,9);
      path([[14,95],[18,23],[26,17],[34,93]],stone);
      path([[22,26],[57,12],[66,15],[64,21],[23,33]],edge);
      path([[19,76],[43,24]],metal,3);
      path([[57,19],[57,52],[52,56],[56,58]],metal,2);
    } else if (kind === 'basin') {
      path([[8,71],[57,71],[66,80],[57,95],[14,95],[5,81]],stone);
      path([[10,74],[56,74],[60,79],[53,83],[14,83]],dark);
      path([[14,81],[47,81],[58,78]],light,2);
      rect(mortar,14,94,7,6); rect(mortar,51,94,7,6);
    } else if (kind === 'lectern') {
      rect(mortar,29,63,14,34);
      path([[14,60],[20,42],[52,42],[59,60],[54,66],[17,66]],edge);
      path([[20,52],[35,45],[49,51],[47,57],[34,52],[23,58]],metal);
      rect(stone,19,94,34,6);
    } else if (kind === 'chair') {
      for (const x of [21,49]) rect(edge,x,51,4,49);
      rect(stone,21,55,32,4);
      for (const x of [29,39]) rect(metal,x,58,3,12);
      path([[22,72],[52,72],[58,78],[52,84],[17,84],[13,79]],edge);
      rect(stone,15,82,4,18); rect(stone,49,82,4,18);
    } else if (kind === 'hollowTree') {
      path([[15,100],[29,85],[28,63],[23,49],[15,44],[10,15],[19,33],[31,44],
        [32,16],[44,3],[39,42],[55,29],[63,12],[60,38],[46,56],[43,85],[57,100]],stone);
      path([[33,85],[31,66],[39,56],[40,78]],dark);
      path([[29,96],[34,87],[40,93],[48,99]],edge,3);
    } else if (kind === 'weight') {
      rect(metal,33,3,4,49);
      for (let y=8; y<51; y+=7) rect(edge,31,y,8,2);
      path([[19,50],[53,50],[57,61],[51,72],[21,72],[15,61]],stone);
      rect(edge,22,54,28,3);
      rect(mortar,17,92,36,8);
      rect(dark,24,87,24,7);
    } else if (kind === 'mirror') {
      rect(stone,29,81,14,13);
      rect(edge,22,94,28,6);
      path([[16,43],[35,28],[56,43],[53,70],[36,82],[19,70]],edge);
      path([[20,44],[35,33],[51,44],[48,67],[35,76],[23,66]],dark);
      path([[24,66],[44,40],[48,44],[28,70]],metal);
      rect(light,41,43,3,2);
    }
    return canvas;
  }

  function wall(region, kind = 'wall', awake = false) {
    const { canvas, rect, path } = painter(64, 64);
    const [dark, mortar, mid, rim, gold, light] = walls[region];
    const arch = [[9,58],[9,25],[13,18],[22,12],[32,4],[42,12],[51,18],[55,25],[55,58]];
    rect(dark,0,0,64,64);
    for (let y=0; y<64; y+=10) {
      for (let x=y%20 ? -9 : 0; x<64; x+=18) {
        rect(mortar,x+1,y+1,17,8);
        rect(mid,x+1,y+1,16,2);
        rect(rim,x+2,y+1,8,1);
        rect(dark,x+12,y+7,5,1);
      }
    }
    if (kind === 'pillar') {
      for (let x=3;x<64;x+=11) {
        rect(mid,x,0,7,64);rect(rim,x+1,0,2,64);rect(mortar,x+6,0,2,64);
      }
      for (const y of [2,8,51,57]) {
        rect(dark,0,y,64,6);rect(rim,0,y,64,2);rect(gold,4,y+1,56,1);
      }
      return canvas;
    }
    path(arch,rim);
    path([[13,55],[13,27],[16,21],[32,9],[48,21],[51,27],[51,55]],dark);
    path(arch,gold,1);
    path([[12,55],[12,26],[16,20],[32,7],[48,20],[52,26],[52,55]],mid,1);

    if (kind === 'gate' || kind === 'secret') {
      const metal = kind === 'gate';
      for (let x=16;x<=48;x+=8) {
        const top=13+Math.abs(x-32)*.55;
        rect(metal?rim:mid,x,top,metal?4:7,57-top);
        rect(metal?gold:mortar,x,top,1,57-top);
      }
      rect(rim,13,42,38,5);
      rect(gold,28,30,8,13);
      rect(dark,31,33,2,6);
      path([[21,52],[28,45],[24,37],[38,30],[35,24],[40,18]],metal?mid:light,1);
    } else if (region === 'crypt') {
      for (let row=0;row<3;row++) {
        const y=23+row*10;
        for (const x of row===0?[27,34]:[21,29,37]) {
          path([[x,y+1],[x+2,y-1],[x+5,y-1],[x+7,y+1],[x+7,y+5],[x+5,y+5],[x+5,y+7],[x+2,y+7],[x+2,y+5],[x,y+5]],row===2?rim:gold);
          rect(dark,x+1,y+2,2,2);rect(dark,x+4,y+2,2,2);
        }
      }
      path([[18,49],[27,52],[36,48],[45,51]],rim,2);
    } else if (region === 'catacomb' || region === 'nave') {
      for (let i=0;i<7;i++) {
        const x=15+i*6;
        path([[x,25+i%3],[x-3,37],[x+2,48],[x-1,56]],i%3?mid:rim,1+i%2);
        rect(gold,x-1,39+i%4*3,1,3);
      }
      if (region==='nave') {
        for (const y of [43,47,52,56]) rect(y===52?gold:rim,0,y,64,1);
        rect(light,27,49,10,1);
      }
    } else if (region === 'chapel') {
      for (const x of [16,23,28,37,43,49]) {
        path([[x,0],[x-8,19],[x+5,35],[x-4,48],[x+2,62]],mortar,5);
        path([[x,0],[x-8,19],[x+5,35],[x-4,48],[x+2,62]],rim,1);
      }
    } else if (region==='salt') {
      for(let i=0;i<26;i++){
        const x=14+(i*19)%37,y=33+(i*7)%22;
        rect(i%4?mid:light,x,y,1+i%3,1);
      }
      path([[14,43],[25,39],[35,45],[49,40]],rim,2);
    } else if (region==='archive') {
      for(const y of [23,35,47]){
        rect(rim,16,y+7,32,2);
        for(let i=0;i<7;i++)rect(i%3?gold:mid,17+i*4,y+(i%2),3,6);
      }
    } else if (region==='garden') {
      for(const x of [21,31,42]){
        path([[x,20],[x+3,32],[x-4,39],[x+1,56]],rim,2);
        path([[x-4,39],[x-9,45],[x-11,49]],gold,1);
      }
    } else if (region==='soundings') {
      for(const x of [20,29,38]){
        rect(mid,x,20,4,35);rect(gold,x+1,23,1,30);
      }
      for(const y of [33,43,53])rect(rim,15,y,34,3);
    } else if (region==='sky') {
      for(let i=0;i<23;i++){
        const x=16+(i*17)%32,y=19+(i*23)%35;
        rect(i%5?gold:light,x,y,1+i%2,1);
      }
      path([[20,42],[26,34],[36,37],[43,25]],rim,1);
    } else {
      for (let i=0;i<4;i++) {
        path([[32,13+i*4],[45-i*3,33],[32,51-i*4],[19+i*3,33]],i%2?rim:gold,1);
      }
    }

    if (region==='chapel'||region==='sanctuary') {
      const eye=[[18,33],[26,27],[32,26],[38,27],[46,33],[38,38],[32,40],[26,38]];
      path(eye,mortar);
      path(eye,gold,1);
      if (awake) {
        path([[21,33],[32,28],[43,33],[32,38]],light);
        rect(dark,30,28,4,10);rect(gold,30,29,1,3);
      } else {
        path([[19,33],[27,35],[36,35],[45,33]],mid,2);
      }
    }
    for (const y of [0,57,62]) {
      rect(dark,0,y,64,2);
      rect(rim,0,y+2,64,1);
      for(let x=3;x<64;x+=8)rect(gold,x,y+1,2,2);
    }
    return canvas;
  }

  function creature(type, pose, frame, phase = 1) {
    const { canvas, rect, path } = painter(72,100);
    const winding=pose==='windup', striking=pose==='strike';
    const gait=pose==='walk'?frame-1:0;
    const lean=pose==='hurt'?4:striking?-3:0;
    const polygon = (points,color) => path(points.map(([x,y])=>[x+lean,y]),color);
    const box = (color,x,y,w,h) => rect(color,x+lean,y,w,h);
    const eye = winding?'#ffd3ab':'#bc9189';

    if(type==='hollow') {
      const head=winding?10:25+gait*2;
      polygon([[23,43],[48,44],[52,72],[43,87],[25,85],[18,71]],'#211923');
      polygon([[24,45],[36,41],[48,45],[44,70],[26,77],[20,56]],'#655054');
      for(let i=0;i<6;i++)path([[24,48+i*4],[34,51+i*4],[46,47+i*4]],i%2?'#a38376':'#473743',2);
      polygon([[31,45],[32,head+11],[39,head+10],[41,44]],'#a28274');
      box('#654e53',36,head+12,2,32-head);
      polygon([[27,head],[34,head-5],[44,head],[45,head+11],[37,head+18],[28,head+11]],'#bea291');
      box('#382830',30,head+5,5,3);box(eye,39,head+5,4,2);
      box('#30212b',34,head+11,6,3);
      polygon([[23,46],[15,53],[8,76],[14,83],[20,70],[30,53]],'#9b716a');
      polygon([[46,45],[54,52],[59,striking?39:74],[65,striking?34:84],[66,69],[53,45]],'#79565a');
      box('#9d8278',24,78,7,17+gait);box('#74575a',40,77,7,17-gait);
    } else if(type==='knight') {
      polygon([[15,48],[22,36],[50,35],[58,46],[55,85],[45,95],[24,98],[15,83]],'#17242b');
      polygon([[20,46],[29,37],[44,37],[50,44],[47,66],[25,69]],'#648182');
      for (const [x,y] of [[22,45],[28,49],[30,57],[44,46],[26,71],[41,73]])box('#a0a99a',x,y,6,3);
      polygon([[24,37],[22,25],[33,8],[48,22],[51,34],[38,44]],'#3a5258');
      polygon([[25,28],[34,12],[45,23],[42,29],[30,33]],'#819791');
      box(eye,30,32,14,2);
      polygon([[8,48],[19,38],[30,46],[30,68],[16,84],[7,70]],'#23353e');
      polygon([[10,50],[19,43],[26,50],[25,66],[16,77],[10,67]],'#536b70');
      box('#a3a08b',16,51,3,16);
      polygon(winding?[[47,62],[55,12],[60,3],[62,19],[54,64]]:[[47,69],[64,39],[70,34],[69,46],[54,74]],'#b4a695');
      box('#996c5e',46,66,13,4);
    } else if(type==='wraith') {
      polygon([[35,8],[47,17],[53,35],[62,56],[59,86],[46,77],[39,96],[31,78],[12,85],[17,54],[24,35],[25,19]],'#241730');
      polygon([[35,12],[43,20],[48,42],[57,63],[48,80],[43,69],[36,85],[26,70],[18,78],[21,54],[28,36],[29,20]],'#745a87');
      polygon([[35,18],[43,28],[48,46],[42,61],[32,64],[26,49],[27,31]],'#a37c9f');
      for(const [x,y,w] of [[32,31,8],[28,39,6],[39,39,7],[32,49,10],[23,57,5],[44,57,6]]) {
        box('#2c1e35',x,y,w,winding?5:2);
        if(winding)box(eye,x+2,y+1,2,2);
      }
      for(const x of [20,28,40,48])path([[x,61],[x-5,75],[x+gait,89]],'#a0789f',2);
    } else if(type==='drowned') {
      path([[36,1],[30,24],[39,39],[29,59],[37,78]],'#719d8e',3);
      polygon([[32,26],[45,33],[49,51],[54,71],[48,91],[33,84],[21,93],[19,75],[23,51]],'#20494c');
      polygon([[26,40],[40,36],[48,47],[51,58],[60,69],[15,69],[22,57]],'#6d9e8d');
      polygon([[31,42],[36,42],[32,62],[20,66],[28,56]],'#b4c6a8');
      box('#172f36',12,69,51,6);box('#9ac3a5',16,68,44,2);
      box(winding?'#ecdbaf':'#a28b79',34,72,6,10);
      for(const x of [17,24,43,48])path([[x,74],[x+2,84],[x-2,97-gait*3]],'#537e7c',2);
      box(eye,32,33,10,3);
    } else {
      const opened=phase===2 || striking;
      polygon([[35,12],[12,6],[18,24],[8,33],[11,68],[3,91],[22,88],[32,96],[44,92],[65,96],[59,68],[68,36],[53,24],[61,7]],'#251923');
      polygon([[35,18],[20,12],[27,29],[15,39],[17,62],[10,86],[26,78],[35,86],[47,80],[57,87],[53,62],[61,40],[47,29],[54,13]],'#7c4b58');
      polygon([[35,25],[26,16],[30,32],[19,43],[26,62],[34,67],[47,62],[53,43],[42,32],[46,17]],'#c29686');
      for(let i=0;i<5;i++){
        box('#50303d',16+i*2,51+i*6,14,2);
        box('#50303d',43-i*2,51+i*6,11,2);
      }
      polygon([[21,46],[30,39],[36,38],[47,42],[52,47],[44,53],[36,55],[28,52]],'#372130');
      if(opened || winding) {
        polygon([[23,46],[36,40],[49,46],[36,52]],winding?'#ffe3b6':'#ecaa8e');
        box('#3a2235',34,41,4,10);
      } else box(eye,29,47,15,2);
      polygon(winding?[[53,63],[62,12],[67,3],[69,18],[59,67]]:[[52,65],[67,68],[68,78],[50,74]],'#d6ac9a');
      if(opened)for(const x of [14,24,44,56])path([[x,56],[x-6,71],[x+4,96]],'#d78979',2);
    }
    return canvas;
  }

  return { wall, creature, masonry, landmark };
})();
