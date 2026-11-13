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

  return { wall, creature };
})();
