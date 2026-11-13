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
      path([[6,98],[13,89],[38,89],[45,98]],dark);
      path([[15,94],[17,21],[24,17],[30,92]],stone);
      path([[19,91],[20,24],[24,23],[24,92]],edge,2);
      path([[19,24],[58,13],[66,16],[63,21],[21,31]],edge);
      path([[23,53],[41,26],[50,22]],metal,2);
      path([[58,19],[58,56],[51,62],[53,67],[58,67]],metal,2);
      rect(dark,16,58,15,10);
      rect(metal,21,59,3,6);
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
      path([[17,96],[21,79],[18,39],[24,35],[29,71],[46,72],[48,35],[54,38],[54,82],[56,98]],dark);
      for (const x of [21,49]) rect(edge,x,39,4,53);
      rect(stone,21,41,32,7);
      rect(metal,26,41,20,1);
      for (const x of [29,39]) rect(edge,x,45,3,24);
      path([[22,69],[51,69],[58,78],[51,84],[17,84],[13,79]],edge);
      path([[22,71],[48,71],[45,76],[18,77]],metal,1);
      rect(stone,15,82,4,18); rect(stone,49,82,4,18);
    } else if (kind === 'hollowTree') {
      path([[5,99],[24,88],[28,65],[22,52],[11,48],[3,31],[10,35],[18,43],
        [17,24],[11,8],[23,16],[27,40],[35,48],[36,20],[32,11],[40,2],[45,13],
        [42,40],[52,34],[55,18],[66,9],[63,26],[58,43],[48,53],[45,72],[49,89],[65,99]],stone);
      path([[25,93],[31,76],[31,62],[39,54],[43,61],[39,78],[37,90]],dark);
      path([[37,55],[43,61],[39,78],[39,89],[48,98]],edge,2);
      path([[11,97],[27,89],[33,80],[28,65],[25,52],[17,44]],edge,2);
      path([[39,24],[38,44],[47,46],[58,29]],metal,1);
      rect(metal,42,80,2,3);
    } else if (kind === 'weight') {
      rect(dark,10,22,9,73); rect(edge,12,25,3,69);
      rect(dark,54,22,9,73); rect(edge,57,25,3,69);
      rect(stone,10,22,53,7); rect(metal,12,22,48,2);
      rect(metal,35,27,3,40);
      for (let y=30; y<61; y+=6) rect(edge,33,y,7,2);
      path([[23,55],[48,55],[53,62],[47,75],[24,75],[19,63]],stone);
      rect(edge,25,59,23,3);
      rect(metal,35,66,3,3);
      rect(mortar,10,92,53,8); rect(dark,24,91,24,6);
    } else if (kind.startsWith('mirror')) {
      rect(stone,29,81,14,13);
      rect(edge,22,94,28,6);
      path([[16,43],[35,28],[56,43],[53,70],[36,82],[19,70]],edge);
      path([[20,44],[35,33],[51,44],[48,67],[35,76],[23,66]],kind.includes('light')?stone:dark);
      const direction=Number(kind.at(-1));
      const streaks=[
        [[24,55],[28,47],[33,42],[29,54],[24,60]],
        [[28,68],[37,45],[43,40],[41,50],[36,67]],
        [[31,69],[42,51],[47,50],[43,60],[35,73]],
      ];
      path(streaks[direction],metal);
      const [gx,gy]=streaks[direction][1];
      rect(light,gx,gy,2,2);
    } else if (kind === 'gauge') {
      rect(mortar,30,52,12,48); rect(edge,31,53,3,41);
      path([[13,33],[21,23],[50,23],[59,33],[59,58],[49,67],[22,67],[13,57]],stone);
      path([[17,35],[24,28],[47,28],[55,35],[55,55],[47,62],[24,62],[17,55]],dark);
      for(const [x,y] of [[21,39],[26,33],[35,31],[44,33],[50,39]])rect(light,x,y,2,3);
      path([[27,50],[35,47],[45,36]],metal,2);
      rect(light,34,45,4,4); rect(edge,25,94,23,6);
    }
    return canvas;
  }

  function materialWall(region, rect, path) {
    const [dark, mortar, mid, rim, gold, light] = walls[region];
    if(region==='nave'){
      for(const x of [2,49]){
        rect(mortar,x,0,13,64);rect(mid,x+2,0,4,64);rect(rim,x+2,0,1,43);
      }
      rect(dark,0,47,64,16);
      for(const [y,c] of [[42,rim],[44,gold],[49,mid],[56,mortar]])rect(c,0,y,64,1);
      return true;
    }
    if(region==='salt'){
      for(const [x,y] of [[6,42],[25,54],[40,36],[54,48],[36,57]]){
        path([[x-4,y+7],[x+2,y-7],[x+7,y+1],[x+10,y+7]],mid);
        path([[x-2,y+4],[x+2,y-4],[x+6,y+2]],gold,1);
      }
      rect(mortar,0,60,64,4);rect(rim,1,60,57,1);
      return true;
    }
    if(region==='archive'){
      rect(dark,6,6,52,52);
      for(const y of [8,24,40]){
        for(let x=10;x<54;x+=5){
          const offset=(x*3+y)%5;
          rect(offset>2?rim:mid,x,y+offset+3,4,11-offset);
          if(offset<2)rect(gold,x,y+7,3,1);
        }
        rect(rim,6,y+14,52,2);rect(mortar,6,y+16,52,1);
      }
      for(const x of [4,56])rect(mid,x,5,4,54);
      return true;
    }
    if(region==='garden'){
      for(const x of [6,52]){rect(dark,x,5,5,59);rect(mid,x+1,8,2,49);}
      path([[0,53],[14,39],[28,42],[39,26],[55,20],[64,14]],dark,7);
      path([[0,51],[14,37],[28,40],[39,24],[55,18],[64,12]],rim,2);
      path([[17,38],[15,27],[24,21],[22,10]],mid,3);
      path([[37,27],[46,31],[53,39],[59,40]],gold,1);
      return true;
    }
    if(region==='soundings'){
      for(const y of [16,34,49]){
        rect(dark,0,y,64,8);rect(mid,0,y,64,5);rect(rim,0,y,64,1);
        for(const x of [10,44]){rect(rim,x,y-2,5,9);rect(gold,x+1,y-1,2,1);}
      }
      return true;
    }
    if(region==='sky'){
      rect(dark,5,5,54,50);rect(mid,5,5,54,1);rect(mortar,6,55,52,2);
      for(const [x,y] of [[14,23],[20,39],[23,14],[31,28],[42,24],[51,41],[47,15]]){
        rect(gold,x,y,1,1);
      }
      path([[19,39],[28,34],[31,28],[42,24],[47,15]],mid,1);
      rect(light,31,28,2,1);
      return true;
    }
    return false;
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
    if(kind==='wall'&&materialWall(region, rect, path))return canvas;
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
    } else if (region === 'catacomb') {
      for (let i=0;i<7;i++) {
        const x=15+i*6;
        path([[x,25+i%3],[x-3,37],[x+2,48],[x-1,56]],i%3?mid:rim,1+i%2);
        rect(gold,x-1,39+i%4*3,1,3);
      }
    } else if (region === 'chapel') {
      for (const x of [16,23,28,37,43,49]) {
        path([[x,0],[x-8,19],[x+5,35],[x-4,48],[x+2,62]],mortar,5);
        path([[x,0],[x-8,19],[x+5,35],[x-4,48],[x+2,62]],rim,1);
      }
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

  function creature(type, pose, frame, phase = 1, kind = '') {
    const { canvas, rect, path } = painter(72,100);
    const wake=pose==='wake', winding=pose==='windup', striking=pose==='strike';
    const fall=pose==='fall', hurt=pose==='hurt', guarding=pose==='guard';
    const gait=pose==='walk' ? frame-1 : 0;
    const lean=hurt?4 : striking?-3 : 0;
    const bodyFall=fall ? [10,24,40][frame] : 0;
    const bend=(x,y)=>[36+(x-36)*(fall?1.14:1)+lean, y+bodyFall*(100-y)/100];
    const polygon=(points,color,width)=>path(points.map(([x,y])=>bend(x,y)),color,width);
    const box=(color,x,y,w,h)=>{
      const [left,top]=bend(x,y);
      rect(color,Math.round(left),Math.round(top),w,h);
    };
    const eye=winding||wake&&frame>0?'#ffe1b7':'#bc9189';

    if(type==='hollow') {
      const neck=kind==='neck';
      const head=wake ? 29-frame*8 : winding ? (neck?14-frame*6:30+frame*3) :
        striking&&neck ? 10+frame*5 : 25+gait*2;
      polygon([[23,43],[48,44],[52,72],[43,87],[25,85],[18,71]],'#211923');
      polygon([[24,45],[36,41],[48,45],[44,70],[26,77],[20,56]],'#655054');
      for(let i=0;i<6;i++)polygon([[24,48+i*4],[34,51+i*4],[46,47+i*4]],i%2?'#a38376':'#473743',2);
      polygon([[31,45],[32,head+11],[39,head+10],[41,44]],'#a28274');
      box('#654e53',36,head+12,2,32-head>0?32-head:1);
      polygon([[27,head],[34,head-5],[44,head],[45,head+11],[37,head+18],[28,head+11]],'#bea291');
      box('#382830',30,head+5,5,3);box(eye,39,head+5,striking&&neck?6:4,2);
      box('#30212b',34,head+11,6,3);
      polygon([[23,46],[15,53],[8,76],[14,83],[20,70],[30,53]],'#9b716a');
      const arm=striking&&!neck ? [[45,46],[56,32],[70-frame*9,26],[67-frame*9,38],[50,58]] :
        winding&&!neck ? [[46,45],[54,39],[64,44+frame*6],[62,52+frame*6],[48,57]] :
        [[46,45],[54,52],[59,74-gait*2],[65,84],[66,69],[53,45]];
      polygon(arm,'#79565a');
      box('#9d8278',24,79,7,20+gait);box('#74575a',40,78,7,21-gait);
    } else if(type==='knight') {
      polygon([[15,48],[22,36],[50,35],[58,46],[55,85],[45,95],[24,98],[15,83]],'#17242b');
      polygon([[20,46],[29,37],[44,37],[50,44],[47,66],[25,69]],'#648182');
      for(const [x,y] of [[22,45],[28,49],[30,57],[44,46],[26,71],[41,73]])box('#a0a99a',x,y,6,3);
      box('#80908a',24+gait*2,82,9,14);box('#4a656a',41-gait*2,81,10,18);
      const helm=wake?8-frame*4:0;
      polygon([[24,37+helm],[22,25+helm],[33,8+helm],[48,22+helm],[51,34+helm],[38,44+helm]],'#3a5258');
      polygon([[25,28+helm],[34,12+helm],[45,23+helm],[42,29+helm],[30,33+helm]],'#819791');
      box(eye,30,32+helm,14,2);
      const shield=guarding?10:wake?8-frame*4:0;
      polygon([[8+shield,48],[19+shield,38],[30+shield,46],[30+shield,68],[16+shield,84],[7+shield,70]],'#23353e');
      polygon([[10+shield,50],[19+shield,43],[26+shield,50],[25+shield,66],[16+shield,77],[10+shield,67]],'#536b70');
      box(guarding?'#e2cca9':'#a3a08b',16+shield,51,3,16);
      const blade=winding&&kind==='thrust' ? [[46,59],[66,48-frame*4],[70,53-frame*4],[51,65]] :
        winding ? [[47,62],[55-frame*5,13],[60-frame*5,3],[63-frame*5,20],[54,64]] :
        striking&&kind==='thrust' ? [[36,60],[15+frame*7,49],[28+frame*5,44],[54,61],[51,66]] :
        striking ? [[46,64],[15+frame*10,71],[3+frame*12,67],[26+frame*9,58],[54,57]] :
        [[47,69],[63,43-gait*4],[69,35-gait*4],[69,46-gait*4],[54,74]];
      polygon(blade,'#b4a695');
      if(winding||striking)polygon([blade[0],blade[1],blade[2]],'#e3cabc',1);
      box('#996c5e',46,66,13,4);
    } else if(type==='wraith') {
      const fold=wake ? 8-frame*4 : winding&&kind==='feint' ? 5+frame*2 : striking ? -5+frame*3 : 0;
      polygon([[35,8+fold],[47,17+fold],[53-fold,35],[62-fold,56],[59,86],[46,77],[39,98],
        [31,78],[12,85],[17+fold,54],[24+fold,35],[25,19+fold]],'#241730');
      polygon([[35,12+fold],[43,20+fold],[48-fold,42],[57-fold,63],[48,80],[43,69],[36,88],
        [26,70],[18,78],[21+fold,54],[28+fold,36],[29,20+fold]],'#745a87');
      polygon([[35,18+fold],[43,28+fold],[48-fold,46],[42,61],[32,64],[26+fold,49],[27+fold,31]],'#a37c9f');
      for(const [x,y,w] of [[32,31,8],[28,39,6],[39,39,7],[32,49,10],[23,57,5],[44,57,6]]) {
        const open=wake?frame>0&&y<44:winding&&kind!=='feint'||striking;
        box('#2c1e35',x,y+(fold>>1),w,open?5:2);
        if(open)box(eye,x+2,y+1+(fold>>1),2,2);
      }
      for(const x of [20,28,40,48])polygon([[x,61],[x-5-gait,75],[x+gait*4,91]],
        '#a0789f',2);
      if(striking)polygon([[45,41],[61,39],[67,53],[63,57],[53,47]],'#c297b6');
    } else if(type==='drowned') {
      const lift=wake?11-frame*6:winding? -4-frame*3:striking?-11+frame*6:0;
      const pull=winding&&kind==='lunge'?7:striking&&kind==='lunge'?-8:0;
      const chain=wake&&frame===0 ? [[39,6],[26,29],[41,49],[30,60]] :
        [[36,3],[34+pull,23],[38+pull,40+lift],[35+pull,58+lift]];
      polygon(chain,'#719d8e',3);
      polygon([[32,26+lift],[45,33+lift],[49,51],[54,71],[48,91],[33,84],[21,97],[19,75],[23,51]],'#20494c');
      polygon([[26+pull,40+lift],[40+pull,36+lift],[48+pull,47+lift],[51+pull,58+lift],
        [60+pull,69+lift],[15+pull,69+lift],[22+pull,57+lift]],'#6d9e8d');
      polygon([[31+pull,42+lift],[36+pull,42+lift],[32+pull,62+lift],
        [20+pull,66+lift],[28+pull,56+lift]],'#b4c6a8');
      box('#172f36',12+pull,69+lift,51,6);box('#9ac3a5',16+pull,68+lift,44,2);
      box(winding||striking?'#ecdbaf':'#a28b79',34+pull+(striking?frame*3:0),72+lift,6,10);
      for(const x of [17,24,43,48])polygon([[x+pull,74+lift],[x+2,84],[x-2,98-gait*3]],'#537e7c',2);
      box(eye,32+pull,33+lift,10,3);
    } else {
      const opened=phase===2||striking||wake&&frame>0||winding;
      const rise=wake?9-frame*4:0;
      polygon([[35,12+rise],[12,6+rise],[18,24],[8,33],[11,68],[3,91],[22,88],[32,97],
        [44,92],[65,97],[59,68],[68,36],[53,24],[61,7+rise]],'#251923');
      polygon([[35,18+rise],[20,12+rise],[27,29],[15,39],[17,62],[10,86],[26,78],[35,86],
        [47,80],[57,87],[53,62],[61,40],[47,29],[54,13+rise]],'#7c4b58');
      polygon([[35,25],[26,16+rise],[30,32],[19,43],[26,62],[34,67],[47,62],
        [53,43],[42,32],[46,17+rise]],'#c29686');
      for(let i=0;i<5;i++){
        box('#50303d',16+i*2,51+i*6,14,2);
        box('#50303d',43-i*2,51+i*6,11,2);
      }
      polygon([[21,46],[30,39],[36,38],[47,42],[52,47],[44,53],[36,55],[28,52]],'#372130');
      if(opened){
        const open=winding&&kind==='ring'?7+frame*2:6;
        polygon([[23,46],[36,46-open],[49,46],[36,46+open]],winding?'#ffe3b6':'#ecaa8e');
        box('#3a2235',34,46-open+1,4,2*open-2);
      }else box(eye,29,47,15,2);
      const weapon=kind==='ring' ? [[53,66],[62,54],[69,45],[66,61],[58,73]] :
        winding&&kind==='lunge' ? [[52,64],[66,44],[70,45],[69,53],[57,69]] :
        winding ? [[53,63],[60-frame*4,13],[66-frame*4,3],[69-frame*4,18],[59,67]] :
        striking&&kind==='lunge' ? [[51,68],[25+frame*6,53],[18+frame*7,46],[42,51],[61,65]] :
        striking ? [[50,68],[20+frame*9,75],[4+frame*12,74],[35,62],[60,61]] :
        [[52,65],[67,68+gait*4],[68,78+gait*4],[50,74]];
      polygon(weapon,'#d6ac9a');
      if(opened)for(const x of [14,24,44,56])polygon([[x,56],[x-6-gait*2,71],[x+4,96]],'#d78979',2);
    }
    return canvas;
  }

  const weaponProfiles={
    sword:{edge:'#e7d8ce',mid:'#8d8495',dark:'#4a3f53',strap:'#a78992'},
    spear:{edge:'#e4d4b0',mid:'#a29378',dark:'#50444c',strap:'#c7a583'},
    axe:{edge:'#d1b4a0',mid:'#a18278',dark:'#51414f',strap:'#815d5a'},
    needle:{edge:'#cfeded',mid:'#87adae',dark:'#3a5058',strap:'#98c2c0'},
  };
  function firstPersonWeapon(id){
    const {canvas,rect,path}=painter(116,220);
    const {edge,mid,dark,strap}=weaponProfiles[id];
    const grip='#4c3944', seam='#6f5662';
    rect(grip,53,56,12,144);
    rect(dark,61,63,4,135);
    for(let y=87;y<174;y+=10)rect(strap,54,y,4,2);
    if(id==='sword'){
      path([[52,163],[51,49],[58,21],[65,46],[67,163]],dark);
      path([[52,157],[52,49],[58,23],[57,157]],edge);
      path([[58,29],[65,49],[66,157],[60,156]],mid);
      rect(strap,57,49,2,100);
      path([[42,157],[73,159],[78,155],[77,164],[70,170],[42,165]],grip);
      rect(mid,45,158,25,2);
    }else if(id==='spear'){
      path([[59,14],[71,47],[60,69],[48,47]],mid);
      path([[59,15],[53,46],[59,64],[48,47]],edge);
      path([[59,24],[62,49],[60,63],[58,48]],dark);
      for(let y=67;y<84;y+=5){rect(dark,51,y,17,4);rect(edge,53,y,4,1);}
    }else if(id==='axe'){
      path([[62,51],[36,29],[18,32],[10,49],[8,65],[19,77],[36,74],[62,68]],dark);
      path([[57,54],[35,33],[20,36],[14,51],[12,65],[20,73],[37,70],[57,64]],mid);
      path([[20,34],[14,48],[10,65],[20,75],[29,72],[16,66],[16,54],[24,35]],edge);
      path([[29,38],[39,50],[48,52],[54,66],[58,92]],strap,3);
      rect(edge,44,55,5,2);
    }else{
      path([[59,13],[64,43],[60,62],[55,44]],edge);
      rect(mid,58,32,2,33);
      path([[59,42],[72,52],[68,61],[53,63],[46,55],[59,42]],mid,2);
      rect(strap,51,67,16,4);rect(edge,54,69,4,1);
      path([[53,77],[62,78],[64,83],[55,85],[53,88],[61,91]],mid,2);
    }
    path([[47,184],[50,173],[65,169],[72,173],[73,181],[61,187]],'#3f303e');
    path([[51,176],[61,173],[69,175]],seam,2);
    rect('#17202a',62,176,4,12);
    return canvas;
  }

  return { wall, creature, masonry, landmark, firstPersonWeapon };
})();
